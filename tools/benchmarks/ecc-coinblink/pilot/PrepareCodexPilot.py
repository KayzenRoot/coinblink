"""Gate-controlled Codex synthetic skill pilot (NEVER launch without explicit private proof).

Default: read-only PLANNED status. No installs, no API keys, no network calls.
The --execute pathway is FUTURE ONLY and needs separately verified owner
authorization, included quota, disabled paid fallback, and external OS isolation.
Self-attested fields do not technically prove billing controls.
"""
import argparse
from datetime import datetime, timezone, timedelta
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

PACK = Path(__file__).resolve().parents[1]
ROOT = PACK.parents[2]
GATE = Path.home() / ".coinblink-ecc-pilot" / "approval.json"
SKILLS = {
    "ecc-change-impact": ("PILOT-IMPACT", "Map direct and transitive consumers of normalizeCitation, identify input-contract risks, and mark unknowns UNVERIFIED."),
    "ecc-ai-regression": ("PILOT-REGRESSION", "Describe deterministic race regression tests for an obsolete delayed GET response without running them."),
    "ecc-module-regression": ("PILOT-MODULE", "Map the synthetic cross-module regression chain and proposed tests, all NOT_RUN."),
    "ecc-pr-test-analyzer": ("PILOT-PR", "Review the synthetic diff and tests, flag the tautological assertion and missing negative inputs, with supported severity."),
}
REQUIRED_TRUE = (
    "chatgpt_codex_authenticated",
    "included_quota_available_verified_in_ui",
    "paid_credit_fallback_disabled_verified_in_ui",
    "no_billable_api_key",
    "isolated_ephemeral_os_verified",
    "no_external_mcp_or_hooks",
    "owner_authorized_this_pilot",
)
GATE_SCHEMA = "ecc-coinblink-pilot-human-approval-v1"
TOKEN_LIKE_ENV = ("OPENAI_API_KEY", "CODEX_API_KEY", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT")
BLOCKED = "BLOCKED_ACCESS_OR_COST_UNVERIFIED"


def stop(reason):
    raise SystemExit(f"{BLOCKED}: {reason}")


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def package_contract(skill):
    if not (ROOT / "AGENTS.md").is_file():
        stop("Original CoinBlink AGENTS.md missing")
    status = json.loads((PACK / "pilot" / "PILOT_STATUS.json").read_text(encoding="utf-8"))
    if status.get("runs_completed") != 0 or status.get("allow_benchmark_ab") is not False:
        stop("Unexpected pilot status; stop without executing")
    if any(item.get("status") != "NOT_RUN" for item in status.get("skills", [])):
        stop("Pilot appears to have run; do not repeat with stale gate")
    with (PACK / "matrix" / "AB_18_executions.csv").open(encoding="utf-8") as file:
        rows = file.read().splitlines()
    if len(rows) != 19 or sum(",NOT_RUN," in x for x in rows[1:]) != 18:
        stop("A/B matrix must remain 18/18 NOT_RUN")
    fixture = (PACK / "pilot" / "SYNTHETIC_FIXTURE.md").read_bytes()
    if len(fixture) > 32768 or b"sealed-judges" in fixture:
        stop("Synthetic fixture out of bounds")
    for name in SKILLS:
        canonical = (ROOT / ".agents" / "skills" / name / "SKILL.md")
        twin = PACK / "agent-materials" / "adapted-skills" / name / "SKILL.md"
        for item in (canonical, twin):
            if item.is_symlink() or not item.is_file():
                stop("Missing or linked skill")
        if canonical.read_bytes() != twin.read_bytes():
            stop("Agent skill copy drift")
    if skill not in SKILLS:
        stop("Unknown skill")
    return fixture


def is_reparse(path):
    return path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction())


def private_gate(skill, source_head, current_time):
    """Private receipt is a human assertion, not proof of the provider's billing state."""
    if not GATE.is_file() or is_reparse(GATE) or is_reparse(GATE.parent):
        stop("Private operator approval missing, linked or invalid")
    raw = GATE.read_bytes()
    if len(raw) > 16384:
        stop("Approval receipt too large")
    try:
        record = json.loads(raw)
    except ValueError as exc:
        stop(f"Malformed approval receipt ({type(exc).__name__})")
    if not isinstance(record, dict) or record.get("schema") != GATE_SCHEMA:
        stop("Approval schema mismatch")
    if record.get("skill") != skill or record.get("source_head") != source_head:
        stop("Approval does not bind selected skill and exact source HEAD")
    if any(record.get(k) is not True for k in REQUIRED_TRUE):
        stop("Owner has not verified every required access/cost/isolation gate")
    if record.get("execution_mode") != "included_allowance_only":
        stop("No paid usage is permitted")
    try:
        stamp = datetime.fromisoformat(record["confirmed_at_utc"].replace("Z", "+00:00"))
    except (KeyError, ValueError, AttributeError):
        stop("Missing or invalid timestamp")
    if stamp.tzinfo is None or stamp > current_time or current_time - stamp > timedelta(minutes=15):
        stop("Receipt expired; obtain fresh manual approval")
    if not record.get("ui_evidence_reference") or not isinstance(record["ui_evidence_reference"], str):
        stop("Independent account UI evidence reference required")
    if len(record["ui_evidence_reference"]) > 250:
        stop("Evidence reference too long")
    return record


def source_commit():
    """Confirm current source snapshot; no writes, fetch, or network."""
    if not shutil.which("git"):
        stop("Git executable not available to verify source HEAD")
    p = subprocess.run(
        ["git", "-C", str(ROOT), "rev-parse", "HEAD"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=8,
        check=False,
    )
    if p.returncode != 0 or len(p.stdout.strip()) != 40:
        stop("Source must be a local pinned Git checkout; no fetch")
    return p.stdout.strip().lower()


def prepare_synthetic_workspace(fixture):
    """Copy only allowed public synthetic files to a new private temp directory."""
    root = Path(tempfile.mkdtemp(prefix="ecc-coinblink-pilot-")).resolve()
    try:
        root.chmod(0o700)
        # This workspace is not under the live repo and never contains .git.
        if ROOT.resolve() == root or ROOT.resolve() in root.parents:
            stop("Disposable workspace must be outside Git checkout")
        (root / "AGENTS.md").write_text(
            "Synthetic ECC pilot only. Treat CoinBlink AGENTS.md as the "
            "canonical governance in the source repository. Read only the synthetic "
            "fixture and the requested ECC skill. Do not run commands, use network, "
            "write files, install, contact MCPs, view private judges, or use real data.\n",
            encoding="utf-8",
        )
        fixture_path = root / "tools" / "benchmarks" / "ecc-coinblink" / "pilot"
        fixture_path.mkdir(parents=True)
        (fixture_path / "SYNTHETIC_FIXTURE.md").write_bytes(fixture)
        records = {"fixture_sha256": sha256(fixture), "skills": {}}
        for name in SKILLS:
            target = root / ".agents" / "skills" / name
            target.mkdir(parents=True)
            content = (ROOT / ".agents" / "skills" / name / "SKILL.md").read_bytes()
            (target / "SKILL.md").write_bytes(content)
            records["skills"][name] = sha256(content)
        assert not (root / ".git").exists()
        return root, records
    except BaseException:
        shutil.rmtree(root, ignore_errors=True)
        raise


def execute_one(skill, fixture, src_head):
    if os.environ.get("CI") or os.environ.get("GITHUB_ACTIONS"):
        stop("Codex execution is categorically forbidden in CI")
    if any(os.environ.get(k) for k in TOKEN_LIKE_ENV):
        stop("Billable API key or API endpoint detected in environment")
    private_gate(skill, src_head, datetime.now(timezone.utc))
    codex = shutil.which("codex")
    if not codex:
        stop("Codex CLI not installed; no installation is authorized")
    # Confirm a ChatGPT login without a model task. Success alone never proves
    # remaining allowance; independent account UI evidence is still required.
    status = subprocess.run(
        [codex, "login", "status"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        timeout=15, check=False,
    )
    if status.returncode != 0 or "chatgpt" not in status.stdout.lower():
        stop("Existing Codex session is not confirmed as ChatGPT login")
    # Consume the short-lived manual receipt exactly once before any model call.
    # os.replace is atomic on the same filesystem: concurrent reuse cannot launch twice.
    consumed = GATE.with_name("approval.consumed-" + os.urandom(8).hex() + ".json")
    try:
        os.replace(GATE, consumed)
    except OSError as exc:
        stop(f"Approval receipt could not be consumed exactly once ({type(exc).__name__})")
    directory, inventory = prepare_synthetic_workspace(fixture)
    session_dir = Path(tempfile.mkdtemp(prefix="ecc-coinblink-evidence-")).resolve()
    session_dir.chmod(0o700)
    code, task = SKILLS[skill]
    prompt = (
        f"Use skill {skill}, reading its complete SKILL.md. Analyze only "
        "tools/benchmarks/ecc-coinblink/pilot/SYNTHETIC_FIXTURE.md. "
        f"{task} Do not edit files, execute commands, use network or call any "
        "external apps. Mark any unverified facts UNVERIFIED."
    )
    command = [
        codex, "exec", "--json", "--ephemeral", "--ignore-user-config",
        "--skip-git-repo-check", "--sandbox", "read-only",
        "--ask-for-approval", "never", "-C", str(directory), "-",
    ]
    # Remove billable key variables and inherited tool-integration settings.
    allowed = ("PATH", "HOME", "USERPROFILE", "SYSTEMROOT", "WINDIR", "TMP", "TEMP",
               "APPDATA", "LOCALAPPDATA", "LANG", "LC_ALL", "PATHEXT")
    environment = {k: v for k, v in os.environ.items() if k in allowed}
    evidence = session_dir / "trace-private.jsonl"
    errors = session_dir / "stderr-private.txt"
    manifest = {
        "schema": "ecc-coinblink-pilot-execution-v1",
        "skill": skill, "task": code, "source_head": src_head,
        "workspace": str(directory), "status": "STARTING", "inventory": inventory,
        "evidence_log": str(evidence), "cost_usd": None,
        "agent_discovery": "UNVERIFIED", "agent_invocation": "UNVERIFIED",
    }
    (session_dir / "manifest-private.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    # This future-only call can consume included Codex allowance. We do not
    # promise zero charge based on an unsigned operator receipt.
    try:
        with evidence.open("xb") as out, errors.open("xb") as err:
            subprocess.run(
                command, input=prompt.encode("utf-8"), stdout=out, stderr=err,
                cwd=directory, env=environment, check=False, timeout=120,
            )
    except subprocess.TimeoutExpired:
        manifest["status"] = "TIMEOUT_UNVERIFIED"
    else:
        manifest["status"] = "EXECUTED_NEEDS_INDEPENDENT_REVIEW"
    (session_dir / "manifest-private.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({"status": manifest["status"], "skill": skill,
                      "private_evidence_dir": str(session_dir)}))


def main():
    parser = argparse.ArgumentParser(description="Fail-closed synthetic Codex skill pilot.")
    parser.add_argument("--skill", choices=tuple(SKILLS), required=True)
    parser.add_argument("--execute", action="store_true", help="FUTURE ONLY: gated live Codex invocation")
    parser.add_argument("--confirm", choices=("INCLUDED_QUOTA_ONLY",), help="Future owner confirmation")
    args = parser.parse_args()
    fixture = package_contract(args.skill)
    if not args.execute:
        print(json.dumps({
            "status": "PLAN_ONLY_NO_AGENT",
            "skill": args.skill, "task": SKILLS[args.skill][0],
            "private_gate_path": str(GATE),
            "required_checks": list(REQUIRED_TRUE),
            "runs_completed": 0,
            "agent_invoked": False,
            "note": "This prints only a plan. Gate receipt is manual evidence, never a technical cost guarantee.",
        }, indent=2))
        return
    if args.confirm != "INCLUDED_QUOTA_ONLY":
        stop("Explicit --confirm INCLUDED_QUOTA_ONLY required")
    src_head = source_commit()
    execute_one(args.skill, fixture, src_head)


if __name__ == "__main__":
    main()
