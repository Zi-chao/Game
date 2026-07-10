import { useEffect, useRef } from 'react';
import { useTicTacToe } from '../hooks/useTicTacToe';
import { OthelloMode } from '../types/game';

interface TicTacToeGameProps {
  onBack: () => void;
}

export const TicTacToeGame = ({ onBack }: TicTacToeGameProps) => {
  const { state, best, makeMove, aiMakeMove, reset, setMode } = useTicTacToe();
  const aiTimerRef = useRef<number | null>(null);

  // 从sessionStorage读取模式
  useEffect(() => {
    const savedMode = sessionStorage.getItem('game_mode_tictactoe') as OthelloMode | null;
    if (savedMode && (savedMode === 'pve' || savedMode === 'pvp')) {
      setMode(savedMode);
    }
  }, [setMode]);

  // AI 自动落子
  useEffect(() => {
    if (state.mode === 'pve' && state.currentPlayer === 2 && state.status === 'playing') {
      aiTimerRef.current = window.setTimeout(() => {
        aiMakeMove();
      }, 400);
      return () => {
        if (aiTimerRef.current) {
          clearTimeout(aiTimerRef.current);
          aiTimerRef.current = null;
        }
      };
    }
  }, [state.currentPlayer, state.status, state.mode, aiMakeMove]);

  const handleCellClick = (index: number) => {
    if (state.status !== 'playing') return;
    if (state.board[index] !== 0) return;
    if (state.mode === 'pve' && state.currentPlayer === 2) return;
    makeMove(index);
  };

  const renderCell = (index: number) => {
    const value = state.board[index];
    const isWinning = state.winningLine?.includes(index);

    return (
    <button
      key={index}
      onClick={() => handleCellClick(index)}
      disabled={value !== 0 || (state.mode === 'pve' && state.currentPlayer === 2)}
      className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center text-5xl md:text-6xl font-bold rounded-xl transition-all ${
        isWinning
          ? 'bg-amber-500/30 border-2 border-amber-400 animate-pulse'
          : value !== 0
          ? 'bg-slate-700/30 cursor-not-allowed border-2 border-slate-700'
          : state.status === 'playing' && !(state.mode === 'pve' && state.currentPlayer === 2)
          ? 'bg-slate-800/50 hover:bg-cyan-700/30 border-2 border-slate-700 hover:scale-105 cursor-pointer'
          : 'bg-slate-800/30 border-2 border-slate-800 cursor-not-allowed'
      }`}
    >
        {value === 1 && <span className="text-blue-400">✕</span>}
        {value === 2 && <span className="text-rose-400">○</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 mb-4 mt-8">
        ❌⭕ 三连棋
      </h1>

      {/* 模式选择 */}
      <div className="flex gap-2 mb-3">
        {(['pve', 'pvp'] as OthelloMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              state.mode === mode
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {mode === 'pve' ? '🤖 人机对战' : '👥 双人对战'}
          </button>
        ))}
      </div>

      {/* 信息栏 */}
      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">当前</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {state.currentPlayer === 1 ? (
              <span className="text-blue-400">✕ 玩家1</span>
            ) : (
              <span className="text-rose-400">○ {state.mode === 'pve' ? '电脑' : '玩家2'}</span>
            )}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">战绩</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {best.wins}胜 {best.losses}负 {best.draws}平
          </div>
        </div>
      </div>

      {/* 棋盘 */}
      <div className="relative">
        <div className="inline-grid grid-cols-3 gap-2 p-3 bg-slate-800 rounded-2xl border-4 border-blue-700 shadow-2xl">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(renderCell)}
        </div>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
            {state.winner === 1 ? (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-blue-400 mb-2 animate-pulse">
                  {state.mode === 'pve' ? '你赢了！' : '玩家1获胜！'}
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">{state.mode === 'pve' ? '💔' : '🏆'}</div>
                <div className="text-4xl font-bold text-rose-400 mb-2 animate-pulse">
                  {state.mode === 'pve' ? '电脑获胜' : '玩家2获胜！'}
                </div>
              </>
            )}
            <button
              onClick={() => reset()}
              className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
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
              className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
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
        <p>点击空格落子 | 三子连线获胜</p>
      </div>
    </div>
  );
};