// Filter state plus every filtered view the pages need, memoised so charts only
// recompute when filters change.
import { useCallback, useMemo, useState } from 'react';
import {
  ALL, applyFilters, countActiveFilters, createDefaultFilters, isFullPeriodRange, periodRangeForYear,
} from '../utils/filters.js';
import { computeKpis } from '../utils/aggregations.js';

export default function useDashboardModel(summary, records) {
  const periodCount = summary.periods.length;
  const [filters, setFilters] = useState(() => createDefaultFilters(periodCount));

  const update = useCallback((partial) => setFilters((prev) => ({ ...prev, ...partial })), []);
  const reset = useCallback(() => setFilters(createDefaultFilters(periodCount)), [periodCount]);

  // Clicking a selected value again clears it (toggle behaviour for cross-filtering).
  const toggle = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? ALL : value }));
  }, []);

  const selectPeriod = useCallback((index) => {
    setFilters((prev) => (prev.periodFrom === index && prev.periodTo === index
      ? { ...prev, periodFrom: 0, periodTo: periodCount - 1 }
      : { ...prev, periodFrom: index, periodTo: index }));
  }, [periodCount]);

  const selectYear = useCallback((year) => {
    const range = periodRangeForYear(summary.periods, year);
    if (!range) return;
    setFilters((prev) => (prev.periodFrom === range.periodFrom && prev.periodTo === range.periodTo
      ? { ...prev, periodFrom: 0, periodTo: periodCount - 1 }
      : { ...prev, ...range }));
  }, [summary.periods, periodCount]);

  const model = useMemo(() => {
    const filtered = applyFilters(records, filters, periodCount);
    const fullRange = isFullPeriodRange(filters, periodCount);
    // The year whose periods exactly match the selected range, if any.
    const years = [...new Set(summary.periods.map((p) => p.year))];
    const selectedYear = fullRange ? null : years.find((year) => {
      const range = periodRangeForYear(summary.periods, year);
      return range.periodFrom === filters.periodFrom && range.periodTo === filters.periodTo;
    }) ?? null;

    return {
      filtered,
      kpis: computeKpis(filtered),
      // Views that ignore their own dimension, so the selected bar stays in context.
      forPeriod: applyFilters(records, filters, periodCount, ['period']),
      forCategory: applyFilters(records, filters, periodCount, ['category']),
      forLocation: applyFilters(records, filters, periodCount, ['location']),
      forScholarship: applyFilters(records, filters, periodCount, ['scholarship']),
      // Cross-tab charts ignore both of their dimensions.
      forCategoryScholarship: applyFilters(records, filters, periodCount, ['category', 'scholarship']),
      forCategoryLocation: applyFilters(records, filters, periodCount, ['category', 'location']),
      isFullRange: fullRange,
      selectedYear,
      activeFilterCount: countActiveFilters(filters, periodCount),
    };
  }, [records, filters, periodCount, summary.periods]);

  return {
    filters, model, update, reset, toggle, selectPeriod, selectYear,
  };
}
