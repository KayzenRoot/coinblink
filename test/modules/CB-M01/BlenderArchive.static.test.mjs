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
