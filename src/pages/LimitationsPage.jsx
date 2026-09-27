// Explains which requested metrics the dataset supports, which it cannot, and
// every data-quality issue found. All figures come from summary.json.
import { formatInt, formatPct, formatUsd } from '../utils/format.js';

const METRIC_LABELS = {
  total_records: 'Total records',
  total_attributes: 'Total attributes (columns)',
  records_with_creation_date: 'Records with a creation date',
  records_with_location: 'Records with a delivery mode',
  records_with_scholarship_value: 'Records with a USD scholarship value',
  offering_scholarship: 'Records offering a scholarship',
  offering_scholarship_pct: 'Share offering a scholarship (%)',
  missing_location: 'Records missing delivery mode',
  missing_scholarship_value: 'Records missing USD scholarship value',
  scholarship_mean_usd: 'Mean scholarship (USD)',
  scholarship_median_usd: 'Median scholarship (USD)',
  scholarship_p25_usd: '25th percentile (USD)',
  scholarship_p75_usd: '75th percentile (USD)',
  scholarship_min_usd: 'Minimum (USD)',
  scholarship_max_usd: 'Maximum (USD)',
  duplicate_records: 'Duplicate records',
  weeks_duration_unit: 'Records with duration in weeks',
  created_2022: 'Created in 2022',
  created_2023: 'Created in 2023',
  created_2024: 'Created in 2024',
  created_2025: 'Created in 2025',
  created_2026: 'Created in 2026 (partial)',
  largest_creation_group_jul_2023: 'Largest creation group ("July 2023")',
};

function unavailableMetrics(summary) {
  const refs = summary.transactionReferenceCounts;
  return [
    {
      metric: 'Opportunities with the highest and lowest sign-ups',
      why: 'The file has one row per opportunity and no sign-up or application counts.',
      needed: 'Applicant ID, opportunity ID (the join key; already present), sign-up or application date, application status.',
    },
    {
      metric: 'Application trends over time',
      why: 'CREATED AT records when an opportunity was added, not when anyone applied. Using it as a proxy would misreport catalogue publishing as demand.',
      needed: 'One row per application with an application or sign-up timestamp.',
    },
    {
      metric: 'Applications by applicant location',
      why: 'LOCATION describes how an opportunity is delivered (Work From Home, Virtual). There is no applicant geography.',
      needed: 'Applicant country, and optionally region or city, linked to each application.',
    },
    {
      metric: 'Outreach-channel performance',
      why: 'No channel, source, campaign or funnel fields exist in the file.',
      needed: 'Channel or UTM source, campaign, impressions, clicks, sign-ups, applications and conversions per channel.',
    },
  ].map((item) => ({ ...item, refs }));
}

function qualityIssues(summary) {
  const total = summary.source.rows;
  const binning = summary.dateBinning;
  const test = summary.likelyTestRecords;
  const s = summary.scholarship;
  const missingLocation = summary.locations.find((l) => l.name === 'Not recorded')?.count || 0;
  const smallCats = summary.categories.filter((c) => c.smallSample);
  const conv = summary.currencyConversion;
  const [extreme1, extreme2] = summary.outliers;
  const largest = binning.largestPeriod;
  const largestSplit = test.byPeriod.find((p) => p.label === largest.label);
  const topOtherYear = [...test.byYear].sort((a, b) => b.other - a.other)[0];
  const mostTestPeriod = [...test.byPeriod].filter((p) => p.total >= 50)
    .sort((a, b) => b.likelyTestPct - a.likelyTestPct)[0];

  return [
    {
      issue: 'Most records look like automated test data',
      evidence: `${formatInt(test.flaggedTotal)} of ${formatInt(total)} records (${formatPct(test.pctOfTotal)}) match a name pattern: `
        + `${formatInt(test.automationWithTimestamp)} are named like “Internship Automation 1689922988424”, and `
        + `${formatInt(test.testWord)} contain a word starting with “test”. This is a lower bound: names like “abc” or lorem-ipsum text are not caught.`,
      handling: 'Flagged, not removed. The flag is a heuristic, not a confirmed classification. Use “Exclude likely test records” to compare. Confirm with the data owner before reporting either version as the real catalogue.',
    },
    {
      issue: 'Test records drive the creation trend',
      evidence: `Test-like records are concentrated in some periods: ${formatPct(largestSplit.likelyTestPct)} of the ${largest.label} period `
        + `and ${formatPct(mostTestPeriod.likelyTestPct)} of the ${mostTestPeriod.label} period. Excluding them, the ${largest.label} `
        + `period falls from ${formatInt(largestSplit.total)} to ${formatInt(largestSplit.other)} records, and ${topOtherYear.year} `
        + `becomes the year with the most records (${formatInt(topOtherYear.other)}). Year totals without test-like records: `
        + test.byYear.map((y) => `${y.year} ${formatInt(y.other)}`).join(', ') + '.',
      handling: 'Compare trends with the test-record filter on and off before drawing conclusions about publishing surges.',
    },
    {
      issue: 'Creation dates are grouped into periods',
      evidence: `Only ${binning.distinctCreatedDates} distinct dates, spaced ${Math.min(...binning.spacingDays)}–${Math.max(...binning.spacingDays)} days apart. `
        + `For ${formatInt(binning.recordsCompared)} records whose names embed a timestamp, ${formatPct(binning.matchNearestAnchorPct)} `
        + `have CREATED AT equal to the nearest of these dates (median offset ${binning.medianAbsOffsetDays} days).`,
      handling: `Trends are shown per period, not per month. The Week 2 “July 2023 spike” of ${formatInt(binning.largestPeriod.count)} is a roughly four-month period.`,
    },
    {
      issue: 'Missing delivery mode',
      evidence: `${formatInt(missingLocation)} records (${formatPct((missingLocation / total) * 100)}) have no LOCATION value.`,
      handling: 'Shown as “Not recorded” rather than dropped.',
    },
    {
      issue: 'Extreme scholarship values',
      evidence: `${formatInt(s.extremeCount)} values of ${formatUsd(s.extremeThresholdUsd, { compact: true })} or more: `
        + `${formatUsd(extreme1.amountUsd)} (${extreme1.category}, code ${extreme1.code}) and ${formatUsd(extreme2.amountUsd)} `
        + `(${extreme2.category}, code ${extreme2.code}, converted from ${formatInt(extreme2.rawAmount)} ${extreme2.rawCurrency}). `
        + `They lift the mean from ${formatUsd(s.meanKnownExcludingExtreme)} to ${formatUsd(s.meanKnown)}.`,
      handling: 'Kept in the data, listed for verification, and medians used instead of means.',
    },
    {
      issue: 'One amount dominates',
      evidence: `${formatInt(s.exactly120Count)} records (${formatPct((s.exactly120Count / total) * 100)}) have exactly $120, `
        + 'which makes the 25th percentile, median and 75th percentile all $120.',
      handling: 'Shown as its own bar in the distribution. It may be a platform default; confirm before treating it as a deliberate award.',
    },
    {
      issue: 'Ambiguous $0 and missing amounts',
      evidence: `${formatInt(summary.scholarshipStatus.zero)} records are $0 and ${formatInt(summary.scholarshipStatus.unknown)} have no USD amount. `
        + `${formatInt(summary.scholarshipUnknownDetail.rawAmountZeroButCurrencyMissing)} of the missing ones have a source amount of 0 but no currency.`,
      handling: 'Three separate statuses: offers, $0 recorded, amount unknown. None are merged.',
    },
    {
      issue: 'Currency conversion is undocumented',
      evidence: `USD amounts were converted in the cleaned file at about ${conv.EUR?.usdPerUnitApprox} USD per EUR `
        + `(${formatInt(conv.EUR?.records)} records) and ${conv.INR?.usdPerUnitApprox} USD per INR (${formatInt(conv.INR?.records)} records). `
        + 'The rate source and date are not recorded.',
      handling: 'Converted values used as provided.',
    },
    {
      issue: 'Fee amounts are unreliable',
      evidence: `fee_usd reaches ${formatUsd(summary.fee.maxFeeUsd, { compact: true })}.`,
      handling: 'Only the free versus paid split is shown; no fee amounts or averages.',
    },
    {
      issue: 'Very small categories',
      evidence: smallCats.map((c) => `${c.name} (${c.count})`).join(', ') + '.',
      handling: 'Marked as small samples in tooltips and shown in grey on rate charts.',
    },
    {
      issue: 'Undated and placeholder dates',
      evidence: `${summary.coverage.recordsWithoutDate} records have no creation date. LAST DATE TO APPLY includes `
        + `${summary.lastDateToApplyPlaceholders} value before 2000 (1970-01-01) and uses the same grouped dates.`,
      handling: 'Undated records appear only when the full period range is selected. LAST DATE TO APPLY is not used.',
    },
    {
      issue: 'Partial final year',
      evidence: `The last period is ${summary.coverage.lastPeriod}. 2026 is incomplete.`,
      handling: '2026 is marked with an asterisk and should not be compared as a full year.',
    },
    {
      issue: 'Personal data in the source',
      evidence: 'CURRENT EDITOR contains staff email addresses.',
      handling: 'Excluded from the dashboard data. The source spreadsheet is listed in .gitignore.',
    },
  ];
}

export default function LimitationsPage({ summary }) {
  const reconciliation = summary.reconciliation;
  const matched = reconciliation.filter((r) => r.match).length;
  const scan = summary.applicantFieldScan;
  const refs = summary.transactionReferenceCounts;

  return (
    <div className="grid">
      <section className="panel panel--wide availability" aria-label="Application and outreach metrics">
        <header className="panel__head">
          <h3 className="panel__title">Application and outreach metrics: data unavailable</h3>
          <p className="panel__measures">
            The internship brief asks for four applicant and outreach measures. The dataset describes opportunities,
            not applicants, so none of them can be calculated. No values are estimated or filled in.
          </p>
          <p className="panel__measures">
            A scan of all {summary.source.columns} column names for applicant, application, sign-up, location and channel
            keywords found {scan.matchingColumns.length ? scan.matchingColumns.join(', ') : 'no matching columns'}.
            NOT STARTED TRANSACTION ({refs['NOT STARTED TRANSACTION']} records) and DROPOUT TRANSACTION
            ({refs['DROPOUT TRANSACTION']} records) hold nested references to other records, not applicant rows.
          </p>
        </header>
        <div className="table-scroll">
          <table className="table table--text">
            <thead>
              <tr><th scope="col">Requested metric</th><th scope="col">Why it cannot be calculated</th>
                <th scope="col">Data required</th></tr>
            </thead>
            <tbody>
              {unavailableMetrics(summary).map((m) => (
                <tr key={m.metric}>
                  <th scope="row">{m.metric}<span className="tag">Data unavailable</span></th>
                  <td>{m.why}</td>
                  <td>{m.needed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--wide" aria-label="Data quality issues">
        <header className="panel__head">
          <h3 className="panel__title">Data-quality issues and how the dashboard handles them</h3>
        </header>
        <div className="table-scroll">
          <table className="table table--text">
            <thead>
              <tr><th scope="col">Issue</th><th scope="col">Evidence</th><th scope="col">Handling</th></tr>
            </thead>
            <tbody>
              {qualityIssues(summary).map((q) => (
                <tr key={q.issue}><th scope="row">{q.issue}</th><td>{q.evidence}</td><td>{q.handling}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--wide" aria-label="Reconciliation with Week 2 figures">
        <header className="panel__head">
          <h3 className="panel__title">Reconciliation with the Week 2 report</h3>
          <p className="panel__measures">
            {matched} of {reconciliation.length} figures reported in Week 2 are reproduced exactly from the attached
            spreadsheet by <code>scripts/prepare_data.py</code>. Notes mark figures that match but need different wording.
          </p>
        </header>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th scope="col">Metric</th><th scope="col" className="num">Week 2 reported</th>
                <th scope="col" className="num">Recomputed</th><th scope="col">Result</th><th scope="col">Note</th></tr>
            </thead>
            <tbody>
              {reconciliation.map((r) => (
                <tr key={r.metric}>
                  <th scope="row">{METRIC_LABELS[r.metric] || r.metric}</th>
                  <td className="num">{r.week2Reported.toLocaleString('en-US')}</td>
                  <td className="num">{r.computed === null ? '–' : r.computed.toLocaleString('en-US')}</td>
                  <td>{r.match ? 'Match' : <strong className="text-caution">Differs</strong>}</td>
                  <td className="muted">{r.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel--wide" aria-label="Column profile">
        <header className="panel__head">
          <h3 className="panel__title">Source columns</h3>
          <p className="panel__measures">
            All {summary.source.columns} columns in {summary.source.sheets.map((s) => `“${s.name}”`).join(', ')}, with
            completeness and whether the dashboard uses them.
          </p>
        </header>
        <details className="details">
          <summary>Show column profile</summary>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th scope="col">Column</th><th scope="col" className="num">Filled</th><th scope="col" className="num">Blank</th>
                  <th scope="col" className="num">Distinct</th><th scope="col">Used</th><th scope="col">Note</th></tr>
              </thead>
              <tbody>
                {summary.columnProfile.map((c) => (
                  <tr key={c.column}>
                    <th scope="row"><code>{c.column}</code></th>
                    <td className="num">{formatInt(c.nonNull)}</td>
                    <td className="num">{formatInt(c.nulls)}</td>
                    <td className="num">{formatInt(c.unique)}</td>
                    <td>{c.role === 'used' ? 'Yes' : 'No'}</td>
                    <td className="muted">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
