// Sheets people naturally write friendly column headers ("DATE", "FEATURED
// (yes to pin)") rather than the exact lowercase field names a schema uses.
// Returns a function that matches each raw header to a known field
// case-insensitively, allowing trailing text ("(yes to pin)"), so those
// columns still map to their canonical field names. An unrecognized header
// (a genuine typo) is just dropped, which required-field validation then
// reports as a missing-field row rather than a silent misread.
export function makeRowNormalizer(fields) {
  return function normalizeRow(raw) {
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
      const norm = key.trim().toLowerCase();
      const field = fields.find((f) => norm === f || norm.startsWith(`${f} `) || norm.startsWith(`${f}(`));
      if (field) out[field] = value;
    }
    return out;
  };
}
