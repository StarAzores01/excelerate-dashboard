// Stacked horizontal bars: scholarship status within each category.
// "Share" mode normalises each bar to 100% so small and large categories compare fairly.
import EChart from './EChart.jsx';
import { axisLabel, baseOption, escapeHtml, splitLine } from './chartTheme.js';
import { COLORS, SCHOLARSHIP_STATUS, SCHOLARSHIP_STATUS_ORDER } from '../../utils/constants.js';
import { formatInt, formatPct } from '../../utils/format.js';

export default function CategoryScholarshipChart({ rows, mode = 'count', onSelectCategory, smallSampleThreshold }) {
  const ordered = [...rows].filter((r) => r.total > 0).reverse();
  const asShare = mode === 'share';

  const option = baseOption({
    grid: { left: 8, right: 24, top: 40, bottom: 24, containLabel: true },
    legend: { top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, textStyle: { color: COLORS.ink } },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (points) => {
        const row = ordered[points[0].dataIndex];
        const small = row.total < smallSampleThreshold ? '<br/><em>Small sample: interpret with caution.</em>' : '';
        const lines = SCHOLARSHIP_STATUS_ORDER.map((s) => `${SCHOLARSHIP_STATUS[s].label}: ${formatInt(row[s])} `
          + `(${formatPct((row[s] / row.total) * 100)})`);
        return `<strong>${escapeHtml(row.category)}</strong> (${formatInt(row.total)} records)<br/>${lines.join('<br/>')}${small}`;
      },
    },
    xAxis: {
      type: 'value', max: asShare ? 100 : undefined, minInterval: asShare ? undefined : 1,
      axisLabel: { ...axisLabel, formatter: asShare ? '{value}%' : '{value}' }, splitLine,
    },
    yAxis: {
      type: 'category', data: ordered.map((r) => r.category),
      axisLabel: { ...axisLabel, color: COLORS.ink }, axisTick: { show: false }, axisLine: { show: false },
    },
    series: SCHOLARSHIP_STATUS_ORDER.map((status) => ({
      name: SCHOLARSHIP_STATUS[status].label,
      type: 'bar',
      stack: 'status',
      barMaxWidth: 22,
      itemStyle: { color: SCHOLARSHIP_STATUS[status].color },
      data: ordered.map((r) => (asShare ? Number(((r[status] / r.total) * 100).toFixed(2)) : r[status])),
    })),
  });

  return (
    <EChart
      option={option}
      height={Math.max(260, ordered.length * 30 + 70)}
      ariaLabel="Stacked bar chart of scholarship status by opportunity category."
      onClick={(p) => onSelectCategory(ordered[p.dataIndex].category)}
    />
  );
}
