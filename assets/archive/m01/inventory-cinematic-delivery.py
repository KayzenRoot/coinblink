"""Inventory the CB-M01 R25 static master, Blender motion, and local-only scratch."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


SCRIPT = Path(__file__).resolve()
EVIDENCE_DIR = SCRIPT.parent
ROOT = EVIDENCE_DIR.parents[2]
OUTPUT = EVIDENCE_DIR / "cinematic-delivery-inventory.json"
BASE_HEAD = "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c"
BRANCH = "codex/cb-m01-wo-001-impl-20261011"
ALLOWED_ROOTS = (
    ".engineering/evidence/CB-M01-WO-001/",
    "src/modules/CB-M01/",
    "test/modules/CB-M01/",
)
WITHHELD_BLEND = ".engineering/evidence/CB-M01-WO-001/hero-cinematic-animation.blend"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_details(path: Path) -> dict[str, object] | None:
    try:
        with Image.open(path) as image:
            result = {
                "format": image.format,
                "dimensions": list(image.size),
                "mode": image.mode,
                "frameCount": getattr(image, "n_frames", 1),
            }
            decoded = 0
            for frame_index in range(int(result["frameCount"])):
                image.seek(frame_index)
                image.load()
                decoded += 1
            result["decodedFrameCount"] = decoded
            return result
    except (OSError, ValueError):
        return None


def file_record(relative: str, status: str) -> dict[str, object]:
    path = ROOT / relative
    record: dict[str, object] = {
        "path": relative.replace("\\", "/"),
        "statusAtInventory": status,
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "suffix": path.suffix.lower(),
    }
    if path.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"}:
        record["image"] = image_details(path)
    elif path.suffix.lower() == ".blend":
        with path.open("rb") as stream:
            record["blenderHeader"] = stream.read(12).decode("ascii", errors="replace")
    return record


status_lines = git("status", "--porcelain=v1", "--untracked-files=all").splitlines()
changed: dict[str, str] = {}
for line in status_lines:
    if not line:
        continue
    status = "UNTRACKED" if line.startswith("??") else "MODIFIED_OR_STAGED"
    relative = line[3:]
    if relative == WITHHELD_BLEND or relative.endswith((".blend1", ".pyc")) or "/__pycache__/" in relative:
        continue
    if relative.startswith(ALLOWED_ROOTS) and relative != OUTPUT.relative_to(ROOT).as_posix():
        changed[relative] = status
for relative in git("diff", "--name-only", BASE_HEAD, "HEAD", "--").splitlines():
    if relative.startswith(ALLOWED_ROOTS) and relative != OUTPUT.relative_to(ROOT).as_posix():
        changed.setdefault(relative, "COMMITTED_AFTER_PR_HEAD")

records = [file_record(path, status) for path, status in sorted(changed.items())]
scratch: list[dict[str, object]] = []
for path in sorted(EVIDENCE_DIR.rglob("*")):
    if path.is_file() and (path.suffix.lower() in {".blend1", ".pyc"}):
        scratch.append({
            "path": path.relative_to(ROOT).as_posix(),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
            "reason": "Blender autosave backup or Python bytecode cache; omitted from Git deliverables.",
        })

frame_dir = Path(tempfile.gettempdir()) / "coinblink-cb-m01-motion-frames"
frame_files = sorted(frame_dir.glob("*.png")) if frame_dir.is_dir() else []
temp_frames = {
    "directory": "%TEMP%/coinblink-cb-m01-motion-frames",
    "directoryFound": frame_dir.is_dir(),
    "count": len(frame_files),
    "bytes": sum(path.stat().st_size for path in frame_files),
    "first": frame_files[0].name if frame_files else None,
    "last": frame_files[-1].name if frame_files else None,
    "reason": "Reproducible intermediate render frames; selected stills and final animation are retained as evidence.",
}
withheld_blend_path = ROOT / WITHHELD_BLEND
withheld_from_github = []
if withheld_blend_path.is_file():
    withheld_from_github.append({
        "path": WITHHELD_BLEND,
        "bytes": withheld_blend_path.stat().st_size,
        "sha256": sha256(withheld_blend_path),
        "reason": "Contains absolute workstation/worktree paths in embedded image references. Blender is unavailable to resave with portable paths, so this binary is withheld from GitHub.",
    })

payload = {
    "schemaVersion": 1,
    "workOrder": "CB-M01-WO-001",
    "recordType": "R25_STATIC_MASTER_AND_BLENDER_MOTION_INVENTORY",
    "capturedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "repository": "KayzenRoot/coinblink",
    "branch": BRANCH,
    "baseHeadAtInventory": BASE_HEAD,
    "snapshotHeadAtInventory": git("rev-parse", "HEAD"),
    "remoteTrackingHeadAtInventory": git("rev-parse", "origin/" + BRANCH),
    "liveRemoteWasSeparatelyChecked": True,
    "policy": {
        "staticMaster": "STATIC_MASTER_APPROVED_IMAGE_PIPELINE",
        "motionDerivative": "BLENDER_MOTION_DERIVATIVE",
        "decorativeOverlays": "DECORATIVE_OVERLAY_INPUT_TO_BLENDER_MOTION",
        "rightsReview": "PENDING_OWNER_OR_LEGAL",
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
        "publicationPermission": False,
    },
    "files": records,
    "fileCount": len(records),
    "bytesTotal": sum(int(record["bytes"]) for record in records),
    "localOnlyScratch": {
        "files": scratch,
        "temporaryMotionFrames": temp_frames,
    },
    "withheldFromGitHub": withheld_from_github,
    "historicalR23WithheldAssets": [{
        "path": WITHHELD_BLEND,
        "status": "HISTORICALLY_WITHHELD_NONPORTABLE_BINARY_NOT_CURRENT_MOTION_PROJECT",
        "bytes": 4249252,
        "sha256": "125170b1433d5efe111ded1f226464215df512c8697996fde21f2cf37654dd3f",
        "supersededBy": ".engineering/evidence/CB-M01-WO-001/hero-cinematic-animation-portable.blend",
        "currentPortableProjectSha256": "898b99ff862f141f27871a2979a1a383fb7a60c3349a0810af2b6fcbafa6d8ec",
        "reason": "Preserved as historical R23 provenance. It is not used by runtime or substituted for the R25 portable motion project.",
    }],
    "inventorySelfHash": "OMITTED_TO_AVOID_SELF_REFERENCE",
}
OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(json.dumps({
    "inventory": OUTPUT.relative_to(ROOT).as_posix(),
    "fileCount": payload["fileCount"],
    "bytesTotal": payload["bytesTotal"],
    "scratchFileCount": len(scratch),
    "temporaryMotionFrames": temp_frames,
}, indent=2))
