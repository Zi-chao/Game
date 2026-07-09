import { useState, useCallback, useEffect, useRef } from 'react';
import { VersusSnakeState, Direction } from '../types/game';
import {
  getVersusInitialSnake1,
  getVersusInitialSnake2,
  moveSnakeByDirection,
  checkWallCollision,
  checkSelfCollision,
  checkBodyCollision,
  getRandomVersusFood,
  growSnakeAt,
  isValidDirectionChange,
} from '../utils/versusUtils';

const HIGH_SCORE_KEY = 'versus_snake_best';

const getBest = (): { p1: number; p2: number } => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? JSON.parse(saved) : { p1: 0, p2: 0 };
};

const saveBest = (p1: number, p2: number) => {
  const current = getBest();
  if (p1 > current.p1 || p2 > current.p2) {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify({
      p1: Math.max(p1, current.p1),
      p2: Math.max(p2, current.p2),
    }));
  }
};

const MOVE_INTERVAL = 140; // 毫秒

export const useVersusSnake = () => {
  const [state, setState] = useState<VersusSnakeState>(() => ({
    snake1: getVersusInitialSnake1(),
    snake2: getVersusInitialSnake2(),
    food: getRandomVersusFood(getVersusInitialSnake1(), getVersusInitialSnake2()),
    direction1: 'RIGHT',
    direction2: 'LEFT',
    score1: 0,
    score2: 0,
    winner: null,
    isPlaying: false,
    isPaused: false,
  }));

  const direction1Ref = useRef<Direction>('RIGHT');
  const direction2Ref = useRef<Direction>('LEFT');
  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const reset = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    const s1 = getVersusInitialSnake1();
    const s2 = getVersusInitialSnake2();
    direction1Ref.current = 'RIGHT';
    direction2Ref.current = 'LEFT';
    setState({
      snake1: s1,
      snake2: s2,
      food: getRandomVersusFood(s1, s2),
      direction1: 'RIGHT',
      direction2: 'LEFT',
      score1: 0,
      score2: 0,
      winner: null,
      isPlaying: false,
      isPaused: false,
    });
  }, []);

  const start = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    const s1 = getVersusInitialSnake1();
    const s2 = getVersusInitialSnake2();
    direction1Ref.current = 'RIGHT';
    direction2Ref.current = 'LEFT';
    setState({
      snake1: s1,
      snake2: s2,
      food: getRandomVersusFood(s1, s2),
      direction1: 'RIGHT',
      direction2: 'LEFT',
      score1: 0,
      score2: 0,
      winner: null,
      isPlaying: true,
      isPaused: false,
    });
    gameLoopRef.current = window.setInterval(gameLoop, MOVE_INTERVAL);
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => {
      if (!prev.isPlaying || prev.winner !== null) return prev;
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  const changeDirection1 = useCallback((dir: Direction) => {
    if (!isValidDirectionChange(direction1Ref.current, dir)) return;
    direction1Ref.current = dir;
    setState(prev => ({ ...prev, direction1: dir }));
  }, []);

  const changeDirection2 = useCallback((dir: Direction) => {
    if (!isValidDirectionChange(direction2Ref.current, dir)) return;
    direction2Ref.current = dir;
    setState(prev => ({ ...prev, direction2: dir }));
  }, []);

  const gameLoop = useCallback(() => {
    setState(prev => {
      if (!prev.isPlaying || prev.isPaused || prev.winner !== null) return prev;

      let snake1 = moveSnakeByDirection(prev.snake1, direction1Ref.current);
      let snake2 = moveSnakeByDirection(prev.snake2, direction2Ref.current);
      let score1 = prev.score1;
      let score2 = prev.score2;

      // 检测碰撞
      const s1Wall = checkWallCollision(snake1[0]);
      const s1Self = checkSelfCollision(snake1);
      const s1HitS2 = checkBodyCollision(snake1, prev.snake2);
      const s2Wall = checkWallCollision(snake2[0]);
      const s2Self = checkSelfCollision(snake2);
      const s2HitS1 = checkBodyCollision(snake2, prev.snake1);

      const s1Dead = s1Wall || s1Self || s1HitS2;
      const s2Dead = s2Wall || s2Self || s2HitS1;

      if (s1Dead || s2Dead) {
        let winner: 0 | 1 | 2 = 0;
        if (s1Dead && !s2Dead) winner = 2;
        else if (!s1Dead && s2Dead) winner = 1;
        else if (s1Dead && s2Dead) {
          // 同时死，分高者胜
          winner = score1 > score2 ? 1 : score2 > score1 ? 2 : 0;
        }
        saveBest(score1, score2);
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        return {
          ...prev,
          snake1,
          snake2,
          score1,
          score2,
          winner,
          isPlaying: false,
        };
      }

      let food = prev.food;
      // 玩家1吃食物
      if (snake1[0].x === food.x && snake1[0].y === food.y) {
        snake1 = growSnakeAt(snake1);
        score1 += 1;
        food = getRandomVersusFood(snake1, snake2);
      }
      // 玩家2吃食物
      else if (snake2[0].x === food.x && snake2[0].y === food.y) {
        snake2 = growSnakeAt(snake2);
        score2 += 1;
        food = getRandomVersusFood(snake1, snake2);
      }

      return {
        ...prev,
        snake1,
        snake2,
        food,
        score1,
        score2,
      };
    });
  }, []);

  // 键盘监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      // 玩家1：WASD
      if (key === 'w') changeDirection1('UP');
      else if (key === 's') changeDirection1('DOWN');
      else if (key === 'a') changeDirection1('LEFT');
      else if (key === 'd') changeDirection1('RIGHT');
      // 玩家2：方向键
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeDirection2('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeDirection2('DOWN');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changeDirection2('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        changeDirection2('RIGHT');
      } else if (key === ' ') {
        e.preventDefault();
        if (!state.isPlaying || state.winner !== null) {
          start();
        } else {
          togglePause();
        }
      } else if (key === 'r') {
        e.preventDefault();
        reset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.isPlaying, state.winner, changeDirection1, changeDirection2, start, togglePause, reset]);

  // 卸载清理
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  return {
    state,
    best: getBest(),
    start,
    reset,
    togglePause,
    changeDirection1,
    changeDirection2,
  };
};