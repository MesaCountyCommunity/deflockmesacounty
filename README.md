# DeFlock Mesa County

A campaign site about automated license plate readers (ALPRs) in Mesa County,
Colorado. Its purpose is to inform residents of Grand Junction, Fruita,
Palisade, and Mesa County about how these systems are being used locally, and
to coordinate the community toward two concrete outcomes: getting the cameras
removed and getting privacy ordinances passed that govern any future use.
Everything on the site is built to make that easier — the findings and
evidence, the Take Action page (contact tool, meeting schedules, public
comment scripts, events calendar), and the working-group signup — rather
than just to describe the problem.

Most campaign content is real and the site is close to launch-ready. See
[CONTENT-TODO.md](CONTENT-TODO.md) for what's still open — a handful of
numbers that need citations, some thin meeting-schedule and FAQ content, and
the public comment sheet, which is connected but has no rows yet.

## How it works

No build step, no server. HTML pages plus one stylesheet and two scripts:

```
index.html          campaign landing page
flock-101.html      explainer
act.html            take-action page: calendar, meetings, comment scripts, contact tool
join.html           working group signup (Google Form)
CORA-CCJRA-REFERENCE.md  CORA/CCJRA content, held for a future action tool
assets/css/         one stylesheet
assets/js/site.js   page interactions (reveal, comment tabs, copy, signup)
assets/js/contact-tool.js   the contact tool (act.html)
assets/js/events.js the calendar renderer (act.html)
assets/js/comments.js the comment-script renderer (act.html)
config/locales.json the locale registry, maintained by hand
data/*.contacts.json scraped government contacts, one file per locale
data/*.content.json  campaign email templates + FAQs, one file per locale
data/events.json     the events calendar, written by fetch-events.js
data/comments.json   the public comment scripts, written by fetch-comments.js
scraper/             the scrapers, validation, and diff summary
```

The contact tool renders entirely from JSON at runtime:

- `config/locales.json` — one entry per locale: which scraper to use, which
  bodies to show, expected member counts, districts, helpful links.
- `data/<locale>.contacts.json` — written by the scraper, reviewed via PR.
- `data/<locale>.content.json` — campaign templates and FAQs from a Google
  Sheet.

### GitHub Actions

Three workflows, all under **Actions** in the GitHub UI, where each can also
be run on demand: open the **Actions** tab, pick the workflow by name in the
left sidebar, then use the **Run workflow** button (top right of the workflow
runs list) to trigger it immediately instead of waiting for its schedule.

- **`scrape.yml`** (Mondays ~7am Mountain, plus "Run workflow") scrapes each
  government site, validates the result, and **opens a pull request** when
  anything changed. Nothing reaches the live site without review. Validation
  failures open an issue and leave the live data untouched, so a redesigned
  city website can never blank out the contact list.
- **`content.yml`** (daily, plus "Run workflow") pulls all four Google
  Sheets — templates, FAQs, events, and public comment scripts — into
  `data/`, and **commits directly to `main`** with no PR, since sheet edits
  are already reviewed by whoever owns the sheet. A fetch that comes back
  empty never overwrites existing data (see "Updating the sheet content"
  below); a genuine failure opens or updates a tracking issue instead.
- **`test.yml`** runs the test suite on every push and pull request.

## Updating the sheet content

Four Google Sheets feed the site, each pulled by its own script in
`scraper/` and each configured as a URL under `sheets` in
`config/locales.json`. Edit the sheet, not this repo — `content.yml` pulls
all four in daily, and each also has an `npm run` script for pulling it by
hand:

| Sheet | Purpose | Columns | Writes to | Pulled by |
|---|---|---|---|---|
| Templates | Email templates the contact tool hands the resident to send | `locale, title, subject, message` | `data/<locale>.content.json` | `npm run content` |
| FAQs | Questions/answers shown alongside the contact tool | `locale, question, answer` | `data/<locale>.content.json` | `npm run content` |
| Public Comment | Scripts for speaking to city council / county commissioners | `jurisdiction, length, message` | `data/comments.json` | `npm run comments` |
| Events | The events calendar on `act.html` | `date, time, title, location, description, link, featured` | `data/events.json` | `npm run events` |

Notes that apply across all four:

- The **Templates** and **FAQs** tabs live in one sheet and share the
  `locale` column, which takes a locale id (`grand-junction`, `fruita`,
  `palisade`, `mesa-county`) or `all`.
- **Public Comment** rows use `jurisdiction` (`gj`, `mesa`, or `all`) and
  `length` (`short`, `personal`, or `long`); an `all` row covers any
  jurisdiction without its own row for that length, including one added
  later. Wrap parts the speaker fills in themselves in square brackets, e.g.
  `[your name]`.
- A row with a missing required field, an unrecognized locale/jurisdiction,
  or (for events) a malformed date is skipped and logged rather than shipped
  broken.
- A sheet that comes back empty never wipes out the existing data file —
  the fetch fails loudly (an issue on `content.yml`, a non-zero exit
  locally) instead of publishing a blank page.
- Paragraph breaks in a cell are written as the two literal characters `\n`
  (Alt+Enter makes the column unreadable to edit); the fetch scripts convert
  them to real line breaks.

To point one of these at a real sheet: **File → Share → Publish to web**,
choose the tab, export as CSV, and paste the published URL into the matching
key under `sheets` in `config/locales.json` (`templates`, `faqs`, `events`,
`comments`).

## How the contact tool is embedded

It was ported from the standalone `mesaContactTool` repo and lives on
`act.html`. Two things differ, and both matter if you ever port it somewhere
else:

1. **Every container id is `ct-`-prefixed.** The campaign page has its own
   `<nav>`, `<footer>`, and tab-like controls, and the standalone tool's
   unprefixed ids (`#tabs`, `#panel`, `#footer`, `#output`) would have collided.
2. **Locale selection writes `#contact-<id>` via `replaceState`.** The page's
   own nav owns hashes like `#calendar` and `#meetings`. A bare `#fruita` would
   have fought them, and assigning `location.hash` on every tab click would
   have buried the section anchors under a pile of history entries.

## Adding a locale

1. Add an entry to `config/locales.json` (id, label, `emailDomain`, scrape
   URLs, bodies with `expectedCount`, optional `districts`, links).
2. If no existing source module fits, add `scraper/sources/<id>.js` exporting
   `scrape(fetchHtml, scrapeConfig) -> Promise<Person[]>` where `Person` is
   `{name, title, district, email, phone, profileUrl}`. Save a snapshot of the
   page under `test/fixtures/` and add a test against it.
3. Run `npm run scrape`, check the new data file, and commit.

The frontend needs no changes — it has no locale-specific code.

## Deploying

GitHub Pages, serving from the repository root on the default branch.
`.nojekyll` is present so Jekyll doesn't touch the directory. Point a custom
domain at it with a `CNAME` file if you have one.

The `noindex, nofollow` robots meta and draft banner that used to guard
against a premature deploy have been removed — the site is considered
launch-ready. Check [CONTENT-TODO.md](CONTENT-TODO.md) for what's still open
before pointing a real domain at this.

## Development

```bash
npm install
npm test                     # parsers, validation, CSV, data schema, events
npm run scrape               # live scrape into data/
npm run content               # pull the campaign Google Sheet into data/
npm run events                # pull the events Google Sheet into data/events.json
npm run comments              # pull the comments Google Sheet into data/comments.json
python3 -m http.server 8080  # then open http://localhost:8080/
```

Parser tests run against committed HTML snapshots in `test/fixtures/`, so they
work offline and pinpoint exactly what broke when a city redesigns its site.
