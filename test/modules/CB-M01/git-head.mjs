import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const objectIdPattern = /^(?:[\da-f]{40}|[\da-f]{64})$/iu;

async function readOptionalText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function resolveGitDirectory(repositoryRoot) {
  const markerPath = join(repositoryRoot, ".git");
  const marker = await stat(markerPath);
  if (marker.isDirectory()) return markerPath;

  const markerText = await readFile(markerPath, "utf8");
  const match = /^gitdir:\s*(.+)\s*$/iu.exec(markerText.trim());
  if (!match) throw new Error("invalid Git directory marker");
  return resolve(repositoryRoot, match[1]);
}

function validateReference(reference) {
  const segments = reference.split("/");
  if (
    !reference.startsWith("refs/") ||
    segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\:\0]/u.test(segment))
  ) {
    throw new Error("invalid Git HEAD reference");
  }
}

function parseObjectId(value) {
  const objectId = value.trim();
  if (!objectIdPattern.test(objectId)) throw new Error("invalid Git object ID");
  return objectId.toLowerCase();
}

async function resolveReference(gitDirectories, reference) {
  for (const gitDirectory of new Set(gitDirectories)) {
    const looseRef = await readOptionalText(join(gitDirectory, ...reference.split("/")));
    if (looseRef !== null) return parseObjectId(looseRef);
  }

  for (const gitDirectory of new Set(gitDirectories)) {
    const packedRefs = await readOptionalText(join(gitDirectory, "packed-refs"));
    if (!packedRefs) continue;
    for (const line of packedRefs.split(/\r?\n/u)) {
      const match = /^(?<objectId>[\da-f]{40}|[\da-f]{64}) (?<reference>[^\s]+)$/iu.exec(line);
      if (match?.groups?.reference === reference) return parseObjectId(match.groups.objectId);
    }
  }

  throw new Error("could not resolve Git HEAD reference");
}

export async function readGitHead(repositoryRoot) {
  const gitDirectory = await resolveGitDirectory(repositoryRoot);
  const head = (await readFile(join(gitDirectory, "HEAD"), "utf8")).trim();
  if (objectIdPattern.test(head)) return head.toLowerCase();

  const match = /^ref:\s*(\S+)$/u.exec(head);
  if (!match) throw new Error("invalid Git HEAD contents");
  validateReference(match[1]);

  const commonDirectoryText = await readOptionalText(join(gitDirectory, "commondir"));
  const commonDirectory = commonDirectoryText
    ? resolve(gitDirectory, commonDirectoryText.trim())
    : gitDirectory;
  return resolveReference([gitDirectory, commonDirectory], match[1]);
}
