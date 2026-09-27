// Shared labels and colours. Keeping them here means a label changes in one place.

export const SCHOLARSHIP_STATUS = {
  offers: { label: 'Offers a scholarship', short: 'Offers', color: '#1f4fd1' },
  zero: { label: '$0 recorded', short: '$0 recorded', color: '#d4912a' },
  unknown: { label: 'Amount unknown', short: 'Unknown', color: '#b3bac6' },
};
export const SCHOLARSHIP_STATUS_ORDER = ['offers', 'zero', 'unknown'];

export const FEE_STATUS = {
  free: 'Free to join',
  paid: 'Fee charged',
  unknown: 'Fee unknown',
};

export const LOCATION_ORDER = ['Work From Home', 'Virtual', 'Unspecified', 'Not recorded'];
export const LOCATION_COLORS = {
  'Work From Home': '#1f4fd1',
  Virtual: '#7d9be8',
  Unspecified: '#8d96a6',
  'Not recorded': '#d3d8e1',
};

export const COLORS = {
  primary: '#1f4fd1',
  primarySoft: '#c9d7f7',
  ink: '#172033',
  muted: '#586174',
  rule: '#dfe4ec',
  caution: '#d4912a',
  neutral: '#b3bac6',
};

export const PAGES = [
  { id: 'overview', label: 'Overview' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'scholarships', label: 'Scholarship analysis' },
  { id: 'limitations', label: 'Data limitations' },
];

// Scholarship amount bins (USD). Right-open intervals [min, max).
// $120 gets its own bin because 3,713 records carry exactly that value.
export const AMOUNT_BINS = [
  { label: 'Under $1', min: 0.000001, max: 1 },
  { label: '$1–9', min: 1, max: 10 },
  { label: '$10–99', min: 10, max: 100 },
  { label: '$100–119', min: 100, max: 120 },
  { label: 'Exactly $120', min: 120, max: 120.000001 },
  { label: '$121–499', min: 120.000001, max: 500 },
  { label: '$500–999', min: 500, max: 1000 },
  { label: '$1k–9.9k', min: 1000, max: 10000 },
  { label: '$10k–999k', min: 10000, max: 1000000 },
  { label: '$1M or more', min: 1000000, max: Infinity },
];
