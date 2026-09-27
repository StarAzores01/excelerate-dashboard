// Thin wrapper around ECharts. Registers only the chart types this dashboard
// uses, which keeps the production bundle much smaller than importing all of ECharts.
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent, GridComponent, LegendComponent, MarkAreaComponent, TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import EChartsReactCore from 'echarts-for-react/esm/core';

echarts.use([
  BarChart, LineChart, PieChart,
  AriaComponent, GridComponent, LegendComponent, MarkAreaComponent, TooltipComponent,
  SVGRenderer,
]);

/**
 * @param {object} props
 * @param {object} props.option   ECharts option object
 * @param {number} [props.height] Chart height in px
 * @param {(params) => void} [props.onClick] Click handler for cross-filtering
 * @param {string} props.ariaLabel Text description for screen readers
 * @param {(instance) => void} [props.onChartReady] Receives the ECharts instance once created
 */
export default function EChart({ option, height = 320, onClick, ariaLabel, onChartReady }) {
  const onEvents = onClick ? { click: onClick } : undefined;
  return (
    <div role="img" aria-label={ariaLabel} className="echart">
      <EChartsReactCore
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        opts={{ renderer: 'svg' }}
        style={{ height, width: '100%' }}
        onEvents={onEvents}
        onChartReady={onChartReady}
      />
    </div>
  );
}
