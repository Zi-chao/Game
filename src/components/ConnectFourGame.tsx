import { useEffect, useRef } from 'react';
import { useConnectFour } from '../hooks/useConnectFour';
import { ROWS, COLS } from '../utils/connectFourUtils';
import { OthelloMode } from '../types/game';
import { AiSideSelector } from './AiSideSelector';
import { ClearCacheButton } from './ClearCacheButton';

interface ConnectFourGameProps {
  onBack: () => void;
}

export const ConnectFourGame = ({ onBack }: ConnectFourGameProps) => {
  const { state, best, aiSide, dropAt, aiDrop, reset, setMode, setAiSide } = useConnectFour();
  const aiTimerRef = useRef<number | null>(null);

  // 从sessionStorage读取模式
  useEffect(() => {
    const savedMode = sessionStorage.getItem('game_mode_connectfour') as OthelloMode | null;
    if (savedMode && (savedMode === 'pve' || savedMode === 'pvp')) {
      setMode(savedMode);
    }
  }, [setMode]);

  useEffect(() => {
    if (state.mode === 'pve' && state.currentPlayer === aiSide && state.status === 'playing') {
      aiTimerRef.current = window.setTimeout(() => {
        aiDrop();
      }, 500);
      return () => {
        if (aiTimerRef.current) {
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = null;
        }
      };
    }
  }, [state.currentPlayer, state.status, state.mode, aiDrop, aiSide]);

  const handleColumnClick = (col: number) => {
    if (state.status !== 'playing') return;
    if (state.mode === 'pve' && state.currentPlayer === aiSide) return;
    dropAt(col);
  };

  const isWinning = (row: number, col: number) => {
    return state.winningCells?.some(c => c.row === row && c.col === col) ?? false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <ClearCacheButton storageKeys={['connectfour_best']} onCleared={() => window.location.reload()} />

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 mb-4 mt-8">
        🔴🟡 四子棋
      </h1>

      <AiSideSelector
        mode={state.mode}
        aiSide={aiSide}
        onChangeMode={(m) => setMode(m)}
        onChangeAiSide={(s) => setAiSide(s)}
      />

      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">当前</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {state.mode === 'pve' ? (
              state.currentPlayer !== aiSide ? (
                <span className="text-amber-300">🙋 玩家</span>
              ) : (
                <span className="text-amber-400">🤖 电脑</span>
              )
            ) : state.currentPlayer === 1 ? (
              <span className="text-red-300">玩家1</span>
            ) : (
              <span className="text-yellow-300">玩家2</span>
            )}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">战绩</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {best.wins}胜 {best.losses}负
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="bg-blue-700 p-3 rounded-2xl border-4 border-blue-900 shadow-2xl">
          {/* 列指示箭头 */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: COLS }).map((_, col) => (
              <button
                key={`arrow-${col}`}
                onClick={() => handleColumnClick(col)}
                disabled={state.status !== 'playing' || (state.mode === 'pve' && state.currentPlayer === aiSide)}
                className="h-6 bg-blue-800/50 hover:bg-blue-600/50 disabled:opacity-30 rounded text-white text-xs flex items-center justify-center transition-all"
              >
                ▼
              </button>
            ))}
          </div>

          {/* 棋盘 */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: ROWS * COLS }).map((_, idx) => {
              const row = Math.floor(idx / COLS);
              const col = idx % COLS;
              const cell = state.board[row][col];
              const winning = isWinning(row, col);
              return (
                <div
                  key={`${row}-${col}`}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${
                    cell === 0
                      ? 'bg-blue-950'
                      : cell === 1
                      ? winning
                        ? 'bg-red-400 shadow-lg shadow-red-400/60 animate-pulse'
                        : 'bg-gradient-to-br from-red-400 to-red-600 shadow-md shadow-red-500/40'
                      : winning
                      ? 'bg-yellow-300 shadow-lg shadow-yellow-300/60 animate-pulse'
                      : 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md shadow-yellow-400/40'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
            {state.mode === 'pve' ? (
              state.winner !== aiSide ? (
                <>
                  <div className="text-5xl mb-2 animate-bounce">🏆</div>
                  <div className="text-4xl font-bold text-red-400 mb-2 animate-pulse">你赢了！</div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-2">💔</div>
                  <div className="text-4xl font-bold text-yellow-400 mb-2 animate-pulse">电脑获胜</div>
                </>
              )
            ) : state.winner === 1 ? (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-red-400 mb-2 animate-pulse">玩家1获胜！</div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">🏆</div>
                <div className="text-4xl font-bold text-yellow-400 mb-2 animate-pulse">玩家2获胜！</div>
              </>
            )}
            <button
              onClick={() => reset()}
              className="mt-4 px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
        {state.status === 'draw' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-yellow-400 mb-4">🤝 平局！</div>
            <button
              onClick={() => reset()}
              className="mt-4 px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重新开始
        </button>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击顶部箭头或列内空格落子 | 四子连成一线获胜</p>
      </div>
    </div>
  );
};