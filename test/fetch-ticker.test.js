import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTicker, MODES } from '../scraper/fetch-ticker.js';

const config = { sheets: { ticker: 'https://sheet/t.csv' } };
const noExisting = { readExisting: () => null };

test('custom rows keep sheet order; mode comes from the first data row only', async () => {
  const csv =
    'mode,text,style,show_until\n' +
    'custom,Join us at Public Meetings,heading,\n' +
    'off,GJ City Council,bold,2026-10-07\n' +
    ',5:30 PM,,2026-10-07\n';
  const out = await buildTicker(config, async () => csv, noExisting);
  assert.equal(out.mode, 'custom');
  assert.deepEqual(out.items, [
    { text: 'Join us at Public Meetings', style: 'heading', showUntil: '' },
    { text: 'GJ City Council', style: 'bold', showUntil: '2026-10-07' },
    { text: '5:30 PM', style: '', showUntil: '2026-10-07' },
  ]);
  assert.equal(out.badMode, null);
  assert.ok(!Number.isNaN(Date.parse(out.fetchedAt)));
});

test('mode is case- and whitespace-insensitive, and a mode-only row adds no item', async () => {
  const csv = 'MODE (only A2 counts),TEXT,STYLE (heading/bold/blank),SHOW_UNTIL\n  Calendar ,,,\n';
  const out = await buildTicker(config, async () => csv, noExisting);
  assert.equal(out.mode, 'calendar');
  assert.deepEqual(out.items, []);
});

test('no ticker URL configured -> null result (caller skips writing)', async () => {
  assert.equal(await buildTicker({ sheets: {} }, async () => ''), null);
});

test('rows with an unknown style or malformed show_until are skipped and reported; blank rows are ignored', async () => {
  const csv =
    'mode,text,style,show_until\n' +
    'custom,Good,,\n' +
    ',,,\n' +
    ',Typo style,bld,\n' +
    ',Bad date,,10/7/2026\n';
  const out = await buildTicker(config, async () => csv, noExisting);
  assert.deepEqual(out.items.map((i) => i.text), ['Good']);
  assert.equal(out.invalidRowCount, 2);
});

test('a blank or misspelled mode keeps the existing ticker and is flagged', async () => {
  const existing = { mode: 'custom', items: [{ text: 'Old', style: '', showUntil: '' }] };
  const out = await buildTicker(config, async () => 'mode,text\ncalender,New\n', { readExisting: () => existing });
  assert.equal(out.mode, 'custom');
  assert.deepEqual(out.items, existing.items);
  assert.equal(out.badMode, 'calender');

  const blank = await buildTicker(config, async () => 'mode,text\n', { readExisting: () => existing });
  assert.equal(blank.badMode, '(blank)');
  assert.deepEqual(blank.items, existing.items);
});

test('a bad mode with no existing ticker.json falls back to off', async () => {
  const out = await buildTicker(config, async () => 'mode,text\n,Hi\n', noExisting);
  assert.equal(out.mode, 'off');
  assert.deepEqual(out.items, []);
  assert.ok(out.badMode);
});

test('committed data/ticker.json matches the shape site.js expects', () => {
  const data = JSON.parse(readFileSync(new URL('../data/ticker.json', import.meta.url), 'utf8'));
  assert.ok(MODES.includes(data.mode));
  assert.ok(Array.isArray(data.items));
  for (const item of data.items) {
    assert.deepEqual(Object.keys(item).sort(), ['showUntil', 'style', 'text']);
    assert.ok(item.text);
    assert.ok(['heading', 'bold', ''].includes(item.style));
    assert.match(item.showUntil, /^(\d{4}-\d{2}-\d{2})?$/);
  }
});
