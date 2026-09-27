import { PAGES } from '../../utils/constants.js';

export default function TabNav({ activePage, activeFilterCount, onReset }) {
  return (
    <nav className="tabs" aria-label="Dashboard sections">
      <div className="tabs__inner">
        <ul className="tabs__list">
          {PAGES.map((page) => (
            <li key={page.id}>
              <a
                href={`#${page.id}`}
                className="tabs__link"
                aria-current={activePage === page.id ? 'page' : undefined}
              >
                {page.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="button button--reset"
          onClick={onReset}
          disabled={activeFilterCount === 0}
          aria-label={`Reset filters (${activeFilterCount} active)`}
        >
          Reset filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>
    </nav>
  );
}
