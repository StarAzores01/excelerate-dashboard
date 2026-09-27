// Distribution of positive scholarship amounts in fixed USD bins. Binning keeps
// the $10M value from flattening the chart; a log scale is offered because the
// "Exactly $120" bin dwarfs the rest.
import EChart from './EChart.jsx';
import { axisLabel, axisLine, axisName, baseOption, splitLine } from './chartTheme.js';
import { COLORS } from '../../utils/constants.js';
import { formatInt, formatPct } from '../../utils/format.js';

export default function AmountDistributionChart({ bins, scale = 'linear' }) {
  const total = bins.reduce((s, b) => s + b.count, 0);
  const isLog = scale === 'log';
  const option = baseOption({
    grid: { left: 56, right: 16, top: 32, bottom: 64 },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'item',
      formatter: (p) => {
        const bin = bins[p.dataIndex];
        const flag = bin.min >= 1000000 ? '<br/><em>Extreme values: verify before any financial use.</em>' : '';
        return `<strong>${bin.label}</strong><br/>${formatInt(bin.count)} records offering a scholarship`
          + `<br/>${formatPct(total ? (bin.count / total) * 100 : 0)} of those records${flag}`;
      },
    },
    xAxis: {
      type: 'category', data: bins.map((b) => b.label),
      axisLabel: { ...axisLabel, interval: 0, rotate: 35 }, axisLine, axisTick: { show: false },
    },
    yAxis: {
      type: isLog ? 'log' : 'value',
      min: isLog ? 1 : undefined,
      minInterval: isLog ? undefined : 1,
      logBase: 10,
      name: isLog ? 'Records (log scale)' : 'Records',
      nameTextStyle: { ...axisName, align: 'left' },
      axisLabel, splitLine,
    },
    series: [{
      type: 'bar',
      barMaxWidth: 44,
      data: bins.map((b) => ({
        // Log axes cannot show zero; a missing bar reads correctly as "none".
        value: isLog && b.count === 0 ? null : b.count,
        itemStyle: {
          color: b.min >= 1000000 ? COLORS.caution : b.label === 'Exactly $120' ? COLORS.primary : '#7d9be8',
          borderRadius: [3, 3, 0, 0],
        },
      })),
      label: { show: true, position: 'top', color: COLORS.ink, formatter: (p) => formatInt(p.value) },
    }],
  });
  return (
    <EChart
      option={option}
      height={340}
      ariaLabel={`Histogram of scholarship amounts: ${bins.map((b) => `${b.label} ${b.count}`).join(', ')}.`}
    />
  );
}
