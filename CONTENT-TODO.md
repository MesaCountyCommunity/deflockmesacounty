# Content TODO

Every unwritten value on this site is wrapped in `<span class="todo">` (or
`class="todo"` on the element itself), which renders as gold highlighted text
with a dashed underline. A sticky yellow **Draft** banner sits under the nav on
every page.

**Nothing on this site has been fact-checked.** The structure is real; the
numbers are dashes.

## Launch checklist

Work top to bottom. The site should not go public until every box is ticked.

- [x] **Findings data (interim)** — the `#findings` stats and the ticker are
      filled from four records obtained by other requesters in 2025 (GJPD
      audit logs, GJPD's written answers, MCSO's ALPR/camera statement — see
      `corpus/records/analysis/README.md` in the research repo for method and
      caveats). **Still open:** these are someone else's records, not ours.
      File the five drafted requests linked from `cora.html`
      (`REQ-2026-001`–`005`) to get independently-verified, current numbers,
      and revisit these four stat cells once responses come back — the MCSO
      camera count especially is over a year stale.
- [ ] **Every `todo` span replaced** — `grep -rn 'class="todo"' *.html` must
      return nothing. Delete the whole wrapper element, not just the text.
- [ ] **Photos** — three `.photo-placeholder` divs in the Evidence section need
      real images. Drop JPGs in `assets/images/` and replace each placeholder
      div with `<img src="assets/images/NAME.jpg" alt="..." loading="lazy" />`.
- [ ] **Google Form** for the mailing list (see below).
- [ ] **Google Calendar** of local meetings — replace the `href="#"` on the
      "View The Calendar" button in the Meetings section.
- [ ] **Working group contact email** — two `data-todo` placeholders, one in
      the closing banner and one in each footer.
- [ ] **Public comment scripts** — six boxes (2 jurisdictions × 3 lengths) in
      the Comment section. Every combination must be filled; `site.js` hides all
      but the matching one, so a missing combination shows an empty section.
- [ ] **Remove the draft banner** — delete the `<div class="todo-banner">` from
      all three pages.
- [ ] **Remove `<meta name="robots" content="noindex, nofollow">`** from all
      three pages. This is the last step, and it is the one that makes the site
      public to search engines.
- [ ] **Delete the `.todo` and `.todo-banner` CSS rules** from
      `assets/css/styles.css` so nothing can silently reintroduce a placeholder.

## Setting up the mailing list form

The signup form posts directly to a Google Form, which is what lets a static
GitHub Pages site collect submissions with no backend. Until it is configured,
`site.js` blocks submission and shows an alert rather than faking success.

1. Create a Google Form with three short-answer questions: Name, Email, and
   "What part of the county?".
2. Open the live form, right-click → **View Page Source**.
3. Search the source for `entry.` — each question has an id like
   `entry.1646014132`. Note which id belongs to which question.
4. Get the form's POST URL: it is the form's `/viewform` URL with `/viewform`
   replaced by `/formResponse`.
5. In `index.html`, replace:
   - `FORM_ID_HERE` in the form's `action` with the real form id
   - `entry.NAME_ID`, `entry.EMAIL_ID`, `entry.AREA_ID` with the real ids
6. Submit the form once on the live site and confirm the row lands in the
   linked spreadsheet.

The `target="signup-sink"` hidden iframe is what keeps the visitor on the page
instead of bouncing them to Google's confirmation screen. Leave it in place.

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

### Take Action
Already working — this is the ported contact tool, live against real scraped
data. No content TODO here. Campaign message templates are edited in the Google
Sheet, not in this repo; see the README.

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
