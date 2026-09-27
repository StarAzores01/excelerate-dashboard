import { useState } from 'react';
import ChartPanel from '../components/charts/ChartPanel.jsx';
import CategoryMetricChart from '../components/charts/CategoryMetricChart.jsx';
import AmountDistributionChart from '../components/charts/AmountDistributionChart.jsx';
import SegmentedToggle from '../components/common/SegmentedToggle.jsx';
import { amountHistogram, outlierImpact, scholarshipByCategory } from '../utils/aggregations.js';
import { COLORS } from '../utils/constants.js';
import { formatInt, formatPct, formatUsd } from '../utils/format.js';

export default function ScholarshipPage({ summary, model, filters, actions }) {
  const [scale, setScale] = useState('log');
  const categoryOrder = summary.categories.map((c) => c.name);
  const threshold = summary.scholarship.extremeThresholdUsd;
  const small = summary.smallSampleThreshold;
  const selectCategory = (v) => actions.toggle('category', v);

  // Coverage needs every status, so these views ignore the scholarship filter.
  const byCategory = scholarshipByCategory(model.forCategoryScholarship, categoryOrder).filter((r) => r.total > 0);
  const smallNote = (row) => (row.total < small ? [`<em>Small sample (${row.total} records): interpret with caution.</em>`] : []);

  const coverageRows = [...byCategory]
    .sort((a, b) => b.coverageRate - a.coverageRate)
    .map((r) => ({
      category: r.category,
      value: r.coverageRate === null ? null : Number(r.coverageRate.toFixed(1)),
      muted: r.total < small,
      tooltip: [
        `${formatPct(r.coverageRate)} of ${formatInt(r.total)} records offer a scholarship`,
        `$0 recorded: ${formatInt(r.zero)}, amount unknown: ${formatInt(r.unknown)}`,
        ...smallNote(r),
      ],
    }));

  const poolRows = [...byCategory]
    .sort((a, b) => b.offers - a.offers)
    .map((r) => ({
      category: r.category,
      value: r.offers,
      tooltip: [
        `${formatInt(r.offers)} records offer a scholarship`,
        `${formatPct(r.shareOfPool)} of all scholarship-bearing records in this selection`,
        ...smallNote(r),
      ],
    }));

  const medianRows = byCategory
    .filter((r) => r.offers > 0)
    .map((r) => ({
      category: r.category,
      value: r.medianAmount,
      muted: r.offers < small,
      tooltip: [
        `Median ${formatUsd(r.medianAmount)} across ${formatInt(r.offers)} records offering one`,
        `${formatPct((r.exactly120 / r.offers) * 100)} of them are exactly $120`,
        ...smallNote({ total: r.offers }),
      ],
    }));

  const impact = outlierImpact(model.filtered, threshold);
  const bins = amountHistogram(model.filtered);
  const offeringCount = bins.reduce((s, b) => s + b.count, 0);
  const unknown = summary.scholarshipUnknownDetail;

  return (
    <div className="grid">
      <ChartPanel
        title="Scholarship coverage rate by category"
        measures="Percentage of each category's opportunity records that offer a scholarship (USD amount above $0)."
        caution={`Grey bars are categories with fewer than ${small} records.`}
        hint="Click a bar to filter by category."
        isEmpty={coverageRows.length === 0}
      >
        <CategoryMetricChart
          rows={coverageRows}
          formatValue={(v) => `${v.toFixed(1)}%`}
          axisFormat="{value}%"
          axisMax={100}
          selected={filters.category}
          onSelectCategory={selectCategory}
          ariaLabel="Bar chart of scholarship coverage rate by category."
        />
      </ChartPanel>

      <ChartPanel
        title="Scholarship-bearing opportunities by category"
        measures="Counts opportunity records that offer a scholarship in each category. Large categories dominate this view; compare with the coverage rate."
        hint="Click a bar to filter by category."
        isEmpty={poolRows.length === 0}
      >
        <CategoryMetricChart
          rows={poolRows}
          formatValue={(v) => formatInt(v)}
          integerAxis
          selected={filters.category}
          onSelectCategory={selectCategory}
          ariaLabel="Bar chart of scholarship-bearing opportunity counts by category."
        />
      </ChartPanel>

      <ChartPanel
        title="Median scholarship amount by category"
        measures="Median USD amount among records that offer a scholarship. Medians are used because a few extreme values distort averages."
        caution="Most categories share a $120 median because $120 is by far the most common value in the dataset."
        isEmpty={medianRows.length === 0}
        emptyMessage="No records in this selection offer a scholarship."
      >
        <CategoryMetricChart
          rows={medianRows}
          formatValue={(v) => formatUsd(v)}
          axisFormat="${value}"
          selected={filters.category}
          onSelectCategory={selectCategory}
          ariaLabel="Bar chart of median scholarship amount by category."
        />
      </ChartPanel>

      <ChartPanel
        title="Scholarship amount distribution"
        measures="Counts records offering a scholarship, grouped into USD amount ranges. Ranges keep the extreme values from flattening the chart."
        caution={offeringCount > 0 && bins[bins.length - 1].count > 0
          ? 'Amber marks values of $1M or more. They are listed below for verification.'
          : undefined}
        isEmpty={offeringCount === 0}
        emptyMessage="No records in this selection offer a scholarship."
        footer={(
          <SegmentedToggle
            label="Vertical scale"
            value={scale}
            onChange={setScale}
            options={[{ value: 'log', label: 'Log scale' }, { value: 'linear', label: 'Linear scale' }]}
          />
        )}
      >
        <AmountDistributionChart bins={bins} scale={scale} />
      </ChartPanel>

      <section className="panel panel--wide" aria-label="Effect of extreme values">
        <header className="panel__head">
          <h3 className="panel__title">How extreme values change the averages</h3>
          <p className="panel__measures">
            Statistics over records with a known USD amount (including $0) in the current selection, with and
            without values of {formatUsd(threshold, { compact: true })} or more.
          </p>
        </header>
        {impact.knownCount === 0 ? (
          <p className="panel__measures">No records with a known amount in this selection.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th scope="col">Statistic</th><th scope="col" className="num">All known values</th>
                  <th scope="col" className="num">Excluding {formatUsd(threshold, { compact: true })}+</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Records</th><td className="num">{formatInt(impact.knownCount)}</td>
                  <td className="num">{formatInt(impact.knownCount - impact.extremeCount)}</td></tr>
                <tr><th scope="row">Mean</th><td className="num">{formatUsd(impact.meanAll)}</td>
                  <td className="num">{formatUsd(impact.meanWithoutExtreme)}</td></tr>
                <tr><th scope="row">Median</th><td className="num">{formatUsd(impact.medianAll)}</td>
                  <td className="num">{formatUsd(impact.medianWithoutExtreme)}</td></tr>
                <tr><th scope="row">Maximum</th><td className="num">{formatUsd(impact.max)}</td>
                  <td className="num">{formatUsd(impact.maxWithoutExtreme)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel panel--wide" aria-label="Largest scholarship values">
        <header className="panel__head">
          <h3 className="panel__title">Largest scholarship values requiring verification</h3>
          <p className="panel__measures">
            The ten largest USD amounts in the full dataset (not affected by filters). These are listed for checking
            against the source system, not treated as errors. Look records up by opportunity code.
          </p>
        </header>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Code</th><th scope="col">Category</th><th scope="col" className="num">Amount (USD)</th>
                <th scope="col" className="num">Source amount</th><th scope="col">Period</th><th scope="col">Flags</th>
              </tr>
            </thead>
            <tbody>
              {summary.outliers.map((o) => (
                <tr key={o.code} className={o.extreme ? 'row--caution' : undefined}>
                  <td><code>{o.code}</code></td>
                  <td>{o.category}</td>
                  <td className="num">{formatUsd(o.amountUsd)}</td>
                  <td className="num">{formatInt(o.rawAmount)} {o.rawCurrency}</td>
                  <td>{o.period}</td>
                  <td>
                    {[o.extreme && 'Extreme value', o.archived && 'Archived', o.likelyTest && 'Test-like name']
                      .filter(Boolean).join(', ') || '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--wide" aria-label="Missing and zero values">
        <header className="panel__head">
          <h3 className="panel__title">How missing and zero amounts are treated</h3>
        </header>
        <dl className="definitions">
          <div>
            <dt style={{ color: COLORS.primary }}>Offers a scholarship ({formatInt(summary.scholarshipStatus.offers)})</dt>
            <dd>The cleaned USD amount is above $0.</dd>
          </div>
          <div>
            <dt>$0 recorded ({formatInt(summary.scholarshipStatus.zero)})</dt>
            <dd>The USD amount is exactly $0. The dataset does not say whether this means no scholarship, a
              placeholder, or incomplete entry, so it is kept separate from both other groups.</dd>
          </div>
          <div>
            <dt>Amount unknown ({formatInt(summary.scholarshipStatus.unknown)})</dt>
            <dd>
              No USD amount. {formatInt(unknown.rawAmountZeroButCurrencyMissing)} of these have a source amount of 0
              with no currency, {formatInt(unknown.rawAmountPositiveButCurrencyMissing)} have a positive source amount
              with no currency, and {formatInt(unknown.rawAmountMissing)} have no source amount. None are counted as $0.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
