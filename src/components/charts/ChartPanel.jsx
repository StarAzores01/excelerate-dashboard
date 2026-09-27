// Consistent frame for every chart: title, what it counts, optional caution,
// and an empty state when filters leave nothing to show.
import EmptyState from '../common/EmptyState.jsx';

export default function ChartPanel({
  title, measures, caution, hint, isEmpty, emptyMessage, wide = false, children, footer,
}) {
  return (
    <section className={`panel${wide ? ' panel--wide' : ''}`} aria-label={title}>
      <header className="panel__head">
        <h3 className="panel__title">{title}</h3>
        <p className="panel__measures">{measures}</p>
        {caution && <p className="caution caution--inline">{caution}</p>}
      </header>
      <div className="panel__body">
        {isEmpty ? <EmptyState message={emptyMessage} /> : children}
      </div>
      {(hint || footer) && !isEmpty && (
        <footer className="panel__foot">
          {hint && <p className="panel__hint">{hint}</p>}
          {footer}
        </footer>
      )}
    </section>
  );
}
