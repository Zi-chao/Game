import { useState, useEffect } from 'react';

export type OrientationMode = 'landscape' | 'portrait';

export const useOrientationGuard = (mode: OrientationMode) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (!isMobile) {
        setShowPrompt(false);
        return;
      }
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowPrompt(mode === 'landscape' ? isPortrait : !isPortrait);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [mode]);

  return showPrompt;
};
