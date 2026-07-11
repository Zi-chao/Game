import { useState } from 'react';

interface ClearCacheButtonProps {
  storageKeys: string[];      // 要清除的 localStorage key 列表
  onCleared?: () => void;     // 清除后回调（用于刷新页面状态）
  label?: string;             // 按钮文字
}

/**
 * 清除本地缓存按钮
 * 接受 localStorage key 列表，清除对应的项（仅清除指定 key，不影响其他游戏数据）
 */
export const ClearCacheButton = ({
  storageKeys,
  onCleared,
  label = '🗑️ 清除缓存',
}: ClearCacheButtonProps) => {
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    // 始终清除通用缓存项
    const allKeysToRemove = [...storageKeys, 'orientation_recommendation_disabled'];
    allKeysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        // 忽略错误
      }
    });
    setCleared(true);
    setConfirming(false);
    onCleared?.();
    setTimeout(() => setCleared(false), 1500);
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="fixed top-3 right-3 z-40 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm border border-slate-600 rounded-lg shadow-lg transition-all hover:scale-105"
        title="清除本地使用数据和成绩"
      >
        {cleared ? '✓ 已清除' : label}
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-2xl mb-3 text-center">🗑️</div>
            <h3 className="text-lg font-bold text-white text-center mb-2">清除本地缓存？</h3>
            <p className="text-slate-300 text-sm text-center mb-5">
              将清除本游戏的成绩和本地使用数据，<br/>此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
              >
                取消
              </button>
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
