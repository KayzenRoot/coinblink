"""Negative and positive contracts for the read-only ECC SARIF gate.

Covers the correction requested in the PR #209 review: an ECC finding at index
>= 30 of a large SARIF must still block, and URI variants must not escape the
scope check.
"""
import importlib.util
import json
import tempfile
from pathlib import Path
import unittest

HERE = Path(__file__).resolve().parent
MODULE_PATH = HERE / "ecc_sarif_gate.py"
WORKFLOW_PATH = HERE.parents[3] / ".github" / "workflows" / "ecc-codeql-experimental.yml"

spec = importlib.util.spec_from_file_location("ecc_sarif_gate", MODULE_PATH)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def result(uri, level="error", rule="py/test"):
    return {
        "ruleId": rule,
        "level": level,
        "locations": [{
            "physicalLocation": {
                "artifactLocation": {"uri": uri},
                "region": {"startLine": 1},
            },
        }],
        "message": {"text": "synthetic"},
    }


def sarif(results, tool="CodeQL"):
    return {
        "runs": [{
            "tool": {"driver": {"name": tool}},
            "results": results,
        }],
    }


class GateContracts(unittest.TestCase):
    def write_and_evaluate(self, documents):
        with tempfile.TemporaryDirectory() as tmp:
            for index, document in enumerate(documents):
                path = Path(tmp) / f"run-{index}.sarif"
                path.write_text(json.dumps(document), encoding="utf-8")
            return gate.evaluate(tmp)

    def test_ecc_finding_beyond_the_thirty_result_sample_still_blocks(self):
        # 30 non-ECC results first, so the ECC finding sits exactly at index 30,
        # past any `results[:30]` sample. This is the correction requested on #209.
        results = [result(f"src/modules/CB-M02/other-{i}.mjs", level="warning")
                   for i in range(30)]
        results.append(result("tools/benchmarks/ecc-coinblink/hidden.py", level="error"))
        self.assertEqual(len(results), 31)
        summary, ecc = self.write_and_evaluate([sarif(results)])
        self.assertEqual(summary["total_results"], 31)
        self.assertLessEqual(summary["printed_findings"], gate.SUMMARY_LIMIT)
        self.assertEqual(len(ecc), 1, "finding at index 30 must reach the decision")
        self.assertTrue(ecc[0]["path"].endswith("hidden.py"))

    def test_many_non_ecc_results_do_not_block(self):
        results = [result(f"src/modules/CB-M02/file-{i}.mjs") for i in range(75)]
        summary, ecc = self.write_and_evaluate([sarif(results)])
        self.assertEqual(summary["total_results"], 75)
        self.assertEqual(ecc, [])

    def test_absolute_and_file_uris_are_normalized_and_block(self):
        for uri in (
            "file:///home/runner/work/coinblink/coinblink/.github/workflows/ecc-offline-validation.yml",
            "/home/runner/work/coinblink/coinblink/tools/benchmarks/ecc-coinblink/pilot/Step.py",
            "./tools/benchmarks/ecc-coinblink/../ecc-coinblink/pilot/Step.py",
            "tools\\benchmarks\\ecc-coinblink\\pilot\\Step.py",
            ".agents/skills/ecc-change-impact/SKILL.md",
            # Segment-anchored matching also fires on a nested occurrence such as
            # docs/tools/.../<ecc dir>/: over-blocking is intentional (fail-closed)
            # and preferable to letting an ECC finding escape by rendering.
            "docs/tools/benchmarks/ecc-coinblink/readme.md.bak",
        ):
            with self.subTest(uri=uri):
                _, ecc = self.write_and_evaluate([sarif([result(uri)])])
                self.assertEqual(len(ecc), 1, f"URI variant escaped the scope check: {uri}")

    def test_similar_but_out_of_scope_paths_do_not_block(self):
        for uri in (
            "tools/benchmarks/ecc-coinblink-notes/readme.md",
            ".github/workflows/other.yml",
            "src/modules/CB-M02/file.mjs",
        ):
            with self.subTest(uri=uri):
                _, ecc = self.write_and_evaluate([sarif([result(uri)])])
                self.assertEqual(ecc, [], f"out-of-scope path was treated as ECC: {uri}")

    def test_multiple_documents_and_runs_are_aggregated(self):
        first = sarif([result("src/app.mjs")])
        second = {"runs": [
            {"tool": {"driver": {"name": "CodeQL"}}, "results": [result("src/other.mjs")]},
            {"tool": {"driver": {"name": "CodeQL"}}, "results": [result(".agents/skills/ecc-ai-regression/SKILL.md")]},
        ]}
        summary, ecc = self.write_and_evaluate([first, second])
        self.assertEqual(summary["documents"], 2)
        self.assertEqual(summary["total_results"], 3)
        self.assertEqual(len(ecc), 1)

    def test_missing_evidence_is_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(gate.GateError):
                gate.evaluate(tmp)

    def test_workflow_uses_the_gate_and_never_truncates_the_decision(self):
        workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
        self.assertIn("ecc_sarif_gate.py", workflow,
                      "the workflow must call the tested gate module")
        self.assertNotIn("results[:30]", workflow,
                         "the blocking decision must not be taken from a truncated sample")


if __name__ == "__main__":
    unittest.main()
