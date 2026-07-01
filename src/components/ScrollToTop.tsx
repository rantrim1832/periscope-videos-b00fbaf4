import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Reset scroll position on route change (SPA default is to keep it).
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
