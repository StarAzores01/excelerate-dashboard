// Opportunity delivery mode (the LOCATION field). This describes how an
// opportunity is delivered, not where applicants are.
import EChart from './EChart.jsx';
import { axisLabel, baseOption, escapeHtml, highlightColor, splitLine } from './chartTheme.js';
import { COLORS, LOCATION_COLORS } from '../../utils/constants.js';
import { formatInt, formatPct } from '../../utils/format.js';

export default function LocationChart({ locationCounts, selected, onSelect, height = 260 }) {
  const total = locationCounts.reduce((s, l) => s + l.count, 0);
  const recorded = locationCounts.filter((l) => l.location !== 'Not recorded').reduce((s, l) => s + l.count, 0);
  const rows = [...locationCounts].reverse();
  const anySelected = selected !== 'All';

  const option = baseOption({
    grid: { left: 8, right: 64, top: 8, bottom: 24, containLabel: true },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'item',
      formatter: (p) => {
        const row = rows[p.dataIndex];
        const ofRecorded = row.location === 'Not recorded'
          ? 'No delivery mode recorded'
          : `${formatPct(recorded ? (row.count / recorded) * 100 : 0)} of records with a recorded mode`;
        return `<strong>${escapeHtml(row.location)}</strong><br/>${formatInt(row.count)} opportunity records`
          + `<br/>${formatPct(total ? (row.count / total) * 100 : 0)} of current selection<br/>${ofRecorded}`;
      },
    },
    xAxis: { type: 'value', minInterval: 1, axisLabel, splitLine },
    yAxis: {
      type: 'category', data: rows.map((r) => r.location),
      axisLabel: { ...axisLabel, color: COLORS.ink }, axisTick: { show: false }, axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 26,
      data: rows.map((r) => ({
        value: r.count,
        itemStyle: {
          color: highlightColor(r.location === selected, anySelected, LOCATION_COLORS[r.location]),
          borderRadius: [0, 3, 3, 0],
        },
      })),
      label: { show: true, position: 'right', color: COLORS.ink, formatter: (p) => formatInt(p.value) },
    }],
  });

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={`Bar chart of opportunities by delivery mode: ${locationCounts.map((l) => `${l.location} ${l.count}`).join(', ')}.`}
      onClick={(p) => onSelect(rows[p.dataIndex].location)}
    />
  );
}
