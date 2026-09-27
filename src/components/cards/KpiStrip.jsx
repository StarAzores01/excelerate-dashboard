// Headline figures for the current filter selection.
import KpiCard from './KpiCard.jsx';
import { formatInt, formatPct, formatUsd } from '../../utils/format.js';

export default function KpiStrip({ kpis, totalRecords }) {
  return (
    <dl className="kpi-strip" aria-label="Key figures for the current selection">
      <KpiCard
        label="Opportunities"
        value={formatInt(kpis.total)}
        detail={kpis.total === totalRecords ? 'All records in the dataset' : `of ${formatInt(totalRecords)} records`}
      />
      <KpiCard
        label="Offer a scholarship"
        value={formatPct(kpis.offeringPct)}
        detail={`${formatInt(kpis.offering)} records with a USD amount above $0`}
      />
      <KpiCard
        label="Median scholarship"
        value={formatUsd(kpis.medianScholarship)}
        detail={kpis.offering ? `Among ${formatInt(kpis.offering)} records offering one` : 'No records offer one'}
      />
      <KpiCard
        label="Categories"
        value={formatInt(kpis.categoryCount)}
        detail={kpis.uncategorized ? `Plus ${formatInt(kpis.uncategorized)} uncategorized records` : 'Distinct opportunity types'}
      />
      <KpiCard
        label="Free to join"
        value={formatPct(kpis.freePct)}
        detail={`${formatInt(kpis.free)} of ${formatInt(kpis.knownFeeCount)} records with a known fee`}
      />
      <KpiCard
        label="Delivery mode recorded"
        value={formatPct(kpis.locationRecordedPct)}
        detail={`${formatInt(kpis.total - kpis.locationRecorded)} records have no delivery mode`}
        tone={kpis.locationRecordedPct !== null && kpis.locationRecordedPct < 90 ? 'caution' : undefined}
      />
    </dl>
  );
}
