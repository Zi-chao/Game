import { useEffect, useState } from 'react';
import { OrientationMode } from '../hooks/useOrientationGuard';
import { getForcedOrientation, ORIENTATION_EVENT } from './GameControls';

interface OrientationPromptProps {
  mode?: OrientationMode;
}

const DISABLED_KEY = 'orientation_recommendation_disabled';

export const readOrientationDisabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DISABLED_KEY) === 'true';
};

const shouldShow = (mode: OrientationMode): boolean => {
  if (typeof window === 'undefined') return false;

  const forced = getForcedOrientation();
  if (forced) {
    return mode !== forced;
  }

  const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  if (!isMobile) return false;
  const isPortrait = window.innerHeight > window.innerWidth;
  return mode === 'landscape' ? isPortrait : !isPortrait;
};

export const OrientationPrompt = ({
  mode = 'landscape',
}: OrientationPromptProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDisabled, setIsDisabled] = useState(() => readOrientationDisabled());
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(v => v + 1);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    window.addEventListener(ORIENTATION_EVENT, handler);
    const onStorage = (e: StorageEvent) => {
      if (e.key === DISABLED_KEY) setIsDisabled(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener(ORIENTATION_EVENT, handler);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (isDismissed) return null;
  if (!shouldShow(mode)) return null;

  const message = mode === 'landscape'
    ? '请将设备旋转至横屏以获得最佳体验'
    : '请将设备旋转至竖屏以获得最佳体验';

  const handleClose = () => {
    setIsDismissed(true);
  };

  if (isDisabled) {
    return (
      <div className="fixed top-3 right-60 z-50 bg-slate-800/95 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white shadow-lg flex items-center gap-2 backdrop-blur-sm">
        <span>📱</span>
        <span>{message}</span>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white ml-1 text-base leading-none w-5 h-5 flex items-center justify-center"
          title="关闭提示"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 fixed inset-0 z-50">
      <div className="text-6xl mb-6">📱</div>
      <div className="text-2xl font-bold text-white mb-4">
        {mode === 'landscape' ? '请将手机旋转至横屏' : '请将手机旋转至竖屏'}
      </div>
      <div className="text-slate-400 text-center px-8 mb-6 max-w-md">
        <p>{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
      >
        知道了
      </button>
    </div>
  );
};
