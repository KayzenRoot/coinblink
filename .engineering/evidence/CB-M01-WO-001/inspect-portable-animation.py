"""Verify the sanitized portable animation project in a fresh Blender process."""

from __future__ import annotations

import json
from pathlib import Path

import bpy


scene = bpy.context.scene
images = list(bpy.data.images)
image_records = []
for image in images:
    packed = image.packed_file is not None
    image_records.append({
        "name": image.name,
        "source": image.source,
        "relativePath": image.filepath,
        "packed": packed,
        "packedBytes": len(image.packed_file.data) if packed else 0,
    })

assert scene.frame_start == 1 and scene.frame_end == 96
assert scene.render.fps == 24
assert scene.render.resolution_x == 1600 and scene.render.resolution_y == 800
assert scene.render.filepath.startswith("//")
external_images = [image for image in images if image.source == "FILE"]
assert len(external_images) > 0 and all(image.packed_file is not None for image in external_images), \
    "Every external image dependency must be packed into the portable .blend"
assert all(image.filepath.startswith("//") for image in external_images), \
    "Every external image path in the portable .blend must be relative"
assert len(bpy.data.libraries) == 0

report = {
    "status": "passed",
    "workOrder": "CB-M01-WO-001",
    "projectFileName": Path(bpy.data.filepath).name,
    "frameRange": [scene.frame_start, scene.frame_end],
    "fps": scene.render.fps,
    "resolution": [scene.render.resolution_x, scene.render.resolution_y],
    "relativeOutputPath": scene.render.filepath,
    "imageCount": len(images),
    "externalImageCount": len(external_images),
    "allExternalImagesPacked": all(image.packed_file is not None for image in external_images),
    "allExternalReferencesRelative": all(image.filepath.startswith("//") for image in external_images),
    "linkedLibraries": len(bpy.data.libraries),
    "images": image_records,
    "rights": {
        "previewOnly": True,
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
    },
}
output = Path(__file__).resolve().parent / "hero-cinematic-animation-portable-inspection.json"
output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2, ensure_ascii=False))
