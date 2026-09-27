import { formatDate, formatInt } from '../../utils/format.js';

export default function Header({ summary }) {
  return (
    <header className="masthead">
      <div className="masthead__inner">
        <h1 className="masthead__title">Excelerate Opportunity Analytics</h1>
        <p className="masthead__subtitle">
          What Excelerate’s opportunity catalogue contains: {formatInt(summary.source.rows)} opportunity records
          by category, delivery mode, creation period and scholarship.
        </p>
        <p className="masthead__coverage">
          Data covers creation periods from {formatDate(summary.coverage.firstPeriod)} to{' '}
          {formatDate(summary.coverage.lastPeriod)}. Source: {summary.source.file}.
        </p>
      </div>
    </header>
  );
}
