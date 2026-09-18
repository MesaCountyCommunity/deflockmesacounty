import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEvents } from '../scraper/fetch-events.js';

const config = { sheets: { events: 'https://sheet/e.csv' } };

test('rows are parsed, sorted by date, and featured is coerced to a boolean', async () => {
  const csv =
    'date,time,title,location,description,link,featured\n' +
    '2026-10-05,6pm,Later meeting,City Hall,,,\n' +
    '2026-09-27,10:30 am,Protest,Spring Valley Park,,,yes\n';
  const out = await buildEvents(config, async () => csv, { readExisting: () => null });
  assert.deepEqual(out.events.map((e) => e.title), ['Protest', 'Later meeting']);
  assert.equal(out.events[0].featured, true);
  assert.equal(out.events[1].featured, false);
  assert.ok(!Number.isNaN(Date.parse(out.fetchedAt)));
});

test('no events URL configured -> null result (caller skips writing)', async () => {
  const out = await buildEvents({ sheets: {} }, async () => '');
  assert.equal(out, null);
});

test('a row missing a required field or with a malformed date is skipped and reported', async () => {
  const csv =
    'date,time,title,location\n' +
    '2026-09-27,10:30 am,Protest,Spring Valley Park\n' +
    ',10:30 am,No date,Nowhere\n' +
    '9/27/2026,10:30 am,Bad date format,Nowhere\n';
  const out = await buildEvents(config, async () => csv, { readExisting: () => null });
  assert.deepEqual(out.events.map((e) => e.title), ['Protest']);
  assert.equal(out.invalidRowCount, 2);
});

test('a fetch that resolves to zero usable rows falls back to existing events.json instead of wiping it', async () => {
  const existing = { fetchedAt: '2020-01-01T00:00:00.000Z', events: [{ date: '2020-01-01', time: '1pm', title: 'Old', location: 'Old place', description: '', link: '', featured: false }] };
  const out = await buildEvents(config, async () => 'date,time,title,location\n', { readExisting: () => existing });
  assert.deepEqual(out.events, existing.events);
  assert.equal(out.emptyFallback, true);
});

test('literal \\n in the description becomes a real newline', async () => {
  const csv = 'date,time,title,location,description\n2026-09-27,10:30 am,Protest,Park,"Line one\\n\\nLine two"\n';
  const out = await buildEvents(config, async () => csv, { readExisting: () => null });
  assert.equal(out.events[0].description, 'Line one\n\nLine two');
});

test('friendly capitalized headers with a parenthetical note still parse (the real Sheet export shape)', async () => {
  const csv =
    'DATE,TIME,TITLE,LOCATION,DESCRIPTION,LINK,FEATURED (yes to pin)\n' +
    '2026-09-27,10:30 AM,Protest Against Flock,Spring Valley Park — Patterson and 27 1/2 Rd,,,\n' +
    '2026-10-07,5:30 PM,GJ City Council Meeting,"City Hall Auditorium, 250 N 5th Street",Also can watch online,https://example.com/agenda,yes\n';
  const out = await buildEvents(config, async () => csv, { readExisting: () => null });
  assert.equal(out.invalidRowCount, 0);
  assert.deepEqual(out.events.map((e) => e.title), ['Protest Against Flock', 'GJ City Council Meeting']);
  assert.equal(out.events[1].featured, true);
  assert.equal(out.events[1].link, 'https://example.com/agenda');
});
