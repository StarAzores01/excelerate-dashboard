// Generic horizontal bar for one per-category metric (coverage rate, pool count, median).
// Keeps the three scholarship-by-category charts visually identical.
import EChart from './EChart.jsx';
import { axisLabel, baseOption, escapeHtml, highlightColor, splitLine } from './chartTheme.js';
import { COLORS } from '../../utils/constants.js';

/**
 * @param {Array} rows              [{ category, value, tooltip: string[] , muted?: boolean }]
 * @param {(v:number)=>string} formatValue  Formats bar labels
 * @param {string} axisFormat       ECharts axis label formatter template
 * @param {boolean} integerAxis     True when values are counts (no fractional ticks)
 */
export default function CategoryMetricChart({
  rows, formatValue, axisFormat = '{value}', axisMax, integerAxis = false, selected = 'All', onSelectCategory, ariaLabel, color = COLORS.primary,
}) {
  const ordered = [...rows].reverse();
  const anySelected = selected !== 'All';
  const option = baseOption({
    grid: { left: 8, right: 72, top: 8, bottom: 24, containLabel: true },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'item',
      formatter: (p) => {
        const row = ordered[p.dataIndex];
        return `<strong>${escapeHtml(row.category)}</strong><br/>${row.tooltip.join('<br/>')}`;
      },
    },
    xAxis: { type: 'value', max: axisMax, minInterval: integerAxis ? 1 : undefined, axisLabel: { ...axisLabel, formatter: axisFormat }, splitLine },
    yAxis: {
      type: 'category', data: ordered.map((r) => r.category),
      axisLabel: { ...axisLabel, color: COLORS.ink }, axisTick: { show: false }, axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 22,
      data: ordered.map((r) => ({
        value: r.value,
        itemStyle: {
          color: r.muted ? COLORS.neutral : highlightColor(r.category === selected, anySelected, color),
          borderRadius: [0, 3, 3, 0],
        },
      })),
      label: {
        show: true, position: 'right', color: COLORS.ink,
        formatter: (p) => (p.value === null || p.value === undefined ? 'n/a' : formatValue(p.value)),
      },
    }],
  });
  return (
    <EChart
      option={option}
      height={Math.max(240, ordered.length * 30 + 40)}
      ariaLabel={ariaLabel}
      onClick={onSelectCategory ? (p) => onSelectCategory(ordered[p.dataIndex].category) : undefined}
    />
  );
}
