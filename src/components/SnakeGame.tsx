import { useEffect, useRef } from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { GameCanvas } from './GameCanvas';
import { ScorePanel } from './ScorePanel';
import { ControlButtons } from './ControlButtons';
import { GameOverlay } from './GameOverlay';
import { Joystick } from './Joystick';
import { ClearCacheButton } from './ClearCacheButton';
import { GameControls } from './GameControls';
import { OrientationPrompt } from './OrientationPrompt';
import { useGamepad } from '../hooks/useGamepad';
import { Direction } from '../types/game';

interface SnakeGameProps {
  onBack: () => void;
}

export const SnakeGame = ({ onBack }: SnakeGameProps) => {
  const { gameState, startGame, togglePause, resetGame, changeDirection } = useSnakeGame();
  const gamepad = useGamepad();
  const lastDirRef = useRef<Direction | null>(null);

  // 手柄方向控制
  useEffect(() => {
    if (!gamepad.connected || !gamepad.direction) return;
    if (gamepad.direction !== lastDirRef.current) {
      lastDirRef.current = gamepad.direction;
      changeDirection(gamepad.direction);
    }
  }, [gamepad.direction, gamepad.connected, changeDirection]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center pt-[85px] p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <ClearCacheButton storageKeys={['snake_high_score']} onCleared={() => window.location.reload()} />
      <GameControls />
      <OrientationPrompt mode="portrait" />

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600 mb-6 mt-8">
        🐍 贪吃蛇
      </h1>

      <ScorePanel score={gameState.score} highScore={gameState.highScore} />

      <div className="relative">
        <GameCanvas gameState={gameState} />
        <GameOverlay gameState={gameState} />
      </div>

      <ControlButtons
        isPlaying={gameState.isPlaying}
        isPaused={gameState.isPaused}
        isGameOver={gameState.isGameOver}
        onStart={startGame}
        onPause={togglePause}
        onReset={resetGame}
      />

      <div className="md:hidden mt-3">
        <Joystick
          onChange={(dir) => { if (dir) changeDirection(dir); }}
          color="#22c55e"
          size={130}
          label="🟢 摇杆"
        />
      </div>

      <div className="mt-6 text-slate-400 text-sm text-center">
        <p className="hidden md:block">方向键控制移动 | 空格键开始/暂停 | R键重新开始</p>
        <p className="md:hidden">推动摇杆控制方向</p>
      </div>
    </div>
  );
};