# CORA / CCJRA reference

Content preserved from the standalone `cora.html` page (removed) for reuse
when this becomes an action tool — e.g. folded into `act.html`, or its own
form-generating tool like the contact tool. This is reference material, not
legal advice, and none of it is wired up to anything right now.

## Two laws, and the difference matters

Colorado splits public records across two statutes, and ALPR requests land
squarely on the seam between them. Getting this wrong is the most common
reason a request stalls.

### CORA — the Colorado Open Records Act

**C.R.S. § 24-72-201 et seq.** Covers general government records: contracts,
invoices, purchase orders, budget line items, council and commissioner
correspondence, staff reports. Its terms are strong:

- The custodian must respond within **three working days**, extendable by up
  to **seven more** only if they assert specific "extenuating circumstances."
- Disclosure is the rule. Denials must cite a specific statutory exemption.
- The **first hour** of research and retrieval is free, and the hourly rate
  above that is capped by statute (**$41.37/hour** as of the last
  adjustment — confirm the agency's posted current rate).

### CCJRA — the Criminal Justice Records Act

**C.R.S. § 24-72-301 et seq.** Covers records held by law enforcement —
police departments, sheriff's offices, DAs, CBI. Its terms are markedly
weaker, and this is the law a police department will invoke for ALPR audit
logs:

- **No fixed deadline.** The standard is a "reasonable time," which in
  practice means you should set your own deadline in the request and follow
  up in writing when it passes.
- **Disclosure is discretionary** for records outside the narrow "official
  action" category. A custodian may withhold on a finding that release would
  be contrary to the public interest — a much easier bar than CORA's
  specific exemptions.
- You may be asked to sign a statement that the records won't be used to
  solicit business for pecuniary gain.

> The practical upshot: send the contract-and-invoice questions as a CORA
> request to the city or county, and the audit-log questions as a CCJRA
> request to the law enforcement agency. Splitting them keeps a CCJRA denial
> from swallowing the parts that CORA plainly covers.

## Who to send it to

Not filled in yet. Each Mesa County agency needs its actual records custodian
contact before either template below can be sent — Grand Junction Police
Department, Mesa County Sheriff's Office, Fruita PD, Palisade PD, plus the
City of Grand Junction and Mesa County clerks for the contract side. Many
have a web portal rather than an email address; link it. Verify each one
before use, since a request to the wrong inbox just disappears.

## Request 1 — the contract (CORA, to the city or county)

This is the easy one and it establishes the paper trail: what was bought,
for how much, by whose signature, and when it renews.

```
To the Custodian of Records,

Under the Colorado Open Records Act, C.R.S. § 24-72-201 et seq., I request
copies of the following records:

1. All contracts, agreements, amendments, renewals, and terms of service
   between [AGENCY] and any provider of automated license plate reader
   (ALPR) technology, including but not limited to Flock Safety, from
   January 1, 2020 to the present.

2. All invoices, purchase orders, and payment records associated with
   those agreements.

3. Any written policy, procedure, general order, or use policy governing
   the operation of ALPR technology, access to ALPR data, retention
   periods, and data sharing with outside agencies.

4. Any staff report, memorandum, or presentation provided to the elected
   body regarding the acquisition or renewal of ALPR technology, and the
   minutes of any meeting at which it was discussed.

5. Any data sharing agreement, memorandum of understanding, or
   participation agreement with any other agency, fusion center, or
   private entity regarding ALPR data.

I request these records in electronic format. If any portion is withheld,
please cite the specific statutory exemption relied upon and produce the
remainder.

CORA requires a response within three working days. If you assert
extenuating circumstances under § 24-72-203(3)(b), please state them
specifically.

If fees will exceed $[YOUR LIMIT], please contact me before incurring
them. Please note that the first hour of research and retrieval is
provided at no charge under § 24-72-205(6)(a).

Sincerely,
[YOUR NAME]
[YOUR CONTACT INFORMATION]
```

## Request 2 — the audit logs (CCJRA, to the police agency)

This is the one that produces the numbers. The audit log is the system's own
record of every search: who ran it, when, from what agency, and —
critically — the stated reason.

```
To the Custodian of Criminal Justice Records,

Under the Colorado Criminal Justice Records Act, C.R.S. § 24-72-301 et
seq., I request the following records:

1. The complete network audit log / search audit report generated by
   [AGENCY]'s ALPR system for the period [START DATE] through [END DATE],
   including for each search: the date and time, the searching agency or
   organization, the searching user, the search reason or case number
   field, and the cameras or networks queried.

2. Any report showing which outside agencies and organizations have been
   granted access to [AGENCY]'s ALPR data, and the date access was
   granted.

3. Any record of an audit, review, or compliance check performed on ALPR
   system usage.

These are the system's own automatically generated administrative records
of agency activity. They are not investigative files, and producing them
does not require disclosing the contents of any investigation. To the
extent any individual entry is claimed to be exempt, I request the
remainder with that entry redacted rather than a categorical denial.

Please produce these in their native electronic format (CSV or
spreadsheet). Converting them to PDF makes them substantially less usable
and is not required.

Please respond within [YOUR DEADLINE — 10 working days is a reasonable
one to state] or advise when I can expect a response.

Sincerely,
[YOUR NAME]
[YOUR CONTACT INFORMATION]
```

## When they say no

- **"That's an investigative record."** An audit log of who searched the
  system is a record of agency activity, not the content of an
  investigation. Ask them to identify which specific entries they claim are
  investigative and to produce the rest.
- **"The vendor holds that data, not us."** A record held by a contractor on
  the agency's behalf, for the agency's business, is generally still the
  agency's record. Ask them to state that position in writing — it is also,
  on its own, a finding worth publishing.
- **"That would cost $[large number]."** Ask for the fee estimate in writing
  with the hours itemized, and narrow the date range rather than abandoning
  the request. Under CORA the rate is capped and the first hour is free.
- **Silence.** Follow up in writing, referencing the date of your original
  request. A written record of non-response is what any later escalation
  rests on.
- **The reason column is blank or stripped.** That is not a dead end, it is
  the story. Note it and ask specifically whether the field was empty in the
  source system or removed during the response.

## Where to get help

The [Colorado Freedom of Information Coalition](https://coloradofoic.org/)
maintains a guide to the state's open records and open meetings laws and
tracks changes to CORA. The
[Attorney General's CORA/CCJRA page](https://coag.gov/media-center/colorado-open-records-act-cora/)
is the state's own summary of the two statutes.

## Ideas for when this becomes an action tool

- A generator that fills `[AGENCY]`, `[YOUR NAME]`, date ranges, etc. from a
  form, the way the contact tool builds an email today.
- Once custodian contacts are gathered (see "Who to send it to" above),
  route the generated request straight to the right inbox per jurisdiction.
- A place for residents to report back what they got, so responses get
  pooled instead of scattered across individual requesters.
