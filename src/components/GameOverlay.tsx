import { SnakeGameState } from '../types/game';

interface GameOverlayProps {
  gameState: SnakeGameState;
}

export const GameOverlay = ({ gameState }: GameOverlayProps) => {
  if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
      {gameState.isGameOver ? (
        <>
          <div className="text-4xl font-bold text-red-500 mb-4 animate-pulse">游戏结束</div>
          <div className="text-2xl text-white mb-6">最终得分: {gameState.score}</div>
          {gameState.score >= gameState.highScore && gameState.score > 0 && (
            <div className="text-xl text-yellow-400 mb-4 animate-bounce">🎉 新纪录！</div>
          )}
        </>
      ) : gameState.isPaused ? (
        <div className="text-4xl font-bold text-amber-400">游戏暂停</div>
      ) : (
        <>
          <div className="text-4xl font-bold text-emerald-400 mb-4">贪吃蛇</div>
          <div className="text-lg text-slate-300 text-center mb-6 max-w-xs">
            使用方向键控制蛇的移动<br />
            吃到食物得分，不要碰到墙壁或自己！
          </div>
        </>
      )}
    </div>
  );
};