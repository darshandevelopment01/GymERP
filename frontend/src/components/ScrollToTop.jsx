import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component scrolls specific layout containers to the top 
 * whenever the route changes. This prevents the "hanging" scroll issue.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // List of common scroll containers in our architecture
    const containers = [
      document.querySelector('.dashboard-main'),
      document.querySelector('.dashboard-content'),
      document.querySelector('.main-content'),
      window
    ];

    containers.forEach(container => {
      if (container) {
        if (container.scrollTo) {
          container.scrollTo(0, 0);
        } else if (container === window) {
           window.scrollTo(0, 0);
        }
      }
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
