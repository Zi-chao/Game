import { useEffect, useRef } from 'react';
import { useOthello } from '../hooks/useOthello';
import { BOARD_SIZE, CELL_SIZE } from '../utils/othelloUtils';
import { OthelloMode } from '../types/game';

interface OthelloGameProps {
  onBack: () => void;
}

export const OthelloGame = ({ onBack }: OthelloGameProps) => {
  const { state, best, playerMove, aiMove, reset, setMode } = useOthello();
  const aiTimerRef = useRef<number | null>(null);

  // 从sessionStorage读取模式
  useEffect(() => {
    const savedMode = sessionStorage.getItem('game_mode_othello') as OthelloMode | null;
    if (savedMode && (savedMode === 'pve' || savedMode === 'pvp')) {
      setMode(savedMode);
    }
  }, [setMode]);

  useEffect(() => {
    if (state.mode === 'pve' && state.currentPlayer === 2 && state.status === 'playing') {
      aiTimerRef.current = window.setTimeout(() => {
        aiMove();
      }, 600);
      return () => {
        if (aiTimerRef.current) {
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = null;
        }
      };
    }
  }, [state.currentPlayer, state.status, state.mode, aiMove]);

  const isValidMove = (row: number, col: number) => {
    return state.validMoves.some(m => m.row === row && m.col === col);
  };

  const getFlipCount = (row: number, col: number) => {
    const move = state.validMoves.find(m => m.row === row && m.col === col);
    return move?.flips.length || 0;
  };

  const handleCellClick = (row: number, col: number) => {
    if (state.status !== 'playing') return;
    // pve 模式只允许玩家1下棋；pvp 模式当前玩家都能下
    if (state.mode === 'pve' && state.currentPlayer !== 1) return;
    if (!isValidMove(row, col)) return;
    playerMove(row, col);
  };

  const winnerPlayer = state.status === 'won' ? (state.blackScore > state.whiteScore ? 1 : 2) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 mb-4 mt-8">
        ⚫⚪ 黑白棋
      </h1>

      <div className="flex gap-2 mb-3">
        {(['pve', 'pvp'] as OthelloMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              state.mode === mode
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {mode === 'pve' ? '🤖 人机对战' : '👥 双人对战'}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-3">
        <div className="bg-black/40 border-2 border-white rounded-xl px-5 py-2">
          <div className="text-slate-300 text-xs flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-black border border-white"></div>
            {state.mode === 'pve' ? '玩家' : '玩家1'}
          </div>
          <div className="text-3xl font-bold text-white font-mono">{state.blackScore}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700 flex flex-col justify-center">
          <div className="text-slate-400 text-xs">战绩</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {best.wins}胜 {best.losses}负
          </div>
        </div>
        <div className="bg-white/20 border-2 border-white rounded-xl px-5 py-2">
          <div className="text-slate-300 text-xs flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            {state.mode === 'pve' ? '电脑' : '玩家2'}
          </div>
          <div className="text-3xl font-bold text-white font-mono">{state.whiteScore}</div>
        </div>
      </div>

      <div className="relative">
        <div
          className="inline-grid gap-1 p-3 bg-emerald-800 rounded-2xl border-4 border-emerald-600 shadow-2xl"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)` }}
        >
          {state.board.flatMap((row, r) =>
            row.map((cell, c) => {
              const valid = isValidMove(r, c);
              const flipCount = getFlipCount(r, c);
              // 当前玩家是否可以操作（pve 只允许玩家1；pvp 双方都行）
              const canPlay = state.mode === 'pve' ? state.currentPlayer === 1 : true;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!valid || state.status !== 'playing' || !canPlay}
                  className={`relative flex items-center justify-center transition-all ${
                    valid && canPlay
                      ? 'cursor-pointer hover:bg-yellow-400/30 hover:scale-105'
                      : 'cursor-default'
                  }`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: '#15803d' }}
                >
                  {cell === 0 && valid && canPlay && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/5 h-3/5 rounded-full border-4 border-yellow-400 opacity-70 flex items-center justify-center text-xs text-yellow-300 font-bold">
                        {flipCount > 0 && flipCount}
                      </div>
                    </div>
                  )}
                  {cell === 1 && (
                    <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-gray-500 shadow-md"></div>
                  )}
                  {cell === 2 && (
                    <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-br from-white to-gray-300 border-2 border-gray-200 shadow-md"></div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
            {winnerPlayer === 1 ? (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-white mb-2 animate-pulse">
                  {state.mode === 'pve' ? '你赢了！' : '黑棋获胜！'}
                </div>
              </>
            ) : winnerPlayer === 2 ? (
              <>
                <div className="text-5xl mb-2">{state.mode === 'pve' ? '💔' : '🏆'}</div>
                <div className="text-4xl font-bold text-white mb-2 animate-pulse">
                  {state.mode === 'pve' ? '电脑获胜' : '白棋获胜！'}
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">🤝</div>
                <div className="text-4xl font-bold text-yellow-400 mb-2">平局！</div>
              </>
            )}
            <div className="text-xl text-white mb-2">
              {state.blackScore} - {state.whiteScore}
            </div>
            <button
              onClick={() => reset()}
              className="mt-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        {state.lastPass && state.status === 'playing' && (
          <div className="text-yellow-400 mb-1 animate-pulse">⚠️ 对方无合法落子，已跳过回合</div>
        )}
        <p>点击黄圈位置落子 | 翻转夹住的对方棋子 | 结束时棋子多者胜</p>
        <p>{state.currentPlayer === 1 ? '✕ 你的回合' : '○ 电脑回合'}</p>
      </div>

      <div className="flex gap-3 mt-3">
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重新开始
        </button>
      </div>
    </div>
  );
};