import { Page } from '../types/game';

interface SingleModePageProps {
  onSelectGame: (page: Page) => void;
  onBack: () => void;
}

interface GameCard {
  id: Page;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  borderColor: string;
  shadowColor: string;
}

const games: GameCard[] = [
  {
    id: 'snake',
    title: '贪吃蛇',
    description: '经典贪吃蛇',
    emoji: '🐍',
    gradient: 'from-emerald-500 to-green-700',
    borderColor: 'border-emerald-400',
    shadowColor: 'shadow-emerald-500/50',
  },
  {
    id: 'tetris',
    title: '俄罗斯方块',
    description: '经典方块消除',
    emoji: '🧩',
    gradient: 'from-purple-500 to-pink-700',
    borderColor: 'border-purple-400',
    shadowColor: 'shadow-purple-500/50',
  },
  {
    id: 'plane',
    title: '飞机大战',
    description: '驾驶战机击落敌机',
    emoji: '✈️',
    gradient: 'from-orange-500 to-red-700',
    borderColor: 'border-orange-400',
    shadowColor: 'shadow-orange-500/50',
  },
  {
    id: 'minesweeper',
    title: '扫雷',
    description: '逻辑推理挑战',
    emoji: '💣',
    gradient: 'from-slate-500 to-gray-700',
    borderColor: 'border-slate-400',
    shadowColor: 'shadow-slate-500/50',
  },
  {
    id: 'tank',
    title: '坦克大战',
    description: '坦克射击游戏',
    emoji: '🪖',
    gradient: 'from-amber-600 to-yellow-700',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
  },
  {
    id: 'memory',
    title: '记忆翻牌',
    description: '考验记忆',
    emoji: '🧠',
    gradient: 'from-rose-500 to-pink-700',
    borderColor: 'border-rose-400',
    shadowColor: 'shadow-rose-500/50',
  },
  {
    id: 'hop',
    title: '跳跳乐',
    description: '一笔画跳棋',
    emoji: '🦘',
    gradient: 'from-fuchsia-500 to-pink-700',
    borderColor: 'border-fuchsia-400',
    shadowColor: 'shadow-fuchsia-500/50',
  },
];

export const SingleModePage = ({ onSelectGame, onBack }: SingleModePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <div className="relative z-10 max-w-6xl w-full">
        <div className="text-center mb-10 md:mb-12 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-3">
            🎯 单人模式
          </h1>
          <p className="text-slate-300 text-base md:text-lg">选择一款游戏开始挑战（7款）</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 md:p-6 border-2 ${game.borderColor} ${game.shadowColor} shadow-xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
              ></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-5xl md:text-6xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {game.emoji}
                </div>
                <h2 className="text-base md:text-lg font-bold text-white mb-1">{game.title}</h2>
                <p className="text-slate-300 text-xs mb-3 line-clamp-2">{game.description}</p>
                <div
                  className={`px-3 py-1 bg-gradient-to-r ${game.gradient} rounded-full text-white font-semibold text-xs group-hover:shadow-lg transition-all`}
                >
                  开始 →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};