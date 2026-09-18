# Content TODO

A running list of what's placeholder, incomplete, or otherwise unfinished on
the site — not a pre-launch gate, just a place to track open work as the
content comes together. Update it as items get resolved or new ones show up.

## Open items

- [ ] **Meeting schedules on `act.html`.** Grand Junction City Council's
      cadence is already known — the `faqs` sheet has it ("1st and 3rd
      Wednesday of each month at 5:30 p.m., City Hall Auditorium") — but it
      isn't reflected in the Meetings section's `meeting-item-schedule` div,
      which currently only links to the FAQ page. The Mesa County Board of
      Commissioners' schedule is still completely missing (empty
      `meeting-item-schedule` div) and needs the actual day/time/cadence.
- [ ] **Public comment sheet has no rows yet.** The sheet is connected
      (`config/locales.json` → `sheets.comments`) and `fetch-comments.js`
      runs cleanly, but `data/comments.json` currently resolves to an empty
      list — nobody's written a script in the sheet yet. Until at least one
      row exists, every jurisdiction × length combination on `act.html` shows
      the "hasn't been written yet" placeholder.
- [ ] **FAQs are thin outside Grand Junction.** Grand Junction has one FAQ
      (meeting cadence); Fruita, Palisade, and Mesa County have none yet.
      Templates currently has one generic entry that every locale shares via
      `locale: all` — fine as a starting point, but worth revisiting once
      there's reason to say something different per jurisdiction.
- [ ] **Numbers embedded directly in `index.html` and `flock-101.html`
      copy need sourcing**, now that there's no separate Findings/stats
      section to hold citations: the ~30 camera / 9 Flock / 11 Flock / 15
      Motorola counts on `index.html`, and on `flock-101.html` the "PTZ
      cameras have been seen in Lincoln Park," the California town's 71%
      misread figure, and the Atlanta ~28,000 / ~5,000 Flock camera figures.
      Nothing here has been fact-checked; each of these needs a citation to
      the source it came from before this goes live.
- [ ] **Photos.** There's currently no image content anywhere on the site
      (the old `.photo-placeholder` Evidence section doesn't exist in the
      current design) — add some if the campaign wants any.
- [ ] **`.todo` CSS rule** (`assets/css/styles.css`) exists so a placeholder
      can't slip through unnoticed — leave it in place until the items above
      are cleared, then delete it so nothing can silently reintroduce a
      placeholder.
- [ ] **Resources page** Add a resources page similar to what
      is currently located at https://defockauburnca.com/resources.html

## Future: a CORA/CCJRA action tool

`cora.html` has been removed as a standalone page. Its content — the
CORA-vs-CCJRA framing, both request templates, the "when they say no" list,
and the resource links — is preserved in
[CORA-CCJRA-REFERENCE.md](CORA-CCJRA-REFERENCE.md) for whenever this becomes
an actual action tool (folded into `act.html`, or its own generator like the
contact tool). That file also carries forward the one substantive gap the
old page never closed: records custodian contacts for each Mesa County
agency (GJPD, Mesa County Sheriff's Office, Fruita PD, Palisade PD, plus the
city/county clerks for the contract side) — gather and verify those before
this content goes live anywhere.

