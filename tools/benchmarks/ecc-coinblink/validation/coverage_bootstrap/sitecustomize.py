"""stdlib-only line tracer for synthetic ECC CI, activated by ECC_COVERAGE_DIR.

Never launches agents, touches secrets, or sends network traffic.
"""
import atexit
import hashlib
import json
import os
from pathlib import Path
import sys

DIRECTORY = os.environ.get("ECC_COVERAGE_DIR")
TARGETS = frozenset(("03-CaptureMetrics.py", "PrepareCodexPilot.py"))
OBSERVED = {}
DIGESTS = {}


def _line_trace(key):
    def on_event(frame, event, unused_arg):
        if event == "line":
            OBSERVED.setdefault(key, set()).add(frame.f_lineno)
        return on_event
    return on_event


def _global_trace(frame, event, unused_arg):
    if event != "call":
        return None
    path = frame.f_code.co_filename
    name = os.path.basename(path)
    if name not in TARGETS:
        return None
    if path not in DIGESTS:
        try:
            DIGESTS[path] = hashlib.sha256(Path(path).read_bytes()).hexdigest()
        except OSError:
            return None
    return _line_trace((name, DIGESTS[path]))


def _flush():
    if not DIRECTORY or not OBSERVED:
        return
    payload = [
        {"file": name, "sha256": digest, "executed": sorted(lines)}
        for (name, digest), lines in sorted(OBSERVED.items())
    ]
    destination = Path(DIRECTORY) / f"lines-{os.getpid()}-{os.urandom(6).hex()}.json"
    with destination.open("x", encoding="utf-8") as stream:
        json.dump(payload, stream, sort_keys=True)


if DIRECTORY and Path(DIRECTORY).is_dir():
    atexit.register(_flush)
    sys.settrace(_global_trace)
