# Content TODO

Every unwritten value on this site is wrapped in `<span class="todo">` (or
`class="todo"` on the element itself), which renders as gold highlighted text
with a dashed underline. A sticky yellow **Draft** banner sits under the nav on
every page.

**Nothing on this site has been fact-checked.** The structure is real; the
numbers are dashes.

## Launch checklist

Work top to bottom. The site should not go public until every box is ticked.

- [ ] **Findings data** — file the records requests (see `cora.html`), get the
      audit logs back, and fill in the real numbers.
- [ ] **Every `todo` span replaced** — `grep -rn 'class="todo"' *.html` must
      return nothing. Delete the whole wrapper element, not just the text.
- [ ] **Photos** — three `.photo-placeholder` divs in the Evidence section need
      real images. Drop JPGs in `assets/images/` and replace each placeholder
      div with `<img src="assets/images/NAME.jpg" alt="..." loading="lazy" />`.
- [ ] **Google Form** for the mailing list (see below).
- [ ] **Events sheet** for the calendar on `act.html` (see below) — until it's
      connected, the calendar just shows whatever is hand-edited into
      `data/events.json`.
- [ ] **Meeting schedules** — three `class="todo"` spans in the Meetings
      section of `act.html` need the real day/time/cadence for Grand Junction
      City Council, Mesa County Board of Commissioners, and their agenda/
      workshop sessions.
- [ ] **Working group contact email** — two `data-todo` placeholders, one in
      the closing banner and one in each footer.
- [ ] **Comments sheet** for the public comment scripts on `act.html` (see
      below) — until it's connected, every jurisdiction × length combination
      shows a "hasn't been written yet" placeholder box.
- [ ] **Remove the draft banner** — delete the `<div class="todo-banner">` from
      all three pages.
- [ ] **Remove `<meta name="robots" content="noindex, nofollow">`** from all
      three pages. This is the last step, and it is the one that makes the site
      public to search engines.
- [ ] **Delete the `.todo` and `.todo-banner` CSS rules** from
      `assets/css/styles.css` so nothing can silently reintroduce a placeholder.

## Setting up the mailing list form

The signup form lives on `join.html` and posts directly to a Google Form,
which is what lets a static GitHub Pages site collect submissions with no
backend. Until it is configured, `site.js` blocks submission and shows an
alert rather than faking success.

1. Create a Google Form with four questions: Name (short answer), Email
   (short answer), Where You Live (short answer), and Message (paragraph,
   marked not required).
2. Open the live form, right-click → **View Page Source**.
3. Search the source for `entry.` — each question has an id like
   `entry.1646014132`. Note which id belongs to which question.
4. Get the form's POST URL: it is the form's `/viewform` URL with `/viewform`
   replaced by `/formResponse`.
5. In `join.html`, replace:
   - `FORM_ID_HERE` in the form's `action` with the real form id
   - `entry.NAME_ID`, `entry.EMAIL_ID`, `entry.AREA_ID`, `entry.MESSAGE_ID`
     with the real ids
6. Submit the form once on the live site and confirm the row lands in the
   linked spreadsheet.

The `target="signup-sink"` hidden iframe is what keeps the visitor on the page
instead of bouncing them to Google's confirmation screen. Leave it in place.

## Setting up the events calendar

The calendar on `act.html` reads `data/events.json`, which is written by
`scraper/fetch-events.js` from a Google Sheet — same pattern as the campaign
templates/FAQs, so anyone in the working group can add an event without
touching code.

1. Create a Google Sheet with one tab and these columns: `date` (YYYY-MM-DD),
   `time` (free text, e.g. `10:30 am`), `title`, `location`, `description`
   (optional), `link` (optional — "more info" URL), `featured` (optional —
   `yes` to pin this event as the highlighted one instead of the soonest
   upcoming event).
2. **File → Share → Publish to web**, choose that tab, and export as CSV. Copy
   the published URL.
3. Paste it into `config/locales.json` as `sheets.events` (currently `null`).
4. Run `npm run events` to confirm it fetches and writes `data/events.json`.
   `content.yml` then keeps it current daily, same as templates/FAQs.

Until step 3 is done, `fetch-events.js` is a no-op and the calendar keeps
showing whatever's hand-edited into `data/events.json` (currently just the
September 27th protest from the ticker).

## Setting up the public comment scripts

The six comment boxes on `act.html` (2 jurisdictions × 3 lengths) are
rendered from `data/comments.json`, written by `scraper/fetch-comments.js`
from a Google Sheet — same pattern as the events calendar, so any
collaborator can add or rewrite a script without touching code.

1. Create a Google Sheet with one tab and these columns: `jurisdiction`
   (`gj`, `mesa`, or `all`), `length` (`short`, `personal`, or `long`),
   `message` — the whole script, written as you'd say it out loud. Wrap any
   part the speaker should fill in themselves in square brackets, e.g. `My
   name is [your name] and I'm a resident of [neighborhood].` — those render
   as highlighted blanks on the page automatically. A blank line between
   sentences in the cell starts a new paragraph.
2. `jurisdiction: all` is a script every jurisdiction uses unless that
   jurisdiction has its own row for the same length, which wins instead —
   use it whenever the speaking notes don't need to differ by jurisdiction,
   and it'll also cover any jurisdiction added later (see "Adding a locale"
   in the README) without needing a new row.
3. One row per jurisdiction+length combination (6 total for full coverage
   today, more once another jurisdiction is added — but any subset works, or
   just `all` rows for all 3 lengths. A combination with no row and no
   matching `all` row just shows a "hasn't been written yet" placeholder
   instead of breaking anything). If two rows share a jurisdiction+length,
   the later row wins.
4. **File → Share → Publish to web**, choose that tab, and export as CSV.
   Copy the published URL.
5. Paste it into `config/locales.json` as `sheets.comments` (currently
   `null`).
6. Run `npm run comments` to confirm it fetches and writes
   `data/comments.json`. `content.yml` then keeps it current daily.

## Section-by-section

### Hero
One paragraph, and it should be written **last** — it summarizes the findings,
so it can't be written before they exist. Name the agencies, give the single
biggest number, and end on "residents were never told."

### Ticker
Five short findings, each one a phrase. The list is duplicated in the markup so
the scroll animation loops seamlessly — **keep both halves identical** or the
loop visibly jumps.

### Findings (stats)
Four numbers. The `source-note` beneath them is not optional: no number goes on
this page without a citation to the records response it came from.

### Portal vs records
**Delete this whole section if there is no gap.** It only earns its place if
the vendor's public transparency portal materially understates what the audit
logs show. Reproducing another campaign's framing without the local evidence
for it is the fastest way to lose an argument in a council chamber.

### Federal access
**Delete this section outright if the audit logs show no federal access.** An
empty table of agencies is worse than no table.

### Demands
The third demand (the ordinance ask) is written and does not need local data.
The other three do. The contract renewal date is the single most useful thing
to find — it is the deadline that makes the whole campaign urgent.

### Take Action (`act.html`)
The contact tool itself is working — live against real scraped data, no
content TODO there. Campaign message templates are edited in the Google
Sheet, not in this repo; see the README. What's still placeholder on this
page: the meeting schedules are `todo` spans, and both the events sheet and
the comments sheet aren't connected yet (see above for each).

### Flock 101 (`flock-101.html`)
Mostly written and locally-neutral. The "What that looks like in Mesa County"
section is the one that makes it local rather than a generic explainer.

### CORA Toolkit (`cora.html`)
The statutory framework and both request templates are real and usable now. The
outstanding item is the records custodian contact for each agency — verify each
one before publishing, since a request sent to the wrong inbox just disappears.

## Not carried over from the source design

Two things exist on deflocknc.com that this site does not have, both
deliberate:

- **The "we won" modal.** A dismissible popup announcing a contract
  termination, gated on a `localStorage` key. Worth building when there is a
  win to announce; a modal with placeholder text on every page load is not.
- **A jurisdiction-specific deep-dive section.** The source has one for the
  city whose contract was cancelled. The equivalent here would be whichever
  Mesa County agency the records turn out to implicate most.
