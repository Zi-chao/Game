import { useState, useEffect } from 'react';
import { useHop } from '../hooks/useHop';
import { HOP_GRID_SIZE } from '../utils/hopUtils';

interface HopGameProps {
  onBack: () => void;
}

export const HopGame = ({ onBack }: HopGameProps) => {
  const { state, totalLevels, reset, restartLevel, hopTo, nextLevel } = useHop();
  const [cellSize, setCellSize] = useState(50);
  const [isPortrait, setIsPortrait] = useState(false);

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

      <div className="flex gap-3 mt-4">
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
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击其他棋子跳过去 | 必须水平、垂直或对角线方向跳</p>
        <p>访问所有关卡点即可过关</p>
      </div>
    </div>
  );
};