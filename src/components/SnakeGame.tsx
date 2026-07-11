import { useEffect, useCallback } from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { GameCanvas } from './GameCanvas';
import { ScorePanel } from './ScorePanel';
import { ControlButtons } from './ControlButtons';
import { GameOverlay } from './GameOverlay';
import { MobileControls } from './MobileControls';
import { ClearCacheButton } from './ClearCacheButton';
import { GameControls } from './GameControls';
import { OrientationPrompt } from './OrientationPrompt';

interface SnakeGameProps {
  onBack: () => void;
}

export const SnakeGame = ({ onBack }: SnakeGameProps) => {
  const { gameState, startGame, togglePause, resetGame, changeDirection } = useSnakeGame();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      if (key === ' ') {
        e.preventDefault();
        if (!gameState.isPlaying || gameState.isGameOver) {
          startGame();
        } else {
          togglePause();
        }
      } else if (key === 'r') {
        e.preventDefault();
        resetGame();
      }
      return;
    }

    switch (key) {
      case 'arrowup':
      case 'w':
        e.preventDefault();
        changeDirection('UP');
        break;
      case 'arrowdown':
      case 's':
        e.preventDefault();
        changeDirection('DOWN');
        break;
      case 'arrowleft':
      case 'a':
        e.preventDefault();
        changeDirection('LEFT');
        break;
      case 'arrowright':
      case 'd':
        e.preventDefault();
        changeDirection('RIGHT');
        break;
      case ' ':
        e.preventDefault();
        togglePause();
        break;
      case 'r':
        e.preventDefault();
        resetGame();
        break;
    }
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, startGame, togglePause, resetGame, changeDirection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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

      <MobileControls onChangeDirection={changeDirection} />

      <div className="mt-6 text-slate-400 text-sm text-center">
        <p className="hidden md:block">方向键控制移动 | 空格键开始/暂停 | R键重新开始</p>
        <p className="md:hidden">点击下方按钮控制方向</p>
      </div>
    </div>
  );
};