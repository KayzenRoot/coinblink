"""Read-only ECC cache fingerprint preflight. No Codex, installs, hooks, MCP or network."""
import hashlib
from pathlib import Path
import re
import stat

_GIT_SHA = re.compile(r"[0-9a-f]{40}")


class CacheIntegrityError(ValueError):
    """A pinned resource cannot be trusted."""


def _components(relative):
    if not isinstance(relative, str) or not relative or "\\" in relative or "\x00" in relative:
        raise CacheIntegrityError("invalid cache-relative resource path")
    if relative.startswith(("/", "~")) or re.match(r"^[A-Za-z]:", relative):
        raise CacheIntegrityError("absolute, home or drive path forbidden")
    parts = relative.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise CacheIntegrityError("empty or traversal path component")
    return parts


def _safe_node(root, relative, kind):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise CacheIntegrityError("plugin cache root must be a real directory")
    anchor = root.resolve(strict=True)
    path = root
    parts = _components(relative)
    for i, part in enumerate(parts):
        path /= part
        try:
            info = path.lstat()
        except OSError as exc:
            raise CacheIntegrityError("pinned resource is missing or unreadable") from exc
        if stat.S_ISLNK(info.st_mode):
            raise CacheIntegrityError("symbolic link in plugin cache reference")
        expected_dir = i < len(parts) - 1 or kind == "directory"
        if expected_dir and not stat.S_ISDIR(info.st_mode):
            raise CacheIntegrityError("expected a regular cache directory")
        if not expected_dir and not stat.S_ISREG(info.st_mode):
            raise CacheIntegrityError("expected a regular cache file")
    if anchor not in path.resolve(strict=True).parents:
        raise CacheIntegrityError("resolved cache resource escapes its root")
    return path


def git_blob_sha(path):
    """Calculate Git's actual blob-object SHA1, not a SHA of filename metadata."""
    data = Path(path).read_bytes()
    # Git object identity is fixed by the SHA-1 object format, NOT used as
    # a cryptographic security primitive. This alone cannot attest cache trust.
    return hashlib.sha1(
        b"blob " + str(len(data)).encode("ascii") + b"\0" + data,
        usedforsecurity=False,
    ).hexdigest()


def pinned_file_inventory(manifest, surface):
    """Merge all pinned install-chain blobs with 479 pinned skill/agent/command blobs."""
    origin = manifest["upstream"]
    source = surface["source"]
    if origin["commit"] != source["commit"] or origin["tree"] != source["tree"]:
        raise CacheIntegrityError("upstream commit/tree drift")
    paths = {p for values in surface["paths"].values() for p in values}
    digests = surface.get("git_blob_shas")
    if len(paths) != 479 or not isinstance(digests, dict) or set(digests) != paths:
        raise CacheIntegrityError("incomplete or altered upstream surface fingerprint inventory")
    expected = dict(digests)
    for name, sha in manifest["blobs"].items():
        if name in expected and expected[name] != sha:
            raise CacheIntegrityError("conflicting source blob fingerprints")
        expected[name] = sha
    for name, sha in expected.items():
        _components(name)
        if not isinstance(sha, str) or not _GIT_SHA.fullmatch(sha):
            raise CacheIntegrityError("invalid pinned Git blob SHA")
    return expected


def inspect_pinned_cache(root, file_blobs, directories=("skills",)):
    """Inspect supplied filesystem only; cannot prove Codex discovery or effective hook trust."""
    if not isinstance(file_blobs, dict) or not file_blobs:
        raise CacheIntegrityError("missing pinned file fingerprints")
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise CacheIntegrityError("cache root does not exist or is a symlink")
    for relative in directories:
        _safe_node(root, relative, "directory")
    for relative, sha in sorted(file_blobs.items()):
        _components(relative)
        if not isinstance(sha, str) or not _GIT_SHA.fullmatch(sha):
            raise CacheIntegrityError("invalid expected SHA")
        path = _safe_node(root, relative, "file")
        if git_blob_sha(path) != sha:
            raise CacheIntegrityError("cached file diverges from pinned source")
    return {
        "result": "PINNED_FILES_INTEGRITY_ONLY",
        "checked_files": len(file_blobs),
        "discovery_verified": False,
        "hooks_trusted": False,
        "mcp_launched": False,
        "installed_plugin_verified": False,
    }
