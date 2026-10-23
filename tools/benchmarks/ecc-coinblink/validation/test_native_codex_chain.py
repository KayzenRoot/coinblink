"""ECC Codex native installation chain: read-only stdlib contract suite."""
import copy
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RECORD = ROOT / "native-codex" / "pinned-manifest.json"
PIN = "90606c8315ee09cafc303515c5f33024db6b9882"
TREE = "9172b168b070a802bbc0a7c53a4ca968e761a8c6"
BLOBS = {
    ".agents/plugins/marketplace.json": "a69ad37099e1355b9bf55847382702e0d1650c03",
    ".codex-plugin/plugin.json": "c24f7453c8a455105a839842a2408688e3b2b559",
    "plugins/ecc/.codex-plugin/plugin.json": "9ea47bdb13f24acfaf399f384fd040df29d75bc3",
    ".mcp.json": "9860a4dbeafc26ce2233df1a0914916feb543582",
    "hooks/codex-hooks.json": "a8830770877e7aa54ee7366aa95de873fd4383b6",
}


def relative_resource(raw):
    if not isinstance(raw, str) or not raw.startswith("./") or "\\" in raw:
        raise ValueError("invalid plugin root relative path")
    content = raw[2:]
    if not content or content.startswith("/") or re.match(r"^[A-Za-z]:", content):
        raise ValueError("outside root")
    if any(part in (".", "..", "") for part in content.rstrip("/").split("/")):
        raise ValueError("cache-root traversal or malformed path")
    return content.rstrip("/")


def check_root_manifest(snapshot):
    if snapshot["marketplace"]["path"] != "./":
        raise ValueError("not a self-contained root marketplace")
    root = snapshot["root_plugin"]
    if root["version"] != snapshot["upstream"]["version"]:
        raise ValueError("version mismatch")
    if relative_resource(root["skills"]) != "skills":
        raise ValueError("wrong skill root")
    for key in ("mcp", "hooks"):
        if relative_resource(root[key]) not in snapshot["blobs"]:
            raise ValueError("missing pinned resource")
    for p in root["assets"]:
        if relative_resource(p) not in snapshot["blobs"]:
            raise ValueError("missing asset")
    return True


class NativeCodexChainTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(RECORD.read_text(encoding="utf-8"))

    def test_commit_tree_license_version_are_fixed(self):
        source = self.data["upstream"]
        self.assertEqual(source["commit"], PIN)
        self.assertEqual(source["tree"], TREE)
        self.assertEqual(source["license"], "MIT")
        self.assertFalse(source["truncated"])
        self.assertEqual(source["version"], "2.2.3")

    def test_three_inventory_counts_and_manifest_drift(self):
        src = self.data["upstream"]
        self.assertEqual((src["skills"], src["agents"], src["commands"]),
                         (311, 71, 97))
        self.assertEqual(src["entries"], 6361)
        self.assertNotEqual(src["skills"], self.data["root_plugin"]["claimed_skills"])
        self.assertNotEqual(src["skills"], self.data["thin_plugin"]["claimed_skills"])

    def test_git_blob_pins_are_independent_constants(self):
        for path, sha in BLOBS.items():
            with self.subTest(path=path):
                self.assertEqual(self.data["blobs"][path], sha)
        self.assertTrue(all(re.fullmatch("[0-9a-f]{40}", sha)
                            for sha in self.data["blobs"].values()))

    def test_marketplace_resolves_root_plugin(self):
        self.assertEqual(self.data["marketplace"]["source"], "local")
        self.assertEqual(self.data["marketplace"]["name"], "ecc")
        self.assertEqual(self.data["marketplace"]["plugin"], "ecc")
        self.assertEqual(self.data["marketplace"]["install"], "AVAILABLE")
        self.assertTrue(check_root_manifest(self.data))

    def test_legacy_thin_manifest_escapes_cache(self):
        thin = self.data["thin_plugin"]
        for p in (thin["skills"], thin["mcp"]):
            with self.assertRaises(ValueError):
                relative_resource(p)

    def test_traversal_and_external_paths_fail_closed(self):
        for p in ("../../secrets", "./../secrets", "./ok/../secret",
                  "/tmp/skills", "https://example.com", r".\temp", "C:/bad",
                  "./ok//bad", "././bad"):
            with self.subTest(path=p):
                with self.assertRaises(ValueError):
                    relative_resource(p)

    def test_root_manifest_rejects_mutated_sources(self):
        for section, value in (("marketplace", {"path": "./plugins/ecc"}),
                               ("root_plugin", {"mcp": "./missing.json"}),
                               ("root_plugin", {"hooks": "../../hooks/secret"}),
                               ("root_plugin", {"skills": "../../skills"})):
            changed = copy.deepcopy(self.data)
            changed[section].update(value)
            with self.assertRaises(ValueError):
                check_root_manifest(changed)

    def test_executable_hook_and_mcp_remain_blocked(self):
        risk, gate = self.data["risks"], self.data["gates"]
        self.assertEqual(risk["session_hook_event"], "SessionStart")
        self.assertEqual(risk["hook_type"], "command")
        self.assertEqual(risk["mcp_command"], "npx")
        self.assertEqual(risk["mcp_args"], ["-y", "chrome-devtools-mcp@1.10.1"])
        self.assertFalse(gate["hooks_trusted"])
        self.assertFalse(gate["mcp_started"])
        self.assertFalse(gate["script_executed"])

    def test_legacy_install_and_global_git_risks(self):
        risk = self.data["risks"]
        self.assertTrue(risk["installer_auto_dependencies"])
        self.assertTrue(risk["legacy_global_git_hooks"])
        self.assertTrue(risk["legacy_user_config_writes"])

    def test_cache_and_discovery_not_assumed(self):
        self.assertEqual(self.data["cache"]["prefix"], "plugins/cache/ecc/ecc")
        self.assertFalse(self.data["cache"]["verified"])
        self.assertFalse(self.data["cache"]["discovery_verified"])
        self.assertFalse(self.data["gates"]["installed"])
        self.assertFalse(self.data["gates"]["codex_run"])

    def test_uninstall_native_and_legacy_are_distinct(self):
        steps = self.data["rollback"]
        self.assertEqual(steps["native"], "codex plugin remove ecc@ecc")
        self.assertEqual(steps["marketplace"], "codex plugin marketplace remove ecc")
        self.assertIn("--legacy-codex-sync --dry-run", steps["legacy_preview"])
        self.assertNotEqual(steps["native"], steps["legacy_commit"])
        self.assertFalse(steps["performed"])

    def test_four_coinblink_skill_mirrors_remain_identical(self):
        names = ("ecc-ai-regression", "ecc-change-impact",
                 "ecc-module-regression", "ecc-pr-test-analyzer")
        for name in names:
            with self.subTest(skill=name):
                a = ROOT.parents[2] / ".agents" / "skills" / name / "SKILL.md"
                b = ROOT / "agent-materials" / "adapted-skills" / name / "SKILL.md"
                self.assertEqual(a.read_bytes(), b.read_bytes())

    def test_readonly_snapshot_is_not_activation(self):
        self.assertEqual(self.data["gates"]["status"],
                         "BLOCKED_ACCESS_OR_COST_UNVERIFIED")
        self.assertNotIn("AGENTS.md", self.data["blobs"])
        self.assertNotIn("package.json", self.data["blobs"])


if __name__ == "__main__":
    unittest.main()
