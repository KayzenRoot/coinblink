"""Future executor negative gates; do NOT run Codex."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest
from datetime import datetime, timezone, timedelta
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / "pilot" / "PrepareCodexPilot.py"


class GateContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("ecc_pilot_runner", SCRIPT)
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    def test_plan_is_cost_free_and_does_not_execute(self):
        for skill in self.module.SKILLS:
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--skill", skill],
                capture_output=True, text=True, timeout=15, check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            data = json.loads(result.stdout)
            self.assertFalse(data["agent_invoked"])
            self.assertEqual(data["status"], "PLAN_ONLY_NO_AGENT")
            self.assertEqual(data["runs_completed"], 0)

    def test_execute_without_confirm_fails_closed(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--skill", "ecc-change-impact", "--execute"],
            capture_output=True, text=True, timeout=15, check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("BLOCKED_ACCESS_OR_COST_UNVERIFIED", result.stderr)

    def test_unknown_skill_rejected(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--skill", "../../secrets", "--execute"],
            capture_output=True, text=True, timeout=15, check=False,
        )
        self.assertNotEqual(result.returncode, 0)

    def test_gate_without_private_receipt_rejected(self):
        now = datetime.now(timezone.utc)
        expected_head = "a" * 40
        with mock.patch.object(self.module, "GATE", Path("/impossible-ecc-private-receipt-absent-2026")):
            with self.assertRaises(SystemExit):
                self.module.private_gate("ecc-change-impact", expected_head, now)

    def test_gate_rejects_paid_credits_and_expired_receipt(self):
        from tempfile import TemporaryDirectory
        with TemporaryDirectory() as temp:
            gate = Path(temp) / "approval.json"
            now = datetime.now(timezone.utc)
            record = {
                "schema": self.module.GATE_SCHEMA,
                "skill": "ecc-change-impact",
                "source_head": "a" * 40,
                "execution_mode": "included_allowance_only",
                "confirmed_at_utc": (now-timedelta(minutes=3)).isoformat(),
                "ui_evidence_reference": "synthetic-test-not-a-real-account",
            }
            record.update({k: True for k in self.module.REQUIRED_TRUE})
            record["paid_credit_fallback_disabled_verified_in_ui"] = False
            gate.write_text(json.dumps(record), encoding="utf-8")
            with mock.patch.object(self.module, "GATE", gate):
                with self.assertRaises(SystemExit):
                    self.module.private_gate("ecc-change-impact", "a" * 40, now)
                record["paid_credit_fallback_disabled_verified_in_ui"] = True
                record["confirmed_at_utc"] = (now-timedelta(minutes=17)).isoformat()
                gate.write_text(json.dumps(record), encoding="utf-8")
                with self.assertRaises(SystemExit):
                    self.module.private_gate("ecc-change-impact", "a" * 40, now)

    def test_no_paid_or_ci_execution_precondition(self):
        code = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('os.environ.get("GITHUB_ACTIONS")', code)
        self.assertIn("TOKEN_LIKE_ENV", code)
        self.assertIn('"read-only"', code)
        self.assertIn('"never"', code)
        self.assertIn("private_gate(skill", code)
        self.assertNotIn("shell=True", code)
        self.assertIn("os.replace(GATE, consumed)", code)
        self.assertNotIn('"--ignore-rules"', code)


if __name__ == "__main__":
    unittest.main()
