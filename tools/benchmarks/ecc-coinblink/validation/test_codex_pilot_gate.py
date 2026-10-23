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
                "protocol_origin_head": self.module.PROTOCOL_ORIGIN_HEAD,
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

    def test_private_gate_rejects_wrong_checkout_sha_and_protocol_origin(self):
        from tempfile import TemporaryDirectory
        with TemporaryDirectory() as temp:
            path = Path(temp) / "approval.json"
            now = datetime.now(timezone.utc)
            rec = {
                "schema": self.module.GATE_SCHEMA,
                "protocol_origin_head": self.module.PROTOCOL_ORIGIN_HEAD,
                "skill": "ecc-change-impact",
                "source_head": "a" * 40,
                "execution_mode": "included_allowance_only",
                "confirmed_at_utc": now.isoformat(),
                "ui_evidence_reference": "synthetic-test-no-paid-account",
            }
            rec.update({k: True for k in self.module.REQUIRED_TRUE})
            path.write_text(json.dumps(rec), encoding="utf-8")
            with mock.patch.object(self.module, "GATE", path):
                with self.assertRaises(SystemExit):
                    self.module.private_gate("ecc-change-impact", "b" * 40, now)
                rec["protocol_origin_head"] = "c" * 40
                path.write_text(json.dumps(rec), encoding="utf-8")
                with self.assertRaises(SystemExit):
                    self.module.private_gate("ecc-change-impact", "a" * 40, now)

    def test_checkout_rejects_wrong_root_and_dirty_tree(self):
        root = str(self.module.ROOT.resolve())
        with mock.patch.object(self.module.shutil, "which", return_value="/usr/bin/git"):
            with mock.patch.object(self.module, "git_output", side_effect=["/tmp/wrong-repository"]):
                with self.assertRaises(SystemExit):
                    self.module.source_commit()
            with mock.patch.object(self.module, "git_output", side_effect=[root, "a" * 40, " M pilot/fixture.md"]):
                with self.assertRaises(SystemExit):
                    self.module.source_commit()
            with mock.patch.object(self.module, "git_output", side_effect=[root, "not-a-sha"]):
                with self.assertRaises(SystemExit):
                    self.module.source_commit()
            with mock.patch.object(self.module, "git_output", side_effect=[root, "a" * 40, ""]):
                self.assertEqual(self.module.source_commit(), "a" * 40)

    def test_authorization_is_single_use_even_when_receipt_is_valid(self):
        from tempfile import TemporaryDirectory
        with TemporaryDirectory() as temp:
            path = Path(temp) / "approval.json"
            now = datetime.now(timezone.utc)
            rec = {
                "schema": self.module.GATE_SCHEMA,
                "protocol_origin_head": self.module.PROTOCOL_ORIGIN_HEAD,
                "skill": "ecc-change-impact",
                "source_head": "a" * 40,
                "execution_mode": "included_allowance_only",
                "confirmed_at_utc": now.isoformat(),
                "ui_evidence_reference": "synthetic-one-time-receipt",
            }
            rec.update({k: True for k in self.module.REQUIRED_TRUE})
            path.write_text(json.dumps(rec), encoding="utf-8")
            with mock.patch.object(self.module, "GATE", path):
                consumed = self.module.consume_private_approval("ecc-change-impact", "a" * 40, now)
                self.assertFalse(path.exists())
                self.assertTrue(consumed.is_file())
                with self.assertRaises(SystemExit):
                    self.module.consume_private_approval("ecc-change-impact", "a" * 40, now)

    def test_public_status_cannot_authorize_checkout(self):
        data = json.loads((SCRIPT.parent / "PILOT_STATUS.json").read_text(encoding="utf-8"))
        self.assertNotIn("head_pinned", data)
        self.assertEqual(data["protocol_origin_head"], self.module.PROTOCOL_ORIGIN_HEAD)
        self.assertIsNone(data["checkout_head"])
        self.assertIsNone(data["authorized_execution_head"])
        self.assertEqual(data["runs_completed"], 0)

    def test_api_token_and_federation_environment_fail_closed(self):
        import os
        for key in self.module.TOKEN_LIKE_ENV:
            with self.subTest(variable=key):
                with mock.patch.dict(os.environ, {key: "synthetic-token"}, clear=True):
                    with self.assertRaises(SystemExit):
                        self.module.runtime_environment()

    def test_login_and_exec_share_sanitized_environment(self):
        import os
        with mock.patch.dict(os.environ, {
            "HOME": "/synthetic-home", "PATH": "/synthetic-bin",
            "CODEX_HOME": "/other-credential-home",
            "UNTRUSTED_SERVICE_TOKEN": "synthetic",
        }, clear=True):
            environment = self.module.runtime_environment()
        self.assertEqual(environment["HOME"], "/synthetic-home")
        self.assertNotIn("CODEX_HOME", environment)
        self.assertNotIn("UNTRUSTED_SERVICE_TOKEN", environment)
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('check=False, env=environment,', source)
        self.assertIn('cwd=directory, env=environment, check=False,', source)

    def test_failed_codex_exit_cannot_claim_success(self):
        self.assertEqual(self.module.codex_exit_status(0), "EXECUTED_NEEDS_INDEPENDENT_REVIEW")
        self.assertEqual(self.module.codex_exit_status(1), "CODEX_FAILED_UNVERIFIED")
        self.assertEqual(self.module.codex_exit_status(127), "CODEX_FAILED_UNVERIFIED")
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('codex_exit_status(outcome.returncode)', source)

    def test_workspace_is_disposable_and_contains_only_synthetic_files(self):
        import shutil
        fixture = self.module.package_contract("ecc-change-impact")
        temporary, inventory = self.module.prepare_synthetic_workspace(fixture)
        try:
            files = {str(path.relative_to(temporary)).replace("\\", "/")
                     for path in temporary.rglob("*") if path.is_file()}
            expected = {
                "AGENTS.md",
                "tools/benchmarks/ecc-coinblink/pilot/SYNTHETIC_FIXTURE.md",
                *(f".agents/skills/{name}/SKILL.md" for name in self.module.SKILLS),
            }
            self.assertEqual(files, expected)
            self.assertNotIn(".git", files)
            self.assertEqual(
                inventory["fixture_sha256"],
                self.module.sha256(fixture),
            )
            self.assertEqual(set(inventory["skills"]), set(self.module.SKILLS))
        finally:
            shutil.rmtree(temporary)

    def test_no_paid_or_ci_execution_precondition(self):
        code = SCRIPT.read_text(encoding="utf-8")
        self.assertIn('os.environ.get("GITHUB_ACTIONS")', code)
        self.assertIn("TOKEN_LIKE_ENV", code)
        self.assertIn('"read-only"', code)
        self.assertIn('"never"', code)
        self.assertIn("private_gate(skill", code)
        self.assertNotIn("shell=True", code)
        self.assertIn("os.replace(GATE, consumed)", code)
        self.assertIn("consume_private_approval(skill, src_head", code)
        self.assertIn('"--untracked-files=all"', code)
        self.assertNotIn('"--ignore-rules"', code)


if __name__ == "__main__":
    unittest.main()
