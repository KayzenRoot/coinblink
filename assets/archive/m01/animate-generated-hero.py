"""Animate the OpenAI-generated hero plate with generated 2D lightning sprites.

Blender only composites the generated hero and transparent ImageGen overlays,
then animates camera drift and brief exposure flashes. It does not author the
artwork, scene, landscape, coin, or lightning geometry.
"""

from __future__ import annotations

import os
from pathlib import Path

import bpy


SCRIPT = Path(__file__).resolve()
EVIDENCE = SCRIPT.parent
ROOT = EVIDENCE.parents[2]
IMAGE = ROOT / "src" / "modules" / "CB-M01" / "hero-cinematic-original.png"
PROJECT = EVIDENCE / "hero-cinematic-animation-portable.blend"
FRAME_DIR = Path(os.environ.get("TEMP", str(EVIDENCE))) / "coinblink-cb-m01-motion-frames"
STILL_DIR = EVIDENCE / "hero-cinematic-motion-stills"
SPRITE_DIR = EVIDENCE / "lightning-sprites-v2"
MODE = os.environ.get("CB_HERO_ANIMATION_MODE", "frames").lower()

SECONDARY_RIGHT_SPRITE = "lightning-05-secondary-right.png"
SECONDARY_LEFT_SPRITE = "lightning-06-secondary-left.png"

SPRITE_OPACITY = {
    "lightning-01-charge.png": 0.28,
    "lightning-02-descent.png": 0.45,
    "lightning-03-impact.png": 0.82,
    "lightning-04-afterglow.png": 0.34,
    SECONDARY_RIGHT_SPRITE: 0.66,
    SECONDARY_LEFT_SPRITE: 0.52,
    "lightning-07-ground-fade.png": 0.20,
}
SPRITE_SCHEDULE = {
    "lightning-01-charge.png": ((18, 19),),
    "lightning-02-descent.png": ((20, 21),),
    "lightning-03-impact.png": ((22, 23),),
    "lightning-04-afterglow.png": ((24, 28),),
    SECONDARY_RIGHT_SPRITE: ((60, 61),),
    SECONDARY_LEFT_SPRITE: ((72, 73),),
    "lightning-07-ground-fade.png": ((29, 34), (62, 66), (74, 79)),
}
SPRITE_X_OFFSETS = {
    SECONDARY_RIGHT_SPRITE: 0.28,
    SECONDARY_LEFT_SPRITE: -0.22,
}
FLASH_STRENGTH_KEYS = (
    (1, 1.0), (21, 1.0), (22, 1.18), (23, 1.28), (24, 1.16),
    (25, 1.04), (29, 1.0), (59, 1.0), (60, 1.20), (61, 1.08),
    (62, 1.0), (71, 1.0), (72, 1.16), (73, 1.06), (74, 1.0), (96, 1.0),
)


def create_sprite_material(name: str, image: bpy.types.Image, opacity: float):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    texture.extension = "CLIP"
    grayscale = nodes.new("ShaderNodeRGBToBW")
    links.new(texture.outputs["Color"], grayscale.inputs["Color"])

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.34
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp.color_ramp.elements[1].position = 0.86
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    links.new(grayscale.outputs["Val"], ramp.inputs["Fac"])

    brightness = nodes.new("ShaderNodeRGBToBW")
    links.new(ramp.outputs["Color"], brightness.inputs["Color"])
    alpha_gate = nodes.new("ShaderNodeMath")
    alpha_gate.operation = "MULTIPLY"
    links.new(texture.outputs["Alpha"], alpha_gate.inputs[0])
    links.new(brightness.outputs["Val"], alpha_gate.inputs[1])

    opacity_node = nodes.new("ShaderNodeValue")
    opacity_node.outputs[0].default_value = opacity
    final_alpha = nodes.new("ShaderNodeMath")
    final_alpha.operation = "MULTIPLY"
    links.new(alpha_gate.outputs[0], final_alpha.inputs[0])
    links.new(opacity_node.outputs[0], final_alpha.inputs[1])

    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1.5
    links.new(texture.outputs["Color"], emission.inputs["Color"])
    mix = nodes.new("ShaderNodeMixShader")
    links.new(final_alpha.outputs[0], mix.inputs["Fac"])
    links.new(transparent.outputs["BSDF"], mix.inputs[1])
    links.new(emission.outputs["Emission"], mix.inputs[2])
    output = nodes.new("ShaderNodeOutputMaterial")
    links.new(mix.outputs["Shader"], output.inputs["Surface"])
    return material



def create_image_plate():
    # One image-mapped card with a small safety bleed for the camera's slow drift.
    half_width = 1.015
    half_height = 0.5075
    mesh = bpy.data.meshes.new("Generated hero image card")
    mesh.from_pydata(((-half_width, -half_height, 0.0),
                      (half_width, -half_height, 0.0),
                      (half_width, half_height, 0.0),
                      (-half_width, half_height, 0.0)), [], ((0, 1, 2, 3),))
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Image UV")
    for loop_index, uv in zip(mesh.polygons[0].loop_indices,
                              ((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0))):
        uv_layer.data[loop_index].uv = uv
    card = bpy.data.objects.new("Generated OpenAI hero plate", mesh)
    bpy.context.collection.objects.link(card)

    image = bpy.data.images.load(str(IMAGE), check_existing=True)
    image.colorspace_settings.name = "sRGB"
    image.pack()
    image.filepath = "//" + Path(os.path.relpath(IMAGE, EVIDENCE)).as_posix()
    material = bpy.data.materials.new("Unmodified generated hero pixels")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Cubic"
    texture.extension = "CLIP"
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1.0
    links.new(texture.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    card.data.materials.append(material)

    return mesh, image, material, emission


def animate_sprite_overlays(mesh, image):
    for index, (filename, opacity) in enumerate(SPRITE_OPACITY.items()):
        sprite_path = SPRITE_DIR / filename
        if not sprite_path.is_file():
            raise FileNotFoundError(f"Lightning sprite missing: {sprite_path}")
        sprite_image = bpy.data.images.load(str(sprite_path), check_existing=True)
        if tuple(sprite_image.size) != tuple(image.size):
            raise ValueError(f"Lightning sprite canvas does not match base image: {sprite_path}")
        sprite_image.colorspace_settings.name = "sRGB"
        sprite_image.pack()
        sprite_image.filepath = "//" + Path(os.path.relpath(sprite_path, EVIDENCE)).as_posix()

        sprite_mesh = mesh.copy()
        sprite = bpy.data.objects.new(f"Generated lightning sprite {index + 1:02d}", sprite_mesh)
        bpy.context.collection.objects.link(sprite)
        sprite.location = (SPRITE_X_OFFSETS.get(filename, 0.0), 0.0,
                           0.01 + index * 0.0001)
        sprite_material = create_sprite_material(
            f"ImageGen lightning overlay {index + 1:02d}", sprite_image, opacity)
        sprite.data.materials.clear()
        sprite.data.materials.append(sprite_material)

        sprite.hide_render = True
        sprite.keyframe_insert(data_path="hide_render", frame=1)
        for start_frame, end_frame in SPRITE_SCHEDULE[filename]:
            sprite.hide_render = False
            sprite.keyframe_insert(data_path="hide_render", frame=start_frame)
            sprite.hide_render = True
            sprite.keyframe_insert(data_path="hide_render", frame=end_frame + 1)
        if sprite.animation_data and sprite.animation_data.action:
            for curve in getattr(sprite.animation_data.action, "fcurves", ()):
                for point in curve.keyframe_points:
                    point.interpolation = "CONSTANT"



def animate_exposure_flashes(material, emission):
    for frame, strength in FLASH_STRENGTH_KEYS:
        emission.inputs["Strength"].default_value = strength
        emission.inputs["Strength"].keyframe_insert(data_path="default_value", frame=frame)
    if material.node_tree.animation_data and material.node_tree.animation_data.action:
        for curve in getattr(material.node_tree.animation_data.action, "fcurves", ()):
            for point in curve.keyframe_points:
                point.interpolation = "LINEAR"



def configure_cinematic_camera(scene):
    camera_data = bpy.data.cameras.new("Slow cinematic camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 2.0
    camera = bpy.data.objects.new("Slow cinematic camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, 0.0, 8.0)
    scene.camera = camera

    # Four-second seamless breathing push: under 1.3% zoom and 1.6% lateral drift.
    # The final key is frame 97 so frames 1-96 cover exactly four seconds without
    # duplicating the loop's first image at its last frame.
    scale_keys = ((1, 2.0), (25, 1.9875), (49, 1.975),
                  (73, 1.9875), (97, 2.0))
    x_keys = ((1, 0.0), (25, 0.016), (49, 0.0),
              (73, -0.016), (97, 0.0))
    for frame, scale in scale_keys:
        camera_data.ortho_scale = scale
        camera_data.keyframe_insert(data_path="ortho_scale", frame=frame)
    for frame, offset_x in x_keys:
        camera.location.x = offset_x
        camera.keyframe_insert(data_path="location", index=0, frame=frame)
    for animation in (camera.animation_data, camera_data.animation_data):
        if animation and animation.action:
            for curve in getattr(animation.action, "fcurves", ()):
                for point in curve.keyframe_points:
                    if curve.data_path == "location":
                        point.interpolation = "LINEAR"
                    else:
                        point.interpolation = "BEZIER"
                        point.handle_left_type = "AUTO_CLAMPED"
                        point.handle_right_type = "AUTO_CLAMPED"



def build_animation():
    if not IMAGE.is_file():
        raise FileNotFoundError(f"Generated image source missing: {IMAGE}")

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 1
    scene.cycles.use_denoising = False
    scene.render.resolution_percentage = 100
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 800
    scene.render.fps = 24
    scene.render.fps_base = 1.0
    scene.frame_start = 1
    scene.frame_end = 96
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    scene.world.color = (0.0, 0.0, 0.0)

    mesh, image, material, emission = create_image_plate()
    animate_sprite_overlays(mesh, image)
    animate_exposure_flashes(material, emission)
    configure_cinematic_camera(scene)

    scene["workOrder"] = "CB-M01-WO-001"
    scene["sourceImage"] = IMAGE.relative_to(ROOT).as_posix()
    scene["motionType"] = "2D camera push/drift with seven ImageGen lightning sprites, spatial offsets, and exposure flashes"
    scene["durationSeconds"] = 4.0
    scene["frameRate"] = 24
    scene["lightningSpriteCount"] = len(SPRITE_OPACITY)
    scene["coinHasIndependentMotion"] = False
    scene["allowedUsage"] = "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY"
    scene["commercialPublicationAllowed"] = False
    scene.frame_set(1)
    scene.render.filepath = "//hero-cinematic-animation-portable-"
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(PROJECT))
    return scene


def render_frames(scene):
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 800
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 96
    FRAME_DIR.mkdir(exist_ok=True)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = str(FRAME_DIR / "frame-")
    bpy.ops.render.render(animation=True)
    print(f"CB_HERO_FRAMES_COMPLETE path={FRAME_DIR} frames=96 fps=24 size=1600x800")


def render_stills(scene):
    STILL_DIR.mkdir(exist_ok=True)
    scene.render.resolution_x = 800
    scene.render.resolution_y = 400
    scene.render.image_settings.file_format = "PNG"
    for frame in (1, 18, 20, 22, 23, 24, 28, 48, 60, 72, 76, 96):
        scene.frame_set(frame)
        scene.render.filepath = str(STILL_DIR / f"frame-{frame:03d}.png")
        bpy.ops.render.render(write_still=True)
    print(f"CB_HERO_STILLS_COMPLETE path={STILL_DIR} frames=1,18,20,22,23,24,28,48,60,72,76,96")


scene = build_animation()
if MODE == "frames":
    render_frames(scene)
elif MODE == "stills":
    render_stills(scene)
elif MODE == "project":
    print(f"CB_HERO_PORTABLE_PROJECT_COMPLETE path={PROJECT} packedImages=8")
else:
    raise ValueError(f"Unsupported CB_HERO_ANIMATION_MODE: {MODE}")
