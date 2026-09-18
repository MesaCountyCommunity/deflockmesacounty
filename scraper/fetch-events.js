// Pulls the events calendar sheet into data/events.json. Mirrors
// fetch-content.js's shape (empty-fetch fallback protection, invalid-row
// reporting) but for a single flat list rather than per-locale content —
// events aren't scoped to a jurisdiction.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchHtml } from './lib/fetch.js';
import { parseCsv } from './lib/csv.js';
import { makeRowNormalizer } from './lib/normalize-row.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIELDS = ['date', 'time', 'title', 'location', 'description', 'link', 'featured'];
const REQUIRED_FIELDS = ['date', 'time', 'title', 'location'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const normalizeRow = makeRowNormalizer(FIELDS);

// Same convention as fetch-content.js: a Sheet cell spells a paragraph break
// as the two literal characters `\` `n` (Alt+Enter makes the column
// unreadable to edit), so convert at this boundary and let the frontend stay
// ignorant of the convention.
function unescapeNewlines(value) {
  return typeof value === 'string' ? value.replace(/\\(.)/g, (m, c) => (c === 'n' ? '\n' : m)) : value;
}

function isFeatured(value) {
  return ['yes', 'true', '1'].includes((value ?? '').trim().toLowerCase());
}

function defaultReadExisting() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'data', 'events.json'), 'utf8'));
  } catch {
    return null;
  }
}

// A row missing a required field, or with a date that isn't YYYY-MM-DD
// (renamed column, or someone typed "9/27/26" into the Sheet), is skipped
// and reported rather than shipped broken — the frontend sorts and compares
// these strings directly and never parses free-form dates.
function partitionValid(rows) {
  const valid = [];
  const invalid = [];
  for (const r of rows) {
    const hasRequired = REQUIRED_FIELDS.every((f) => r[f] !== undefined && r[f].trim() !== '');
    (hasRequired && DATE_RE.test(r.date.trim()) ? valid : invalid).push(r);
  }
  return { valid, invalid };
}

export async function buildEvents(config, fetchImpl, { readExisting = defaultReadExisting } = {}) {
  const url = config.sheets?.events;
  if (!url) return null; // not configured yet — caller skips writing
  const rows = parseCsv(await fetchImpl(url)).map(normalizeRow);
  const fetchedAt = new Date().toISOString();
  const { valid, invalid } = partitionValid(rows);
  const computed = valid
    .map((r) => ({
      date: r.date.trim(),
      time: r.time.trim(),
      title: r.title.trim(),
      location: r.location.trim(),
      description: unescapeNewlines((r.description ?? '').trim()),
      link: (r.link ?? '').trim(),
      featured: isFeatured(r.featured),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // A successful fetch that resolves to zero usable rows (sheet momentarily
  // blank, header renamed) must not wipe out an existing non-empty
  // events.json — Sheet content commits straight to main with no PR in the
  // way. Fall back to what's on disk and flag it so the runner can fail.
  const existing = computed.length === 0 ? readExisting() : null;
  const emptyFallback = computed.length === 0 && (existing?.events?.length ?? 0) > 0;
  const events = emptyFallback ? existing.events : computed;

  return { fetchedAt, events, invalidRowCount: invalid.length, emptyFallback };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const config = JSON.parse(readFileSync(join(ROOT, 'config', 'locales.json'), 'utf8'));
  try {
    const out = await buildEvents(config, fetchHtml);
    if (!out) {
      console.log('events sheet not configured yet; nothing to do');
      process.exit(0);
    }
    if (out.invalidRowCount) {
      console.warn(
        `WARN ${out.invalidRowCount} row(s) in the events sheet were missing a required field or had a malformed date (want YYYY-MM-DD) and were skipped`,
      );
    }
    writeFileSync(
      join(ROOT, 'data', 'events.json'),
      JSON.stringify({ fetchedAt: out.fetchedAt, events: out.events }, null, 2) + '\n',
    );
    console.log(`ok   events: ${out.events.length}`);
    if (out.emptyFallback) {
      console.error('FAIL events: fetched sheet was empty; kept the existing events.json instead of wiping it');
      process.exit(1);
    }
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  }
}
