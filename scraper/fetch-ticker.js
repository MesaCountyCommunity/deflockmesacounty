// Pulls the ticker sheet into data/ticker.json. Same shape as
// fetch-events.js (empty-fetch fallback protection, invalid-row reporting),
// plus a mode switch: the MODE column is read from the first data row only
// (A2) — every other cell in that column is ignored — and picks what the
// ticker shows:
//
//   calendar  "Next DeFlock Event" built from data/events.json
//   custom    the text/style/show_until rows in this sheet
//   off       no ticker at all
//
// Expiry and the custom -> calendar -> off fallback happen in the browser
// (assets/js/site.js), so a row stops showing the day after its show_until
// even though this only runs once a day.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchHtml } from './lib/fetch.js';
import { parseCsv } from './lib/csv.js';
import { makeRowNormalizer } from './lib/normalize-row.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIELDS = ['mode', 'text', 'style', 'show_until'];
export const MODES = ['calendar', 'custom', 'off'];
const STYLES = ['heading', 'bold', ''];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const normalizeRow = makeRowNormalizer(FIELDS);

function defaultReadExisting() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'data', 'ticker.json'), 'utf8'));
  } catch {
    return null;
  }
}

// A row with no text is dropped silently — that's the mode-only A2 row, or
// a blank row between groups. A row with text but an unknown style or a
// show_until that isn't YYYY-MM-DD is skipped and reported rather than
// shipped broken; the frontend compares show_until as a string.
function partitionItems(rows) {
  const valid = [];
  const invalid = [];
  for (const r of rows) {
    const text = (r.text ?? '').trim();
    if (!text) continue;
    const style = (r.style ?? '').trim().toLowerCase();
    const showUntil = (r.show_until ?? '').trim();
    if (STYLES.includes(style) && (showUntil === '' || DATE_RE.test(showUntil))) {
      valid.push({ text, style, showUntil });
    } else {
      invalid.push(r);
    }
  }
  return { valid, invalid };
}

export async function buildTicker(config, fetchImpl, { readExisting = defaultReadExisting } = {}) {
  const url = config.sheets?.ticker;
  if (!url) return null; // not configured yet — caller skips writing
  const rows = parseCsv(await fetchImpl(url)).map(normalizeRow);
  const fetchedAt = new Date().toISOString();
  const rawMode = (rows[0]?.mode ?? '').trim();
  const mode = rawMode.toLowerCase();

  // Blank or misspelled mode (or a sheet that came back empty): keep the
  // ticker that's live rather than guess, and flag it so the runner fails
  // and the workflow opens an issue. With nothing on disk yet, stay off.
  if (!MODES.includes(mode)) {
    const existing = readExisting();
    const fallback = existing && MODES.includes(existing.mode)
      ? { mode: existing.mode, items: existing.items ?? [] }
      : { mode: 'off', items: [] };
    return { fetchedAt, ...fallback, invalidRowCount: 0, badMode: rawMode || '(blank)' };
  }

  const { valid, invalid } = partitionItems(rows);
  return { fetchedAt, mode, items: valid, invalidRowCount: invalid.length, badMode: null };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const config = JSON.parse(readFileSync(join(ROOT, 'config', 'locales.json'), 'utf8'));
  try {
    const out = await buildTicker(config, fetchHtml);
    if (!out) {
      console.log('ticker sheet not configured yet; nothing to do');
      process.exit(0);
    }
    if (out.invalidRowCount) {
      console.warn(
        `WARN ${out.invalidRowCount} row(s) in the ticker sheet had an unknown style (want heading, bold, or blank) or a malformed show_until (want YYYY-MM-DD) and were skipped`,
      );
    }
    writeFileSync(
      join(ROOT, 'data', 'ticker.json'),
      JSON.stringify({ fetchedAt: out.fetchedAt, mode: out.mode, items: out.items }, null, 2) + '\n',
    );
    console.log(`ok   ticker: ${out.mode}, ${out.items.length} item(s)`);
    if (out.badMode) {
      console.error(
        `FAIL ticker: mode in cell A2 was "${out.badMode}" (want ${MODES.join(', ')}); kept the existing ticker (${out.mode})`,
      );
      process.exit(1);
    }
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  }
}
