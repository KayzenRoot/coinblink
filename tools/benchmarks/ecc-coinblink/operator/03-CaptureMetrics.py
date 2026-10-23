"""Offline Codex JSONL accounting. No network, agent execution, or benchmark runs.

Usage (after separate authorization):
  python operator/03-CaptureMetrics.py --run-id T1-A-r1

The caller may select only a registered run ID, never an input/output path.
JSONL must be placed at local-artifacts/runs/<run-id>/codex.jsonl.
The exclusive output is local-artifacts/runs/<run-id>/metrics/codex-usage.json.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import stat

RUN_IDS = tuple(
    f"T{task}-{arm}-r{repeat}"
    for task in (1, 2, 3)
    for arm in ("A", "B")
    for repeat in (1, 2, 3)
)
MAX_LOG_BYTES = 32 * 1024 * 1024

parser = argparse.ArgumentParser(description="Read a pre-existing Codex JSONL log safely.")
parser.add_argument("--run-id", required=True, choices=RUN_IDS)
args = parser.parse_args()

# All filesystem paths are derived from fixed package layout, never from CLI paths.
pack_root = Path(__file__).resolve().parent.parent
run_folders = {
    run_id: pack_root / "local-artifacts" / "runs" / run_id
    for run_id in RUN_IDS
}


def reject_links_and_escape(target: Path) -> None:
    """Reject path redirection including links and Windows junctions."""
    root = pack_root.resolve(strict=True)
    for part in (target, *target.parents):
        if part == root.parent:
            break
        if part.exists() and (
            part.is_symlink() or
            (hasattr(part, "is_junction") and part.is_junction())
        ):
            raise SystemExit("Symlink/junction is not permitted")
    try:
        target.resolve(strict=False).relative_to(root)
    except ValueError as exc:
        raise SystemExit("Path must stay inside the offline package") from exc


if not (pack_root / "00_LEIA_PRIMEIRO.md").is_file():
    raise SystemExit("Invalid offline package root")
for parent in (pack_root, *pack_root.parents):
    if (parent / ".git").exists():
        raise SystemExit("Never write metrics inside a Git checkout")

run_dir = run_folders[args.run_id]
origin_file = run_dir / "RUN_ORIGIN.json"
source_file = run_dir / "codex.jsonl"
output_dir = run_dir / "metrics"
output_file = output_dir / "codex-usage.json"

for item in (run_dir, origin_file, source_file, output_dir, output_file):
    reject_links_and_escape(item)

if not run_dir.is_dir() or not origin_file.is_file():
    raise SystemExit("Prepared run and RUN_ORIGIN.json required")
try:
    origin = json.loads(origin_file.read_text(encoding="utf-8-sig"))
except (OSError, ValueError) as exc:
    raise SystemExit("Invalid run origin metadata") from exc
if not isinstance(origin, dict) or origin.get("run_id") != args.run_id:
    raise SystemExit("Run origin does not match the selected run ID")

# Avoid following a symlink at the last input component and reject special files.
read_flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
try:
    handle = os.open(source_file, read_flags)
except OSError as exc:
    raise SystemExit("Expected an existing, regular local JSONL log") from exc
try:
    if not stat.S_ISREG(os.fstat(handle).st_mode):
        raise SystemExit("JSONL source is not a regular file")
    with os.fdopen(handle, "rb") as stream:
        handle = -1
        raw = stream.read(MAX_LOG_BYTES + 1)
finally:
    if handle >= 0:
        os.close(handle)
if len(raw) > MAX_LOG_BYTES:
    raise SystemExit("JSONL log exceeds the 32 MiB local limit")

usage = []
failed = 0
malformed = 0
sessions = 0
for line in raw.decode("utf-8-sig", errors="replace").splitlines():
    if not line.strip():
        continue
    try:
        event = json.loads(line)
    except ValueError:
        malformed += 1
        continue
    if not isinstance(event, dict):
        malformed += 1
        continue
    kind = event.get("type")
    if kind == "turn.completed" and isinstance(event.get("usage"), dict):
        usage.append(event["usage"])
    if kind == "turn.failed":
        failed += 1
    if kind == "thread.started":
        sessions += 1

keys = ("input_tokens", "cached_input_tokens", "output_tokens", "reasoning_output_tokens")
counts = {
    key: sum(entry[key] for entry in usage)
    if usage and all(
        type(entry.get(key)) is int and entry[key] >= 0 for entry in usage
    ) else None
    for key in keys
}
payload = {
    "run_id": args.run_id,
    "state": "CAPTURED_LOG_ONLY",
    "sha256_jsonl": hashlib.sha256(raw).hexdigest(),
    "turns_completed": len(usage),
    "turns_failed": failed,
    "malformed_lines": malformed,
    "thread_count": sessions,
    "usage": counts,
    "cost_usd": None,
    "seconds_active": None,
    "seconds_wall": None,
    "seconds_ci_wait": None,
    "judge_pass": None,
    "telemetry_complete": bool(usage) and failed == 0 and malformed == 0 and sessions <= 1,
    "note": "Partial telemetry is not zero. No billing or subagent estimate inferred.",
}

# Create only the known metrics directory and refuse overwrites/racing symlinks.
output_dir.mkdir(mode=0o700, exist_ok=True)
reject_links_and_escape(output_dir)
reject_links_and_escape(output_file)
write_flags = (
    os.O_WRONLY | os.O_CREAT | os.O_EXCL
    | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
)
try:
    descriptor = os.open(output_file, write_flags, 0o600)
except OSError as exc:
    raise SystemExit("Metrics output exists or is not writable; no overwrite") from exc
with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as stream:
    json.dump(payload, stream, ensure_ascii=False, indent=2)
    stream.write("\n")
print("CAPTURE_CREATED_NOT_VALIDATED", args.run_id)
