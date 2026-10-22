import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const animationPath = new URL("../../../assets/archive/m01/animate-generated-hero.py", import.meta.url);
const scenePath = new URL("../../../assets/archive/m01/blender-hero-scene.py", import.meta.url);

test("archived Blender Python scripts parse without importing bpy or rendering", () => {
  const interpreter = process.platform === "win32" ? "python" : "python3";
  const check = [
    "import ast, pathlib, sys",
    "for name in sys.argv[1:]:",
    "    path = pathlib.Path(name)",
    "    ast.parse(path.read_text(encoding='utf-8'), filename=str(path))",
  ].join("\n");
  const probe = spawnSync(interpreter, [
    "-c", check, fileURLToPath(animationPath), fileURLToPath(scenePath),
  ], { encoding: "utf8", timeout: 10000 });
  assert.equal(probe.error, undefined, probe.error?.message);
  assert.equal(probe.status, 0, probe.stderr || probe.stdout);
});

test("archived Blender helper ordering and safety boundaries remain explicit", async () => {
  const [animation, scene] = await Promise.all([
    readFile(animationPath, "utf8"), readFile(scenePath, "utf8"),
  ]);
  const verifyOrder = (source, fragments) => {
    let previous = -1;
    for (const fragment of fragments) {
      const position = source.indexOf(fragment);
      assert.ok(position > previous, "Missing or out-of-order Blender operation: " + fragment);
      previous = position;
    }
  };
  verifyOrder(animation, [
    "    mesh, image, material, emission = create_image_plate()",
    "    animate_sprite_overlays(mesh, image)",
    "    animate_exposure_flashes(material, emission)",
    "    configure_cinematic_camera(scene)",
  ]);
  verifyOrder(scene, [
    "    pivot = construct_minted_coin(gold, gold_face, gold_edge, gold_highlight)",
    "    add_minted_relief(pivot, gold_edge, gold_highlight)",
    "    animate_glowing_motes(spark_mat)",
    "    animate_coin_and_lighting(pivot, chart_shader)",
  ]);
  assert.match(scene, /random\.seed\(SEED\)/u);
  assert.match(animation, /LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY/u);
  assert.match(scene, /LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY/u);
});

test("Blender helper extractions preserve minted-style choices and camera interpolation", () => {
  const interpreter = process.platform === "win32" ? "python" : "python3";
  const script = "import ast\nimport pathlib\nimport sys\nfrom types import SimpleNamespace\n\ndef isolated_function(path, name):\n    tree = ast.parse(pathlib.Path(path).read_text(encoding=\"utf-8\"), filename=path)\n    funcs = [item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == name]\n    assert len(funcs) == 1, (path, name)\n    ns = {}\n    exec(compile(ast.Module(body=funcs, type_ignores=[]), path, \"exec\"), ns)\n    return ns[name]\n\nanimation, scene = sys.argv[1:]\nselect = isolated_function(scene, \"minted_face_index_style\")\nedge, highlight = object(), object()\nfor index in range(72):\n    expected = (1.58, 0.0045, highlight) if index % 6 == 0 else (1.625, 0.0025, edge)\n    result = select(index, edge, highlight)\n    assert result == expected, (index, result, expected)\n\napply_curve = isolated_function(animation, \"set_camera_curve_interpolation\")\nfor data_path in (\"location\", \"ortho_scale\", \"rotation_euler\"):\n    pts = [SimpleNamespace(interpolation=\"BEFORE\", handle_left_type=\"OLD-L\", handle_right_type=\"OLD-R\") for _ in range(3)]\n    apply_curve(SimpleNamespace(data_path=data_path, keyframe_points=pts))\n    for point in pts:\n        if data_path == \"location\":\n            assert (point.interpolation, point.handle_left_type, point.handle_right_type) == (\"LINEAR\", \"OLD-L\", \"OLD-R\")\n        else:\n            assert (point.interpolation, point.handle_left_type, point.handle_right_type) == (\"BEZIER\", \"AUTO_CLAMPED\", \"AUTO_CLAMPED\")\nprint(\"Blender helper semantics validated: 72 material styles and 9 camera keyframes\")";
  const probe = spawnSync(interpreter, [
    "-c", script, fileURLToPath(animationPath), fileURLToPath(scenePath),
  ], { encoding: "utf8", timeout: 10000 });
  assert.equal(probe.error, undefined, probe.error?.message);
  assert.equal(probe.status, 0, probe.stderr || probe.stdout);
});
