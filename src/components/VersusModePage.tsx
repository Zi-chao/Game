import { Page } from '../types/game';

interface VersusModePageProps {
  onSelectGame: (page: Page) => void;
  onBack: () => void;
}

interface GameCard {
  id: Page;
  title: string;
  description: string;
  p1Controls: string;
  p2Controls: string;
  emoji: string;
  gradient: string;
  borderColor: string;
  shadowColor: string;
}

const games: GameCard[] = [
  {
    id: 'snake-versus',
    title: '贪吃蛇对战',
    description: '两条蛇同时吃食物，吃得多者获胜',
    p1Controls: '玩家1: WASD (键盘)',
    p2Controls: '玩家2: 左摇杆/A键 (手柄)',
    emoji: '🐍',
    gradient: 'from-emerald-500 to-green-700',
    borderColor: 'border-emerald-400',
    shadowColor: 'shadow-emerald-500/50',
  },
  {
    id: 'plane-versus',
    title: '飞机大战对战',
    description: '双方对射，先击落对方三次获胜',
    p1Controls: '玩家1: WASD+空格 (键盘)',
    p2Controls: '玩家2: 左摇杆+A/RT (手柄)',
    emoji: '✈️',
    gradient: 'from-orange-500 to-red-700',
    borderColor: 'border-orange-400',
    shadowColor: 'shadow-orange-500/50',
  },
  {
    id: 'pong',
    title: '重力小球',
    description: '反弹球让对方接不住，先得5分获胜',
    p1Controls: '玩家1(底部): A/D (键盘)',
    p2Controls: '玩家2(顶部): 左摇杆 (手柄)',
    emoji: '🏓',
    gradient: 'from-purple-500 to-fuchsia-700',
    borderColor: 'border-purple-400',
    shadowColor: 'shadow-purple-500/50',
  },
];

export const VersusModePage = ({ onSelectGame, onBack }: VersusModePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <div className="relative z-10 max-w-5xl w-full">
        <div className="text-center mb-10 md:mb-12 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 mb-3">
            ⚔️ 双人对战
          </h1>
          <p className="text-slate-300 text-base md:text-lg">本地双人同屏对战（3款）</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                <div className="text-6xl md:text-7xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {game.emoji}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{game.title}</h2>
                <p className="text-slate-300 text-xs md:text-sm mb-3 line-clamp-2">
                  {game.description}
                </p>
                <div className="bg-slate-900/50 rounded-lg p-2 w-full space-y-1">
                  <div className="text-[10px] md:text-xs text-emerald-300">🟢 {game.p1Controls}</div>
                  <div className="text-[10px] md:text-xs text-blue-300">🔵 {game.p2Controls}</div>
                </div>
                <div
                  className={`mt-3 px-5 py-1.5 bg-gradient-to-r ${game.gradient} rounded-full text-white font-semibold text-sm group-hover:shadow-lg transition-all`}
                >
                  开始对战 →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};