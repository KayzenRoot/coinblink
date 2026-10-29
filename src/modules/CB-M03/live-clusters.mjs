// CB-M03-P1-CROSS-COVERAGE-001: which publishers tell the same story.
//
// This is deliberately not a classifier. Two headlines are linked only when
// they share enough significant title words; the reader then sees the other
// publishers that carried the same story. No inference, no network, no storage,
// and the publishers' text is never merged or rewritten.
import { isLiveNewsStopword } from "./live-news-topics.mjs";
import { normalizeLiveSearch } from "./live-news-filter.mjs";

export const LIVE_NEWS_CLUSTER_MIN_SHARED = 4;
export const LIVE_NEWS_CLUSTER_MIN_SIMILARITY = 0.5;
export const LIVE_NEWS_CLUSTER_MAX = 8;
export const LIVE_NEWS_CLUSTER_MAX_OTHERS = 4;
export const LIVE_NEWS_TOP_COVERAGE_MAX = 3;

const TOKEN_MIN_LENGTH = 3;
const MIN_TITLE_TOKENS = 4;
const OPTION_MAX = 1000;

/**
 * @typedef {object} LiveCoverageMember
 * @property {string} id
 * @property {string} sourceId
 * @property {string} sourceName
 * @property {string | null} language
 * @property {string} title
 * @property {string} link
 * @property {string | null} publishedAt
 */

/**
 * @typedef {object} LiveCoverageCluster
 * @property {string} id
 * @property {number} coverage
 * @property {string | null} latestAt
 * @property {ReadonlyArray<LiveCoverageMember>} members
 */

function clampOption(value, fallback, max) {
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, max);
}

function singularize(token) {
  if (token.length < 5 || !token.endsWith("s")) return token;
  if (token.endsWith("ss") || token.endsWith("us") || token.endsWith("is") || token.endsWith("ies")) return token;
  return token.slice(0, -1);
}

/**
 * Significant words of one headline: accents folded, lowercased, function
 * words dropped and a trailing plural "s" removed. Mechanical, not stemming.
 * @param {unknown} title
 * @returns {Set<string>}
 */
export function tokenizeLiveTitle(title) {
  const tokens = new Set();
  if (typeof title !== "string" || title === "") return tokens;
  const words = title.normalize("NFD").replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("en").match(/\p{L}[\p{L}\p{N}]*/gu) ?? [];
  for (const word of words) {
    if (word.length < TOKEN_MIN_LENGTH || isLiveNewsStopword(word)) continue;
    tokens.add(singularize(word));
  }
  return tokens;
}

function readRecord(item) {
  if (item === null || typeof item !== "object") return null;
  const { id, title, link, sourceId, sourceName, publishedAt, language } = item;
  if (typeof id !== "string" || id === "") return null;
  if (typeof title !== "string" || title === "") return null;
  if (typeof link !== "string" || link === "") return null;
  if (typeof sourceId !== "string" || sourceId === "") return null;
  const tokens = tokenizeLiveTitle(title);
  if (tokens.size < MIN_TITLE_TOKENS) return null;
  return {
    member: Object.freeze({
      id,
      sourceId,
      sourceName: typeof sourceName === "string" && sourceName !== "" ? sourceName : sourceId,
      language: typeof language === "string" && language !== "" ? language : null,
      title,
      link,
      publishedAt: typeof publishedAt === "string" && publishedAt !== "" ? publishedAt : null,
    }),
    tokens,
  };
}

function compareRecords(a, b) {
  const left = a.member.publishedAt ?? "";
  const right = b.member.publishedAt ?? "";
  if (left !== right) return right.localeCompare(left);
  return a.member.id.localeCompare(b.member.id);
}

function matches(a, b, minShared, minSimilarity) {
  let shared = 0;
  for (const token of a.tokens) {
    if (b.tokens.has(token)) shared += 1;
  }
  if (shared < minShared) return false;
  return shared / Math.min(a.tokens.size, b.tokens.size) >= minSimilarity;
}

function findRoot(parents, start) {
  let root = start;
  while (parents[root] !== root) root = parents[root];
  let cursor = start;
  while (parents[cursor] !== cursor) {
    const next = parents[cursor];
    parents[cursor] = root;
    cursor = next;
  }
  return root;
}

function compareClusters(a, b) {
  if (a.coverage !== b.coverage) return b.coverage - a.coverage;
  const left = a.latestAt ?? "";
  const right = b.latestAt ?? "";
  if (left !== right) return right.localeCompare(left);
  return a.id.localeCompare(b.id);
}

function readRecords(items) {
  const records = [];
  if (Array.isArray(items)) {
    for (const item of items) {
      const record = readRecord(item);
      if (record !== null) records.push(record);
    }
  }
  records.sort(compareRecords);
  return records;
}

function linkRecords(records, minShared, minSimilarity) {
  const parents = records.map((_, index) => index);
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      if (findRoot(parents, i) === findRoot(parents, j)) continue;
      if (!matches(records[i], records[j], minShared, minSimilarity)) continue;
      parents[findRoot(parents, j)] = findRoot(parents, i);
    }
  }
  return parents;
}

function groupRecords(records, parents) {
  const groups = new Map();
  for (let i = 0; i < records.length; i += 1) {
    const root = findRoot(parents, i);
    const group = groups.get(root);
    if (group === undefined) groups.set(root, [records[i].member]);
    else group.push(records[i].member);
  }
  return groups;
}

function buildClusters(groups) {
  const clusters = [];
  for (const members of groups.values()) {
    const sources = new Set(members.map((member) => member.sourceId));
    if (sources.size < 2) continue;
    clusters.push(Object.freeze({
      id: members[0].id,
      coverage: sources.size,
      latestAt: members[0].publishedAt,
      members: Object.freeze(members),
    }));
  }
  clusters.sort(compareClusters);
  return clusters;
}

/**
 * Group headline items carried by at least two publishers. Items without a
 * usable id, title, link or source are skipped instead of failing the page.
 * @param {unknown} items
 * @param {{minShared?: number, minSimilarity?: number, maxClusters?: number}} [options]
 * @returns {ReadonlyArray<LiveCoverageCluster>}
 */
export function clusterLiveHeadlines(items, options = {}) {
  const minShared = clampOption(options.minShared, LIVE_NEWS_CLUSTER_MIN_SHARED, OPTION_MAX);
  const minSimilarity = Number.isFinite(options.minSimilarity) && options.minSimilarity > 0
    ? Math.min(options.minSimilarity, 1)
    : LIVE_NEWS_CLUSTER_MIN_SIMILARITY;
  const maxClusters = clampOption(options.maxClusters, LIVE_NEWS_CLUSTER_MAX, OPTION_MAX);
  const records = readRecords(items);
  const clusters = buildClusters(groupRecords(records, linkRecords(records, minShared, minSimilarity)));
  return Object.freeze(clusters.slice(0, maxClusters));
}

/**
 * Map every clustered headline id to its cluster.
 * @param {unknown} clusters
 * @returns {Map<string, LiveCoverageCluster>}
 */
export function buildCoverageIndex(clusters) {
  const index = new Map();
  if (!Array.isArray(clusters)) return index;
  for (const cluster of clusters) {
    if (cluster === null || typeof cluster !== "object") continue;
    if (!Array.isArray(cluster.members)) continue;
    for (const member of cluster.members) {
      if (member === null || typeof member !== "object") continue;
      if (typeof member.id === "string" && member.id !== "") index.set(member.id, cluster);
    }
  }
  return index;
}

/**
 * Other publishers in the same cluster, one per publisher, newest first.
 * The headline itself and other items from its own publisher are excluded.
 * @param {unknown} cluster
 * @param {unknown} itemId
 * @param {number} [limit]
 * @returns {ReadonlyArray<LiveCoverageMember>}
 */
export function coverageOthers(cluster, itemId, limit = LIVE_NEWS_CLUSTER_MAX_OTHERS) {
  const max = clampOption(limit, LIVE_NEWS_CLUSTER_MAX_OTHERS, OPTION_MAX);
  if (cluster === null || typeof cluster !== "object" || !Array.isArray(cluster.members)) {
    return Object.freeze([]);
  }
  let self = null;
  for (const member of cluster.members) {
    if (member !== null && typeof member === "object" && member.id === itemId) {
      self = member;
      break;
    }
  }
  if (self === null) return Object.freeze([]);
  const seen = new Set([self.sourceId]);
  const others = [];
  for (const member of cluster.members) {
    if (member === null || typeof member !== "object") continue;
    if (member.id === self.id || seen.has(member.sourceId)) continue;
    seen.add(member.sourceId);
    others.push(member);
    if (others.length >= max) break;
  }
  return Object.freeze(others);
}

/**
 * The most covered stories for the highlight strip, already ordered by
 * coverage and recency. Invalid entries are skipped.
 * @param {unknown} clusters
 * @param {number} [limit]
 * @returns {ReadonlyArray<LiveCoverageCluster>}
 */
export function topCoverageClusters(clusters, limit = LIVE_NEWS_TOP_COVERAGE_MAX) {
  const max = clampOption(limit, LIVE_NEWS_TOP_COVERAGE_MAX, OPTION_MAX);
  if (!Array.isArray(clusters)) return Object.freeze([]);
  const picked = [];
  for (const cluster of clusters) {
    if (cluster === null || typeof cluster !== "object") continue;
    if (!Array.isArray(cluster.members) || typeof cluster.coverage !== "number") continue;
    if (cluster.coverage < 2) continue;
    picked.push(cluster);
    if (picked.length >= max) break;
  }
  return Object.freeze(picked);
}

/**
 * One member per publisher in a cluster, in member order, for attribution.
 * @param {unknown} cluster
 * @returns {ReadonlyArray<LiveCoverageMember>}
 */
export function coveragePublishers(cluster) {
  if (cluster === null || typeof cluster !== "object" || !Array.isArray(cluster.members)) {
    return Object.freeze([]);
  }
  const seen = new Set();
  const publishers = [];
  for (const member of cluster.members) {
    if (member === null || typeof member !== "object") continue;
    if (typeof member.sourceId !== "string" || seen.has(member.sourceId)) continue;
    seen.add(member.sourceId);
    publishers.push(member);
  }
  return Object.freeze(publishers);
}

/**
 * Clusters that include a given publisher, keeping every member of the story.
 * @param {unknown} clusters
 * @param {unknown} sourceId
 * @returns {ReadonlyArray<LiveCoverageCluster>}
 */
export function clustersForSource(clusters, sourceId) {
  if (!Array.isArray(clusters) || typeof sourceId !== "string" || sourceId === "") {
    return Object.freeze([]);
  }
  return Object.freeze(clusters.filter((cluster) =>
    cluster !== null && typeof cluster === "object" && Array.isArray(cluster.members)
    && cluster.members.some((member) =>
      member !== null && typeof member === "object" && member.sourceId === sourceId)));
}

/**
 * Keep clusters where at least one member title matches the reader's search.
 * An empty query keeps every cluster; an invalid collection yields none.
 * @param {unknown} clusters
 * @param {unknown} query
 * @returns {ReadonlyArray<LiveCoverageCluster>}
 */
export function searchCoverageClusters(clusters, query) {
  if (!Array.isArray(clusters)) return Object.freeze([]);
  const needle = typeof query === "string" ? normalizeLiveSearch(query).trim() : "";
  if (needle === "") return Object.freeze([...clusters]);
  return Object.freeze(clusters.filter((cluster) =>
    cluster !== null && typeof cluster === "object" && Array.isArray(cluster.members)
    && cluster.members.some((member) =>
      member !== null && typeof member === "object" && typeof member.title === "string"
      && normalizeLiveSearch(member.title).includes(needle))));
}
