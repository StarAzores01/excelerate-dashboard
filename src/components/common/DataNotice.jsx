// Standing caution shown on analytical pages: what the data can and cannot say.
import { formatInt, formatPct } from '../../utils/format.js';

export default function DataNotice({ summary, kpis, excludeLikelyTest }) {
  const test = summary.likelyTestRecords;
  return (
    <aside className="notice" aria-label="How to read this data">
      <div className="notice__text">
        <p>
          <strong>Opportunity catalogue data, not applicant activity.</strong> Every chart counts opportunity
          records. Creation dates were grouped into 13 periods about four months apart, so trends are shown per
          period rather than per month. Applicant sign-ups, application trends, applicant location and
          outreach-channel performance are <strong>Data unavailable</strong>: the dataset has no applicant or channel
          fields, so no values are shown or estimated.
        </p>
        <p>
          {excludeLikelyTest ? (
            <>Likely test records are excluded. {formatInt(test.flaggedTotal)} records ({formatPct(test.pctOfTotal)} of
              the dataset) matched the name pattern.</>
          ) : (
            <>{formatInt(kpis.likelyTest)} records in the current view ({formatPct(kpis.likelyTestPct)}) have names that
              match automated-test patterns, such as “Internship Automation” followed by a timestamp. Use the
              “Exclude likely test records” filter to compare.</>
          )}{' '}
          The flag is a name-pattern heuristic, not a confirmed classification: it can miss test records and has not
          been checked against the source system.{' '}
          <a href="#limitations">See data limitations</a>.
        </p>
      </div>
    </aside>
  );
}
