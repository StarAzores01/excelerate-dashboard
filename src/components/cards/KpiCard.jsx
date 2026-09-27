export default function KpiCard({ label, value, detail, tone }) {
  return (
    <div className={`kpi${tone ? ` kpi--${tone}` : ''}`}>
      <dt className="kpi__label">{label}</dt>
      <dd className="kpi__value">{value}</dd>
      {detail && <dd className="kpi__detail">{detail}</dd>}
    </div>
  );
}
