// Full-page loading and error states.
export function LoadingState() {
  return (
    <div className="status" role="status" aria-live="polite">
      <div className="status__bar" aria-hidden="true" />
      <p>Loading opportunity data…</p>
    </div>
  );
}

export function ErrorState({ error }) {
  return (
    <div className="status status--error" role="alert">
      <h2>The dashboard data could not be loaded</h2>
      <p>{error?.message || 'Unknown error.'}</p>
      <p>
        Check that <code>public/data/opportunities.json</code> and <code>public/data/summary.json</code> exist.
        If they are missing, run <code>python scripts/prepare_data.py</code>. If the site is deployed under a
        sub-path, confirm the Vite <code>base</code> setting matches it.
      </p>
    </div>
  );
}
