import { useState } from 'react';
import { useMemoryGame, MemoryDifficulty } from '../hooks/useMemoryGame';
import { GRID_SIZES } from '../utils/memoryUtils';

interface MemoryGameProps {
  onBack: () => void;
}

const DIFFICULTY_LABELS: Record<MemoryDifficulty, string> = {
  easy: '简单 4×3',
  medium: '中等 4×4',
  hard: '困难 6×4',
};

export const MemoryGame = ({ onBack }: MemoryGameProps) => {
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('easy');
  const { state, bestMoves, reset, flipCard } = useMemoryGame(difficulty);
  const config = GRID_SIZES[difficulty];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 mb-4 mt-8">
        🧠 记忆翻牌
      </h1>

      {/* 难度选择 */}
      <div className="flex gap-2 mb-3">
        {(Object.keys(GRID_SIZES) as MemoryDifficulty[]).map(diff => (
          <button
            key={diff}
            onClick={() => setDifficulty(diff)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              difficulty === diff
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {DIFFICULTY_LABELS[diff]}
          </button>
        ))}
      </div>

      {/* 信息栏 */}
      <div className="flex gap-3 mb-4">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">步数</div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{state.moves}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">已配对</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{state.matches}/{config.pairs}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">用时</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{state.time}s</div>
        </div>
        {bestMoves > 0 && (
          <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="text-slate-400 text-xs">最佳</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">{bestMoves}</div>
          </div>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all transform hover:scale-105"
        >
          🔄
        </button>
      </div>

      {/* 卡片网格 */}
      <div
        className="inline-grid gap-2"
        style={{ gridTemplateColumns: `repeat(${config.cols}, 80px)` }}
      >
        {state.cards.map(card => (
          <button
            key={card.id}
            onClick={() => flipCard(card.id)}
            disabled={card.isMatched || card.isFlipped}
            className={`h-20 rounded-xl font-bold text-4xl transition-all transform ${
              card.isMatched
                ? 'bg-emerald-500/30 border-2 border-emerald-400 scale-95 opacity-60'
                : card.isFlipped
                ? 'bg-rose-500 border-2 border-rose-300 -translate-y-1'
                : 'bg-gradient-to-br from-rose-600 to-pink-700 border-2 border-rose-400 hover:scale-105 hover:-translate-y-1 shadow-lg cursor-pointer'
            }`}
            style={{ width: 80, height: 80 }}
          >
            {card.isFlipped || card.isMatched ? card.emoji : '?'}
          </button>
        ))}
      </div>

      {state.status === 'won' && (
        <div className="mt-6 text-center">
          <div className="text-3xl font-bold text-emerald-400 mb-2 animate-bounce">🎉 全部配对成功！</div>
          <div className="text-slate-300">步数: {state.moves} | 用时: {state.time}秒</div>
          {state.moves === bestMoves && (
            <div className="text-yellow-400 mt-1 animate-pulse">⭐ 新纪录！</div>
          )}
        </div>
      )}

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击两张相同图案的卡片即可消除</p>
      </div>
    </div>
  );
};