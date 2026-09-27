// Stacked horizontal bars: delivery mode within each category.
import EChart from './EChart.jsx';
import { axisLabel, baseOption, escapeHtml, splitLine } from './chartTheme.js';
import { COLORS, LOCATION_COLORS, LOCATION_ORDER } from '../../utils/constants.js';
import { formatInt, formatPct } from '../../utils/format.js';

export default function LocationByCategoryChart({ rows, onSelectCategory }) {
  const ordered = [...rows].filter((r) => r.total > 0).reverse();
  const option = baseOption({
    grid: { left: 8, right: 24, top: 40, bottom: 24, containLabel: true },
    legend: { top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, textStyle: { color: COLORS.ink } },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (points) => {
        const row = ordered[points[0].dataIndex];
        const lines = LOCATION_ORDER.map((l) => `${l}: ${formatInt(row.byLocation[l])} (${formatPct((row.byLocation[l] / row.total) * 100)})`);
        return `<strong>${escapeHtml(row.category)}</strong> (${formatInt(row.total)} records)<br/>${lines.join('<br/>')}`;
      },
    },
    xAxis: { type: 'value', max: 100, axisLabel: { ...axisLabel, formatter: '{value}%' }, splitLine },
    yAxis: {
      type: 'category', data: ordered.map((r) => r.category),
      axisLabel: { ...axisLabel, color: COLORS.ink }, axisTick: { show: false }, axisLine: { show: false },
    },
    series: LOCATION_ORDER.map((location) => ({
      name: location,
      type: 'bar',
      stack: 'location',
      barMaxWidth: 22,
      itemStyle: { color: LOCATION_COLORS[location] },
      data: ordered.map((r) => Number(((r.byLocation[location] / r.total) * 100).toFixed(2))),
    })),
  });
  return (
    <EChart
      option={option}
      height={Math.max(260, ordered.length * 30 + 70)}
      ariaLabel="Stacked percentage bar chart of delivery mode by opportunity category."
      onClick={(p) => onSelectCategory(ordered[p.dataIndex].category)}
    />
  );
}
