"""Reproducible, original Blender scene for the local CB-M01 hero study.

All geometry and materials are authored here. The Golden screenshot is a
composition reference only; this scene loads no reference pixels or textures.
Run with CB_HERO_RENDER_MODE=preview|master|candidate|motion.
"""

from __future__ import annotations

import math
import os
import random
from pathlib import Path

import bpy
from mathutils import Vector


SEED = 241013
random.seed(SEED)
SCRIPT_PATH = Path(__file__).resolve()
EVIDENCE_DIR = SCRIPT_PATH.parent
REPO_ROOT = EVIDENCE_DIR.parents[2]
MODULE_DIR = REPO_ROOT / "src" / "modules" / "CB-M01"
RENDER_DIR = EVIDENCE_DIR / "hero-cinematic-renders"
RENDER_DIR.mkdir(parents=True, exist_ok=True)
MODE = os.environ.get("CB_HERO_RENDER_MODE", "preview").lower()


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.meshes,
                       bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(name, color, metallic=0.0, roughness=0.5,
             noise_scale=None, bump_strength=0.0, bump_distance=0.03):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (520, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.location = (260, 0)
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    if noise_scale:
        noise = nodes.new("ShaderNodeTexNoise")
        noise.location = (-420, 30)
        noise.inputs["Scale"].default_value = noise_scale
        noise.inputs["Detail"].default_value = 5.0
        noise.inputs["Roughness"].default_value = 0.72
        bump = nodes.new("ShaderNodeBump")
        bump.location = (30, -170)
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = bump_distance
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return mat


def emission(name, color, strength):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeEmission")
    shader.inputs["Color"].default_value = (*color, 1.0)
    shader.inputs["Strength"].default_value = strength
    links.new(shader.outputs["Emission"], output.inputs["Surface"])
    return mat, shader


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area(name, location, target, power, color, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    aim(obj, target)
    return obj


def add_rock(name, location, scale, mat, subdivisions=2, facet_mat=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    for vertex in obj.data.vertices:
        direction = vertex.co.normalized()
        vertex.co += direction * random.uniform(-0.05, 0.05)
    obj.scale = scale
    obj.data.materials.append(mat)
    if facet_mat:
        obj.data.materials.append(facet_mat)
    for index, polygon in enumerate(obj.data.polygons):
        polygon.use_smooth = False
        if facet_mat and polygon.normal.z > 0.45:
            polygon.material_index = 1
    return obj


def triangulate_ridge_faces(xs, ys):
    faces = []
    width = len(xs)
    for row in range(len(ys) - 1):
        for column in range(width - 1):
            a = row * width + column
            b = a + 1
            c = a + width
            d = c + 1
            if random.choice((True, False)):
                faces.extend(((a, b, d), (a, d, c)))
            else:
                faces.extend(((a, b, c), (b, d, c)))
    return faces


def add_ridge(materials):
    # A layered, denser basalt range; the left side stays low and dark.
    xs = [-8.0 + index * 0.2 for index in range(81)]
    ys = [3.0, 3.8, 4.8, 6.0, 7.4, 8.9, 10.4]
    row_factors = [1.0, 0.91, 0.79, 0.66, 0.52, 0.37, 0.22]
    vertices = []
    for row, y in enumerate(ys):
        for x in xs:
            peaks = (
                2.2 * math.exp(-((x - 0.9) / 1.8) ** 2)
                + 3.1 * math.exp(-((x - 4.4) / 1.25) ** 2)
                + 2.2 * math.exp(-((x - 6.7) / 1.4) ** 2)
            )
            jagged = random.uniform(-0.12, 0.12)
            z = 0.12 + (0.28 + peaks + jagged) * row_factors[row]
            vertices.append((x, y, max(0.08, z)))
    faces = triangulate_ridge_faces(xs, ys)
    mesh = bpy.data.meshes.new("Original triangulated basalt ridge")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.clear()
    for mat in materials:
        mesh.materials.append(mat)
    ridge = bpy.data.objects.new("Basalt mountain range", mesh)
    bpy.context.collection.objects.link(ridge)
    for polygon in mesh.polygons:
        height = sum(mesh.vertices[index].co.z for index in polygon.vertices) / len(polygon.vertices)
        if height < 0.85:
            polygon.material_index = 0
        elif height < 1.7:
            polygon.material_index = 1
        else:
            polygon.material_index = 2
        polygon.use_smooth = False
    return ridge


def add_polyline(name, points, bevel, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 1
    curve.bevel_depth = bevel
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinate in zip(spline.points, points):
        point.co = (*coordinate, 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def add_candlestick(name, x, y, z, height, body_mat, wick_mat):
    """Small, self-contained 3D chart marks kept behind the physical coin."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=0.018, depth=height + 0.28,
        location=(x, y + 0.02, z + height / 2.0),
    )
    wick = bpy.context.object
    wick.name = f"{name} wick"
    wick.data.materials.append(wick_mat)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, z + height / 2.0))
    body = bpy.context.object
    body.name = f"{name} body"
    body.dimensions = (0.15, 0.14, height)
    body.data.materials.append(body_mat)
    bevel = body.modifiers.new("Soft chart candle edges", "BEVEL")
    bevel.width = 0.025
    bevel.segments = 2
    body.modifiers.new("Weighted chart candle normals", "WEIGHTED_NORMAL")


def set_keyframes(obj, data_path, values):
    for frame, value in values:
        setattr(obj, data_path, value)
        obj.keyframe_insert(data_path=data_path, frame=frame)
    animation = obj.animation_data
    if animation and animation.action:
        for fcurve in animation.action.fcurves:
            for keyframe in fcurve.keyframe_points:
                keyframe.interpolation = "BEZIER"
                keyframe.handle_left_type = "AUTO_CLAMPED"
                keyframe.handle_right_type = "AUTO_CLAMPED"



def add_coin_torus(pivot, name, radius, minor, z, mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=minor,
                                     major_segments=144, minor_segments=12,
                                     location=(0.0, 0.0, z))
    obj = bpy.context.object
    obj.name = name
    obj.parent = pivot
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def construct_minted_coin(gold, gold_face, gold_edge, gold_highlight):
    # Original extruded, ridged coin. The parent makes subtle camera-facing motion possible.
    pivot = bpy.data.objects.new("Animated Bitcoin coin pivot", None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = (2.45, -0.18, 2.62)
    # Turn the face into a clear 3/4 view so the thick, ribbed edge reads in the render.
    pivot.rotation_euler = (math.radians(70.0), math.radians(-5.0), math.radians(-40.0))
    bpy.ops.mesh.primitive_cylinder_add(vertices=144, radius=1.88, depth=0.2, location=(0.0, 0.0, 0.0))
    coin = bpy.context.object
    coin.name = "Thick beveled gold Bitcoin coin"
    coin.parent = pivot
    coin.data.materials.append(gold)
    coin.data.materials.append(gold_face)
    for polygon in coin.data.polygons:
        if abs(polygon.normal.z) > 0.96:
            polygon.material_index = 1
    bevel = coin.modifiers.new("Rounded minted rim", "BEVEL")
    bevel.width = 0.045
    bevel.segments = 4
    coin.modifiers.new("Weighted coin normals", "WEIGHTED_NORMAL")

    # Narrow antique-gold bars break up the edge and make the minted thickness visible.
    for index in range(48):
        angle = 2.0 * math.pi * index / 48.0
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
        groove = bpy.context.object
        groove.name = f"Coin edge notch {index + 1:02d}"
        groove.parent = pivot
        groove.location = (1.875 * math.cos(angle), 1.875 * math.sin(angle), 0.0)
        groove.rotation_euler.z = angle
        groove.dimensions = (0.035, 0.075, 0.15)
        groove.data.materials.append(gold_edge)

    add_coin_torus(pivot, "Outer coin face bead", 1.73, 0.028, 0.106, gold_highlight)
    add_coin_torus(pivot, "Inner engraved coin ring", 1.53, 0.012, 0.109, gold_edge)
    add_coin_torus(pivot, "Fine inner gold ring", 1.46, 0.009, 0.111, gold_highlight)
    add_coin_torus(pivot, "Inner relief border", 1.39, 0.009, 0.112, gold_edge)
    add_coin_torus(pivot, "B emblem inner medallion", 0.82, 0.009, 0.112, gold_highlight)

    return pivot


def minted_face_index_style(index, gold_edge, gold_highlight):
    if index % 6 == 0:
        return 1.58, 0.0045, gold_highlight
    return 1.625, 0.0025, gold_edge


def add_minted_relief(pivot, gold_edge, gold_highlight):
    # Fine minted radial indices add face detail that remains legible at hero scale.
    for index in range(72):
        angle = 2.0 * math.pi * index / 72.0
        inner, thickness, tick_material = minted_face_index_style(
            index, gold_edge, gold_highlight)
        outer = 1.69
        tick = add_polyline(
            f"Minted face index {index + 1:02d}",
            [(inner * math.cos(angle), inner * math.sin(angle), 0.112),
             (outer * math.cos(angle), outer * math.sin(angle), 0.112)],
            thickness,
            tick_material,
        )
        tick.parent = pivot

    # Fine radial engraving in the dark coin face creates visible minted relief.
    for index in range(32):
        angle = 2.0 * math.pi * index / 32.0
        inner = 0.93 if index % 2 == 0 else 1.02
        outer = 1.34
        line = add_polyline(
            f"Coin face engraving {index + 1:02d}",
            [(inner * math.cos(angle), inner * math.sin(angle), 0.115),
             (outer * math.cos(angle), outer * math.sin(angle), 0.115)],
            0.0035 if index % 2 == 0 else 0.002,
            gold_edge if index % 2 == 0 else gold_highlight,
        )
        line.parent = pivot

    for index in range(16):
        angle = 2.0 * math.pi * index / 16.0
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12, ring_count=6, radius=0.024,
            location=(1.43 * math.cos(angle), 1.43 * math.sin(angle), 0.125),
        )
        rivet = bpy.context.object
        rivet.name = f"Coin medallion rivet {index + 1:02d}"
        rivet.parent = pivot
        rivet.data.materials.append(gold_highlight)
        for face in rivet.data.polygons:
            face.use_smooth = True

    # The B and two narrow stems are new geometry, not pixels taken from the reference.
    bpy.ops.object.text_add(location=(0.0, 0.0, 0.114))
    glyph = bpy.context.object
    glyph.name = "Raised Bitcoin B symbol"
    glyph.data.body = "B"
    glyph.data.align_x = "CENTER"
    glyph.data.align_y = "CENTER"
    glyph.data.size = 1.68
    glyph.data.extrude = 0.025
    glyph.data.bevel_depth = 0.009
    glyph.data.bevel_resolution = 2
    glyph.parent = pivot
    glyph.data.materials.append(gold_highlight)
    for index, x in enumerate((-0.23, 0.23)):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.0, 0.156))
        stem = bpy.context.object
        stem.name = f"Bitcoin symbol stem {index + 1}"
        stem.parent = pivot
        stem.location = (x, 0.0, 0.156)
        stem.dimensions = (0.034, 1.25, 0.024)
        stem.data.materials.append(gold_highlight)



def animate_glowing_motes(spark_mat):
    # Few restrained light motes, each with tiny drift across the 2-second study.
    for index, (x, y, z, radius) in enumerate((
        (0.35, -0.05, 4.3, 0.035), (4.6, -0.25, 4.65, 0.028), (5.15, 0.0, 1.4, 0.03),
        (-0.85, 0.25, 3.25, 0.022), (5.8, 0.15, 2.6, 0.026), (1.0, -0.5, 4.55, 0.024),
    )):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=(x, y, z))
        mote = bpy.context.object
        mote.name = f"Quiet lime particle {index + 1}"
        mote.data.materials.append(spark_mat)
        initial = mote.location.copy()
        mote.keyframe_insert(data_path="location", frame=1)
        mote.location.z += 0.18
        mote.location.x += 0.05 * (-1 if index % 2 else 1)
        mote.keyframe_insert(data_path="location", frame=13)
        mote.location = initial
        mote.keyframe_insert(data_path="location", frame=25)



def animate_coin_and_lighting(pivot, chart_shader):
    key = add_area("Large warm key light", (-3.0, -5.5, 7.0), (2.3, 0.0, 2.5), 1180.0, (1.0, 0.72, 0.40), 2.5)
    add_area("Soft frontal coin fill", (4.5, -5.0, 4.2), (2.4, 0.0, 2.6), 680.0, (1.0, 0.89, 0.65), 2.1)
    add_area("Lime mountain rim light", (4.8, 2.2, 5.4), (3.5, 1.0, 1.8), 820.0, (0.55, 1.0, 0.24), 1.8)
    add_area("Broad lime rock wash", (0.2, -2.8, 6.2), (1.8, 2.5, 0.2), 940.0, (0.36, 1.0, 0.16), 5.8)
    add_area("Quiet warm backlight", (2.0, 4.0, 6.4), (2.5, 0.0, 2.3), 980.0, (1.0, 0.58, 0.23), 1.7)

    # Smooth sweeping highlight and a restrained coin wobble: never a fast spin.
    for frame, tilt in ((1, math.radians(-5.0)), (13, math.radians(-1.5)), (25, math.radians(-5.0))):
        pivot.rotation_euler.y = tilt
        pivot.keyframe_insert(data_path="rotation_euler", index=1, frame=frame)
    for frame, x in ((1, -3.0), (13, 2.0), (25, -3.0)):
        key.location.x = x
        key.keyframe_insert(data_path="location", index=0, frame=frame)
    for frame, strength in ((1, 2.0), (13, 2.5), (25, 2.0)):
        chart_shader.inputs["Strength"].default_value = strength
        chart_shader.inputs["Strength"].keyframe_insert(data_path="default_value", frame=frame)



def build_scene():
    clear_scene()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.use_denoising = True
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.compression = 8
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_x = 800
    scene.render.resolution_y = 400
    scene.cycles.samples = 8
    scene.frame_start = 1
    scene.frame_end = 24
    scene.render.fps = 12
    scene.world.color = (0.012, 0.025, 0.017)
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.012, 0.025, 0.017, 1.0)
    background.inputs["Strength"].default_value = 0.28

    gold = material("Warm minted gold", (0.68, 0.33, 0.055), 0.94, 0.22, 9.0, 0.08, 0.012)
    gold_face = material("Engraved antique gold face", (0.39, 0.17, 0.032), 0.96, 0.27, 24.0, 0.13, 0.009)
    gold_highlight = material("Coin relief highlights", (0.96, 0.64, 0.19), 0.9, 0.18)
    gold_edge = material("Antique gold edge grooves", (0.22, 0.105, 0.025), 0.83, 0.31)
    rock_dark = material("Basalt shadow", (0.012, 0.026, 0.015), 0.08, 0.91, 12.0, 0.3, 0.07)
    rock_mid = material("Basalt forest green", (0.026, 0.061, 0.034), 0.08, 0.88, 10.0, 0.3, 0.07)
    rock_lit = material("Mineral edges", (0.045, 0.095, 0.04), 0.12, 0.82, 14.0, 0.24, 0.05)
    ground_mat = material("Dark volcanic ground", (0.006, 0.012, 0.007), 0.02, 0.96, 1.2, 0.12, 0.06)
    chart_mat, chart_shader = emission("Soft lime chart energy", (0.45, 1.0, 0.12), 2.1)
    chart_dim, _ = emission("Faint green chart trail", (0.14, 0.47, 0.08), 0.65)
    spark_mat, _ = emission("Quiet lime motes", (0.63, 1.0, 0.3), 0.75)

    bpy.ops.mesh.primitive_plane_add(size=200.0, location=(0.0, 0.0, -0.42))
    ground = bpy.context.object
    ground.name = "Dark rocky ground"
    ground.data.materials.append(ground_mat)

    add_ridge((rock_dark, rock_mid, rock_lit))

    # A shallow back-plane volume scatters the rim light into restrained green haze.
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0.0, 5.2, 3.2))
    haze = bpy.context.object
    haze.name = "Thin rear mountain atmosphere"
    haze.dimensions = (17.0, 9.0, 6.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    haze_material = bpy.data.materials.new("Quiet green atmospheric scatter")
    haze_material.use_nodes = True
    haze_nodes = haze_material.node_tree.nodes
    haze_links = haze_material.node_tree.links
    haze_nodes.clear()
    haze_output = haze_nodes.new("ShaderNodeOutputMaterial")
    haze_scatter = haze_nodes.new("ShaderNodeVolumeScatter")
    haze_scatter.inputs["Color"].default_value = (0.1, 0.22, 0.08, 1.0)
    haze_scatter.inputs["Density"].default_value = 0.018
    haze_scatter.inputs["Anisotropy"].default_value = 0.35
    haze_links.new(haze_scatter.outputs["Volume"], haze_output.inputs["Volume"])
    haze.data.materials.append(haze_material)

    # Low, angular foreground rocks preserve negative space on the reading side.
    for index, (x, y, z, sx, sy, sz) in enumerate((
        (-6.0, -1.8, -0.2, 1.2, 1.0, 0.42), (-4.2, -2.6, -0.22, 1.5, 0.9, 0.48),
        (-2.5, -2.3, -0.2, 1.1, 0.8, 0.38), (-0.4, -2.8, -0.18, 0.95, 0.8, 0.38),
        (1.0, -2.5, -0.2, 1.0, 0.75, 0.42), (4.9, -2.7, -0.2, 1.6, 1.0, 0.52),
        (6.5, -1.8, -0.16, 1.4, 1.0, 0.6), (3.8, -1.45, -0.14, 0.9, 0.75, 0.44),
    )):
        add_rock(f"Foreground basalt {index + 1:02d}", (x, y, z), (sx, sy, sz),
                 rock_dark if index % 3 else rock_mid, subdivisions=2, facet_mat=rock_lit)

    # Sparse right-side boulders carry the lime rim light while the left remains calm.
    for index, values in enumerate(((5.8, 2.2, 0.2, 1.3, 0.8, 1.1),
                                    (7.1, 1.5, 0.16, 1.1, 0.9, 0.85),
                                    (1.2, 3.1, 0.16, 1.25, 0.7, 1.3))):
        x, y, z, sx, sy, sz = values
        add_rock(f"Ridge boulder {index + 1:02d}", (x, y, z), (sx, sy, sz),
                 rock_mid, subdivisions=2, facet_mat=rock_lit)

    # Rising line stays behind the coin and contains no words, prices, or market claim.
    chart_points = [(-2.5, 1.4, 0.85), (-1.55, 1.35, 1.2), (-0.7, 1.3, 1.42),
                    (0.25, 1.25, 1.36), (1.1, 1.2, 2.05), (2.05, 1.15, 2.2),
                    (3.0, 1.1, 2.95), (4.0, 1.05, 3.15), (4.9, 1.0, 3.85),
                    (5.9, 0.95, 4.05)]
    chart = add_polyline("Restrained upward lime light trail", chart_points, 0.034, chart_mat)
    add_polyline("Dim lower chart reflection", [(x, y + 0.07, z - 0.22) for x, y, z in chart_points],
                 0.013, chart_dim)

    for index, (x, z, height) in enumerate((
        (4.5, 0.86, 0.72), (5.15, 1.62, 0.92), (5.85, 2.24, 0.74),
        (6.45, 2.56, 1.02), (7.0, 3.24, 0.78),
    )):
        add_candlestick(f"Background market candle {index + 1:02d}", x, 1.75, z,
                        height, chart_dim, chart_mat)

    pivot = construct_minted_coin(gold, gold_face, gold_edge, gold_highlight)
    add_minted_relief(pivot, gold_edge, gold_highlight)
    animate_glowing_motes(spark_mat)
    animate_coin_and_lighting(pivot, chart_shader)

    camera_data = bpy.data.cameras.new("CoinBlink cinematic camera")
    camera_data.type = "PERSP"
    camera_data.lens = 48.0
    camera_data.sensor_width = 36.0
    camera = bpy.data.objects.new("CoinBlink cinematic camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, -18.0, 7.2)
    aim(camera, (0.0, 0.0, 1.75))
    scene.camera = camera

    scene.render.image_settings.file_format = "PNG"
    scene.frame_set(1)
    scene["workOrder"] = "CB-M01-WO-001"
    scene["assetOrigin"] = "ORIGINAL_LOCAL_RENDER"
    scene["allowedUsage"] = "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY"
    scene["rightsReview"] = "PENDING_OWNER_OR_LEGAL"
    scene["commercialPublicationAllowed"] = False
    scene["construction"] = "Procedural original geometry and materials; no external textures or reference pixels"
    scene["motion"] = "24-frame restrained coin tilt, moving soft key light, chart pulse and slow particles"
    scene.render.filepath = "//hero-cinematic-renders/hero-cinematic-blender-preview-800x400.png"
    return scene


def configure_cycles_device(scene):
    """Use a supported Cycles GPU when the local Blender runtime exposes one."""
    preferences = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("HIP", "OPTIX", "CUDA", "ONEAPI"):
        try:
            preferences.compute_device_type = backend
            preferences.get_devices()
        except Exception as error:  # Blender/driver availability varies by workstation.
            print(f"CB_HERO_GPU_BACKEND_UNAVAILABLE backend={backend} reason={error}")
            continue
        gpu_devices = [device for device in preferences.devices if device.type != "CPU"]
        if gpu_devices:
            for device in preferences.devices:
                device.use = device.type != "CPU"
            scene.cycles.device = "GPU"
            print(f"CB_HERO_GPU_SELECTED backend={backend} devices={[d.name for d in gpu_devices]}")
            return
    scene.cycles.device = "CPU"
    print("CB_HERO_GPU_UNAVAILABLE fallback=CPU")


def render_mode(scene):
    if MODE == "preview":
        scene.render.resolution_x, scene.render.resolution_y = 800, 400
        scene.cycles.samples = 8
        scene.render.filepath = "//hero-cinematic-renders/hero-cinematic-blender-preview-800x400.png"
        scene.frame_set(1)
    elif MODE == "master":
        scene.render.resolution_x, scene.render.resolution_y = 2560, 1280
        scene.cycles.samples = 32
        scene.render.filepath = "//hero-cinematic-renders/hero-cinematic-blender-master-2560x1280.png"
        scene.frame_set(1)
    elif MODE == "candidate":
        scene.render.resolution_x, scene.render.resolution_y = 1600, 800
        scene.cycles.samples = 16
        scene.render.filepath = "//hero-cinematic-renders/hero-cinematic-blender-candidate-1600x800.png"
        scene.frame_set(1)
    elif MODE == "motion":
        frames_dir = RENDER_DIR / "motion-frames"
        frames_dir.mkdir(exist_ok=True)
        scene.render.resolution_x, scene.render.resolution_y = 640, 320
        scene.cycles.samples = 6
        scene.render.image_settings.file_format = "PNG"
        scene.render.filepath = "//hero-cinematic-renders/motion-frames/frame-"
        scene.frame_start, scene.frame_end = 1, 24
    else:
        raise ValueError(f"Unsupported CB_HERO_RENDER_MODE: {MODE}")

    configure_cycles_device(scene)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(EVIDENCE_DIR / "hero-cinematic-production.blend"))
    if MODE == "motion":
        bpy.ops.render.render(animation=True)
    else:
        bpy.ops.render.render(write_still=True)
    print(f"CB_HERO_RENDER_COMPLETE mode={MODE} engine={scene.render.engine} device={scene.cycles.device} ")
    print(f"CB_HERO_OUTPUT={scene.render.filepath}")


scene = build_scene()
render_mode(scene)
