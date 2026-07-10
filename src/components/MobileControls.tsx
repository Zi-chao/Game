import { Direction } from '../types/game';

interface MobileControlsProps {
  onChangeDirection: (direction: Direction) => void;
  isPlaying: boolean;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan';
  label?: string;
}

const colorMap = {
  emerald: { bg: 'bg-emerald-700', hover: 'hover:bg-emerald-600', text: 'text-emerald-300' },
  blue: { bg: 'bg-blue-700', hover: 'hover:bg-blue-600', text: 'text-blue-300' },
  amber: { bg: 'bg-amber-700', hover: 'hover:bg-amber-600', text: 'text-amber-300' },
  rose: { bg: 'bg-rose-700', hover: 'hover:bg-rose-600', text: 'text-rose-300' },
  purple: { bg: 'bg-purple-700', hover: 'hover:bg-purple-600', text: 'text-purple-300' },
  cyan: { bg: 'bg-cyan-700', hover: 'hover:bg-cyan-600', text: 'text-cyan-300' },
};

export const MobileControls = ({ onChangeDirection, isPlaying, color = 'emerald', label }: MobileControlsProps) => {
  if (!isPlaying) return null;
  const c = colorMap[color];

  return (
    <div className="mt-3 select-none">
      {label && <div className={`text-xs text-center mb-1 ${c.text}`}>{label}</div>}
      <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto">
        <div></div>
        <button
          onTouchStart={(e) => { e.preventDefault(); onChangeDirection('UP'); }}
          onClick={() => onChangeDirection('UP')}
          className={`aspect-square ${c.bg} ${c.hover} text-white text-xl rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none`}
        >
          ↑
        </button>
        <div></div>
        <button
          onTouchStart={(e) => { e.preventDefault(); onChangeDirection('LEFT'); }}
          onClick={() => onChangeDirection('LEFT')}
          className={`aspect-square ${c.bg} ${c.hover} text-white text-xl rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none`}
        >
          ←
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); onChangeDirection('DOWN'); }}
          onClick={() => onChangeDirection('DOWN')}
          className={`aspect-square ${c.bg} ${c.hover} text-white text-xl rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none`}
        >
          ↓
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); onChangeDirection('RIGHT'); }}
          onClick={() => onChangeDirection('RIGHT')}
          className={`aspect-square ${c.bg} ${c.hover} text-white text-xl rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none`}
        >
          →
        </button>
      </div>
    </div>
  );
};

interface MobileShooterControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onAction?: () => void;
  isPlaying: boolean;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan';
  label?: string;
  actionLabel?: string;
}

export const MobileShooterControls = ({ onMoveLeft, onMoveRight, onAction, isPlaying, color = 'amber', label, actionLabel = '射击' }: MobileShooterControlsProps) => {
  if (!isPlaying) return null;
  const c = colorMap[color];

  return (
    <div className="mt-3 select-none">
      {label && <div className={`text-xs text-center mb-1 ${c.text}`}>{label}</div>}
      <div className="flex gap-2 justify-center items-center">
        <button
          onTouchStart={(e) => { e.preventDefault(); onMoveLeft(); }}
          className={`w-16 h-16 ${c.bg} ${c.hover} text-white text-2xl rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none font-bold`}
        >
          ←
        </button>
        {onAction && (
          <button
            onTouchStart={(e) => { e.preventDefault(); onAction(); }}
            className={`w-20 h-16 ${c.bg} ${c.hover} text-white text-sm rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none font-bold`}
          >
            {actionLabel}
          </button>
        )}
        <button
          onTouchStart={(e) => { e.preventDefault(); onMoveRight(); }}
          className={`w-16 h-16 ${c.bg} ${c.hover} text-white text-2xl rounded-lg flex items-center justify-center transition-all active:scale-95 touch-none font-bold`}
        >
          →
        </button>
      </div>
    </div>
  );
};