"""Read-only SARIF gate for the ECC CodeQL experiment.

The blocking decision must consider **every** result of every run. Only the
printed summary may be truncated. Paths are normalized so that absolute URIs,
``file://`` URIs, ``./`` prefixes and nested path segments cannot smuggle an ECC
finding past the prefix check.

No network, no installation, no subprocess: standard library only.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# A result belongs to the ECC experiment when its normalized path matches one of
# these segment-anchored patterns. Anchoring on a segment boundary avoids a
# prefix such as ``tools/benchmarks/ecc-coinblink-fake`` matching.
ECC_PATH_PATTERNS = (
    re.compile(r"(?:^|/)tools/benchmarks/ecc-coinblink/"),
    re.compile(r"(?:^|/)\.agents/skills/ecc-[^/]*(?:/|$)"),
    re.compile(r"(?:^|/)\.github/workflows/ecc-[^/]*$"),
)

SUMMARY_LIMIT = 30


class GateError(Exception):
    """Raised when the gate cannot produce a trustworthy decision."""


def normalize_repo_path(uri: object) -> str:
    """Return a stable, repo-relative-looking path for a SARIF URI.

    SARIF may carry absolute paths (``/home/runner/work/repo/repo/x.py``),
    ``file://`` URIs, Windows separators or ``./`` prefixes. Normalization strips
    scheme, host, leading slashes and redundant ``.``/``..`` segments so that the
    ECC prefix check cannot be bypassed by how a producer rendered the path.
    """
    if not isinstance(uri, str) or not uri:
        return ""
    value = uri.replace("\\", "/")
    value = re.sub(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", "", value)
    value = value.split("?", 1)[0].split("#", 1)[0]
    if re.match(r"^[A-Za-z]:/", value):
        value = value[2:]
    parts: list[str] = []
    for segment in value.split("/"):
        if segment in ("", "."):
            continue
        if segment == "..":
            if parts:
                parts.pop()
            continue
        parts.append(segment)
    return "/".join(parts)


def is_ecc_path(path: str) -> bool:
    """True when a normalized path lives inside the ECC experiment scope."""
    if not path:
        return False
    return any(pattern.search(path) for pattern in ECC_PATH_PATTERNS)


def _location_fields(result: dict) -> tuple[object, object]:
    locations = result.get("locations") or [{}]
    physical = (locations[0] or {}).get("physicalLocation", {}) or {}
    artifact = physical.get("artifactLocation", {}) or {}
    region = physical.get("region", {}) or {}
    return artifact.get("uri"), region.get("startLine")


def collect_findings(sarif_documents: list[dict]) -> tuple[list[dict], int]:
    """Return (all findings, total result count) across every run and document.

    The returned list is never truncated: the caller decides blocking from it.
    """
    findings: list[dict] = []
    total = 0
    for document in sarif_documents:
        for run in document.get("runs", []) or []:
            results = run.get("results", []) or []
            total += len(results)
            tool = ((run.get("tool") or {}).get("driver") or {}).get("name")
            for result in results:
                uri, line = _location_fields(result)
                findings.append({
                    "tool": tool,
                    "rule": result.get("ruleId"),
                    "level": result.get("level"),
                    "path": normalize_repo_path(uri),
                    "raw_uri": uri,
                    "line": line,
                    "message": (result.get("message") or {}).get("text", "")[:180],
                })
    return findings, total


def ecc_findings_of(findings: list[dict]) -> list[dict]:
    return [item for item in findings if is_ecc_path(item["path"])]


def load_sarif_documents(root: str) -> list[dict]:
    """Load every ``*.sarif`` under ``root``. Refuses to pass without evidence."""
    files = sorted(Path(root).rglob("*.sarif"))
    if not files:
        raise GateError("BLOCKED: CodeQL returned no local SARIF evidence")
    documents: list[dict] = []
    for file in files:
        try:
            documents.append(json.loads(file.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError) as error:
            raise GateError(f"BLOCKED: unreadable SARIF evidence at {file.name}: {error}") from error
    return documents


def evaluate(root: str) -> tuple[dict, list[dict]]:
    """Build the printed summary (bounded) and the full blocking finding list."""
    documents = load_sarif_documents(root)
    findings, total = collect_findings(documents)
    ecc = ecc_findings_of(findings)
    summary = {
        "documents": len(documents),
        "total_results": total,
        "printed_findings": min(len(findings), SUMMARY_LIMIT),
        "sample": findings[:SUMMARY_LIMIT],
        "ecc_findings_count": len(ecc),
        "ecc_findings": ecc[:SUMMARY_LIMIT],
    }
    return summary, ecc


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: ecc_sarif_gate.py <sarif-root>")
        return 2
    try:
        summary, ecc = evaluate(argv[1])
    except GateError as error:
        print(str(error))
        return 1
    print("ECC_CODEQL_READ_ONLY_SARIF=" + json.dumps(summary, sort_keys=True))
    if ecc:
        print("BLOCKED: CodeQL issues inside the ECC experiment: " + json.dumps(
            [item["path"] for item in ecc], sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
