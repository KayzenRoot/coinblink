"""Create same-render PNG/WebP preview exports and a sanitized hash manifest."""

from __future__ import annotations

import hashlib
import io
import json
import math
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


SCRIPT = Path(__file__).resolve()
EVIDENCE_DIR = SCRIPT.parent
ROOT = EVIDENCE_DIR.parents[2]
MASTER = EVIDENCE_DIR / "hero-cinematic-renders" / "hero-cinematic-blender-master-2560x1280.png"
PNG_OUTPUT = ROOT / "src" / "modules" / "CB-M01" / "hero-cinematic-blender.png"
WEBP_OUTPUT = ROOT / "src" / "modules" / "CB-M01" / "hero-cinematic-blender.webp"
REPORT = EVIDENCE_DIR / "hero-cinematic-blender-export-report.json"
PROVENANCE = EVIDENCE_DIR / "hero-cinematic-blender-provenance.json"
IMAGEGEN_PROVENANCE = EVIDENCE_DIR / "hero-cinematic-imagegen-provenance.json"
LIGHTNING_PROVENANCE = EVIDENCE_DIR / "lightning-sprites-provenance.json"
BLENDER_SOURCE = EVIDENCE_DIR / "blender-hero-scene.py"
BLENDER_PROJECT = EVIDENCE_DIR / "hero-cinematic-production.blend"
ANIMATION_SOURCE = EVIDENCE_DIR / "animate-generated-hero.py"
ANIMATION_PROJECT = EVIDENCE_DIR / "hero-cinematic-animation-portable.blend"
SCENE_REGISTRY = EVIDENCE_DIR / "scene-asset-provenance.json"
MAX_PNG_BYTES = 3_500_000
MAX_WEBP_BYTES = 1_500_000


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def image_bytes(image: Image.Image, format_name: str, **options: object) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format=format_name, **options)
    return buffer.getvalue()


def png_quality(rgb: Image.Image) -> tuple[bytes, int, dict[str, float]]:
    candidates: list[tuple[int, bytes, dict[str, float]]] = []
    for colors in (256, 240, 224, 208, 192, 176, 160, 144, 128, 112, 96, 80, 64):
        encoded = image_bytes(
            rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT,
                         dither=Image.Dither.FLOYDSTEINBERG),
            "PNG", optimize=True, compress_level=9,
        )
        with Image.open(io.BytesIO(encoded)) as decoded:
            decoded.load()
            difference = ImageChops.difference(rgb, decoded.convert("RGB"))
            stats = ImageStat.Stat(difference)
            mse = sum(value * value for value in stats.rms) / 3.0
            psnr = 99.0 if mse == 0 else 10.0 * math.log10((255.0 * 255.0) / mse)
        candidates.append((colors, encoded, {"meanAbsoluteErrorRgb": round(sum(stats.mean) / 3.0, 5),
                                             "psnrDb": round(psnr, 4)}))

    eligible = [candidate for candidate in candidates if len(candidate[1]) <= MAX_PNG_BYTES]
    if not eligible:
        raise RuntimeError("No palette PNG met the 3.5 MB limit without resizing.")
    colors, encoded, metrics = max(eligible, key=lambda candidate: candidate[0])
    return encoded, colors, metrics


def webp_quality(rgb: Image.Image) -> tuple[bytes, int]:
    for quality in range(96, 59, -2):
        encoded = image_bytes(rgb, "WEBP", quality=quality, method=6, exact=True)
        if len(encoded) <= MAX_WEBP_BYTES:
            return encoded, quality
    raise RuntimeError("No WebP quality met the 1.5 MB limit without resizing.")


def image_record(path: Path, payload: bytes) -> dict[str, object]:
    with Image.open(io.BytesIO(payload)) as image:
        image.verify()
    with Image.open(io.BytesIO(payload)) as image:
        image.load()
        return {
            "path": path.relative_to(ROOT).as_posix(),
            "format": image.format,
            "dimensions": list(image.size),
            "mode": image.mode,
            "bytes": len(payload),
            "sha256": sha256_bytes(payload),
            "fullyDecoded": True,
        }


with Image.open(MASTER) as source_image:
    source_image.verify()
with Image.open(MASTER) as source_image:
    source_image.load()
    if source_image.size != (2560, 1280) or source_image.format != "PNG":
        raise RuntimeError(f"Unexpected master image: {source_image.format} {source_image.size}")
    master = source_image.convert("RGB")

master_payload = MASTER.read_bytes()
png_payload, png_palette_colors, png_metrics = png_quality(master)
webp_payload, webp_quality_value = webp_quality(master)
PNG_OUTPUT.write_bytes(png_payload)
WEBP_OUTPUT.write_bytes(webp_payload)
imagegen = json.loads(IMAGEGEN_PROVENANCE.read_text(encoding="utf-8"))

report = {
    "schemaVersion": 1,
    "workOrder": "CB-M01-WO-001",
    "recordType": "R25_BLENDER_STILL_EXPORTS_NOT_MASTER",
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "origin": "BLENDER_CYCLES_STILL_RENDER",
    "assetClass": "BLENDER_CYCLES_STILL_RENDER_NOT_MASTER",
    "runtimeUsage": False,
    "sourceMaster": {
        "path": MASTER.relative_to(ROOT).as_posix(),
        "format": "PNG",
        "dimensions": [2560, 1280],
        "bytes": len(master_payload),
        "sha256": sha256_bytes(master_payload),
        "renderEngine": "Blender Cycles",
        "blenderVersion": "5.2.2 LTS",
        "device": "CPU",
        "samples": 32,
        "denoising": True,
    },
    "exports": {
        "png": {**image_record(PNG_OUTPUT, png_payload),
                "maxBytes": MAX_PNG_BYTES,
                "encoding": "palette PNG, median-cut, Floyd-Steinberg, optimize, compression 9",
                "paletteColors": png_palette_colors,
                "comparisonToMaster": png_metrics},
        "webp": {**image_record(WEBP_OUTPUT, webp_payload),
                 "maxBytes": MAX_WEBP_BYTES,
                 "encoding": "lossy WebP, method 6",
                 "quality": webp_quality_value},
    },
    "usage": {
        "previewOnly": True,
        "runtimeUsage": False,
        "staticMaster": False,
        "rightsStatus": "PENDING_OWNER_OR_LEGAL",
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
        "publicationPermission": False,
        "allowedUsage": "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY",
    },
}
REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                  encoding="utf-8", newline="\n")
provenance = {
    "schemaVersion": 1,
    "workOrder": "CB-M01-WO-001",
    "recordType": "R25_BLENDER_STILL_EXPORTS_NOT_MASTER_PROVENANCE",
    "origin": "BLENDER_CYCLES_STILL_RENDER",
    "assetClass": "BLENDER_CYCLES_STILL_RENDER_NOT_MASTER",
    "role": "LEGACY_STILL_EXPORTS_NOT_RUNTIME",
    "runtimeUsage": False,
    "creatorTool": "Blender 5.2.2 LTS, Cycles, procedural local geometry",
    "designReference": "assets/reference/coinblink-home-master-dark-1536x864.jpg",
    "designReferenceUse": "COMPOSITION_REFERENCE_ONLY_NO_REFERENCE_PIXELS_LOADED",
    "sourceScript": {
        "path": BLENDER_SOURCE.relative_to(ROOT).as_posix(),
        "sha256": sha256_bytes(BLENDER_SOURCE.read_bytes()),
    },
    "sourceProject": {
        "path": BLENDER_PROJECT.relative_to(ROOT).as_posix(),
        "sha256": sha256_bytes(BLENDER_PROJECT.read_bytes()),
    },
    "legacyStillRender": report["sourceMaster"],
    "exports": report["exports"],
    "animationProject": {
        "sourceScript": {
            "path": ANIMATION_SOURCE.relative_to(ROOT).as_posix(),
            "sha256": sha256_bytes(ANIMATION_SOURCE.read_bytes()),
        },
        "path": ANIMATION_PROJECT.relative_to(ROOT).as_posix(),
        "sha256": sha256_bytes(ANIMATION_PROJECT.read_bytes()),
        "bytes": ANIMATION_PROJECT.stat().st_size,
        "imageDependenciesPacked": True,
        "absoluteReferences": False,
        "allowedUsage": "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY",
        "assetClass": "BLENDER_MOTION_DERIVATIVE",
        "role": "MOTION_ONLY_NOT_STATIC_MASTER",
        "staticMasterPath": imagegen["staticMaster"]["path"],
        "staticMasterSha256": imagegen["staticMaster"]["sha256"],
        "runtimeOutput": imagegen["motionDerivative"]["motionOutputs"][0],
        "sourceAnimationOutput": imagegen["motionDerivative"]["motionOutputs"][1],
        "contactSheetOutput": imagegen["motionDerivative"]["motionOutputs"][2],
        "frameCount": imagegen["motionDerivative"]["sourceRender"]["frameCount"],
        "frameRate": imagegen["motionDerivative"]["sourceRender"]["frameRate"],
        "durationMs": imagegen["motionDerivative"]["sourceRender"]["durationMs"],
        "outputFrameCount": imagegen["motionDerivative"]["frameCount"],
        "outputAverageFramesPerSecond": imagegen["motionDerivative"]["averageFramesPerSecond"],
        "portabilityReport": (EVIDENCE_DIR / "hero-cinematic-animation-portable-inspection.json").relative_to(ROOT).as_posix(),
        "portabilityInspectionStatus": imagegen["motionDerivative"]["portability"]["status"],
        "rights": imagegen["motionDerivative"]["rights"],
    },
    "rights": {
        "review": "PENDING_OWNER_OR_LEGAL",
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
        "publicationPermission": False,
        "allowedUsage": "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY",
    },
}
PROVENANCE.write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + "\n",
                      encoding="utf-8", newline="\n")

component_path = ROOT / "src" / "modules" / "CB-M01" / "GoldenHome.astro"
component_bytes = component_path.read_bytes()
component = component_bytes.decode("utf-8")
git_blob = hashlib.sha1(b"blob " + str(len(component_bytes)).encode("ascii")
                        + b"\0" + component_bytes).hexdigest()
registry = json.loads(SCENE_REGISTRY.read_text(encoding="utf-8"))
hero_asset = next(asset for asset in registry["assets"] if asset["region"] == "hero")
start_marker = hero_asset["sourceFragment"]["startMarker"]
end_marker = hero_asset["sourceFragment"]["endMarker"]
start = component.index(start_marker)
end = component.index(end_marker, start + len(start_marker))
hero_fragment = component[start:end]
old_source = registry["source"]
if not any(item.get("recordType") == "PRE_R25_SOURCE_SNAPSHOT"
           for item in registry.get("history", [])):
    registry.setdefault("history", []).append({
        "recordType": "PRE_R25_SOURCE_SNAPSHOT",
        "sourcePath": old_source["path"],
        "sourceGitBlobSha": old_source["gitBlobSha"],
        "sourceSha256": old_source["sha256"],
        "heroSourceFragment": hero_asset["sourceFragment"].copy(),
        "capturedBy": "R25 provenance update; preserves the previous exact source digests",
    })
registry["source"]["sha256"] = sha256_bytes(component_bytes)
registry["source"]["gitBlobSha"] = git_blob
r25_change = (
    "R25 adopts an approved-pipeline static ImageGen master and a separate "
    "Blender motion derivative. Historical Blender still exports are not the "
    "master or runtime asset; generated lightning PNGs are decorative Blender "
    "inputs, not browser animation frames. Rights and publication remain blocked."
)
if r25_change not in registry["source"]["changeRecord"]:
    registry["source"]["changeRecord"] = registry["source"]["changeRecord"].rstrip() + " " + r25_change
hero_asset["version"] = "0.4.0"
hero_asset["description"] = (
    "Decorative CoinBlink hero using an approved-pipeline static ImageGen master "
    "with an optional Blender-rendered motion derivative; accessible HTML copy "
    "remains outside the decorative artwork. Not Golden visual approval."
)
hero_asset["form"] = "IMAGEGEN_STATIC_MASTER_WITH_BLENDER_MOTION_DERIVATIVE"
hero_asset["physicalImageAsset"] = "STATIC_IMAGEGEN_MASTER_PLUS_BLENDER_MOTION_DERIVATIVE"
hero_asset["sourceFragment"]["sha256"] = hashlib.sha256(hero_fragment.encode("utf-8")).hexdigest()
hero_asset["sourceFragment"]["sourceByteLength"] = len(hero_fragment.encode("utf-8"))
for asset in registry["assets"]:
    asset["sourceGitBlobSha"] = git_blob
    asset["sourcePath"] = "src/modules/CB-M01/GoldenHome.astro"
registry["r25SupplementalPreview"] = {
    "assetId": "CB-M01-DEMO-HERO-BLENDER-LEGACY-STILLS",
    "assetClass": "BLENDER_CYCLES_STILL_RENDER_NOT_MASTER",
    "origin": "BLENDER_CYCLES_STILL_RENDER",
    "provenance": PROVENANCE.relative_to(ROOT).as_posix(),
    "runtimeUsage": False,
    "staticMaster": False,
    "role": "LEGACY_BLENDER_STILL_EXPORTS_NOT_USED_BY_RUNTIME",
    "png": report["exports"]["png"],
    "webp": report["exports"]["webp"],
    "previewOnly": True,
    "rightsReview": "PENDING_OWNER_OR_LEGAL",
    "ownerVisualApproval": False,
    "commercialPublicationAllowed": False,
    "publicationPermission": False,
}
registry["legacyBlenderStillExports"] = registry["r25SupplementalPreview"]
lightning = json.loads(LIGHTNING_PROVENANCE.read_text(encoding="utf-8"))
registry["cinematicAssetPolicy"] = {
    "decision": "R25_OWNER_DIRECTION",
    "staticMaster": {
        "assetClass": "STATIC_MASTER_APPROVED_IMAGE_PIPELINE",
        "origin": "OPENAI_IMAGE_GENERATION",
        "pipeline": "CODEX_APPROVED_IMAGE_PIPELINE",
        "path": imagegen["staticMaster"]["path"],
        "sha256": imagegen["staticMaster"]["sha256"],
        "provenance": IMAGEGEN_PROVENANCE.relative_to(ROOT).as_posix() + "#staticMaster",
    },
    "motionDerivative": {
        "assetClass": "BLENDER_MOTION_DERIVATIVE",
        "path": imagegen["motionDerivative"]["path"],
        "sha256": imagegen["motionDerivative"]["sha256"],
        "sourceProject": imagegen["motionDerivative"]["sourceProject"],
        "absoluteReferences": False,
        "provenance": PROVENANCE.relative_to(ROOT).as_posix() + "#animationProject",
    },
    "decorativeOverlays": {
        "assetClass": "DECORATIVE_OVERLAY_INPUT_TO_BLENDER_MOTION",
        "origin": "OPENAI_IMAGE_GENERATION",
        "count": len(lightning["frames"]),
        "individualBrowserAnimation": False,
        "packedIntoMotionProject": True,
        "provenance": LIGHTNING_PROVENANCE.relative_to(ROOT).as_posix(),
    },
    "rights": {
        "review": "PENDING_OWNER_OR_LEGAL",
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
        "publicationPermission": False,
        "liveEditorialEligible": False,
        "advertisingEligible": False,
        "allowedUsage": "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY",
    },
}
SCENE_REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n",
                          encoding="utf-8", newline="\n")
print(json.dumps({
    "master": report["sourceMaster"],
    "png": report["exports"]["png"],
    "webp": report["exports"]["webp"],
    "report": REPORT.relative_to(ROOT).as_posix(),
    "provenance": PROVENANCE.relative_to(ROOT).as_posix(),
    "sceneRegistry": SCENE_REGISTRY.relative_to(ROOT).as_posix(),
}, indent=2))
