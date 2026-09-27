// Horizontal bar: opportunity records per category, largest first.
import EChart from './EChart.jsx';
import { axisLabel, baseOption, escapeHtml, highlightColor, splitLine } from './chartTheme.js';
import { COLORS } from '../../utils/constants.js';
import { formatInt, formatPct } from '../../utils/format.js';

export default function CategoryChart({ categoryCounts, selected, onSelect, smallSampleThreshold, height }) {
  const total = categoryCounts.reduce((sum, c) => sum + c.count, 0);
  const rows = [...categoryCounts].reverse(); // ECharts draws category axes bottom-up
  const anySelected = selected !== 'All';

  const option = baseOption({
    grid: { left: 8, right: 56, top: 8, bottom: 24, containLabel: true },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'item',
      formatter: (p) => {
        const row = rows[p.dataIndex];
        const small = row.count < smallSampleThreshold
          ? '<br/><em>Small sample: interpret with caution.</em>' : '';
        return `<strong>${escapeHtml(row.category)}</strong><br/>${formatInt(row.count)} opportunity records`
          + `<br/>${formatPct(total ? (row.count / total) * 100 : 0)} of current selection${small}`;
      },
    },
    xAxis: { type: 'value', minInterval: 1, axisLabel, splitLine },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.category),
      axisLabel: { ...axisLabel, color: COLORS.ink },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 22,
      data: rows.map((r) => ({
        value: r.count,
        itemStyle: { color: highlightColor(r.category === selected, anySelected, COLORS.primary), borderRadius: [0, 3, 3, 0] },
      })),
      label: { show: true, position: 'right', color: COLORS.ink, formatter: (p) => formatInt(p.value) },
    }],
  });

  return (
    <EChart
      option={option}
      height={height || Math.max(240, rows.length * 30 + 40)}
      ariaLabel={`Horizontal bar chart of opportunities by category. Largest: ${categoryCounts[0]?.category} with ${categoryCounts[0]?.count}.`}
      onClick={(p) => onSelect(rows[p.dataIndex].category)}
    />
  );
}
