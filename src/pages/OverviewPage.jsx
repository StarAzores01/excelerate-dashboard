import ChartPanel from '../components/charts/ChartPanel.jsx';
import TrendChart from '../components/charts/TrendChart.jsx';
import CategoryChart from '../components/charts/CategoryChart.jsx';
import LocationChart from '../components/charts/LocationChart.jsx';
import ScholarshipStatusChart from '../components/charts/ScholarshipStatusChart.jsx';
import {
  countByCategory, countByLocation, countByPeriod, countByScholarshipStatus,
} from '../utils/aggregations.js';
import { LOCATION_ORDER } from '../utils/constants.js';
import { describeFilters } from '../utils/filters.js';
import { formatInt, formatPct, formatUsd } from '../utils/format.js';

/** Plain-language readings computed from the current selection. */
function buildHighlights(summary, model) {
  const { filtered, kpis } = model;
  if (filtered.length === 0) return [];
  const categoryOrder = summary.categories.map((c) => c.name);
  const topCategory = countByCategory(filtered, categoryOrder)[0];
  const periods = countByPeriod(filtered, summary.periods);
  const topPeriod = periods.reduce((best, p) => (p.count > best.count ? p : best), periods[0]);
  const locations = countByLocation(filtered, LOCATION_ORDER);
  const remote = locations.filter((l) => l.location === 'Work From Home' || l.location === 'Virtual')
    .reduce((s, l) => s + l.count, 0);

  const items = [
    `${topCategory.category} is the largest category with ${formatInt(topCategory.count)} records `
      + `(${formatPct((topCategory.count / filtered.length) * 100)} of this selection).`,
  ];
  if (topPeriod.count > 0) {
    items.push(`The busiest creation period is the one recorded as ${topPeriod.label}, with `
      + `${formatInt(topPeriod.count)} records. Each period spans roughly four months.`);
  }
  if (kpis.locationRecorded > 0) {
    items.push(`${formatPct((remote / kpis.locationRecorded) * 100)} of records with a recorded delivery mode are `
      + 'Work From Home or Virtual.');
  }
  if (kpis.offering > 0) {
    items.push(`${formatPct(kpis.offeringPct)} offer a scholarship, with a median of ${formatUsd(kpis.medianScholarship)}.`);
  }
  return items;
}

export default function OverviewPage({ summary, model, filters, actions }) {
  const categoryOrder = summary.categories.map((c) => c.name);
  const isEmpty = model.filtered.length === 0;
  const highlights = buildHighlights(summary, model);

  return (
    <div className="grid">
      <ChartPanel
        wide
        title="Opportunities created per period"
        measures="Counts opportunity records by their recorded creation date. This is catalogue publishing activity, not applicant sign-ups."
        caution="Creation dates in the source are grouped into 13 periods about four months apart. The last period may be incomplete."
        hint="Click anywhere above a period to show only that period. Click it again to clear."
        isEmpty={model.forPeriod.length === 0}
      >
        <TrendChart
          periodCounts={countByPeriod(model.forPeriod, summary.periods)}
          periodFrom={filters.periodFrom}
          periodTo={filters.periodTo}
          isFullRange={model.isFullRange}
          onSelectPeriod={actions.selectPeriod}
          height={300}
        />
      </ChartPanel>

      <ChartPanel
        title="Opportunities by category"
        measures="Counts opportunity records per category."
        hint="Click a bar to filter by category."
        isEmpty={model.forCategory.length === 0}
      >
        <CategoryChart
          categoryCounts={countByCategory(model.forCategory, categoryOrder)}
          selected={filters.category}
          onSelect={(v) => actions.toggle('category', v)}
          smallSampleThreshold={summary.smallSampleThreshold}
        />
      </ChartPanel>

      <div className="stack">
        <ChartPanel
          title="Delivery mode"
          measures="Counts opportunity records by the LOCATION field, which describes how an opportunity is delivered. It is not applicant location."
          hint="Click a bar to filter by delivery mode."
          isEmpty={model.forLocation.length === 0}
        >
          <LocationChart
            locationCounts={countByLocation(model.forLocation, LOCATION_ORDER)}
            selected={filters.location}
            onSelect={(v) => actions.toggle('location', v)}
            height={220}
          />
        </ChartPanel>
        <ChartPanel
          title="Scholarship status"
          measures="Share of opportunity records that offer a scholarship, record $0, or have no usable USD amount."
          hint="Click a slice to filter by scholarship status."
          isEmpty={model.forScholarship.length === 0}
        >
          <ScholarshipStatusChart
            statusCounts={countByScholarshipStatus(model.forScholarship)}
            selected={filters.scholarship}
            onSelect={(v) => actions.toggle('scholarship', v)}
            height={200}
          />
        </ChartPanel>
      </div>

      <section className="panel panel--wide readings" aria-label="Highlights for this selection">
        <h3 className="panel__title">Highlights for this selection</h3>
        <p className="panel__measures">Selection: {describeFilters(filters, summary.periods).join(' · ')}.</p>
        {isEmpty ? (
          <p className="panel__measures">No records match the current filters.</p>
        ) : (
          <ul className="readings__list">
            {highlights.map((text) => <li key={text}>{text}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
