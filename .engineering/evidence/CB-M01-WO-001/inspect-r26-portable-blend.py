"""Read-only inspection of the existing portable R25 Blender motion source."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / ".engineering/evidence/CB-M01-WO-001/r26-blender-project-inspection.json"
project_path = Path(bpy.data.filepath).resolve()
if not project_path.is_relative_to(ROOT):
    raise RuntimeError("Blender project must resolve inside the CoinBlink worktree")

digest = hashlib.sha256(project_path.read_bytes()).hexdigest()
scene = bpy.context.scene
images = []
path_portability = []
for image in bpy.data.images:
    if image.name in {"Render Result", "Viewer Node"}:
        continue
    raw_path = image.filepath
    packed = image.packed_file is not None
    is_relative = raw_path.startswith("//")
    resolved_path = Path(bpy.path.abspath(raw_path)).resolve() if raw_path else None
    path_portability.append(is_relative or packed or not raw_path)
    images.append(
        {
            "name": image.name,
            "filepath": raw_path,
            "relativePath": is_relative,
            "packed": packed,
            "resolvedFileExists": bool(resolved_path and resolved_path.is_file()),
        }
    )

objects = [
    {
        "name": obj.name,
        "type": obj.type,
        "animated": bool(obj.animation_data and obj.animation_data.action),
    }
    for obj in scene.objects
]
camera = scene.camera
manifest = {
    "schemaVersion": 1,
    "workOrder": "CB-M01-WO-001",
    "inspection": "R26_READ_ONLY_REOPEN_IN_BLENDER_NO_RENDER_NO_SAVE",
    "project": {
        "path": project_path.relative_to(ROOT).as_posix(),
        "sha256": digest,
        "bytes": project_path.stat().st_size,
    },
    "blenderVersion": bpy.app.version_string,
    "scene": {
        "objectCount": len(objects),
        "objects": objects,
        "camera": camera.name if camera else None,
        "cameraLensMm": camera.data.lens if camera and camera.data else None,
        "frameStart": scene.frame_start,
        "frameEnd": scene.frame_end,
        "fps": scene.render.fps,
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "materials": sorted(material.name for material in bpy.data.materials),
        "images": images,
        "linkedLibraryCount": len(bpy.data.libraries),
    },
    "portability": {
        "allImagePathsRelativePackedOrInternal": all(path_portability),
        "packedImageCount": sum(1 for image in images if image["packed"]),
        "unpackedImagesWithMissingFiles": [
            image["name"] for image in images if not image["packed"] and not image["resolvedFileExists"]
        ],
    },
    "releaseGate": {
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
        "publicationPermission": False,
        "productState": "DEMO",
    },
}
OUTPUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("R26_BLEND_INSPECTION=" + json.dumps({
    "projectSha256": digest,
    "blenderVersion": bpy.app.version_string,
    "objectCount": len(objects),
    "packedImageCount": manifest["portability"]["packedImageCount"],
    "relativePackedPathAudit": manifest["portability"]["allImagePathsRelativePackedOrInternal"],
    "report": OUTPUT.relative_to(ROOT).as_posix(),
}, ensure_ascii=False))
