"""Offline ECC package contract checks. Only synthetic data; never launches Codex."""
import csv
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

PACK = Path(__file__).resolve().parents[1]
REPO = PACK.parents[2]
SKILLS = ("ecc-ai-regression", "ecc-change-impact", "ecc-module-regression", "ecc-pr-test-analyzer")
TASK_SHAS = {
    "T1": "bff1e461caf75de2e4dcdc59d116a99e8c5b2840",
    "T2": "491417e8c8d1c14b516c970a998eddc6a4ac7a09",
    "T3": "8053ace0315909ceac83300b576ff9fcb19ab6f7",
}


class PackageContracts(unittest.TestCase):
    def test_four_skills_have_identical_agent_copies(self):
        for name in SKILLS:
            canonical = (REPO / ".agents" / "skills" / name / "SKILL.md").read_bytes()
            copy = (PACK / "agent-materials" / "adapted-skills" / name / "SKILL.md").read_bytes()
            self.assertEqual(canonical, copy, name)
            self.assertIn(f"name: {name}\n", canonical.decode("utf-8"))
            self.assertIn("description:", canonical.decode("utf-8"))
            self.assertLess(len(canonical), 10000)
        self.assertEqual(
            {p.name for p in (PACK / "agent-materials" / "adapted-skills").iterdir()},
            set(SKILLS),
        )

    def test_matrix_18_unique_not_run_without_metrics(self):
        with (PACK / "matrix" / "AB_18_executions.csv").open(encoding="utf-8", newline="") as file:
            rows = list(csv.DictReader(file))
        self.assertEqual(len(rows), 18)
        self.assertEqual(len({row["run_id"] for row in rows}), 18)
        expected = {f"{task}-{arm}-r{i}" for task in TASK_SHAS for arm in ("A", "B") for i in range(1, 4)}
        self.assertEqual({row["run_id"] for row in rows}, expected)
        for row in rows:
            self.assertEqual(row["state"], "NOT_RUN")
            self.assertEqual(row["base_sha"], TASK_SHAS[row["task"]])
            self.assertEqual(row["arm"], row["run_id"].split("-")[1])
            self.assertEqual(row["judge_version"], "UNVALIDATED")
            self.assertEqual(row["tokens_in"], "")
            self.assertEqual(row["cost_usd"], "")
            self.assertEqual(row["judge_pass"], "")

    def test_descriptors_are_nonmaterialized(self):
        for task, sha in TASK_SHAS.items():
            record = json.loads((PACK / "snapshot-descriptors" / f"{task}.json").read_text(encoding="utf-8"))
            self.assertEqual(record["base_sha"], sha)
            self.assertEqual(record["task"], task)
            self.assertFalse(record["materialized"])
            self.assertEqual(record["state"], "NOT_MATERIALIZED")
            self.assertEqual(len(record["tree_sha"]), 40)

    def test_no_sealed_judges_or_automatic_benchmark(self):
        for path in PACK.rglob("*"):
            self.assertNotIn("sealed-judges", path.parts)
        content = (PACK / "results" / "NOT_RUN.md").read_text(encoding="utf-8")
        self.assertIn("NOT_RUN", content)
        self.assertFalse((PACK / "local-artifacts").exists())


class CollectorContracts(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="ecc-unit-")
        self.addCleanup(self.temporary.cleanup)
        self.pack = Path(self.temporary.name) / "isolated-pack"
        operator = self.pack / "operator"
        operator.mkdir(parents=True)
        self.script = operator / "03-CaptureMetrics.py"
        shutil.copyfile(PACK / "operator" / self.script.name, self.script)
        (self.pack / "00_LEIA_PRIMEIRO.md").write_text("offline synthetic test\n", encoding="utf-8")
        self.run_id = "T1-A-r1"
        self.run = self.pack / "local-artifacts" / "runs" / self.run_id
        self.run.mkdir(parents=True)
        (self.run / "RUN_ORIGIN.json").write_text(json.dumps({"run_id": self.run_id}), encoding="utf-8")
        self.raw = (
            '{"type":"thread.started"}\n'
            '{"type":"turn.completed","usage":{"input_tokens":100,"cached_input_tokens":20,'
            '"output_tokens":40,"reasoning_output_tokens":5}}\n'
        ).encode("utf-8")
        (self.run / "codex.jsonl").write_bytes(self.raw)

    def invoke(self, *extra):
        return subprocess.run(
            [sys.executable, str(self.script), "--run-id", self.run_id, *extra],
            cwd=self.temporary.name, capture_output=True, text=True, timeout=20, check=False,
        )

    @property
    def output(self):
        return self.run / "metrics" / "codex-usage.json"

    def test_valid_log_counts_and_checksum(self):
        done = self.invoke()
        self.assertEqual(done.returncode, 0, done.stderr)
        result = json.loads(self.output.read_text(encoding="utf-8"))
        self.assertEqual(result["sha256_jsonl"], hashlib.sha256(self.raw).hexdigest())
        self.assertEqual(result["usage"]["input_tokens"], 100)
        self.assertEqual(result["usage"]["output_tokens"], 40)
        self.assertEqual(result["usage"]["cached_input_tokens"], 20)
        self.assertTrue(result["telemetry_complete"])
        self.assertIsNone(result["cost_usd"])

    def test_cli_cannot_choose_paths_or_escape(self):
        for extra in (("--jsonl", "../../secret.jsonl"), ("--out", "../../external.json")):
            self.assertNotEqual(self.invoke(*extra).returncode, 0)
        self.assertNotEqual(
            subprocess.run(
                [sys.executable, str(self.script), "--run-id", "../T1-A-r1"],
                capture_output=True, text=True, timeout=20, check=False,
            ).returncode, 0
        )
        self.assertFalse(self.output.exists())

    def test_missing_or_mismatched_origin_refuses(self):
        (self.run / "RUN_ORIGIN.json").write_text('{"run_id":"T2-B-r1"}', encoding="utf-8")
        self.assertNotEqual(self.invoke().returncode, 0)
        self.assertFalse(self.output.exists())

    def test_missing_log_refuses(self):
        (self.run / "codex.jsonl").unlink()
        self.assertNotEqual(self.invoke().returncode, 0)
        self.assertFalse(self.output.exists())

    def test_malformed_data_is_not_counted_as_valid(self):
        (self.run / "codex.jsonl").write_text('{"type":"thread.started"}\nnot-json\n', encoding="utf-8")
        self.assertEqual(self.invoke().returncode, 0)
        data = json.loads(self.output.read_text(encoding="utf-8"))
        self.assertFalse(data["telemetry_complete"])
        self.assertEqual(data["malformed_lines"], 1)
        self.assertIsNone(data["usage"]["input_tokens"])

    def test_existing_output_is_not_overwritten(self):
        self.assertEqual(self.invoke().returncode, 0)
        saved = self.output.read_bytes()
        self.assertNotEqual(self.invoke().returncode, 0)
        self.assertEqual(self.output.read_bytes(), saved)

    def test_inside_git_checkout_is_rejected(self):
        (self.pack / ".git").mkdir()
        self.assertNotEqual(self.invoke().returncode, 0)
        self.assertFalse(self.output.exists())

    def test_symlink_source_is_rejected_when_supported(self):
        real = Path(self.temporary.name) / "elsewhere.jsonl"
        real.write_bytes(self.raw)
        (self.run / "codex.jsonl").unlink()
        try:
            (self.run / "codex.jsonl").symlink_to(real)
        except (OSError, NotImplementedError):
            self.skipTest("Symlink creation unavailable on this runner")
        self.assertNotEqual(self.invoke().returncode, 0)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
