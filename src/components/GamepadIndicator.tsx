import { useGamepad } from '../hooks/useGamepad';

export const GamepadIndicator = () => {
  const { connected } = useGamepad();

  if (!connected) return null;

  return (
    <div className="fixed top-3 left-3 z-40 flex items-center gap-1.5">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-900/80 backdrop-blur-sm border border-emerald-500 rounded-lg shadow-lg text-xs">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-emerald-200 font-bold">🎮</span>
      </div>
    </div>
  );
};
