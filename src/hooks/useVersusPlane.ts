import { useState, useCallback, useEffect, useRef } from 'react';
import { VersusPlaneState, VersusPlaneBullet } from '../types/game';

const HIGH_SCORE_KEY = 'versus_plane_best';
const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 36;
const PLAYER_SPEED = 4;
const BULLET_SPEED = 7;
const BULLET_WIDTH = 6;
const FIRE_INTERVAL = 350;
const REQUIRED_SCORE = 3; // 需要击中对方 3 次获胜

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

const checkHit = (
  bullet: VersusPlaneBullet,
  targetX: number,
): boolean => {
  // 玩家1在底部（y = GAME_HEIGHT - PLAYER_HEIGHT），玩家2在顶部（y = 0）
  const targetY = bullet.owner === 1
    ? 0  // 玩家1的子弹向上，目标是玩家2（在顶部）
    : GAME_HEIGHT - PLAYER_HEIGHT; // 玩家2的子弹向下，目标是玩家1（在底部）

  return (
    bullet.x >= targetX &&
    bullet.x <= targetX + PLAYER_WIDTH &&
    bullet.y >= targetY &&
    bullet.y <= targetY + PLAYER_HEIGHT
  );
};

export const useVersusPlane = () => {
  const [state, setState] = useState<VersusPlaneState>(() => ({
    player1X: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    player2X: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    bullets: [],
    score1: 0,
    score2: 0,
    lives1: 3,
    lives2: 3,
    winner: null,
    isPlaying: false,
    isPaused: false,
  }));

  const gameLoopRef = useRef<number | null>(null);
  const lastShot1Ref = useRef<number>(0);
  const lastShot2Ref = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const reset = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    lastShot1Ref.current = 0;
    lastShot2Ref.current = 0;
    setState({
      player1X: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      player2X: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      bullets: [],
      score1: 0,
      score2: 0,
      lives1: 3,
      lives2: 3,
      winner: null,
      isPlaying: false,
      isPaused: false,
    });
  }, []);

  const start = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    lastShot1Ref.current = performance.now();
    lastShot2Ref.current = performance.now();
    setState({
      player1X: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      player2X: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      bullets: [],
      score1: 0,
      score2: 0,
      lives1: 3,
      lives2: 3,
      winner: null,
      isPlaying: true,
      isPaused: false,
    });
    gameLoopRef.current = requestAnimationFrame(loop);
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => {
      if (!prev.isPlaying || prev.winner !== null) return prev;
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  const loop = useCallback((currentTime: number) => {
    setState(prev => {
      if (!prev.isPlaying || prev.isPaused || prev.winner !== null) {
        gameLoopRef.current = null;
        return prev;
      }

      let { player1X, player2X, bullets, score1, score2, lives1, lives2 } = prev;

      // 玩家1移动 (A/D)
      if (keysPressed.current.has('a')) {
        player1X = Math.max(0, player1X - PLAYER_SPEED);
      }
      if (keysPressed.current.has('d')) {
        player1X = Math.min(GAME_WIDTH - PLAYER_WIDTH, player1X + PLAYER_SPEED);
      }

      // 玩家2移动 (Arrow Left/Right)
      if (keysPressed.current.has('arrowleft')) {
        player2X = Math.max(0, player2X - PLAYER_SPEED);
      }
      if (keysPressed.current.has('arrowright')) {
        player2X = Math.min(GAME_WIDTH - PLAYER_WIDTH, player2X + PLAYER_SPEED);
      }

      // 玩家1射击（向上）
      if (keysPressed.current.has(' ') && currentTime - lastShot1Ref.current > FIRE_INTERVAL) {
        lastShot1Ref.current = currentTime;
        bullets.push({
          x: player1X + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
          y: GAME_HEIGHT - PLAYER_HEIGHT,
          owner: 1,
        });
      }

      // 玩家2射击（向下）
      if (keysPressed.current.has('enter') && currentTime - lastShot2Ref.current > FIRE_INTERVAL) {
        lastShot2Ref.current = currentTime;
        bullets.push({
          x: player2X + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
          y: PLAYER_HEIGHT,
          owner: 2,
        });
      }

      // 子弹移动
      bullets = bullets
        .map(b => ({
          ...b,
          y: b.owner === 1 ? b.y - BULLET_SPEED : b.y + BULLET_SPEED,
        }))
        .filter(b => b.y > -20 && b.y < GAME_HEIGHT + 20);

      // 碰撞检测
      const survivingBullets: VersusPlaneBullet[] = [];
      for (const b of bullets) {
        if (b.owner === 1 && checkHit(b, player2X)) {
          // 玩家1击中玩家2
          score1 += 1;
          lives2 -= 1;
          if (lives2 <= 0) {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
            saveBest(score1, score2);
            return {
              ...prev,
              player1X,
              player2X,
              bullets: survivingBullets,
              score1,
              score2,
              lives1,
              lives2: 0,
              winner: 1,
              isPlaying: false,
            };
          }
        } else if (b.owner === 2 && checkHit(b, player1X)) {
          // 玩家2击中玩家1
          score2 += 1;
          lives1 -= 1;
          if (lives1 <= 0) {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
            saveBest(score1, score2);
            return {
              ...prev,
              player1X,
              player2X,
              bullets: survivingBullets,
              score1,
              score2,
              lives1: 0,
              lives2,
              winner: 2,
              isPlaying: false,
            };
          }
        } else {
          survivingBullets.push(b);
        }
      }

      return {
        ...prev,
        player1X,
        player2X,
        bullets: survivingBullets,
        score1,
        score2,
        lives1,
        lives2,
      };
    });

    gameLoopRef.current = requestAnimationFrame(loop);
  }, []);

  // 键盘监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      if (key === ' ') e.preventDefault();

      if (key === 'r') {
        e.preventDefault();
        reset();
      }

      if (key === 'enter') {
        e.preventDefault();
        const s = state;
        if (!s.isPlaying || s.winner !== null) {
          start();
        } else if (!s.isPaused) {
          // Enter 用于射击，不暂停
        }
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
  }, [state, start, reset]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  return {
    state,
    best: getBest(),
    requiredScore: REQUIRED_SCORE,
    start,
    reset,
    togglePause,
  };
};