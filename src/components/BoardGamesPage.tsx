import { Page } from '../types/game';

interface BoardGamesPageProps {
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
  modes: string;
}

const games: GameCard[] = [
  {
    id: 'gomoku',
    title: '五子棋',
    description: '15×15 标准棋盘，五子连珠获胜',
    emoji: '⚫',
    gradient: 'from-amber-500 to-orange-700',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
    modes: '人机/双人',
  },
  {
    id: 'othello',
    title: '黑白棋',
    description: '奥赛罗，翻转对手棋子占更多领地',
    emoji: '⚪',
    gradient: 'from-emerald-500 to-green-700',
    borderColor: 'border-emerald-400',
    shadowColor: 'shadow-emerald-500/50',
    modes: '人机/双人',
  },
  {
    id: 'tictactoe',
    title: '三连棋',
    description: '经典井字棋，三子连线获胜',
    emoji: '❌',
    gradient: 'from-blue-500 to-cyan-700',
    borderColor: 'border-blue-400',
    shadowColor: 'shadow-blue-500/50',
    modes: '人机/双人',
  },
  {
    id: 'connectfour',
    title: '四子棋',
    description: '重力下落，四子连成一线获胜',
    emoji: '🔴',
    gradient: 'from-rose-500 to-pink-700',
    borderColor: 'border-rose-400',
    shadowColor: 'shadow-rose-500/50',
    modes: '人机/双人',
  },
  {
    id: 'xiangqi',
    title: '中国象棋',
    description: '经典国粹，吃掉对方帅/将获胜',
    emoji: '🐘',
    gradient: 'from-red-500 to-orange-700',
    borderColor: 'border-red-400',
    shadowColor: 'shadow-red-500/50',
    modes: '人机/双人',
  },
  {
    id: 'chess',
    title: '国际象棋',
    description: '经典西洋棋，吃掉对方王获胜',
    emoji: '♟️',
    gradient: 'from-blue-500 to-indigo-700',
    borderColor: 'border-blue-400',
    shadowColor: 'shadow-blue-500/50',
    modes: '人机/双人',
  },
];

export const BoardGamesPage = ({ onSelectGame, onBack }: BoardGamesPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl"></div>
      </div>

      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <div className="relative z-10 max-w-5xl w-full">
        <div className="text-center mb-10 md:mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 mb-3">
          🎯 棋类专区
        </h1>
        <p className="text-slate-300 text-base md:text-lg">6款经典棋类游戏（人机/双人）</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
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
                <p className="text-slate-300 text-xs mb-2 line-clamp-2 min-h-[2rem]">
                  {game.description}
                </p>
                <div className="text-[10px] text-amber-300 mb-3">🎮 {game.modes}</div>
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