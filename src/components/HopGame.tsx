import { useState, useEffect } from 'react';
import { useHop } from '../hooks/useHop';
import { HOP_GRID_SIZE, getLevelRecord, getAllLevelRecords, HOP_LEVELS } from '../utils/hopUtils';
import { ClearCacheButton } from './ClearCacheButton';

interface HopGameProps {
  onBack: () => void;
}

// 格式化时间戳为可读字符串
const formatTime = (timestamp: number): string => {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const HopGame = ({ onBack }: HopGameProps) => {
  const { state, totalLevels, reset, restartLevel, hopTo, nextLevel, clearCurrentLevelRecord, clearAllRecords } = useHop();
  const [cellSize, setCellSize] = useState(50);
  const [isPortrait, setIsPortrait] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'current' | 'all'>(null);
  const [, setRecordsVersion] = useState(0); // 触发重新读取

  // 当前关卡的详细记录
  const currentRecord = getLevelRecord(state.levelIndex);
  // 全部关卡记录
  const allRecords = getAllLevelRecords();

  const isVisited = (row: number, col: number): boolean => {
    return state.visited.some(v => v.row === row && v.col === col);
  };

  const isCurrent = (row: number, col: number): boolean => {
    return state.currentRow === row && state.currentCol === col;
  };

  const isValidDot = (row: number, col: number): boolean => {
    return state.level.dots.some(d => d.row === row && d.col === col);
  };

  const visitedCount = state.visited.length;
  const totalCount = state.level.dots.length;

  useEffect(() => {
    const checkSize = () => {
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && portrait);
      if (isMobile) {
        const maxWidth = window.innerWidth - 32;
        const size = Math.floor(maxWidth / HOP_GRID_SIZE);
        setCellSize(Math.min(size, 50));
      } else {
        setCellSize(50);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    window.addEventListener('orientationchange', checkSize);
    return () => {
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('orientationchange', checkSize);
    };
  }, []);

  if (isPortrait) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="text-6xl mb-6">📱</div>
        <div className="text-2xl font-bold text-white mb-4">请将手机旋转至横屏</div>
        <div className="text-slate-400 text-center px-8">
          <p>跳跳乐游戏需要横屏才能完整显示</p>
          <p>旋转后即可开始游戏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-2 md:p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <ClearCacheButton storageKeys={['hop_best', 'hop_level_records']} onCleared={() => window.location.reload()} />

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-600 mb-4 mt-8">
        🦘 跳跳乐
      </h1>

      {/* 信息栏 */}
      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">关卡</div>
          <div className="text-2xl font-bold text-fuchsia-400 font-mono">
            {state.levelIndex + 1}/{totalLevels}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">已访问</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {visitedCount}/{totalCount}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">步数</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{state.moves}</div>
        </div>
        {state.bestMoves > 0 && (
          <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="text-slate-400 text-xs">最高关卡</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">{state.bestMoves}</div>
          </div>
        )}
        {currentRecord.bestMoves > 0 && (
          <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="text-slate-400 text-xs">本关最少步数</div>
            <div className="text-2xl font-bold text-pink-400 font-mono">{currentRecord.bestMoves}</div>
          </div>
        )}
        {currentRecord.clearedCount > 0 && (
          <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="text-slate-400 text-xs">本关通关次数</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{currentRecord.clearedCount}</div>
          </div>
        )}
      </div>

      {/* 游戏棋盘 */}
      <div className="relative">
        <div
          className="inline-grid gap-1 p-2 md:p-3 bg-slate-800 rounded-xl border-2 md:border-4 border-fuchsia-700 shadow-2xl"
          style={{ gridTemplateColumns: `repeat(${HOP_GRID_SIZE}, ${cellSize}px)` }}
        >
          {Array.from({ length: HOP_GRID_SIZE * HOP_GRID_SIZE }).map((_, idx) => {
            const row = Math.floor(idx / HOP_GRID_SIZE);
            const col = idx % HOP_GRID_SIZE;
            const visited = isVisited(row, col);
            const current = isCurrent(row, col);
            const validDot = isValidDot(row, col);

            return (
              <button
                key={`${row}-${col}`}
                onClick={() => hopTo(row, col)}
                disabled={!validDot || state.status !== 'playing'}
                className={`flex items-center justify-center rounded transition-all ${
                  current
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-2 border-yellow-200 shadow-lg shadow-yellow-400/50 scale-110'
                    : visited
                    ? 'bg-emerald-500/50 border border-emerald-300'
                    : validDot
                    ? 'bg-slate-700 hover:bg-fuchsia-600 border border-slate-600 hover:scale-105 cursor-pointer'
                    : 'bg-slate-900/30 border border-slate-800'
                }`}
                style={{ width: cellSize, height: cellSize }}
              >
                {current && <span style={{ fontSize: cellSize * 0.4 }}>🦘</span>}
                {visited && !current && (
                  <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* 路径连线 */}
        <svg
          className="absolute pointer-events-none"
          style={{
            top: 8,
            left: 8,
            width: HOP_GRID_SIZE * cellSize + (HOP_GRID_SIZE - 1),
            height: HOP_GRID_SIZE * cellSize + (HOP_GRID_SIZE - 1),
          }}
        >
          {state.visited.map((v, i) => {
            if (i === 0) return null;
            const prev = state.visited[i - 1];
            return (
              <line
                key={i}
                x1={prev.col * (cellSize + 1) + cellSize / 2}
                y1={prev.row * (cellSize + 1) + cellSize / 2}
                x2={v.col * (cellSize + 1) + cellSize / 2}
                y2={v.row * (cellSize + 1) + cellSize / 2}
                stroke="#ec4899"
                strokeWidth="3"
                opacity="0.6"
              />
            );
          })}
        </svg>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-emerald-400 mb-4 animate-bounce">🎉 通关！</div>
            <div className="text-xl text-white mb-2">用 {state.moves} 步访问了 {visitedCount} 个点</div>
            {state.levelIndex + 1 < totalLevels ? (
              <button
                onClick={nextLevel}
                className="mt-4 px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                下一关
              </button>
            ) : (
              <div className="text-yellow-400 mt-2 animate-pulse">⭐ 全部通关！</div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        <button
          onClick={restartLevel}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重玩本关
        </button>
        <button
          onClick={reset}
          className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重新开始
        </button>
        <button
          onClick={() => setConfirmAction('current')}
          className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
          title={`清除第 ${state.levelIndex + 1} 关的最少步数和通关次数记录`}
        >
          清除本关记录
        </button>
        <button
          onClick={() => setConfirmAction('all')}
          className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
          title="清除所有跳跳乐关卡记录和最高关卡统计"
        >
          清除全部记录
        </button>
      </div>

      {/* 全部关卡记录概览 */}
      <details className="mt-3 w-full max-w-2xl">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-200 text-xs text-center select-none">
          📊 查看全部关卡记录（{Object.keys(allRecords).length}/{totalLevels} 关有记录）
        </summary>
        <div className="mt-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="py-1 px-2 text-left">关卡</th>
                <th className="py-1 px-2 text-right">最少步数</th>
                <th className="py-1 px-2 text-right">通关次数</th>
                <th className="py-1 px-2 text-right">上次通关</th>
              </tr>
            </thead>
            <tbody>
              {HOP_LEVELS.map((_, idx) => {
                const rec = allRecords[idx] || { bestMoves: 0, clearedCount: 0, lastPlayed: 0 };
                return (
                  <tr key={idx} className={`${idx === state.levelIndex ? 'bg-fuchsia-900/30' : ''}`}>
                    <td className="py-1 px-2 text-slate-300">
                      第 {idx + 1} 关{idx === state.levelIndex && ' ⬅'}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-pink-300">
                      {rec.bestMoves > 0 ? rec.bestMoves : '-'}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-cyan-300">
                      {rec.clearedCount > 0 ? rec.clearedCount : '-'}
                    </td>
                    <td className="py-1 px-2 text-right text-slate-400">
                      {rec.lastPlayed > 0 ? formatTime(rec.lastPlayed) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击其他棋子跳过去 | 必须水平、垂直或对角线方向跳</p>
        <p>访问所有关卡点即可过关</p>
      </div>

      {/* 确认对话框 */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-slate-800 border-2 border-slate-600 rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-2xl font-bold text-white mb-3 text-center">
              ⚠️ 确认清除记录
            </div>
            <div className="text-slate-300 text-sm mb-5 leading-relaxed">
              {confirmAction === 'current' ? (
                <>
                  将要清除 <span className="text-pink-400 font-bold">第 {state.levelIndex + 1} 关</span> 的记录：
                  <ul className="mt-2 ml-4 list-disc text-slate-400">
                    <li>本关最少步数（{currentRecord.bestMoves > 0 ? currentRecord.bestMoves : '无'}）</li>
                    <li>本关通关次数（{currentRecord.clearedCount}）</li>
                    <li>上次通关时间</li>
                  </ul>
                  <p className="mt-3 text-amber-400 text-xs">
                    其他关卡的记录和最高关卡统计不受影响
                  </p>
                </>
              ) : (
                <>
                  将要清除 <span className="text-red-400 font-bold">所有跳跳乐记录</span>：
                  <ul className="mt-2 ml-4 list-disc text-slate-400">
                    <li>全部 {totalLevels} 个关卡的最少步数</li>
                    <li>全部关卡的通关次数</li>
                    <li>最高关卡统计</li>
                    <li>所有通关时间记录</li>
                  </ul>
                  <p className="mt-3 text-red-400 text-xs">
                    此操作不可撤销，请谨慎选择！
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-all"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (confirmAction === 'current') {
                    clearCurrentLevelRecord();
                  } else {
                    clearAllRecords();
                  }
                  setConfirmAction(null);
                  setRecordsVersion(v => v + 1);
                }}
                className={`flex-1 px-4 py-2 text-white font-bold rounded-lg transition-all ${
                  confirmAction === 'current'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};