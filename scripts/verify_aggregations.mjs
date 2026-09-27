// Cross-checks the dashboard's JavaScript aggregations against the statistics
// computed independently by scripts/prepare_data.py (public/data/summary.json).
// Run with:  npm run verify
// Exits with status 1 on any mismatch.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { decodeRecords } from '../src/utils/decode.js';
import {
  applyFilters, createDefaultFilters, describeFilters, periodRangeForYear,
} from '../src/utils/filters.js';
import {
  computeKpis, countByYear, countByCategory, countByLocation, countByScholarshipStatus,
  scholarshipByCategory, amountHistogram, outlierImpact, countByPeriod,
} from '../src/utils/aggregations.js';
import { LOCATION_ORDER } from '../src/utils/constants.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (file) => JSON.parse(await readFile(path.join(root, 'public/data', file), 'utf8'));

const summary = await readJson('summary.json');
const records = decodeRecords(await readJson('opportunities.json'), summary.periods);
const periodCount = summary.periods.length;
const categoryOrder = summary.categories.map((c) => c.name);

let failures = 0;
function expectEqual(label, actual, expected, tolerance = 0.005) {
  const ok = typeof expected === 'number'
    ? actual !== null && Math.abs(actual - expected) <= tolerance
    : actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(48)} expected=${expected} actual=${actual}`);
}

// 1. Unfiltered totals match the Python summary
const all = applyFilters(records, createDefaultFilters(periodCount), periodCount);
const kpis = computeKpis(all);
expectEqual('record count', all.length, summary.source.rows);
expectEqual('offering scholarship', kpis.offering, summary.scholarshipStatus.offers);
expectEqual('median scholarship (offering)', kpis.medianScholarship, summary.scholarship.medianPositive);
expectEqual('likely test records', kpis.likelyTest, summary.likelyTestRecords.flaggedTotal);
expectEqual('free to join', kpis.free, summary.fee.status.free);
expectEqual('location recorded', kpis.locationRecorded, summary.source.rows - (summary.locations.find((l) => l.name === 'Not recorded')?.count || 0));

const impact = outlierImpact(all, summary.scholarship.extremeThresholdUsd);
expectEqual('mean of known amounts', impact.meanAll, summary.scholarship.meanKnown);
expectEqual('median of known amounts', impact.medianAll, summary.scholarship.medianKnown);
expectEqual('mean excluding extreme values', impact.meanWithoutExtreme, summary.scholarship.meanKnownExcludingExtreme);
expectEqual('max amount', impact.max, summary.scholarship.maxKnown);

// 2. Breakdowns match the reconciled source counts
for (const { name, count } of summary.categories) {
  expectEqual(`category ${name}`, countByCategory(all, categoryOrder).find((c) => c.category === name).count, count);
}
for (const { name, count } of summary.locations) {
  expectEqual(`location ${name}`, countByLocation(all, LOCATION_ORDER).find((l) => l.location === name).count, count);
}
for (const row of summary.reconciliation.filter((r) => r.metric.startsWith('created_'))) {
  const year = Number(row.metric.split('_')[1]);
  expectEqual(`created in ${year}`, countByYear(all, summary.periods).find((y) => y.year === year).count, row.computed);
}

// 3. Partition invariants: every breakdown sums to the filtered total
const partitions = [
  ['status partition', countByScholarshipStatus(all).reduce((s, r) => s + r.count, 0)],
  ['histogram covers offering records', amountHistogram(all).reduce((s, b) => s + b.count, 0), kpis.offering],
  ['category x scholarship sums', scholarshipByCategory(all, categoryOrder).reduce((s, r) => s + r.offers + r.zero + r.unknown, 0)],
  ['period counts + undated', countByPeriod(all, summary.periods).reduce((s, p) => s + p.count, 0) + summary.coverage.recordsWithoutDate],
];
for (const [label, actual, expected = all.length] of partitions) expectEqual(label, actual, expected);

// 4. Filters narrow consistently
const filters = { ...createDefaultFilters(periodCount), ...periodRangeForYear(summary.periods, 2024), category: 'Internship' };
const subset = applyFilters(records, filters, periodCount);
const manual = records.filter((r) => r.year === 2024 && r.category === 'Internship');
expectEqual('2024 Internship filter vs manual', subset.length, manual.length);
const noTest = applyFilters(records, { ...createDefaultFilters(periodCount), excludeLikelyTest: true }, periodCount);
expectEqual('exclude likely test records', noTest.length, summary.source.rows - summary.likelyTestRecords.flaggedTotal);
for (const { year, other } of summary.likelyTestRecords.byYear) {
  expectEqual(`created in ${year}, likely test excluded`, countByYear(noTest, summary.periods).find((y) => y.year === year).count, other);
}

// 5. The "Current selection" label describes the filters that are applied
expectEqual('selection label, defaults', describeFilters(createDefaultFilters(periodCount), summary.periods).join(' · '),
  'All creation periods · Likely test records included');
expectEqual('selection label, 2024 Internship', describeFilters(filters, summary.periods).join(' · '),
  'Periods Mar 2024 – Oct 2024 · Category: Internship · Likely test records included');

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
