import { OthelloMode } from '../types/game';

interface ModeSelectDialogProps {
  gameTitle: string;
  emoji: string;
  onSelectMode: (mode: OthelloMode) => void;
  onCancel: () => void;
}

export const ModeSelectDialog = ({ gameTitle, emoji, onSelectMode, onCancel }: ModeSelectDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 max-w-sm w-full border-2 border-slate-600 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{gameTitle}</h2>
          <p className="text-slate-400 text-sm">请选择游戏模式</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelectMode('pve')}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🤖</span>
            <span>人机对战</span>
          </button>

          <button
            onClick={() => onSelectMode('pvp')}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">👥</span>
            <span>双人对战</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium text-sm transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};