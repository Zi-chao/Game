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

      // 检测碰撞：蛇头相撞也算死亡（不能穿过）
      const s1Head = snake1[0];
      const s2Head = snake2[0];
      const s1Wall = checkWallCollision(s1Head);
      const s1Self = checkSelfCollision(snake1);
      const s1HitS2Body = checkBodyCollision(snake1, prev.snake2.slice(1));
      const s1HeadHitS2Head = s1Head.x === s2Head.x && s1Head.y === s2Head.y;
      const s2Wall = checkWallCollision(s2Head);
      const s2Self = checkSelfCollision(snake2);
      const s2HitS1Body = checkBodyCollision(snake2, prev.snake1.slice(1));
      const s2HeadHitS1Head = s1HeadHitS2Head;

      const s1Dead = s1Wall || s1Self || s1HitS2Body || s1HeadHitS2Head;
      const s2Dead = s2Wall || s2Self || s2HitS1Body || s2HeadHitS1Head;

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
      const s1EatFood = snake1[0].x === food.x && snake1[0].y === food.y;
      const s2EatFood = snake2[0].x === food.x && snake2[0].y === food.y;
      // 蛇头相撞时位置重叠，不吃食物
      if (s1EatFood && !s1HeadHitS2Head) {
        snake1 = growSnakeAt(snake1);
        score1 += 1;
        food = getRandomVersusFood(snake1, snake2);
      }
      if (s2EatFood && !s2HeadHitS1Head) {
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

  // 手柄轮询 - 玩家2用手柄控制（左摇杆/D-pad 方向，Start 开始，A 确认）
  useEffect(() => {
    let raf = 0;
    const poll = () => {
      const gps = navigator.getGamepads?.();
      const gp = gps?.[0];
      if (gp) {
        // 玩家2方向：左摇杆 + D-pad
        const lx = gp.axes[0] || 0;
        const ly = gp.axes[1] || 0;
        const dup = gp.buttons[12]?.pressed || false;
        const ddown = gp.buttons[13]?.pressed || false;
        const dleft = gp.buttons[14]?.pressed || false;
        const dright = gp.buttons[15]?.pressed || false;
        // 上下方向（取最大）
        if (ly < -0.3 || dup) changeDirection2('UP');
        else if (ly > 0.3 || ddown) changeDirection2('DOWN');
        if (lx < -0.3 || dleft) changeDirection2('LEFT');
        else if (lx > 0.3 || dright) changeDirection2('RIGHT');
        // Start 键：开始/暂停
        if (gp.buttons[9]?.pressed) {
          if (!state.isPlaying || state.winner !== null) start();
          else togglePause();
        }
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [changeDirection2, state.isPlaying, state.winner, start, togglePause]);

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