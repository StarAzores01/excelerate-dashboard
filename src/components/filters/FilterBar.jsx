// All dashboard filters. Values are limited to what exists in the dataset.
import { useId } from 'react';
import SelectField from './SelectField.jsx';
import { ALL, describeFilters } from '../../utils/filters.js';
import { LOCATION_ORDER, SCHOLARSHIP_STATUS, SCHOLARSHIP_STATUS_ORDER } from '../../utils/constants.js';
import { formatInt } from '../../utils/format.js';

export default function FilterBar({ filters, onChange, summary, filteredCount }) {
  const checkboxId = useId();
  const periodOptions = summary.periods.map((p) => ({ value: String(p.index), label: p.label }));
  const categoryOptions = [
    { value: ALL, label: 'All categories' },
    ...summary.categories.map((c) => ({ value: c.name, label: `${c.name} (${formatInt(c.count)})` })),
  ];
  const locationOptions = [
    { value: ALL, label: 'All delivery modes' },
    ...LOCATION_ORDER.map((l) => ({ value: l, label: l })),
  ];
  const scholarshipOptions = [
    { value: ALL, label: 'Any scholarship status' },
    ...SCHOLARSHIP_STATUS_ORDER.map((s) => ({ value: s, label: SCHOLARSHIP_STATUS[s].label })),
  ];
  const statusOptions = [
    { value: ALL, label: 'Active and archived' },
    { value: 'Active', label: 'Active only' },
    { value: 'Archived', label: 'Archived only' },
  ];

  // Keep the range valid: moving "from" past "to" (or vice versa) moves both.
  const setFrom = (value) => {
    const from = Number(value);
    onChange({ periodFrom: from, periodTo: Math.max(from, filters.periodTo) });
  };
  const setTo = (value) => {
    const to = Number(value);
    onChange({ periodTo: to, periodFrom: Math.min(to, filters.periodFrom) });
  };

  return (
    <section className="filters" aria-label="Filters">
      <div className="filters__grid">
        <fieldset className="field field--range">
          <legend className="field__label">Creation period</legend>
          <div className="field__pair">
            <SelectField label="From" value={String(filters.periodFrom)} options={periodOptions} onChange={setFrom} />
            <SelectField label="To" value={String(filters.periodTo)} options={periodOptions} onChange={setTo} />
          </div>
        </fieldset>
        <SelectField label="Category" value={filters.category} options={categoryOptions}
          onChange={(v) => onChange({ category: v })} />
        <SelectField label="Delivery mode" value={filters.location} options={locationOptions}
          onChange={(v) => onChange({ location: v })} />
        <SelectField label="Scholarship" value={filters.scholarship} options={scholarshipOptions}
          onChange={(v) => onChange({ scholarship: v })} />
        <SelectField label="Listing status" value={filters.status} options={statusOptions}
          onChange={(v) => onChange({ status: v })} />
      </div>
      <div className="filters__meta">
        <label className="check" htmlFor={checkboxId}>
          <input
            id={checkboxId}
            type="checkbox"
            checked={filters.excludeLikelyTest}
            onChange={(e) => onChange({ excludeLikelyTest: e.target.checked })}
          />
          Exclude likely test records ({formatInt(summary.likelyTestRecords.flaggedTotal)} flagged by a name-pattern heuristic)
        </label>
        <p className="filters__count" aria-live="polite">
          Showing <strong>{formatInt(filteredCount)}</strong> of {formatInt(summary.source.rows)} opportunity records.
          Click a bar or point in most charts to filter by it.
        </p>
      </div>
      <p className="filters__selection">
        <span className="filters__selection-label">Current selection:</span>{' '}
        {describeFilters(filters, summary.periods).join(' · ')}
      </p>
    </section>
  );
}
