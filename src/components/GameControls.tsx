import { useState, useEffect } from 'react';

const ORIENTATION_KEY = 'forced_orientation';
export const ORIENTATION_EVENT = 'forcedOrientationChange';

export const getForcedOrientation = (): 'portrait' | 'landscape' | null => {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(ORIENTATION_KEY);
  if (v === 'portrait' || v === 'landscape') return v;
  return null;
};

const tryLockOrientation = (mode: 'portrait' | 'landscape') => {
  const so = (screen as any).orientation;
  if (so && typeof so.lock === 'function') {
    so.lock(mode).catch(() => {});
  }
};

const tryUnlockOrientation = () => {
  const so = (screen as any).orientation;
  if (so && typeof so.unlock === 'function') {
    so.unlock();
  }
};

export const GameControls = () => {
  const [forced, setForced] = useState<'portrait' | 'landscape' | null>(getForcedOrientation);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ORIENTATION_KEY) {
        const v = e.newValue;
        if (v === 'portrait' || v === 'landscape') setForced(v);
        else setForced(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const cycleOrientation = () => {
    let next: 'portrait' | 'landscape' | null;
    if (forced === null) next = 'portrait';
    else if (forced === 'portrait') next = 'landscape';
    else next = null;
    setForced(next);

    if (next === 'portrait') {
      // 竖屏不管：不调用 API，只保存状态
      localStorage.setItem(ORIENTATION_KEY, next);
      tryUnlockOrientation();
    } else if (next === 'landscape') {
      // 横屏：API 锁定横屏 + 全屏
      localStorage.setItem(ORIENTATION_KEY, next);
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      tryLockOrientation('landscape');
    } else {
      // 恢复自动：解锁 + 退出全屏
      localStorage.removeItem(ORIENTATION_KEY);
      tryUnlockOrientation();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
    window.dispatchEvent(new CustomEvent(ORIENTATION_EVENT));
  };

  const label = forced === 'portrait' ? '🔄 竖屏' : forced === 'landscape' ? '🔄 横屏' : '🔄 自动';
  const title = forced === null
    ? '点击强制竖屏'
    : forced === 'portrait'
    ? '已强制竖屏，点击切换为横屏'
    : '已强制横屏，点击恢复自动';

  return (
    <button
      onClick={cycleOrientation}
      className="fixed top-3 right-32 z-40 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm border border-slate-600 rounded-lg shadow-lg transition-all hover:scale-105"
      title={title}
    >
      {label}
    </button>
  );
};
