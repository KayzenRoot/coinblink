"""Fail-closed structural inspection for the saved CB-M01 Blender master."""

from __future__ import annotations

import json
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = Path(__file__).resolve().parent
PROJECT = Path(bpy.data.filepath).resolve()
SCENE = bpy.context.scene


def principled_metallic(material):
    if not material or not material.use_nodes:
        return None
    shader = next((node for node in material.node_tree.nodes
                   if node.type == "BSDF_PRINCIPLED"), None)
    if not shader:
        return None
    return float(shader.inputs["Metallic"].default_value)


coin = bpy.data.objects.get("Thick beveled gold Bitcoin coin")
glyph = bpy.data.objects.get("Raised Bitcoin B symbol")
camera = SCENE.camera
areas = [obj for obj in SCENE.objects if obj.type == "LIGHT" and obj.data.type == "AREA"]
rocks = [obj for obj in SCENE.objects if obj.name.startswith(("Foreground basalt", "Ridge boulder"))]
ridge = bpy.data.objects.get("Basalt mountain range")
ground = bpy.data.objects.get("Dark rocky ground")

assert SCENE.render.engine == "CYCLES", "master must use Blender Cycles"
assert SCENE.render.resolution_x == 2560 and SCENE.render.resolution_y == 1280
assert SCENE.render.resolution_percentage == 100
assert SCENE.cycles.samples == 32
assert SCENE.render.filepath.startswith("//"), "render path must be portable and relative"
assert camera and camera.type == "CAMERA" and camera.data.type == "PERSP"
assert coin and coin.type == "MESH" and len(coin.data.vertices) >= 144
assert max(coin.dimensions) > 3.0 and min(coin.dimensions) > 0.1
assert any((principled_metallic(material) or 0.0) >= 0.8 for material in coin.data.materials)
assert glyph and glyph.type == "FONT" and glyph.data.extrude > 0
assert len(areas) >= 5 and all(light.data.energy > 0 for light in areas)
assert ridge and ridge.type == "MESH" and len(ridge.data.polygons) >= 900
assert ground and ground.type == "MESH"
assert len(rocks) >= 8 and all(obj.type == "MESH" for obj in rocks)
assert all(not polygon.use_smooth for obj in rocks for polygon in obj.data.polygons)

report = {
    "status": "passed",
    "workOrder": "CB-M01-WO-001",
    "blenderVersion": bpy.app.version_string,
    "projectPath": PROJECT.relative_to(ROOT).as_posix(),
    "scene": {
        "engine": SCENE.render.engine,
        "device": SCENE.cycles.device,
        "resolution": [SCENE.render.resolution_x, SCENE.render.resolution_y],
        "samples": SCENE.cycles.samples,
        "denoising": SCENE.cycles.use_denoising,
        "portableRenderPath": SCENE.render.filepath,
        "objectCount": len(SCENE.objects),
        "meshCount": sum(obj.type == "MESH" for obj in SCENE.objects),
        "areaLightCount": len(areas),
        "camera": {"type": camera.data.type, "lensMm": camera.data.lens},
    },
    "coin": {
        "objectName": coin.name,
        "geometry": "144+ vertex beveled mesh cylinder with physical thickness",
        "dimensions": [round(value, 4) for value in coin.dimensions],
        "materials": [{"name": material.name, "metallic": principled_metallic(material)}
                      for material in coin.data.materials],
        "extrudedBitcoinGlyph": {"objectName": glyph.name, "extrusion": glyph.data.extrude},
    },
    "environment": {
        "ridgeMeshFaces": len(ridge.data.polygons),
        "groundPresent": True,
        "rockObjectCount": len(rocks),
        "facetedRockMeshes": all(not polygon.use_smooth for obj in rocks for polygon in obj.data.polygons),
    },
    "rights": {
        "previewOnly": True,
        "ownerVisualApproval": False,
        "commercialPublicationAllowed": False,
    },
}
output = EVIDENCE / "hero-cinematic-blender-scene-inspection.json"
output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2, ensure_ascii=False))
