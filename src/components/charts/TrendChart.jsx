// Opportunity records per creation period. The source CREATED AT values are
// snapped to 13 anchor dates ~116 days apart, so each point is a ~4-month period.
import { useCallback, useEffect, useRef } from 'react';
import EChart from './EChart.jsx';
import { axisLabel, axisLine, axisName, baseOption, splitLine } from './chartTheme.js';
import { COLORS } from '../../utils/constants.js';
import { formatDate, formatInt } from '../../utils/format.js';

export default function TrendChart({ periodCounts, periodFrom, periodTo, isFullRange, onSelectPeriod, height }) {
  const lastIndex = periodCounts.length - 1;

  // Clicking anywhere inside the plot selects the nearest period, which is much
  // easier than hitting an 8px point. A ref keeps the handler current without
  // re-registering it on every render.
  const onSelectRef = useRef(onSelectPeriod);
  useEffect(() => { onSelectRef.current = onSelectPeriod; }, [onSelectPeriod]);
  const handleChartReady = useCallback((chart) => {
    chart.getZr().on('click', (event) => {
      const pixel = [event.offsetX, event.offsetY];
      if (!chart.containPixel('grid', pixel)) return;
      const [index] = chart.convertFromPixel({ seriesIndex: 0 }, pixel);
      const periodIndex = Math.round(index);
      if (periodIndex >= 0 && periodIndex <= lastIndex) onSelectRef.current(periodIndex);
    });
  }, [lastIndex]);
  const option = baseOption({
    grid: { left: 56, right: 24, top: 24, bottom: 48 },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'axis',
      formatter: ([point]) => {
        const period = periodCounts[point.dataIndex];
        const partial = point.dataIndex === lastIndex ? '<br/><em>Last period in the dataset; may be incomplete.</em>' : '';
        return `<strong>${formatInt(period.count)}</strong> opportunity records<br/>`
          + `Creation date recorded as ${formatDate(period.date)}<br/>`
          + `<span style="color:${COLORS.muted}">Covers roughly ±2 months around this date</span>${partial}`;
      },
    },
    xAxis: {
      type: 'category',
      data: periodCounts.map((p) => p.label),
      axisLabel: { ...axisLabel, hideOverlap: true },
      axisLine,
      axisTick: { alignWithLabel: true, lineStyle: { color: COLORS.rule } },
      name: 'Creation period (recorded date)',
      nameLocation: 'middle',
      nameGap: 32,
      nameTextStyle: axisName,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      name: 'Opportunities created',
      nameTextStyle: { ...axisName, align: 'left' },
      axisLabel,
      splitLine,
    },
    series: [{
      type: 'line',
      data: periodCounts.map((p, i) => ({
        value: p.count,
        itemStyle: { color: i === lastIndex ? COLORS.neutral : COLORS.primary },
      })),
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: COLORS.primary, width: 2.5 },
      itemStyle: { color: COLORS.primary },
      areaStyle: { color: 'rgba(31,79,209,0.06)' },
      markArea: isFullRange ? undefined : {
        silent: true,
        itemStyle: { color: 'rgba(31,79,209,0.08)' },
        data: [[{ xAxis: periodFrom }, { xAxis: periodTo }]],
      },
    }],
  });

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={`Line chart of opportunity records by creation period. Peak: ${
        formatInt(Math.max(...periodCounts.map((p) => p.count)))} records.`}
      onChartReady={handleChartReady}
    />
  );
}
