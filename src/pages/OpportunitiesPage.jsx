import { useState } from 'react';
import ChartPanel from '../components/charts/ChartPanel.jsx';
import TrendChart from '../components/charts/TrendChart.jsx';
import AnnualChart from '../components/charts/AnnualChart.jsx';
import CategoryChart from '../components/charts/CategoryChart.jsx';
import LocationChart from '../components/charts/LocationChart.jsx';
import CategoryScholarshipChart from '../components/charts/CategoryScholarshipChart.jsx';
import LocationByCategoryChart from '../components/charts/LocationByCategoryChart.jsx';
import SegmentedToggle from '../components/common/SegmentedToggle.jsx';
import {
  countByCategory, countByLocation, countByPeriod, countByYear, locationByCategory, scholarshipByCategory,
} from '../utils/aggregations.js';
import { LOCATION_ORDER } from '../utils/constants.js';

export default function OpportunitiesPage({ summary, model, filters, actions }) {
  const [scholarshipMode, setScholarshipMode] = useState('share');
  const categoryOrder = summary.categories.map((c) => c.name);
  const lastYear = summary.periods[summary.periods.length - 1].year;
  const selectCategory = (v) => actions.toggle('category', v);

  return (
    <div className="grid">
      <ChartPanel
        wide
        title="Opportunity creation trend"
        measures="Counts opportunity records per recorded creation period. It shows when opportunities were added to the catalogue, not when anyone applied."
        caution="Each point represents about four months. Source dates were grouped into 13 periods, so month-level spikes cannot be identified."
        hint="Click anywhere above a period to show only that period. Click it again to clear."
        isEmpty={model.forPeriod.length === 0}
      >
        <TrendChart
          periodCounts={countByPeriod(model.forPeriod, summary.periods)}
          periodFrom={filters.periodFrom}
          periodTo={filters.periodTo}
          isFullRange={model.isFullRange}
          onSelectPeriod={actions.selectPeriod}
          height={320}
        />
      </ChartPanel>

      <ChartPanel
        title="Opportunities created per year"
        measures="Counts opportunity records by the year of their recorded creation date."
        caution={`* ${lastYear} is a partial year. Records near a year boundary may be assigned to the neighbouring year because dates were grouped.`}
        hint="Click a bar to show only that year."
        isEmpty={model.forPeriod.length === 0}
      >
        <AnnualChart
          yearCounts={countByYear(model.forPeriod, summary.periods)}
          selectedYear={model.selectedYear}
          partialYear={lastYear}
          onSelectYear={actions.selectYear}
        />
      </ChartPanel>

      <ChartPanel
        title="Opportunities by delivery mode"
        measures="Counts opportunity records by delivery mode (the LOCATION field). Not applicant location."
        hint="Click a bar to filter by delivery mode."
        isEmpty={model.forLocation.length === 0}
      >
        <LocationChart
          locationCounts={countByLocation(model.forLocation, LOCATION_ORDER)}
          selected={filters.location}
          onSelect={(v) => actions.toggle('location', v)}
          height={300}
        />
      </ChartPanel>

      <ChartPanel
        title="Opportunities by category"
        measures="Counts opportunity records per category, largest first."
        hint="Click a bar to filter by category."
        isEmpty={model.forCategory.length === 0}
      >
        <CategoryChart
          categoryCounts={countByCategory(model.forCategory, categoryOrder)}
          selected={filters.category}
          onSelect={selectCategory}
          smallSampleThreshold={summary.smallSampleThreshold}
        />
      </ChartPanel>

      <ChartPanel
        title="Scholarship availability within each category"
        measures="Splits each category's opportunity records by scholarship status."
        hint="Share view compares categories of different sizes. Click a bar to filter by category."
        isEmpty={model.forCategoryScholarship.length === 0}
        footer={(
          <SegmentedToggle
            label="Chart values"
            value={scholarshipMode}
            onChange={setScholarshipMode}
            options={[{ value: 'share', label: 'Share' }, { value: 'count', label: 'Count' }]}
          />
        )}
      >
        <CategoryScholarshipChart
          rows={scholarshipByCategory(model.forCategoryScholarship, categoryOrder)}
          mode={scholarshipMode}
          onSelectCategory={selectCategory}
          smallSampleThreshold={summary.smallSampleThreshold}
        />
      </ChartPanel>

      <ChartPanel
        wide
        title="Delivery mode within each category"
        measures="Share of each category's opportunity records by delivery mode, including records with no mode recorded."
        hint="Click a bar to filter by category."
        isEmpty={model.forCategoryLocation.length === 0}
      >
        <LocationByCategoryChart
          rows={locationByCategory(model.forCategoryLocation, categoryOrder, LOCATION_ORDER)}
          onSelectCategory={selectCategory}
        />
      </ChartPanel>
    </div>
  );
}
