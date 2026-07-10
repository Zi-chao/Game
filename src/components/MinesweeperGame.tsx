import { useState, useEffect } from 'react';
import { useMinesweeper } from '../hooks/useMinesweeper';
import { Difficulty } from '../types/game';
import { DIFFICULTY_CONFIGS, CELL_SIZE } from '../utils/minesweeperUtils';

interface MinesweeperGameProps {
  onBack: () => void;
}

const NUMBER_COLORS = [
  '', '#0000ff', '#008000', '#ff0000', '#000080',
  '#800000', '#008080', '#000000', '#808080',
];

export const MinesweeperGame = ({ onBack }: MinesweeperGameProps) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const { state, bestTime, reset, handleLeftClick, handleRightClick } = useMinesweeper(difficulty);
  const config = DIFFICULTY_CONFIGS[difficulty];

  const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    handleRightClick(row, col);
  };

  const [cellSize, setCellSize] = useState(CELL_SIZE);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(mobile && portrait);
      if (mobile) {
        const maxWidth = window.innerWidth - 32;
        const cols = config.cols;
        const sizeByWidth = Math.floor(maxWidth / cols);
        setCellSize(Math.min(sizeByWidth, 32));
      } else {
        setCellSize(CELL_SIZE);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [config.cols]);

  if (isPortrait) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6">📱</div>
        <div className="text-2xl font-bold text-white mb-4">请将手机旋转至横屏</div>
        <div className="text-slate-400 text-center px-8">
          <p>扫雷游戏需要横屏才能完整显示</p>
          <p>旋转后即可开始游戏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex flex-col items-center p-2 md:p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-2 left-2 md:top-4 md:left-4 px-3 py-1.5 md:px-4 md:py-2 bg-slate-700/80 hover:bg-slate-600 text-white text-sm md:text-base rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回
      </button>

      <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-gray-500 mb-2 md:mb-4 mt-4 md:mt-8">
        💣 扫雷
      </h1>

      {/* 难度选择 */}
      <div className="flex gap-2 mb-2 md:mb-4">
        {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(diff => (
          <button
            key={diff}
            onClick={() => setDifficulty(diff)}
            className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
              difficulty === diff
                ? 'bg-slate-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {DIFFICULTY_CONFIGS[diff].label}
          </button>
        ))}
      </div>

      {/* 信息栏 */}
      <div className="flex gap-2 md:gap-4 mb-2 md:mb-3 flex-wrap justify-center">
        <div className="bg-slate-800 rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-slate-700 min-w-[80px] md:min-w-[100px]">
          <div className="text-slate-400 text-xs">剩余雷数</div>
          <div className="text-xl md:text-2xl font-bold text-red-400 font-mono">{state.mineCount - state.flagCount}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-slate-700 min-w-[80px] md:min-w-[100px]">
          <div className="text-slate-400 text-xs">用时</div>
          <div className="text-xl md:text-2xl font-bold text-cyan-400 font-mono">{state.time}s</div>
        </div>
        {bestTime > 0 && (
          <div className="bg-slate-800 rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-slate-700 min-w-[80px] md:min-w-[100px]">
            <div className="text-slate-400 text-xs">最佳</div>
            <div className="text-xl md:text-2xl font-bold text-yellow-400 font-mono">{bestTime}s</div>
          </div>
        )}
        <button
          onClick={reset}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xl md:text-2xl transition-all"
        >
          {state.status === 'lost' ? '😵' : state.status === 'won' ? '😎' : '🙂'}
        </button>
      </div>

      {/* 状态提示 */}
      {state.status === 'lost' && (
        <div className="text-red-400 font-bold mb-2 animate-pulse text-sm">游戏失败！点击表情重试</div>
      )}
      {state.status === 'won' && (
        <div className="text-emerald-400 font-bold mb-2 animate-bounce text-sm">🎉 胜利！</div>
      )}

      {/* 棋盘 */}
      <div
        className="inline-grid gap-px bg-slate-700 p-1 rounded-lg shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
        }}
      >
          {state.board.flatMap((row, r) =>
            row.map((cell, c) => {
              const isRevealed = cell.state === 'revealed';
              const isFlagged = cell.state === 'flagged';
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleLeftClick(r, c)}
                  onContextMenu={e => handleContextMenu(e, r, c)}
                  className={`flex items-center justify-center font-bold transition-all ${
                    isRevealed
                      ? cell.isMine
                        ? 'bg-red-500'
                        : 'bg-slate-300'
                      : isFlagged
                      ? 'bg-yellow-200 hover:bg-yellow-300'
                      : 'bg-slate-500 hover:bg-slate-400 active:bg-slate-300'
                  }`}
                  style={{ width: cellSize, height: cellSize, color: cell.neighborMines ? NUMBER_COLORS[cell.neighborMines] : 'inherit', fontSize: cellSize * 0.5 }}
                >
                  {isRevealed && cell.isMine && '💣'}
                  {isRevealed && !cell.isMine && cell.neighborMines > 0 && cell.neighborMines}
                  {isFlagged && '🚩'}
                </button>
              );
            })
          )}
      </div>

      <div className="mt-2 md:mt-4 text-slate-400 text-xs text-center">
        <p className="hidden md:block">左键翻开 | 右键标记 | 第一次点击不会触雷</p>
        <p className="md:hidden">点击翻开 | 长按标记</p>
      </div>
    </div>
  );
};