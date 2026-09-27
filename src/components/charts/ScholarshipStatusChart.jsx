// Donut: offers / $0 recorded / amount unknown. Click a slice to filter.
import EChart from './EChart.jsx';
import { baseOption } from './chartTheme.js';
import { COLORS, SCHOLARSHIP_STATUS } from '../../utils/constants.js';
import { formatInt, formatPct } from '../../utils/format.js';

export default function ScholarshipStatusChart({ statusCounts, selected, onSelect, height = 260 }) {
  const total = statusCounts.reduce((s, r) => s + r.count, 0);
  const anySelected = selected !== 'All';
  const option = baseOption({
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'item',
      formatter: (p) => {
        const row = statusCounts[p.dataIndex];
        return `<strong>${SCHOLARSHIP_STATUS[row.status].label}</strong><br/>${formatInt(row.count)} records`
          + `<br/>${formatPct(total ? (row.count / total) * 100 : 0)} of current selection`;
      },
    },
    legend: {
      orient: 'vertical', right: 0, top: 'middle', icon: 'circle', itemGap: 12,
      textStyle: { color: COLORS.ink, fontSize: 12 },
      formatter: (name) => {
        const row = statusCounts.find((r) => SCHOLARSHIP_STATUS[r.status].label === name);
        return `${name}  ${formatPct(total ? (row.count / total) * 100 : 0)}`;
      },
    },
    series: [{
      type: 'pie',
      radius: ['52%', '78%'],
      center: ['30%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: statusCounts.map((r) => ({
        name: SCHOLARSHIP_STATUS[r.status].label,
        value: r.count,
        itemStyle: {
          color: SCHOLARSHIP_STATUS[r.status].color,
          opacity: anySelected && selected !== r.status ? 0.3 : 1,
        },
      })),
    }],
  });
  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={`Donut chart of scholarship status: ${statusCounts.map((r) => `${SCHOLARSHIP_STATUS[r.status].label} ${r.count}`).join(', ')}.`}
      onClick={(p) => onSelect(statusCounts[p.dataIndex].status)}
    />
  );
}
