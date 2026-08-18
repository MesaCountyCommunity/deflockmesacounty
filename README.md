# DeFlock Mesa County

A campaign site about automated license plate readers in Mesa County, Colorado,
with the Mesa County contact tool built into its Take Action section.

The design mirrors [deflocknc.com](https://deflocknc.com) (DeFlock Nevada
County, CA), which is itself a static GitHub Pages site. **All campaign content
here is placeholder** — see [CONTENT-TODO.md](CONTENT-TODO.md) before
publishing anything.

## Status

| Part | State |
|---|---|
| Design system, layout, all three pages | Done |
| Contact tool, ported and integrated | Done, working against real data |
| Scraper, validation, scheduled Actions | Done, 51 tests passing |
| CORA toolkit — statutes and request templates | Written and usable |
| Campaign findings, stats, photos, comment scripts | **Placeholder** |
| Mailing list form, meetings calendar | **Not connected** |

## How it works

No build step, no server. Three HTML pages plus one stylesheet and two scripts:

```
index.html          campaign landing page; hosts the contact tool at #act
flock-101.html      explainer
cora.html           Colorado public records toolkit + request templates
assets/css/         one stylesheet
assets/js/site.js   page interactions (reveal, comment tabs, copy, signup)
assets/js/contact-tool.js   the contact tool
config/locales.json the locale registry, maintained by hand
data/*.json         scraped contacts + sheet content
scraper/            the scrapers, validation, and diff summary
```

The contact tool renders entirely from JSON at runtime:

- `config/locales.json` — one entry per locale: which scraper to use, which
  bodies to show, expected member counts, districts, helpful links.
- `data/<locale>.contacts.json` — written by the scraper, reviewed via PR.
- `data/<locale>.content.json` — campaign templates and FAQs from a Google
  Sheet.

Three GitHub Actions keep it current:

- **`scrape.yml`** (weekly, plus a "Run workflow" button) scrapes each
  government site, validates the result, and **opens a pull request** when
  anything changed. Nothing reaches the live site without review. Validation
  failures open an issue and leave the live data untouched, so a redesigned
  city website can never blank out the contact list.
- **`content.yml`** (daily) pulls the Google Sheet into the content files and
  commits directly.
- **`test.yml`** runs the test suite on every push and pull request.

## Development

```bash
npm install
npm test                     # 51 tests: parsers, validation, CSV, data schema
npm run scrape               # live scrape into data/
npm run content              # pull the Google Sheet into data/
python3 -m http.server 8080  # then open http://localhost:8080/
```

Parser tests run against committed HTML snapshots in `test/fixtures/`, so they
work offline and pinpoint exactly what broke when a city redesigns its site.

## Editing campaigns and FAQs

Edit the Google Sheet, not this repo: two tabs, `templates`
(`locale,title,subject,message`) and `faqs` (`locale,question,answer`). The
`locale` column takes a locale id (`grand-junction`, `fruita`, `palisade`,
`mesa-county`). `content.yml` pulls it in daily.

## How the contact tool is embedded

It was ported from the standalone `mesaContactTool` repo. Two things differ, and
both matter if you ever port it somewhere else:

1. **Every container id is `ct-`-prefixed.** The campaign page has its own
   `<nav>`, `<footer>`, and tab-like controls, and the standalone tool's
   unprefixed ids (`#tabs`, `#panel`, `#footer`, `#output`) would have collided.
2. **Locale selection writes `#contact-<id>` via `replaceState`.** The page's
   own nav owns hashes like `#act` and `#findings`. A bare `#fruita` would have
   fought them, and assigning `location.hash` on every tab click would have
   buried the section anchors under a pile of history entries.

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

**Do not deploy before working through [CONTENT-TODO.md](CONTENT-TODO.md).**
The pages currently carry `<meta name="robots" content="noindex, nofollow">`
and a draft banner specifically so a premature deploy can't be indexed or
mistaken for finished work.
