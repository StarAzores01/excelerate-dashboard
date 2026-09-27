import Header from './components/layout/Header.jsx';
import TabNav from './components/layout/TabNav.jsx';
import FilterBar from './components/filters/FilterBar.jsx';
import KpiStrip from './components/cards/KpiStrip.jsx';
import DataNotice from './components/common/DataNotice.jsx';
import { ErrorState, LoadingState } from './components/common/StatusMessage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import OpportunitiesPage from './pages/OpportunitiesPage.jsx';
import ScholarshipPage from './pages/ScholarshipPage.jsx';
import LimitationsPage from './pages/LimitationsPage.jsx';
import useDashboardData from './hooks/useDashboardData.js';
import useDashboardModel from './hooks/useDashboardModel.js';
import useHashPage from './hooks/useHashPage.js';

const ANALYTICAL_PAGES = {
  overview: OverviewPage,
  opportunities: OpportunitiesPage,
  scholarships: ScholarshipPage,
};

export default function App() {
  const { status, data, error } = useDashboardData();
  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState error={error} />;
  return <Dashboard summary={data.summary} records={data.records} />;
}

function Dashboard({ summary, records }) {
  const page = useHashPage();
  const { filters, model, update, reset, toggle, selectPeriod, selectYear } = useDashboardModel(summary, records);
  const actions = { toggle, selectPeriod, selectYear };
  const Page = ANALYTICAL_PAGES[page];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header summary={summary} />
      <TabNav activePage={page} activeFilterCount={model.activeFilterCount} onReset={reset} />
      <main id="main" className="main">
        {Page ? (
          <>
            <FilterBar filters={filters} onChange={update} summary={summary} filteredCount={model.filtered.length} />
            <DataNotice summary={summary} kpis={model.kpis} excludeLikelyTest={filters.excludeLikelyTest} />
            <KpiStrip kpis={model.kpis} totalRecords={summary.source.rows} />
            <Page summary={summary} model={model} filters={filters} actions={actions} />
          </>
        ) : (
          <>
            <p className="page-intro">
              What this dataset can and cannot support, and how each issue is handled. Filters do not apply on this page.
            </p>
            <LimitationsPage summary={summary} />
          </>
        )}
      </main>
      <footer className="site-foot">
        <p>
          Data processed {new Date(summary.generatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })} from{' '}
          {summary.source.file}. All figures count opportunity records.
        </p>
      </footer>
    </>
  );
}
