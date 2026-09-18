import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComments } from '../scraper/fetch-comments.js';

const config = { sheets: { comments: 'https://sheet/c.csv' } };

test('rows are parsed, keyed by jurisdiction+length, and sorted', async () => {
  const csv =
    'jurisdiction,length,message\n' +
    'mesa,short,Dear commissioners...\n' +
    'gj,long,Dear council, the long version...\n' +
    'gj,short,Dear council, the short version...\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.deepEqual(
    out.comments.map((c) => `${c.jurisdiction}:${c.length}`),
    ['gj:short', 'gj:long', 'mesa:short'],
  );
  assert.ok(!Number.isNaN(Date.parse(out.fetchedAt)));
});

test('no comments URL configured -> null result (caller skips writing)', async () => {
  const out = await buildComments({ sheets: {} }, async () => '');
  assert.equal(out, null);
});

test('an unrecognized jurisdiction/length or an empty message is skipped and reported', async () => {
  const csv =
    'jurisdiction,length,message\n' +
    'gj,short,Dear council...\n' +
    'Grand Junction,short,Typo\'d jurisdiction\n' +
    'gj,medium,Typo\'d length\n' +
    'gj,long,\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.deepEqual(out.comments.map((c) => `${c.jurisdiction}:${c.length}`), ['gj:short']);
  assert.equal(out.invalidRowCount, 3);
});

test('a later row for the same combo overwrites an earlier one and is counted as a duplicate', async () => {
  const csv = 'jurisdiction,length,message\n' + 'gj,short,First draft\n' + 'gj,short,Second draft\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.equal(out.comments.length, 1);
  assert.equal(out.comments[0].message, 'Second draft');
  assert.equal(out.duplicateRowCount, 1);
});

test('friendly capitalized headers still parse', async () => {
  const csv = 'Jurisdiction,Length,Message\ngj,short,Dear council...\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.deepEqual(out.comments, [{ jurisdiction: 'gj', length: 'short', message: 'Dear council...' }]);
});

test('a fetch that resolves to zero usable rows falls back to existing comments.json instead of wiping it', async () => {
  const existing = { fetchedAt: '2020-01-01T00:00:00.000Z', comments: [{ jurisdiction: 'gj', length: 'short', message: 'Old' }] };
  const out = await buildComments(config, async () => 'jurisdiction,length,message\n', { readExisting: () => existing });
  assert.deepEqual(out.comments, existing.comments);
  assert.equal(out.emptyFallback, true);
});

test('literal \\n in the message becomes a real newline', async () => {
  const csv = 'jurisdiction,length,message\ngj,short,"Line one\\n\\nLine two"\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.equal(out.comments[0].message, 'Line one\n\nLine two');
});

test('an "all" row is used by every jurisdiction that has no row of its own for that length', async () => {
  const csv = 'jurisdiction,length,message\nall,short,Shared short script\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.deepEqual(
    out.comments.map((c) => [`${c.jurisdiction}:${c.length}`, c.message]),
    [['gj:short', 'Shared short script'], ['mesa:short', 'Shared short script']],
  );
});

test('a jurisdiction-specific row overrides the "all" row for the same length', async () => {
  const csv = 'jurisdiction,length,message\nall,short,Shared short script\ngj,short,GJ-specific script\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  const gj = out.comments.find((c) => c.jurisdiction === 'gj' && c.length === 'short');
  const mesa = out.comments.find((c) => c.jurisdiction === 'mesa' && c.length === 'short');
  assert.equal(gj.message, 'GJ-specific script');
  assert.equal(mesa.message, 'Shared short script');
});

test('two "all" rows for the same length count as a duplicate', async () => {
  const csv = 'jurisdiction,length,message\nall,short,First\nall,short,Second\n';
  const out = await buildComments(config, async () => csv, { readExisting: () => null });
  assert.equal(out.duplicateRowCount, 1);
  assert.equal(out.comments.find((c) => c.jurisdiction === 'gj').message, 'Second');
});
