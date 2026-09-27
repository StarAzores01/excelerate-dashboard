// Converts the compact JSON produced by scripts/prepare_data.py into readable records.
// Field meanings are documented in public/data/opportunities.json under "fields".

export function decodeRecords(opportunitiesJson, periods) {
  return opportunitiesJson.records.map((row) => ({
    category: row.c,
    location: row.l,
    period: row.p,
    year: row.p === null ? null : periods[row.p].year,
    scholarship: row.s,
    amount: row.a,
    fee: row.f,
    archived: row.ar === 1,
    likelyTest: row.t === 1,
  }));
}
