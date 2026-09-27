// Shared ECharts styling so every chart reads the same way.
import { COLORS } from '../../utils/constants.js';

export const FONT = "'Public Sans Variable', 'Public Sans', system-ui, sans-serif";

export const baseTextStyle = { fontFamily: FONT, color: COLORS.ink, fontSize: 12 };

export const tooltipBase = {
  backgroundColor: '#ffffff',
  borderColor: COLORS.rule,
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { fontFamily: FONT, color: COLORS.ink, fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 14px rgba(23,32,51,.12); border-radius: 6px;',
};

export const axisLabel = { color: COLORS.muted, fontFamily: FONT, fontSize: 12 };
export const axisLine = { lineStyle: { color: COLORS.rule } };
export const splitLine = { lineStyle: { color: '#eef1f6' } };
export const axisName = { color: COLORS.muted, fontFamily: FONT, fontSize: 12 };

/** Base option merged into every chart. */
export function baseOption(overrides = {}) {
  return {
    textStyle: baseTextStyle,
    aria: { enabled: true },
    animationDuration: 300,
    tooltip: { ...tooltipBase },
    ...overrides,
  };
}

/** Dims unselected bars when a filter value is chosen, keeping context visible. */
export function highlightColor(isSelected, anySelected, color) {
  if (!anySelected) return color;
  return isSelected ? color : COLORS.primarySoft;
}

/** Escapes text placed into HTML tooltips. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}
