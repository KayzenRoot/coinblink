"""Historical R23 packager; the Owner-approved R25 asset model supersedes this script."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


EVIDENCE = Path(__file__).resolve().parent
ROOT = EVIDENCE.parents[2]
FRAMES = Path(__import__("os").environ.get("TEMP", str(EVIDENCE))) / "coinblink-cb-m01-motion-frames"
SOURCE = EVIDENCE / "hero-cinematic-imagegen-source.png"
PNG = ROOT / "src" / "modules" / "CB-M01" / "hero-cinematic-original.png"
WEBP = ROOT / "src" / "modules" / "CB-M01" / "hero-cinematic-original.webp"
ANIMATED = EVIDENCE / "hero-cinematic-motion-preview.webp"
CONTACT = EVIDENCE / "hero-cinematic-motion-contact-sheet.png"
SPRITE_CONTACT = EVIDENCE / "lightning-sprite-contact-sheet.png"
MANIFEST = EVIDENCE / "hero-cinematic-imagegen-provenance.json"
SPRITES = EVIDENCE / "lightning-sprites-v2"
SPRITE_PROMPTS = SPRITES / "sprite-prompts.json"

# This historical generator rewrites the old origin gate and browser-sprite
# manifest. Fail before touching any artifacts once an R25 manifest exists.
if MANIFEST.is_file() and "staticMaster" in json.loads(MANIFEST.read_text(encoding="utf-8")):
    raise SystemExit(
        "R23 packager is superseded by the R25 static-master/Blender-motion policy; "
        "do not overwrite current provenance."
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


paths = [FRAMES / f"frame-{frame:04d}.png" for frame in range(1, 97)]
missing = [str(path) for path in paths if not path.is_file()]
if missing:
    raise FileNotFoundError(f"Expected 96 render frames; missing {len(missing)}. First: {missing[0]}")

frames = [Image.open(path).convert("RGB") for path in paths]
if any(frame.size != (1600, 800) for frame in frames):
    raise ValueError("Animation frame dimensions changed; expected 1600x800")

sprite_paths = sorted(SPRITES.glob("lightning-*.png"))
if len(sprite_paths) != 7:
    raise ValueError(f"Expected seven generated lightning sprites, found {len(sprite_paths)}")
sprite_records = []
for sprite_path in sprite_paths:
    with Image.open(sprite_path) as sprite:
        if sprite.mode != "RGBA" or sprite.size != (1774, 887):
            raise ValueError(f"Unexpected sprite format or canvas: {sprite_path} {sprite.mode} {sprite.size}")
        alpha = sprite.getchannel("A")
        if alpha.getextrema()[0] != 0 or alpha.getextrema()[1] == 0:
            raise ValueError(f"Sprite must preserve transparent background and visible pixels: {sprite_path}")
        alpha_histogram = alpha.histogram()
        transparent_pixels = alpha_histogram[0]
        sprite_records.append({
            "path": str(sprite_path.relative_to(ROOT)).replace("\\", "/"),
            "bytes": sprite_path.stat().st_size,
            "sha256": sha256(sprite_path),
            "dimensions": list(sprite.size),
            "transparentPixelRatio": round(transparent_pixels / (sprite.width * sprite.height), 6),
        })
if not SPRITE_PROMPTS.is_file():
    raise FileNotFoundError(f"Missing generated-sprite prompt record: {SPRITE_PROMPTS}")
sprite_prompt_record = json.loads(SPRITE_PROMPTS.read_text(encoding="utf-8"))

sprite_sheet = Image.new("RGB", (480 * 4, 270 * 2), (5, 11, 9))
sprite_draw = ImageDraw.Draw(sprite_sheet)
for slot, sprite_path in enumerate(sprite_paths):
    x = (slot % 4) * 480
    y = (slot // 4) * 270
    sprite_draw.text((x + 12, y + 7), sprite_path.stem.replace("lightning-", "").replace("-", " ").upper(),
                     fill=(220, 235, 220))
    with Image.open(sprite_path) as sprite:
        thumb = ImageOps.contain(sprite.convert("RGBA"), (480, 240), method=Image.Resampling.LANCZOS)
        sprite_sheet.paste(thumb.convert("RGB"), (x, y + 28), thumb.getchannel("A"))
sprite_sheet.save(SPRITE_CONTACT, format="PNG", optimize=True)

frames[0].save(ANIMATED, format="WEBP", save_all=True,
               append_images=frames[1:],
               duration=[42 if index % 3 != 2 else 41 for index in range(96)], loop=0,
               quality=92, method=4, minimize_size=False)
with Image.open(ANIMATED) as check:
    if not getattr(check, "is_animated", False) or check.n_frames != 96:
        raise RuntimeError(f"Animated WebP did not retain all 96 frames: {check.n_frames}")
    if check.size != (1600, 800):
        raise RuntimeError(f"Unexpected animation dimensions: {check.size}")
    durations = []
    for index in range(check.n_frames):
        check.seek(index)
        check.load()
        durations.append(check.info.get("duration", 0))
    if sum(durations) != 4000:
        raise RuntimeError(f"Unexpected animation duration: {sum(durations)}ms")

# The contact sheet covers the main strike, impact, afterglow, and both secondary strikes.
samples = []
sample_indices = (0, 17, 19, 21, 22, 23, 59, 71, 95)
for index in sample_indices:
    thumb = ImageOps.fit(frames[index], (480, 240), method=Image.Resampling.LANCZOS)
    samples.append(thumb)
sheet = Image.new("RGB", (480 * 3, 268 * 3), (4, 9, 7))
draw = ImageDraw.Draw(sheet)
for slot, (frame_index, frame) in enumerate(zip(sample_indices, samples)):
    x = (slot % 3) * 480
    y = (slot // 3) * 268
    draw.text((x + 12, y + 7), f"FRAME {frame_index + 1:02d}", fill=(220, 235, 220))
    sheet.paste(frame, (x, y + 28))
sheet.save(CONTACT, format="PNG", optimize=True)

generation_prompt = (
    "Use case: original cinematic website hero artwork for the CoinBlink demonstration homepage. "
    "Input image: the attached full-page screenshot is a visual reference only; take composition, palette, "
    "lighting, and subject placement from the large hero banner at the top-left, and ignore the rest of the "
    "webpage. Create a new, highly faithful cinematic 3D scene that matches the hero's visual direction: "
    "a large minted golden Bitcoin coin in three-quarter view, positioned center-right, with clearly visible "
    "thick ribbed edge and engraved Bitcoin mark; dramatic dark jagged basalt mountains framing the lower and "
    "rear areas; vivid but restrained lime-green rising light trail behind the coin; fine atmospheric haze and "
    "a few subtle particles. Composition: extra-wide 2:1 landscape background, keep the left 42 percent very "
    "dark and low-detail for separate HTML copy, keep the coin dominant in the right-center, and retain the "
    "luminous green chart energy and rocky horizon. Style: premium photoreal 3D product-cinematic render, "
    "realistic metal reflections, physically plausible shadows, rich material detail, crisp focus on the coin, "
    "layered depth, high-end lighting, deep charcoal and forest-green shadows with warm gold. Make the art "
    "original while tracking the reference composition closely. No webpage, panels, logos, UI, buttons, people, "
    "symbols other than a simple Bitcoin mark on the coin, no headline, no price, no other writing, no watermark. "
    "Do not copy or reproduce any pixels from the reference screenshot."
)

with Image.open(SOURCE) as original:
    source_dimensions = list(original.size)
    source_format = original.format
manifest = {
    "schemaVersion": 1,
    "workOrder": "CB-M01-WO-001",
    "productState": "LOCAL_PREVIEW_ONLY_NOT_PUBLISHED",
    "origin": "OPENAI_IMAGE_GENERATION",
    "provider": "OpenAI built-in image_gen tool",
    "modelVersion": "NOT_EXPOSED_BY_TOOL_RESULT",
    "generatedSource": {
        "path": ".engineering/evidence/CB-M01-WO-001/hero-cinematic-imagegen-source.png",
        "format": source_format,
        "dimensions": source_dimensions,
        "bytes": SOURCE.stat().st_size,
        "sha256": sha256(SOURCE),
        "prompt": generation_prompt,
    },
    "visualReference": {
        "path": "assets/reference/coinblink-home-master-dark-1536x864.jpg",
        "sha256": "82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8",
        "use": "COMPOSITION_PALETTE_AND_LIGHTING_REFERENCE_ONLY",
    },
    "outputs": {
        "png": {"path": "src/modules/CB-M01/hero-cinematic-original.png",
                "bytes": PNG.stat().st_size, "sha256": sha256(PNG)},
        "webp": {"path": "src/modules/CB-M01/hero-cinematic-original.webp",
                 "bytes": WEBP.stat().st_size, "sha256": sha256(WEBP)},
        "animation": {"path": ".engineering/evidence/CB-M01-WO-001/hero-cinematic-motion-preview.webp",
                      "bytes": ANIMATED.stat().st_size, "sha256": sha256(ANIMATED),
                      "dimensions": [1600, 800], "sourceFrameCount": 96,
                      "encodedFrameCount": check.n_frames, "frameRate": 24,
                      "durationMs": sum(durations), "durationSeconds": 4.0, "loop": True,
                      "motion": "SLOW_CAMERA_DRIFT_WITH_SEVEN_GENERATED_LIGHTNING_SPRITES_AND_FLASHES",
                      "independentCoinMotion": False,
                      "source": ".engineering/evidence/CB-M01-WO-001/hero-cinematic-animation.blend"},
        "contactSheet": ".engineering/evidence/CB-M01-WO-001/hero-cinematic-motion-contact-sheet.png",
    },
    "lightningSprites": {
        "count": len(sprite_records),
        "transparentBackground": True,
        "files": sprite_records,
        "promptSet": sprite_prompt_record,
        "contactSheet": str(SPRITE_CONTACT.relative_to(ROOT)).replace("\\", "/"),
    },
    "technicalPreflight": {
        "status": "NOT_RUN_ORIGIN_SCHEMA_MISMATCH",
        "reason": "Historical R23 result only. The Owner R25 policy accepts an approved-pipeline static master and does not require a Blender-origin still.",
    },
    "rights": {
        "review": "PENDING_OWNER_OR_LEGAL",
        "commercialPublicationAllowed": False,
        "allowedUsage": "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY",
        "ownerVisualApproval": False,
    },
}
MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({
    "frames": len(frames),
    "encodedFrames": check.n_frames,
    "durationMs": sum(durations),
    "animatedWebp": str(ANIMATED),
    "animatedBytes": ANIMATED.stat().st_size,
    "contactSheet": str(CONTACT),
    "spriteContactSheet": str(SPRITE_CONTACT),
    "manifest": str(MANIFEST),
    "pngBytes": PNG.stat().st_size,
    "webpBytes": WEBP.stat().st_size,
    "sourceSha256": sha256(SOURCE),
}, indent=2))
