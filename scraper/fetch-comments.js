// Pulls the public-comment-script sheet into data/comments.json. Mirrors
// fetch-events.js's shape (empty-fetch fallback protection, invalid-row
// reporting, friendly-header matching) but keyed by jurisdiction × length
// instead of sorted by date.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchHtml } from './lib/fetch.js';
import { parseCsv } from './lib/csv.js';
import { makeRowNormalizer } from './lib/normalize-row.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIELDS = ['jurisdiction', 'length', 'message'];
const JURISDICTIONS = ['gj', 'mesa'];
const ALL = 'all';
const LENGTHS = ['short', 'personal', 'long'];
const normalizeRow = makeRowNormalizer(FIELDS);

// Same convention as fetch-content.js: a Sheet cell spells a paragraph break
// as the two literal characters `\` `n` (Alt+Enter makes the column
// unreadable to edit), so convert at this boundary and let the frontend stay
// ignorant of the convention.
function unescapeNewlines(value) {
  return typeof value === 'string' ? value.replace(/\\(.)/g, (m, c) => (c === 'n' ? '\n' : m)) : value;
}

function defaultReadExisting() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'data', 'comments.json'), 'utf8'));
  } catch {
    return null;
  }
}

// A row with an empty message, or a jurisdiction/length value outside the
// known sets (a typo'd "Grand Junction" instead of "gj" would otherwise
// silently write a combination nothing on the page ever shows), is skipped
// and reported rather than shipped broken. "all" is accepted as a
// jurisdiction — see buildComments for how it's resolved.
function partitionValid(rows) {
  const valid = [];
  const invalid = [];
  for (const r of rows) {
    const jurisdiction = (r.jurisdiction ?? '').trim().toLowerCase();
    const length = (r.length ?? '').trim().toLowerCase();
    const message = (r.message ?? '').trim();
    const ok = [...JURISDICTIONS, ALL].includes(jurisdiction) && LENGTHS.includes(length) && message !== '';
    (ok ? valid : invalid).push({ jurisdiction, length, message });
  }
  return { valid, invalid };
}

export async function buildComments(config, fetchImpl, { readExisting = defaultReadExisting } = {}) {
  const url = config.sheets?.comments;
  if (!url) return null; // not configured yet — caller skips writing
  const rows = parseCsv(await fetchImpl(url)).map(normalizeRow);
  const fetchedAt = new Date().toISOString();
  const { valid, invalid } = partitionValid(rows);

  // Last row for a given jurisdiction+length combo wins, so a collaborator
  // rewriting a script can just add a new row rather than finding and
  // deleting the old one. Reported so a genuine accidental duplicate (two
  // different drafts nobody meant to leave both in) doesn't go unnoticed.
  // "all" is tracked here as its own pseudo-jurisdiction, same as any other.
  const byCombo = new Map();
  let duplicateRowCount = 0;
  for (const r of valid) {
    const key = `${r.jurisdiction}:${r.length}`;
    if (byCombo.has(key)) duplicateRowCount++;
    byCombo.set(key, unescapeNewlines(r.message));
  }

  // Resolve "all" as a fallback: an "all" row for a length is the script
  // every jurisdiction gets unless that jurisdiction has its own row for the
  // same length, which wins instead. This is what lets a collaborator write
  // one script that covers every jurisdiction today and every jurisdiction
  // added later, while still being able to say "actually Mesa County needs
  // different wording here" for just one combo.
  const computed = [];
  for (const jurisdiction of JURISDICTIONS) {
    for (const length of LENGTHS) {
      const message = byCombo.get(`${jurisdiction}:${length}`) ?? byCombo.get(`${ALL}:${length}`);
      if (message !== undefined) computed.push({ jurisdiction, length, message });
    }
  }

  // A successful fetch that resolves to zero usable rows (sheet momentarily
  // blank, header renamed) must not wipe out an existing non-empty
  // comments.json — Sheet content commits straight to main with no PR in the
  // way. Fall back to what's on disk and flag it so the runner can fail.
  const existing = computed.length === 0 ? readExisting() : null;
  const emptyFallback = computed.length === 0 && (existing?.comments?.length ?? 0) > 0;
  const comments = emptyFallback ? existing.comments : computed;

  return { fetchedAt, comments, invalidRowCount: invalid.length, duplicateRowCount, emptyFallback };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const config = JSON.parse(readFileSync(join(ROOT, 'config', 'locales.json'), 'utf8'));
  try {
    const out = await buildComments(config, fetchHtml);
    if (!out) {
      console.log('comments sheet not configured yet; nothing to do');
      process.exit(0);
    }
    if (out.invalidRowCount) {
      console.warn(
        `WARN ${out.invalidRowCount} row(s) in the comments sheet had an unrecognized jurisdiction/length or an empty message and were skipped`,
      );
    }
    if (out.duplicateRowCount) {
      console.warn(`WARN ${out.duplicateRowCount} row(s) in the comments sheet duplicated a jurisdiction+length combo; the last one won`);
    }
    writeFileSync(
      join(ROOT, 'data', 'comments.json'),
      JSON.stringify({ fetchedAt: out.fetchedAt, comments: out.comments }, null, 2) + '\n',
    );
    console.log(`ok   comments: ${out.comments.length} of ${JURISDICTIONS.length * LENGTHS.length} combinations written`);
    if (out.emptyFallback) {
      console.error('FAIL comments: fetched sheet was empty; kept the existing comments.json instead of wiping it');
      process.exit(1);
    }
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  }
}
