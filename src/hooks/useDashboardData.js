// Loads the processed JSON once. import.meta.env.BASE_URL respects Vite's `base`
// setting, so the same code works locally and on a GitHub Pages sub-path.
import { useEffect, useState } from 'react';
import { decodeRecords } from '../utils/decode.js';

async function fetchJson(file) {
  const url = `${import.meta.env.BASE_URL}data/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request for ${url} failed with status ${response.status}.`);
  return response.json();
}

export default function useDashboardData() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchJson('summary.json'), fetchJson('opportunities.json')])
      .then(([summary, opportunities]) => {
        if (cancelled) return;
        const records = decodeRecords(opportunities, summary.periods);
        if (records.length !== summary.source.rows) {
          throw new Error(`Record count mismatch: ${records.length} records vs ${summary.source.rows} in summary. Re-run the data script.`);
        }
        setState({ status: 'ready', data: { summary, records }, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', data: null, error });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
