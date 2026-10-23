const MAX_TITLE = 140;
const MAX_AUTHOR = 80;
const MAX_SUMMARY = 400;
const MAX_BODY = 12_000;
const MAX_SOURCE = 500;
export const MAX_MARKDOWN_BYTES = 64_000;
const utf8 = new TextEncoder();

const clean = (value, max) => String(value ?? '').trim().slice(0, max).replace(/\r\n?/gu, '\n');
const escapeMarkdown = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll(/^#/gmu, '&#35;');
const escapeLegacyMarkdown = value => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
// A heading's '#' must be encoded even when it is not the first character.
// A single pass keeps literal "&#35;" distinguishable from a real '#'.
const escapeTitleV2 = value => value.replace(/[&<>#]/gu, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '#': '&#35;',
})[character]);
const FORMAT_V2 = '> COINBLINK LOCAL DRAFT FORMAT: 2';
const SOURCE_HEADING = '### CoinBlink source notes (unverified)';
const CLAIM_HEADING = '### CoinBlink claim review queue (local only)';
const SOURCE_ROW = /^\[\^cb([1-9]|1[0-2])\]: (.{1,90}) \| (https:\/\/\S+)$/u;
const CLAIM_ROW = /^\[CB-CLAIM-(0[1-9]|1[0-2]) \| (NEEDS_HUMAN_REVIEW|REVIEW_NOTED_NOT_VERIFIED) \| source=(none|cb(?:[1-9]|1[0-2]))\] (.{10,220})$/u;

function validSourceNote(match) {
  if (match[2] !== match[2].trim() || /[|<>\r\t\\[\]]/u.test(match[2])) return false;
  try {
    const url = new URL(match[3]);
    return url.href === match[3] && url.protocol === 'https:' && !url.username && !url.password
      && url.hostname.includes('.') && !url.hostname.endsWith('.') && match[3].length <= 500;
  } catch { return false; }
}

function validLocalNotes(rowsText, pattern, sources) {
  if (!rowsText || rowsText.endsWith('\n\n')) return false;
  const rows = (rowsText.endsWith('\n') ? rowsText.slice(0, -1) : rowsText).split('\n');
  if (!rows.length || rows.length > 12) return false;
  const seen = new Set();
  for (const row of rows) {
    const match = pattern.exec(row);
    if (!match || seen.has(match[1])) return false;
    if (sources ? !validSourceNote(match) : /[|<>\r]/u.test(match[4])) return false;
    seen.add(match[1]);
  }
  return true;
}

function splitLocalAppendix(body, heading, pattern, sources) {
  const marker = '\n\n' + heading + '\n';
  const index = body.lastIndexOf(marker);
  if (index < 0) return body.includes(heading) ? null : body;
  const prose = body.slice(0, index);
  if (prose.includes(heading) || !validLocalNotes(body.slice(index + marker.length), pattern, sources)) return null;
  return prose;
}

function exportableArticleProse(body) {
  const strippedHeadings = body.replaceAll(SOURCE_HEADING, '').replaceAll(CLAIM_HEADING, '');
  if (strippedHeadings.includes('### CoinBlink source notes')
      || strippedHeadings.includes('### CoinBlink claim review queue')) return '';
  const beforeSources = splitLocalAppendix(body, SOURCE_HEADING, SOURCE_ROW, true);
  if (beforeSources === null) return '';
  return splitLocalAppendix(beforeSources, CLAIM_HEADING, CLAIM_ROW, false)?.trim() ?? '';
}

export function prepareLocalDraft(input) {
  const title = clean(input.title, MAX_TITLE).replaceAll('\n', ' ').trim();
  const author = clean(input.author, MAX_AUTHOR).replaceAll('\n', ' ').trim();
  const summary = clean(input.summary, MAX_SUMMARY);
  const body = clean(input.body, MAX_BODY);
  const sourceValue = clean(input.source, MAX_SOURCE);
  let source = '';
  if (sourceValue) {
    try {
      const parsed = new URL(sourceValue);
      if (parsed.protocol === 'https:' && !parsed.username && !parsed.password
        && parsed.hostname.includes('.') && !parsed.hostname.endsWith('.')
        && !/\s/u.test(sourceValue) && parsed.href.length <= MAX_SOURCE) {
        source = parsed.href;
      }
    } catch { /* Invalid source addresses never reach an outbound link. */ }
  }
  const errors = [];
  if (title.length < 8) errors.push('title');
  if (summary.length < 20) errors.push('summary');
  if (exportableArticleProse(body).length < 40) errors.push('body');
  if (!source) errors.push('source');
  return Object.freeze({ title, author, summary, body, source, ready: errors.length === 0, errors: Object.freeze(errors) });
}

function serializeLocalDraft(prepared, legacy = false) {
  if (!prepared.ready) throw new Error('A source-backed draft is required');
  const encode = legacy ? escapeLegacyMarkdown : escapeMarkdown;
  const title = legacy ? encode(prepared.title.replace(/[\n#]/gu, ' ')) : escapeTitleV2(prepared.title);
  const summary = encode(prepared.summary);
  const body = encode(prepared.body);
  const author = encode(legacy ? prepared.author || 'Not provided' : prepared.author);
  const source = prepared.source;
  return [
    '# ' + title, '',
    '> WORKING DRAFT ONLY. Not checked, approved, or published.', '',
    ...(legacy ? [] : [FORMAT_V2, '']),
    '**Author label:** ' + author, '',
    '**Original source:** ' + source, '',
    '## Summary', '', summary, '',
    '## Draft', '', body, '',
    '## Editorial gates', '',
    '- [ ] Verify facts against original source and independent evidence',
    '- [ ] Check reuse rights and attribution',
    '- [ ] Request owner review before any publication', '',
  ].join('\n');
}

export function draftToMarkdown(prepared) {
  return serializeLocalDraft(prepared);
}

export function parseLocalDraftMarkdown(raw) {
  if (typeof raw !== 'string' || utf8.encode(raw).byteLength > MAX_MARKDOWN_BYTES || raw.includes('\0')) {
    throw new Error('Unsupported or oversized Markdown draft');
  }
  const text = raw.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n');
  const header = '# ';
  const isVersion2 = text.includes('\n\n> WORKING DRAFT ONLY. Not checked, approved, or published.\n\n' + FORMAT_V2 + '\n\n**Author label:** ');
  const byline = '\n\n> WORKING DRAFT ONLY. Not checked, approved, or published.\n\n'
    + (isVersion2 ? FORMAT_V2 + '\n\n' : '') + '**Author label:** ';
  const source = '\n\n**Original source:** ';
  const summary = '\n\n## Summary\n\n';
  const body = '\n\n## Draft\n\n';
  const gates = '\n\n## Editorial gates\n\n';
  const exactGates = [
    '- [ ] Verify facts against original source and independent evidence',
    '- [ ] Check reuse rights and attribution',
    '- [ ] Request owner review before any publication',
  ].join('\n');
  if (!text.startsWith(header) || !text.endsWith(gates + exactGates + '\n')) throw new Error('Not a CoinBlink working draft');
  const markers = [byline, source, summary, body, gates];
  let cursor = header.length;
  const values = [];
  for (const part of markers) {
    const position = text.indexOf(part, cursor);
    if (position < cursor) throw new Error('Missing original draft sections');
    values.push(text.slice(cursor, position));
    cursor = position + part.length;
  }
  if (text.slice(cursor) !== exactGates + '\n') throw new Error('Unexpected content after editorial gates');
  const [title, author, originalSource, brief, article] = values;
  const restore = (value, isTitle = false) => {
    const angles = value.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
    if (!isVersion2) return angles;
    const restored = isTitle ? angles.replaceAll('&#35;', '#') : angles.replaceAll(/^&#35;/gmu, '#');
    return restored.replaceAll('&amp;', '&');
  };
  const result = prepareLocalDraft({
    title: restore(title, true),
    author: !isVersion2 && restore(author) === 'Not provided' ? '' : restore(author),
    source: originalSource,
    summary: restore(brief),
    body: restore(article),
  });
  if (!result.ready || serializeLocalDraft(result, !isVersion2) !== text) throw new Error('Draft format or fields failed validation');
  return result;
}

export function safeDraftFilename(title) {
  const kebab = clean(title, MAX_TITLE)
    .normalize('NFKD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/gu, '-');
  const start = kebab.startsWith('-') ? 1 : 0;
  const end = kebab.endsWith('-') ? kebab.length - 1 : kebab.length;
  const slug = kebab.slice(start, end).slice(0, 60);
  return (slug || 'coinblink-draft') + '.md';
}

function samePersistedFields(parsed, record) {
  return parsed.title === record.title && parsed.author === record.author_label
    && parsed.summary === record.summary && parsed.body === record.body && parsed.source === record.source_url;
}

export function createPersistedDraftMarkdown(record) {
  if (!record || record.status !== 'draft') throw new Error('Draft cannot be exported to canonical Markdown');
  const prepared = prepareLocalDraft({
    title: record.title, author: record.author_label, summary: record.summary,
    body: record.body, source: record.source_url,
  });
  if (!prepared.ready || prepared.title !== record.title || prepared.author !== record.author_label
      || prepared.summary !== record.summary || prepared.body !== record.body || prepared.source !== record.source_url) {
    throw new Error('Draft cannot be exported to canonical Markdown');
  }
  const markdown = draftToMarkdown(prepared);
  const byteLength = utf8.encode(markdown).byteLength;
  if (byteLength > MAX_MARKDOWN_BYTES) throw new Error('Draft cannot be exported to canonical Markdown');
  const parsed = parseLocalDraftMarkdown(markdown);
  if (!samePersistedFields(parsed, record)) throw new Error('Draft cannot be exported to canonical Markdown');
  return Object.freeze({ markdown, filename: safeDraftFilename(record.title), byteLength });
}
