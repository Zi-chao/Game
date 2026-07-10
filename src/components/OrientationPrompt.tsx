import { useEffect, useState } from 'react';

interface OrientationPromptProps {
  message?: string;
}

export const OrientationPrompt = ({ message = '请将设备旋转至横屏以获得最佳体验' }: OrientationPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // 只在移动设备上提示
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (!isMobile) {
        setShowPrompt(false);
        return;
      }
      // 检测竖屏
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
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="orientation-prompt" style={{ display: 'flex' }}>
      <div className="icon">📱</div>
      <div className="text-xl font-bold mb-2">横屏模式</div>
      <div className="text-sm text-slate-300 max-w-xs">{message}</div>
    </div>
  );
};