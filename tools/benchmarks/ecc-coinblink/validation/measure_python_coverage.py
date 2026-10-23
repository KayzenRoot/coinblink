"""Measure executable-line coverage of synthetic ECC Python contracts with stdlib.

Runs existing unittest suite in a disposable subprocess and collects per-process
traces from both the imported pilot executor and copied collector CLI fixtures.
No Codex, private judges, package installations, or external coverage service.
"""
import dis
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import CodeType

VALIDATION = Path(__file__).resolve().parent
PACK = VALIDATION.parent
TARGETS = {
    "03-CaptureMetrics.py": PACK / "operator" / "03-CaptureMetrics.py",
    "PrepareCodexPilot.py": PACK / "pilot" / "PrepareCodexPilot.py",
}
MINIMUM_COVERAGE = {"03-CaptureMetrics.py": 50, "PrepareCodexPilot.py": 30}


def executable_lines(path):
    """Count actual Python bytecode source lines, including nested functions."""
    code = compile(path.read_bytes(), str(path), "exec")
    found = set()
    pending = [code]
    while pending:
        current = pending.pop()
        found.update(line for _, line in dis.findlinestarts(current) if line > 0)
        pending.extend(value for value in current.co_consts if isinstance(value, CodeType))
    return found


def collect_coverage(directory):
    observed = {name: set() for name in TARGETS}
    expected = {
        name: hashlib.sha256(path.read_bytes()).hexdigest()
        for name, path in TARGETS.items()
    }
    traces = sorted(directory.glob("lines-*.json"))
    if not traces:
        raise ValueError("No Python line traces were captured")
    for trace in traces:
        for entry in json.loads(trace.read_text(encoding="utf-8")):
            name = entry["file"]
            if name in expected and entry["sha256"] == expected[name]:
                observed[name].update(entry["executed"])
    return observed, len(traces)


def main():
    with tempfile.TemporaryDirectory(prefix="ecc-synthetic-python-lines-") as temp:
        directory = Path(temp)
        environment = os.environ.copy()
        environment["ECC_COVERAGE_DIR"] = str(directory)
        bootstrap = str(VALIDATION / "coverage_bootstrap")
        environment["PYTHONPATH"] = bootstrap + os.pathsep + environment.get("PYTHONPATH", "")
        result = subprocess.run(
            [sys.executable, "-m", "unittest", "discover", "-s", str(VALIDATION),
             "-p", "test_*.py", "-v"],
            cwd=PACK.parents[2], env=environment, timeout=180, check=False,
        )
        if result.returncode != 0:
            raise SystemExit(f"Synthetic ECC tests failed: {result.returncode}")
        observed, processes = collect_coverage(directory)
        report = {"schema": "ecc-stdlib-python-line-coverage-v1",
                  "trace_processes": processes, "files": {}}
        passed = True
        for name, path in TARGETS.items():
            eligible = executable_lines(path)
            covered = observed[name] & eligible
            count = len(eligible)
            percent = round(100 * len(covered) / count, 2) if count else 0
            report["files"][name] = {
                "executed": len(covered), "executable": count,
                "line_coverage_percent": percent,
                "minimum_percent": MINIMUM_COVERAGE[name],
                "uncovered_lines": sorted(eligible - covered),
            }
            if percent < MINIMUM_COVERAGE[name]:
                passed = False
        print("ECC_PYTHON_LINE_COVERAGE=" + json.dumps(report, sort_keys=True))
        if not passed:
            raise SystemExit("Python coverage below synthetic contract floor")


if __name__ == "__main__":
    main()
