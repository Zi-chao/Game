import { useEffect, useState } from 'react';

interface OrientationPromptProps {
  message?: string;
}

export const OrientationPrompt = ({ message = '请将设备旋转至横屏以获得最佳体验' }: OrientationPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('orientation_prompt_dismissed') === 'true';
  });

  useEffect(() => {
    if (isDismissed) {
      setShowPrompt(false);
      return;
    }

    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (!isMobile) {
        setShowPrompt(false);
        return;
      }
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowPrompt(isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isDismissed]);

  const handleClose = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('orientation_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="orientation-prompt">
      <div className="flex items-center gap-2">
        <span className="text-lg">📱</span>
        <span className="text-sm text-white">{message}</span>
      </div>
      <button
        onClick={handleClose}
        className="orientation-close-btn"
      >
        ×
      </button>
    </div>
  );
};