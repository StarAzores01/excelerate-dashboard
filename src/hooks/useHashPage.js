// Tracks the active page in the URL hash (#overview, #scholarships, ...).
// Hash navigation works on GitHub Pages without server-side routing.
import { useEffect, useState } from 'react';
import { PAGES } from '../utils/constants.js';

const DEFAULT_PAGE = PAGES[0].id;

function readHash() {
  const id = window.location.hash.replace('#', '');
  return PAGES.some((p) => p.id === id) ? id : DEFAULT_PAGE;
}

export default function useHashPage() {
  const [page, setPage] = useState(readHash);
  useEffect(() => {
    const onHashChange = () => {
      setPage(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return page;
}
