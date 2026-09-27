// Aggregations used by KPI cards and charts. Pure functions over decoded records:
// { category, location, period, year, scholarship, amount, fee, archived, likelyTest }

import { AMOUNT_BINS, SCHOLARSHIP_STATUS_ORDER } from './constants.js';

/** Median with the same convention as pandas: mean of the two middle values. */
export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function share(part, whole) {
  return whole ? (part / whole) * 100 : null;
}

function countBy(records, key) {
  const counts = new Map();
  for (const record of records) {
    const value = record[key];
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

/** Positive USD amounts, i.e. records that offer a scholarship. */
export function positiveAmounts(records) {
  return records.filter((r) => r.scholarship === 'offers').map((r) => r.amount);
}

export function computeKpis(records) {
  const total = records.length;
  const offering = records.filter((r) => r.scholarship === 'offers').length;
  const knownFee = records.filter((r) => r.fee !== 'unknown');
  const free = knownFee.filter((r) => r.fee === 'free').length;
  const locationRecorded = records.filter((r) => r.location !== 'Not recorded').length;
  const categories = new Set(records.map((r) => r.category).filter((c) => c !== 'Uncategorized'));
  const uncategorized = records.filter((r) => r.category === 'Uncategorized').length;
  const likelyTest = records.filter((r) => r.likelyTest).length;

  return {
    total,
    offering,
    offeringPct: share(offering, total),
    medianScholarship: median(positiveAmounts(records)),
    categoryCount: categories.size,
    uncategorized,
    knownFeeCount: knownFee.length,
    free,
    freePct: share(free, knownFee.length),
    locationRecorded,
    locationRecordedPct: share(locationRecorded, total),
    likelyTest,
    likelyTestPct: share(likelyTest, total),
  };
}

/** Count of records per creation period, in period order. */
export function countByPeriod(records, periods) {
  const counts = new Array(periods.length).fill(0);
  for (const record of records) {
    if (record.period !== null) counts[record.period] += 1;
  }
  return periods.map((period, i) => ({ ...period, count: counts[i] }));
}

export function countByYear(records, periods) {
  const years = [...new Set(periods.map((p) => p.year))];
  const counts = countBy(records.filter((r) => r.year !== null), 'year');
  return years.map((year) => ({ year, count: counts.get(year) || 0 }));
}

/** Categories sorted by count (descending), keeping every known category. */
export function countByCategory(records, categoryOrder) {
  const counts = countBy(records, 'category');
  return categoryOrder
    .map((category) => ({ category, count: counts.get(category) || 0 }))
    .sort((a, b) => b.count - a.count);
}

export function countByLocation(records, locationOrder) {
  const counts = countBy(records, 'location');
  return locationOrder.map((location) => ({ location, count: counts.get(location) || 0 }));
}

export function countByScholarshipStatus(records) {
  const counts = countBy(records, 'scholarship');
  return SCHOLARSHIP_STATUS_ORDER.map((status) => ({ status, count: counts.get(status) || 0 }));
}

/**
 * Per-category scholarship breakdown: status counts, coverage rate
 * (offers / all records in the category), and median positive amount.
 */
export function scholarshipByCategory(records, categoryOrder) {
  const groups = new Map(categoryOrder.map((c) => [c, []]));
  for (const record of records) {
    if (!groups.has(record.category)) groups.set(record.category, []);
    groups.get(record.category).push(record);
  }
  const totalOffering = records.filter((r) => r.scholarship === 'offers').length;

  return [...groups.entries()]
    .map(([category, rows]) => {
      const offers = rows.filter((r) => r.scholarship === 'offers');
      const amounts = offers.map((r) => r.amount);
      return {
        category,
        total: rows.length,
        offers: offers.length,
        zero: rows.filter((r) => r.scholarship === 'zero').length,
        unknown: rows.filter((r) => r.scholarship === 'unknown').length,
        coverageRate: share(offers.length, rows.length),
        shareOfPool: share(offers.length, totalOffering),
        medianAmount: median(amounts),
        exactly120: amounts.filter((a) => a === 120).length,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Category x delivery-mode matrix for stacked bars. */
export function locationByCategory(records, categoryOrder, locationOrder) {
  const rows = categoryOrder.map((category) => {
    const inCategory = records.filter((r) => r.category === category);
    const counts = countBy(inCategory, 'location');
    return {
      category,
      total: inCategory.length,
      byLocation: Object.fromEntries(locationOrder.map((l) => [l, counts.get(l) || 0])),
    };
  });
  return rows.sort((a, b) => b.total - a.total);
}

/** Histogram of positive USD amounts using fixed bins, so outliers cannot distort the scale. */
export function amountHistogram(records) {
  const amounts = positiveAmounts(records);
  return AMOUNT_BINS.map((bin) => ({
    ...bin,
    count: amounts.filter((a) => a >= bin.min && a < bin.max).length,
  }));
}

/** Mean and median with and without values at or above the extreme threshold. */
export function outlierImpact(records, threshold) {
  const known = records.filter((r) => r.amount !== null).map((r) => r.amount);
  const withoutExtreme = known.filter((a) => a < threshold);
  const positive = known.filter((a) => a > 0);
  return {
    knownCount: known.length,
    extremeCount: known.length - withoutExtreme.length,
    meanAll: mean(known),
    medianAll: median(known),
    meanWithoutExtreme: mean(withoutExtreme),
    medianWithoutExtreme: median(withoutExtreme),
    medianPositive: median(positive),
    max: known.length ? Math.max(...known) : null,
    maxWithoutExtreme: withoutExtreme.length ? Math.max(...withoutExtreme) : null,
  };
}
