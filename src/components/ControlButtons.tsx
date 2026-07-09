interface ControlButtonsProps {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const ControlButtons = ({
  isPlaying,
  isPaused,
  isGameOver,
  onStart,
  onPause,
  onReset,
}: ControlButtonsProps) => {
  return (
    <div className="flex gap-3 mt-4 flex-wrap justify-center">
      {!isPlaying || isGameOver ? (
        <button
          onClick={onStart}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-emerald-600/30"
        >
          {isGameOver ? '再来一局' : '开始游戏'}
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-amber-600/30"
        >
          {isPaused ? '继续游戏' : '暂停'}
        </button>
      )}
      <button
        onClick={onReset}
        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        重新开始
      </button>
    </div>
  );
};