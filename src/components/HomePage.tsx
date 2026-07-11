import { useState } from 'react';
import { Page } from '../types/game';
import { readOrientationDisabled } from './OrientationPrompt';

interface HomePageProps {
  onSelectMode: (page: Page) => void;
}

interface ModeCard {
  id: Page;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  borderColor: string;
  shadowColor: string;
}

const ORIENTATION_DISABLED_KEY = 'orientation_recommendation_disabled';

const modes: ModeCard[] = [
  {
    id: 'single-mode',
    title: '单人模式',
    description: '挑战各种经典游戏',
    emoji: '🎯',
    gradient: 'from-cyan-500 to-blue-700',
    borderColor: 'border-cyan-400',
    shadowColor: 'shadow-cyan-500/50',
  },
  {
    id: 'versus-mode',
    title: '双人对战',
    description: '本地双人对战游戏',
    emoji: '⚔️',
    gradient: 'from-rose-500 to-pink-700',
    borderColor: 'border-rose-400',
    shadowColor: 'shadow-rose-500/50',
  },
  {
    id: 'board-games',
    title: '棋类专区',
    description: '棋类游戏（人机/双人）',
    emoji: '🎲',
    gradient: 'from-amber-500 to-yellow-700',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
  },
];

export const HomePage = ({ onSelectMode }: HomePageProps) => {
  const [orientationDisabled, setOrientationDisabled] = useState(() => readOrientationDisabled());
  const [showHelp, setShowHelp] = useState(false);

  const handleToggle = () => {
    const next = !orientationDisabled;
    setOrientationDisabled(next);
    localStorage.setItem(ORIENTATION_DISABLED_KEY, String(next));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 animate-pulse">
            🎮 小游戏
          </h1>
          <p className="text-slate-300 text-lg md:text-xl">选择游戏模式开始你的挑战之旅</p>
          <div className="mt-4 flex justify-center gap-2 text-2xl">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
        </div>

        {/* 横竖屏推荐开关 - 放在标题下方、模式卡片上方，更显眼 */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-600 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">📱↔️</span>
              <div>
                <div className="text-white font-semibold text-base">横竖屏推荐</div>
                <div className="text-slate-400 text-xs">进入游戏时提醒旋转设备方向</div>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                orientationDisabled ? 'bg-slate-600' : 'bg-cyan-500'
              }`}
              title={orientationDisabled ? '点击开启' : '点击关闭'}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  orientationDisabled ? 'left-0.5' : 'left-7'
                }`}
              />
            </button>

            <button
              onClick={() => setShowHelp(v => !v)}
              className="w-7 h-7 rounded-full border-2 border-slate-400 text-slate-200 text-sm flex items-center justify-center hover:bg-slate-700 hover:border-slate-300 hover:text-white transition-all flex-shrink-0"
              title="查看说明"
            >
              ?
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 md:p-10 border-2 ${mode.borderColor} ${mode.shadowColor} shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}
              ></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl md:text-8xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {mode.emoji}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{mode.title}</h2>
                <p className="text-slate-300 text-sm md:text-base mb-6">{mode.description}</p>
                <div
                  className={`px-6 py-2 bg-gradient-to-r ${mode.gradient} rounded-full text-white font-semibold group-hover:shadow-lg transition-all`}
                >
                  进入 →
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>使用方向键 / WASD / 空格键操作游戏</p>
        </div>

        {showHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-slate-400 text-slate-200 text-sm flex items-center justify-center">?</span>
                  横竖屏推荐说明
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-slate-400 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="text-sm text-slate-300 space-y-2">
                <p>• <span className="text-cyan-400">开启</span>：进入游戏时若方向不符，会弹出全屏提示（需手动关闭）</p>
                <p>• <span className="text-slate-400">关闭</span>：进入游戏时仅在右上角显示小提示，不阻挡游戏</p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                知道了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};