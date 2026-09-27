// Filter state and record filtering. Pure functions: no React, safe to test in Node.

import { SCHOLARSHIP_STATUS } from './constants.js';

export const ALL = 'All';

export function createDefaultFilters(periodCount) {
  return {
    periodFrom: 0,
    periodTo: periodCount - 1,
    category: ALL,
    location: ALL,
    scholarship: ALL,
    status: ALL, // 'Active' | 'Archived'
    excludeLikelyTest: false,
  };
}

export function isFullPeriodRange(filters, periodCount) {
  return filters.periodFrom === 0 && filters.periodTo === periodCount - 1;
}

export function countActiveFilters(filters, periodCount) {
  let active = 0;
  if (!isFullPeriodRange(filters, periodCount)) active += 1;
  for (const key of ['category', 'location', 'scholarship', 'status']) {
    if (filters[key] !== ALL) active += 1;
  }
  if (filters.excludeLikelyTest) active += 1;
  return active;
}

/**
 * Returns the records matching the filters.
 *
 * `ignore` lists filter dimensions to skip. A chart that lets the user pick a
 * category ignores the category filter itself, so every bar stays visible and
 * the selected one is highlighted instead of the others disappearing.
 *
 * Records with no creation date (4 in the source) match only when the full
 * period range is selected, because they cannot be placed inside a narrower one.
 */
export function applyFilters(records, filters, periodCount, ignore = []) {
  const skip = new Set(ignore);
  const fullRange = isFullPeriodRange(filters, periodCount);

  return records.filter((record) => {
    if (!skip.has('period') && !fullRange) {
      if (record.period === null) return false;
      if (record.period < filters.periodFrom || record.period > filters.periodTo) return false;
    }
    if (!skip.has('category') && filters.category !== ALL && record.category !== filters.category) return false;
    if (!skip.has('location') && filters.location !== ALL && record.location !== filters.location) return false;
    if (!skip.has('scholarship') && filters.scholarship !== ALL && record.scholarship !== filters.scholarship) {
      return false;
    }
    if (!skip.has('status') && filters.status !== ALL) {
      if (filters.status === 'Archived' && !record.archived) return false;
      if (filters.status === 'Active' && record.archived) return false;
    }
    if (!skip.has('likelyTest') && filters.excludeLikelyTest && record.likelyTest) return false;
    return true;
  });
}

/**
 * Plain-language description of the current selection, e.g.
 * ['Periods Mar 2024 – Oct 2024', 'Category: Internship', 'Likely test records excluded'].
 * The period and test-record state are always included because they change every figure.
 */
export function describeFilters(filters, periods) {
  const parts = [];
  if (isFullPeriodRange(filters, periods.length)) {
    parts.push('All creation periods');
  } else {
    const from = periods[filters.periodFrom].label;
    const to = periods[filters.periodTo].label;
    parts.push(from === to ? `Period ${from}` : `Periods ${from} – ${to}`);
  }
  if (filters.category !== ALL) parts.push(`Category: ${filters.category}`);
  if (filters.location !== ALL) parts.push(`Delivery mode: ${filters.location}`);
  if (filters.scholarship !== ALL) parts.push(`Scholarship: ${SCHOLARSHIP_STATUS[filters.scholarship].label}`);
  if (filters.status !== ALL) parts.push(`${filters.status} listings only`);
  parts.push(filters.excludeLikelyTest ? 'Likely test records excluded' : 'Likely test records included');
  return parts;
}

/** Period index range covering one calendar year. */
export function periodRangeForYear(periods, year) {
  const indexes = periods.filter((p) => p.year === year).map((p) => p.index);
  if (indexes.length === 0) return null;
  return { periodFrom: Math.min(...indexes), periodTo: Math.max(...indexes) };
}
