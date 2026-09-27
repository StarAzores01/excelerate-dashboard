// Opportunity records per calendar year of the recorded creation date.
import EChart from './EChart.jsx';
import { axisLabel, axisLine, axisName, baseOption, highlightColor, splitLine } from './chartTheme.js';
import { COLORS } from '../../utils/constants.js';
import { formatInt } from '../../utils/format.js';

export default function AnnualChart({ yearCounts, selectedYear, partialYear, onSelectYear, height = 300 }) {
  const option = baseOption({
    grid: { left: 56, right: 16, top: 28, bottom: 36 },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'item',
      formatter: (p) => {
        const row = yearCounts[p.dataIndex];
        const note = row.year === partialYear ? '<br/><em>Partial year: data ends in May 2026.</em>' : '';
        return `<strong>${row.year}</strong><br/>${formatInt(row.count)} opportunity records${note}`;
      },
    },
    xAxis: {
      type: 'category',
      data: yearCounts.map((y) => (y.year === partialYear ? `${y.year}*` : String(y.year))),
      axisLabel, axisLine, axisTick: { show: false },
    },
    yAxis: { type: 'value', minInterval: 1, name: 'Opportunities created', nameTextStyle: { ...axisName, align: 'left' }, axisLabel, splitLine },
    series: [{
      type: 'bar',
      barMaxWidth: 56,
      data: yearCounts.map((y) => {
        const base = y.year === partialYear ? '#8ea6ea' : COLORS.primary;
        return {
          value: y.count,
          itemStyle: {
            color: highlightColor(y.year === selectedYear, selectedYear !== null, base),
            borderRadius: [3, 3, 0, 0],
          },
        };
      }),
      label: { show: true, position: 'top', color: COLORS.ink, formatter: (p) => formatInt(p.value) },
    }],
  });

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={`Bar chart of opportunity records per year: ${yearCounts.map((y) => `${y.year} ${y.count}`).join(', ')}.`}
      onClick={(p) => onSelectYear(yearCounts[p.dataIndex].year)}
    />
  );
}
