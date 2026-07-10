import { AiSide } from '../types/game';

interface AiSideSelectorProps {
  mode: string;             // 'pve' | 'pvp'
  aiSide: AiSide;           // AI 执哪一方（1 或 2）
  onChangeMode: (mode: 'pve' | 'pvp') => void;
  onChangeAiSide: (side: AiSide) => void;
}

export const AiSideSelector = ({
  mode,
  aiSide,
  onChangeMode,
  onChangeAiSide,
}: AiSideSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
      {/* 模式选择 */}
      <div className="flex bg-slate-700/60 rounded-lg p-1 border border-slate-600">
        <button
          onClick={() => onChangeMode('pvp')}
          className={`px-3 py-1 rounded-md font-bold transition-all ${
            mode === 'pvp'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          👥 双人对战
        </button>
        <button
          onClick={() => {
            onChangeMode('pve');
            // 切换到人机时默认玩家先手（玩家1），如果 AI 是玩家1则改为玩家2
            if (aiSide !== 1 && aiSide !== 2) {
              onChangeAiSide(2);
            }
          }}
          className={`px-3 py-1 rounded-md font-bold transition-all ${
            mode === 'pve'
              ? 'bg-purple-600 text-white'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          🤖 人机对战
        </button>
      </div>

      {/* AI 先后手选择（仅在 pve 模式下显示） */}
      {mode === 'pve' && (
        <div className="flex bg-slate-700/60 rounded-lg p-1 border border-slate-600">
          <button
            onClick={() => onChangeAiSide(2)}
            className={`px-3 py-1 rounded-md font-bold transition-all ${
              aiSide === 2
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
            title="玩家先手（AI 后手）"
          >
            🙋 我先手
          </button>
          <button
            onClick={() => onChangeAiSide(1)}
            className={`px-3 py-1 rounded-md font-bold transition-all ${
              aiSide === 1
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
            title="AI 先手（玩家后手）"
          >
            🤖 AI先手
          </button>
        </div>
      )}
    </div>
  );
};