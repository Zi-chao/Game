import { useState, useCallback, useEffect, useRef } from 'react';
import { SnakeGameState, Direction } from '../types/game';
import {
  getInitialSnake,
  getRandomFood,
  moveSnake,
  checkCollision,
  checkFoodCollision,
  growSnake,
  getSpeed,
  isValidDirectionChange,
} from '../utils/gameUtils';

const HIGH_SCORE_KEY = 'snake_high_score';

export const useSnakeGame = () => {
  const [gameState, setGameState] = useState<SnakeGameState>(() => {
    const snake = getInitialSnake();
    return {
      snake,
      food: getRandomFood(snake),
      direction: 'RIGHT',
      score: 0,
      highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10),
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
    };
  });

  const directionRef = useRef<Direction>(gameState.direction);
  const gameLoopRef = useRef<number | null>(null);

  const resetGame = useCallback(() => {
    const snake = getInitialSnake();
    setGameState(prev => ({
      snake,
      food: getRandomFood(snake),
      direction: 'RIGHT',
      score: 0,
      highScore: prev.highScore,
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
    }));
    directionRef.current = 'RIGHT';
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
    }));
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const changeDirection = useCallback((newDirection: Direction) => {
    if (!isValidDirectionChange(directionRef.current, newDirection)) {
      return;
    }
    directionRef.current = newDirection;
    setGameState(prev => ({
      ...prev,
      direction: newDirection,
    }));
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying || prev.isPaused || prev.isGameOver) {
        return prev;
      }

      const newSnake = moveSnake(prev.snake, directionRef.current);

      if (checkCollision(newSnake)) {
        const newHighScore = Math.max(prev.score, prev.highScore);
        localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
        return {
          ...prev,
          snake: newSnake,
          isPlaying: false,
          isGameOver: true,
          highScore: newHighScore,
        };
      }

      let updatedSnake = newSnake;
      let updatedFood = prev.food;
      let updatedScore = prev.score;

      if (checkFoodCollision(newSnake, prev.food)) {
        updatedSnake = growSnake(newSnake);
        updatedFood = getRandomFood(updatedSnake);
        updatedScore = prev.score + 1;
      }

      return {
        ...prev,
        snake: updatedSnake,
        food: updatedFood,
        score: updatedScore,
      };
    });
  }, []);

  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
      const speed = getSpeed(gameState.score);
      gameLoopRef.current = window.setInterval(gameLoop, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.score, gameLoop]);

  return {
    gameState,
    startGame,
    togglePause,
    resetGame,
    changeDirection,
  };
};