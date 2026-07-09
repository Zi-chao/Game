import { Direction } from '../types/game';

interface MobileControlsProps {
  onChangeDirection: (direction: Direction) => void;
  isPlaying: boolean;
}

export const MobileControls = ({ onChangeDirection, isPlaying }: MobileControlsProps) => {
  if (!isPlaying) return null;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
        <div></div>
        <button
          onClick={() => onChangeDirection('UP')}
          className="aspect-square bg-slate-700 hover:bg-slate-600 text-white text-2xl rounded-xl flex items-center justify-center transition-all active:scale-95"
        >
          ↑
        </button>
        <div></div>
        <button
          onClick={() => onChangeDirection('LEFT')}
          className="aspect-square bg-slate-700 hover:bg-slate-600 text-white text-2xl rounded-xl flex items-center justify-center transition-all active:scale-95"
        >
          ←
        </button>
        <button
          onClick={() => onChangeDirection('DOWN')}
          className="aspect-square bg-slate-700 hover:bg-slate-600 text-white text-2xl rounded-xl flex items-center justify-center transition-all active:scale-95"
        >
          ↓
        </button>
        <button
          onClick={() => onChangeDirection('RIGHT')}
          className="aspect-square bg-slate-700 hover:bg-slate-600 text-white text-2xl rounded-xl flex items-center justify-center transition-all active:scale-95"
        >
          →
        </button>
      </div>
    </div>
  );
};