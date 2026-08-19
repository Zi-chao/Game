import { useState, useCallback, useRef, useEffect } from 'react';
import { PongState, Ball } from '../types/game';

const HIGH_SCORE_KEY = 'pong_best';
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const PADDLE_SPEED = 9;
const BALL_SPEED_X = 2.5;
const BALL_SPEED_Y = 2.5;
const REQUIRED_SCORE = 5;

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

const createInitialBall = (): Ball => ({
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT / 2,
  vx: BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1),
  vy: BALL_SPEED_Y * (Math.random() > 0.5 ? 1 : -1),
  radius: BALL_RADIUS,
});

const createInitialState = (): PongState => ({
  ball: createInitialBall(),
  paddle1: {
    x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: GAME_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  },
  paddle2: {
    x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: 20,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  },
  score1: 0,
  score2: 0,
  winner: null,
  isPlaying: false,
  isPaused: false,
});

export const usePong = () => {
  const [state, setState] = useState<PongState>(createInitialState());
  const [, setTick] = useState(0);
  const render = useCallback(() => setTick(t => t + 1), []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const mobileMoveRef = useRef<{ p1L: boolean; p1R: boolean; p2L: boolean; p2R: boolean }>({
    p1L: false, p1R: false, p2L: false, p2R: false,
  });

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current !== null) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopLoop();
    keysPressed.current.clear();
    setState(createInitialState());
  }, [stopLoop]);

  const start = useCallback(() => {
    stopLoop();
    keysPressed.current.clear();
    setState({ ...createInitialState(), isPlaying: true });
  }, [stopLoop]);

  const togglePause = useCallback(() => {
    setState(prev => {
      if (!prev.isPlaying || prev.winner !== null) return prev;
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  // 主循环：当 isPlaying 切换时启动循环
  useEffect(() => {
    if (!state.isPlaying || state.winner !== null) {
      return;
    }

    let stopped = false;
    const loop = () => {
      if (stopped) return;
      const s = stateRef.current;
      if (!s.isPlaying || s.winner !== null) {
        gameLoopRef.current = null;
        return;
      }
      if (s.isPaused) {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      let { ball, paddle1, paddle2, score1, score2 } = s;

      // 玩家1：WASD 中的 A/D 或触屏
      if (keysPressed.current.has('a') || mobileMoveRef.current.p1L) {
        paddle1 = { ...paddle1, x: Math.max(0, paddle1.x - PADDLE_SPEED) };
      }
      if (keysPressed.current.has('d') || mobileMoveRef.current.p1R) {
        paddle1 = { ...paddle1, x: Math.min(GAME_WIDTH - PADDLE_WIDTH, paddle1.x + PADDLE_SPEED) };
      }
      // 玩家2：方向键或触屏
      if (keysPressed.current.has('arrowleft') || mobileMoveRef.current.p2L) {
        paddle2 = { ...paddle2, x: Math.max(0, paddle2.x - PADDLE_SPEED) };
      }
      if (keysPressed.current.has('arrowright') || mobileMoveRef.current.p2R) {
        paddle2 = { ...paddle2, x: Math.min(GAME_WIDTH - PADDLE_WIDTH, paddle2.x + PADDLE_SPEED) };
      }

      // 移动球
      ball = {
        ...ball,
        x: ball.x + ball.vx,
        y: ball.y + ball.vy,
      };

      // 左右墙壁反弹
      if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= GAME_WIDTH) {
        ball = { ...ball, vx: -ball.vx };
      }

      // 玩家1挡板碰撞（底部）
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= paddle1.y &&
        ball.y - ball.radius <= paddle1.y + paddle1.height &&
        ball.x >= paddle1.x &&
        ball.x <= paddle1.x + paddle1.width
      ) {
        const hitPos = (ball.x - paddle1.x) / paddle1.width;
        const angle = (hitPos - 0.5) * Math.PI / 3;
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.05;
        ball = {
          ...ball,
          vy: -Math.abs(Math.cos(angle) * speed),
          vx: Math.sin(angle) * speed,
          y: paddle1.y - ball.radius,
        };
      }

      // 玩家2挡板碰撞（顶部）
      if (
        ball.vy < 0 &&
        ball.y - ball.radius <= paddle2.y + paddle2.height &&
        ball.y + ball.radius >= paddle2.y &&
        ball.x >= paddle2.x &&
        ball.x <= paddle2.x + paddle2.width
      ) {
        const hitPos = (ball.x - paddle2.x) / paddle2.width;
        const angle = (hitPos - 0.5) * Math.PI / 3;
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.05;
        ball = {
          ...ball,
          vy: Math.abs(Math.cos(angle) * speed),
          vx: Math.sin(angle) * speed,
          y: paddle2.y + paddle2.height + ball.radius,
        };
      }

      // 球出界判定
      if (ball.y > GAME_HEIGHT) {
        score2 += 1;
        if (score2 >= REQUIRED_SCORE) {
          saveBest(score1, score2);
          stateRef.current = {
            ...s,
            ball,
            paddle1,
            paddle2,
            score1,
            score2,
            isPlaying: false,
            winner: 2,
          };
          setState(stateRef.current);
          return;
        }
        ball = { ...createInitialBall(), y: GAME_HEIGHT / 2, vy: -BALL_SPEED_Y };
      } else if (ball.y < 0) {
        score1 += 1;
        if (score1 >= REQUIRED_SCORE) {
          saveBest(score1, score2);
          stateRef.current = {
            ...s,
            ball,
            paddle1,
            paddle2,
            score1,
            score2,
            isPlaying: false,
            winner: 1,
          };
          setState(stateRef.current);
          return;
        }
        ball = { ...createInitialBall(), y: GAME_HEIGHT / 2, vy: BALL_SPEED_Y };
      }

      stateRef.current = {
        ...s,
        ball,
        paddle1,
        paddle2,
        score1,
        score2,
      };
      setState(stateRef.current);
      render();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      stopLoop();
    };
  }, [state.isPlaying, state.winner, render, stopLoop]);

  // 键盘监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      if (key === ' ') {
        e.preventDefault();
        setState(s => {
          if (!s.isPlaying || s.winner !== null) {
            return { ...createInitialState(), isPlaying: true };
          }
          return { ...s, isPaused: !s.isPaused };
        });
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
  }, [reset]);

  const setMobileMove = useCallback((player: 1 | 2, dir: 'left' | 'right', pressed: boolean) => {
    const key = `${player === 1 ? 'p1' : 'p2'}${dir === 'left' ? 'L' : 'R'}` as 'p1L' | 'p1R' | 'p2L' | 'p2R';
    mobileMoveRef.current[key] = pressed;
  }, []);

  // 触屏跟随：直接设置挡板 X 坐标（实时跟随手指）
  const setPaddlePos = useCallback((player: 1 | 2, x: number) => {
    const clamped = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, x));
    stateRef.current = {
      ...stateRef.current,
      paddle1: player === 1 ? { ...stateRef.current.paddle1, x: clamped } : stateRef.current.paddle1,
      paddle2: player === 2 ? { ...stateRef.current.paddle2, x: clamped } : stateRef.current.paddle2,
    };
    render();
  }, [render]);

  return {
    state,
    best: getBest(),
    requiredScore: REQUIRED_SCORE,
    start,
    reset,
    togglePause,
    setMobileMove,
    setPaddlePos,
    gameWidth: GAME_WIDTH,
    gameHeight: GAME_HEIGHT,
  };
};