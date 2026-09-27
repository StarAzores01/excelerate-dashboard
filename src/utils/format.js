// Number formatting helpers. All amounts in the dataset are USD after conversion.

const integer = new Intl.NumberFormat('en-US');

export function formatInt(value) {
  return value === null || value === undefined ? '–' : integer.format(Math.round(value));
}

export function formatPct(value, digits = 1) {
  return value === null || value === undefined ? '–' : `${value.toFixed(digits)}%`;
}

/** $120, $3,003.74, or compact ($10M) for very large values. */
export function formatUsd(value, { compact = false } = {}) {
  if (value === null || value === undefined) return '–';
  if (compact && Math.abs(value) >= 10000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2,
    }).format(value);
  }
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
