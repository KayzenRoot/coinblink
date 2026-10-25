"""Dormant Codex portable plugin package: stdlib-only static verification.

No Codex calls, no plugin installation, no network, no evaluation benchmark.
"""
import copy
import json
from pathlib import Path
import re
import unittest

PACK = Path(__file__).resolve().parents[1]
REPO = PACK.parents[2]
ROOT = PACK / "native-codex" / "staged-marketplace"
PLUGIN = ROOT / "plugins" / "coinblink-ecc-curated"
MANIFEST = PLUGIN / "plugin.json"
CATALOG = ROOT / ".agents" / "plugins" / "marketplace.json"
EXPECTED = (
    "ecc-ai-regression",
    "ecc-change-impact",
    "ecc-module-regression",
    "ecc-pr-test-analyzer",
)
PORTABLE_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"


def validate_catalog(catalog):
    if set(catalog) != {"name", "plugins"} or catalog["name"] != "coinblink-ecc-staging":
        raise ValueError("unexpected local marketplace metadata")
    plugins = catalog["plugins"]
    if len(plugins) != 1:
        raise ValueError("marketplace must contain exactly one curated plugin")
    entry = plugins[0]
    if set(entry) != {"name", "source", "policy", "category"}:
        raise ValueError("unexpected marketplace fields")
    if entry["name"] != "coinblink-ecc-curated":
        raise ValueError("wrong plugin name")
    if entry["source"] != {"source": "local", "path": "./plugins/coinblink-ecc-curated"}:
        raise ValueError("network, external or traversing marketplace source")
    if entry["policy"] != {"installation": "AVAILABLE", "authentication": "ON_INSTALL"}:
        raise ValueError("plugin installation must remain user initiated")


def validate_manifest(manifest):
    permitted = {"$schema", "name", "version", "description", "repository", "license"}
    if set(manifest) != permitted:
        raise ValueError("unexpected hooks/MCP/extensions/commands in plugin manifest")
    if manifest["$schema"] != PORTABLE_SCHEMA:
        raise ValueError("unsupported portable schema")
    if manifest["name"] != "coinblink-ecc-curated" or manifest["version"] != "0.1.0":
        raise ValueError("wrong plugin identity")
    if manifest["license"] != "MIT":
        raise ValueError("upstream provenance missing")
    if not manifest["description"]:
        raise ValueError("description required")


def validate_staged_tree():
    if ROOT.is_symlink() or PLUGIN.is_symlink() or not ROOT.is_dir():
        raise ValueError("staging root must be a local regular directory")
    allowed = {MANIFEST.relative_to(ROOT), CATALOG.relative_to(ROOT),
               (ROOT / "README.md").relative_to(ROOT)}
    for name in EXPECTED:
        allowed.add((PLUGIN / "skills" / name / "SKILL.md").relative_to(ROOT))
    actual = set()
    for path in ROOT.rglob("*"):
        if path.is_symlink():
            raise ValueError("symlinks or junction-like links forbidden")
        if path.is_file():
            actual.add(path.relative_to(ROOT))
    if actual != allowed:
        raise ValueError("unexpected plugin payload file: " + repr(actual ^ allowed))
    for name in EXPECTED:
        destination = PLUGIN / "skills" / name / "SKILL.md"
        canonical = REPO / ".agents" / "skills" / name / "SKILL.md"
        benchmark_copy = PACK / "agent-materials" / "adapted-skills" / name / "SKILL.md"
        if not destination.is_file() or canonical.read_bytes() != destination.read_bytes():
            raise ValueError("staged skill content drift")
        if benchmark_copy.read_bytes() != destination.read_bytes():
            raise ValueError("benchmark skill copy drift")
        content = destination.read_text(encoding="utf-8")
        match = re.match(r"\A---\nname:\s*([a-z0-9-]+)\ndescription:\s*([^\n]+)\n---\n", content)
        if not match or match.group(1) != name:
            raise ValueError("missing valid name/description frontmatter")
    return True


class StagedNativePluginTests(unittest.TestCase):
    def test_exact_portable_manifest(self):
        validate_manifest(json.loads(MANIFEST.read_text(encoding="utf-8")))

    def test_exact_local_marketplace_without_autoinstall(self):
        validate_catalog(json.loads(CATALOG.read_text(encoding="utf-8")))

    def test_staged_tree_has_only_four_skills_and_no_code(self):
        self.assertTrue(validate_staged_tree())

    def test_no_hook_mcp_runtime_config_or_scripts(self):
        files = [x.relative_to(ROOT).as_posix() for x in ROOT.rglob("*") if x.is_file()]
        self.assertFalse(any("/hooks/" in x or "mcp" in x or x.endswith((".js", ".py", ".sh", ".ps1", ".toml")) for x in files))
        self.assertFalse((REPO / ".agents" / "plugins" / "marketplace.json").exists())

    def test_reject_manifest_hook_and_mcp_injection(self):
        original = json.loads(MANIFEST.read_text(encoding="utf-8"))
        for field in ("hooks", "mcpServers", "extensions", "scripts", "skills"):
            with self.subTest(field=field):
                altered = copy.deepcopy(original)
                altered[field] = "./unexpected"
                with self.assertRaises(ValueError):
                    validate_manifest(altered)

    def test_reject_marketplace_network_and_traversal(self):
        original = json.loads(CATALOG.read_text(encoding="utf-8"))
        for source in ("../../outside", "https://example.com/plugin", "./plugins/../evil"):
            with self.subTest(source=source):
                data = copy.deepcopy(original)
                data["plugins"][0]["source"]["path"] = source
                with self.assertRaises(ValueError):
                    validate_catalog(data)

    def test_reject_implicit_install_policy(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        data["plugins"][0]["policy"]["installation"] = "FORCE_INSTALL"
        with self.assertRaises(ValueError):
            validate_catalog(data)


if __name__ == "__main__":
    unittest.main()
