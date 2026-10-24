"""ECC Codex native installation chain: read-only stdlib contract suite."""
import copy
import json
from pathlib import Path
import re
import tempfile
import unittest
from native_cache_integrity import CacheIntegrityError, git_blob_sha, inspect_pinned_cache, pinned_file_inventory

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



SURFACE_RECORD = ROOT / "native-codex" / "pinned-surface-inventory.json"
SURFACE_PATTERNS = {
    "skills": re.compile(r"^skills/[^/]+/SKILL[.]md$"),
    "agents": re.compile(r"^agents/[^/]+[.]md$"),
    "commands": re.compile(r"^commands/[^/]+[.]md$"),
}


def verify_surface_inventory(surface, summary):
    if surface["source"]["commit"] != PIN or surface["source"]["tree"] != TREE:
        raise ValueError("wrong upstream source")
    if surface["source"]["tree_truncated"]:
        raise ValueError("partial upstream tree")
    for name, pattern in SURFACE_PATTERNS.items():
        paths = surface["paths"][name]
        if len(paths) != summary["upstream"][name] or len(paths) != surface["counts"][name]:
            raise ValueError("inventory count mismatch")
        if len(paths) != len(set(paths)) or paths != sorted(paths):
            raise ValueError("duplicate or unsorted inventory")
        if not all(pattern.fullmatch(path) and
                   not any(segment in (".", "..") for segment in path.split("/"))
                   for path in paths):
            raise ValueError("invalid inventory path")
    digests = surface.get("git_blob_shas")
    if not isinstance(digests, dict) or set(digests) != set(
        path for paths in surface["paths"].values() for path in paths
    ):
        raise ValueError("missing or extra git blob fingerprints")
    if not all(isinstance(sha, str) and re.fullmatch("[0-9a-f]{40}", sha)
               for sha in digests.values()):
        raise ValueError("malformed source blob SHA")
    return True


def verify_runtime_coverage(snapshot):
    cache = snapshot["cache_audit"]
    if "hooks" in cache["inspected_refs"] or "hooks" not in cache["excluded_refs"]:
        raise ValueError("upstream cache-checker gap misrepresented")
    if cache["validates_file_hashes"] or cache["can_prove_skill_discovery"]:
        raise ValueError("cache checker must not imply runtime attestation")
    effects = snapshot["session_start_audit"]
    if not all(effects[key] for key in (
        "effect_directories_created", "effect_expired_session_files_removed",
        "effect_observer_session_lease_written", "effect_prior_context_injected",
    )):
        raise ValueError("SessionStart side effect missing")
    if effects["hook_trust_observed"]:
        raise ValueError("hook trust not verified")
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

    def test_full_surface_path_inventory_is_pinned_and_unique(self):
        inventory = json.loads(SURFACE_RECORD.read_text(encoding="utf-8"))
        self.assertTrue(verify_surface_inventory(inventory, self.data))
        self.assertEqual(sum(inventory["counts"].values()), 479)

    def test_inventory_tampering_and_path_traversal_fail(self):
        valid = json.loads(SURFACE_RECORD.read_text(encoding="utf-8"))
        for group, bad_path in (
            ("skills", "skills/../SKILL.md"),
            ("agents", "agents//untrusted.md"),
            ("commands", "commands/../../secret.md"),
        ):
            modified = copy.deepcopy(valid)
            modified["paths"][group][0] = bad_path
            with self.subTest(group=group):
                with self.assertRaises(ValueError):
                    verify_surface_inventory(modified, self.data)
        partial = copy.deepcopy(valid)
        partial["source"]["tree_truncated"] = True
        with self.assertRaises(ValueError):
            verify_surface_inventory(partial, self.data)

    def test_cache_checker_cannot_attest_hooks_or_skill_execution(self):
        self.assertTrue(verify_runtime_coverage(self.data))
        cache = self.data["cache_audit"]
        self.assertEqual(cache["inspected_refs"],
                         ["skills", "mcpServers", "interface.composerIcon", "interface.logo"])
        self.assertIn("hooks", cache["excluded_refs"])
        self.assertTrue(cache["uses_stat_sync_follows_symlinks"])
        self.assertFalse(cache["installed_cache_observed"])
        self.assertEqual(cache["git_blob"],
                         self.data["blobs"]["scripts/codex/check-plugin-cache.js"])
        broken = copy.deepcopy(self.data)
        broken["cache_audit"]["validates_file_hashes"] = True
        with self.assertRaises(ValueError):
            verify_runtime_coverage(broken)

    def test_session_start_side_effects_and_legacy_global_writes_are_blocked(self):
        self.assertTrue(verify_runtime_coverage(self.data))
        session = self.data["session_start_audit"]
        self.assertEqual(session["entrypoint"], "scripts/hooks/plugin-hook-bootstrap.js")
        self.assertEqual(session["downstream"], "scripts/hooks/session-start.js")
        legacy = self.data["legacy_sync_audit"]
        self.assertTrue(legacy["changes_global_hooks_path"])
        self.assertTrue(legacy["changes_codex_user_config"])
        self.assertTrue(legacy["may_alter_mcp_config"])
        self.assertFalse(legacy["performed"])
        broken = copy.deepcopy(self.data)
        broken["session_start_audit"]["effect_expired_session_files_removed"] = False
        with self.assertRaises(ValueError):
            verify_runtime_coverage(broken)

    def test_every_upstream_surface_is_git_blob_pinned(self):
        inv = json.loads(SURFACE_RECORD.read_text(encoding="utf-8"))
        mapping = pinned_file_inventory(self.data, inv)
        self.assertGreaterEqual(len(mapping), 479)
        self.assertEqual(len(inv["git_blob_shas"]), 479)
        self.assertEqual(mapping["skills/change-impact/SKILL.md"],
                         inv["git_blob_shas"]["skills/change-impact/SKILL.md"])

    def test_synthetic_cache_accepts_exact_pinned_contents_without_executing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "plugin"
            skill = root / "skills" / "example" / "SKILL.md"
            skill.parent.mkdir(parents=True)
            skill.write_text("# Synthetic only\n", encoding="utf-8")
            result = inspect_pinned_cache(
                root, {"skills/example/SKILL.md": git_blob_sha(skill)}
            )
            self.assertEqual(result["result"], "PINNED_FILES_INTEGRITY_ONLY")
            self.assertEqual(result["checked_files"], 1)
            self.assertFalse(result["discovery_verified"])
            self.assertFalse(result["hooks_trusted"])

    def test_cache_preflight_rejects_mutated_contents_and_missing_hooks(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "plugin"
            leaf = root / "skills" / "example" / "SKILL.md"
            leaf.parent.mkdir(parents=True)
            leaf.write_bytes(b"Original synthetic skill")
            expected = {"skills/example/SKILL.md": git_blob_sha(leaf)}
            leaf.write_bytes(b"Tampered synthetic skill")
            with self.assertRaises(CacheIntegrityError):
                inspect_pinned_cache(root, expected)
            with self.assertRaises(CacheIntegrityError):
                inspect_pinned_cache(root, {"hooks/codex-hooks.json": "a" * 40})

    def test_cache_preflight_rejects_traversal_and_unpinned_paths(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "plugin"
            root.mkdir()
            for name in ("../secret", "skills/../secret", "skills//SKILL.md",
                         "/etc/passwd", r"skills\bad", "C:/bad"):
                with self.subTest(name=name):
                    with self.assertRaises(CacheIntegrityError):
                        inspect_pinned_cache(root, {name: "a" * 40}, directories=())
            with self.assertRaises(CacheIntegrityError):
                inspect_pinned_cache(root, {"skills/test/SKILL.md": "untrusted"}, directories=())

    def test_cache_preflight_rejects_symlinked_skill_root(self):
        with tempfile.TemporaryDirectory() as temp:
            container = Path(temp)
            root = container / "plugin"
            root.mkdir()
            external = container / "other"
            external.mkdir()
            try:
                (root / "skills").symlink_to(external, target_is_directory=True)
            except OSError:
                self.skipTest("Host does not permit creating test-only symlinks")
            with self.assertRaises(CacheIntegrityError):
                inspect_pinned_cache(root, {"skills/test/SKILL.md": "a" * 40})

    def test_surface_pinset_rejects_missing_hash_or_wrong_origin(self):
        inv = json.loads(SURFACE_RECORD.read_text(encoding="utf-8"))
        bad = copy.deepcopy(inv)
        del bad["git_blob_shas"]["skills/change-impact/SKILL.md"]
        with self.assertRaises(CacheIntegrityError):
            pinned_file_inventory(self.data, bad)
        bad2 = copy.deepcopy(inv)
        bad2["source"]["commit"] = "0" * 40
        with self.assertRaises(CacheIntegrityError):
            pinned_file_inventory(self.data, bad2)

    def test_readonly_snapshot_is_not_activation(self):
        self.assertEqual(self.data["gates"]["status"],
                         "BLOCKED_ACCESS_OR_COST_UNVERIFIED")
        self.assertNotIn("AGENTS.md", self.data["blobs"])
        self.assertNotIn("package.json", self.data["blobs"])


if __name__ == "__main__":
    unittest.main()
