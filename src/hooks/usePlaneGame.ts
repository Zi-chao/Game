import { useState, useCallback, useRef, useEffect } from 'react';
import { PlaneGameState, Bullet, Enemy } from '../types/game';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  BULLET_SPEED,
  ENEMY_SPEED_MIN,
  ENEMY_SPEED_MAX,
  ENEMY_SPAWN_INTERVAL,
  BULLET_FIRE_INTERVAL,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  checkRectCollision,
} from '../utils/planeUtils';

const HIGH_SCORE_KEY = 'plane_high_score';

const createInitialState = (highScore: number): PlaneGameState => ({
  playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
  bullets: [],
  enemies: [],
  score: 0,
  highScore,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  lives: 3,
});

const spawnEnemy = (): Enemy => ({
  x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
  y: -ENEMY_HEIGHT,
  width: ENEMY_WIDTH,
  height: ENEMY_HEIGHT,
  speed: ENEMY_SPEED_MIN + Math.random() * (ENEMY_SPEED_MAX - ENEMY_SPEED_MIN),
});

export const usePlaneGame = () => {
  // 状态用 ref 保存，避免 useState 频繁更新触发 RAF 重启
  const stateRef = useRef<PlaneGameState>(
    createInitialState(parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10))
  );

  // 触发 React 重渲染的计数器
  const [, setTick] = useState(0);
  const render = useCallback(() => setTick(t => t + 1), []);

  const gameLoopRef = useRef<number | null>(null);
  const lastShotRef = useRef<number>(0);
  const lastEnemySpawnRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current !== null) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // 游戏主循环 - 通过 ref 读取最新状态，避免闭包问题
  const loop = useCallback((currentTime: number) => {
    const state = stateRef.current;

    if (!state.isPlaying || state.isPaused || state.isGameOver) {
      gameLoopRef.current = null;
      return;
    }

    let { playerX, bullets, enemies, score, lives } = state;

    // 玩家移动
    if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
      playerX = Math.max(0, playerX - PLAYER_SPEED);
    }
    if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
      playerX = Math.min(GAME_WIDTH - PLAYER_WIDTH, playerX + PLAYER_SPEED);
    }

    // 自动射击
    if (currentTime - lastShotRef.current > BULLET_FIRE_INTERVAL) {
      lastShotRef.current = currentTime;
      bullets = [
        ...bullets,
        {
          x: playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
          y: GAME_HEIGHT - PLAYER_HEIGHT - 10,
        },
      ];
    }

    // 子弹移动
    bullets = bullets
      .map(b => ({ ...b, y: b.y - BULLET_SPEED }))
      .filter(b => b.y + BULLET_HEIGHT > 0);

    // 生成敌机
    if (currentTime - lastEnemySpawnRef.current > ENEMY_SPAWN_INTERVAL) {
      lastEnemySpawnRef.current = currentTime;
      enemies = [...enemies, spawnEnemy()];
    }

    // 敌机移动
    enemies = enemies
      .map(e => ({ ...e, y: e.y + e.speed }))
      .filter(e => e.y < GAME_HEIGHT);

    // 碰撞检测：子弹 vs 敌机
    const survivingBullets: Bullet[] = [];
    for (const bullet of bullets) {
      let hit = false;
      for (let i = 0; i < enemies.length; i++) {
        if (checkRectCollision(
          { x: bullet.x, y: bullet.y, width: BULLET_WIDTH, height: BULLET_HEIGHT },
          enemies[i]
        )) {
          hit = true;
          score += 10;
          enemies = enemies.filter((_, idx) => idx !== i);
          break;
        }
      }
      if (!hit) survivingBullets.push(bullet);
    }
    bullets = survivingBullets;

    // 碰撞检测：敌机 vs 玩家
    let livesLost = 0;
    const survivingEnemies: Enemy[] = [];
    const playerRect = {
      x: playerX,
      y: GAME_HEIGHT - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };
    for (const enemy of enemies) {
      if (checkRectCollision(playerRect, enemy)) {
        livesLost++;
      } else {
        survivingEnemies.push(enemy);
      }
    }
    enemies = survivingEnemies;
    lives -= livesLost;

    // 检查游戏结束
    if (lives <= 0) {
      const newHighScore = Math.max(score, state.highScore);
      localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
      stateRef.current = {
        ...state,
        playerX,
        bullets: [],
        enemies: [],
        score,
        lives: 0,
        isPlaying: false,
        isGameOver: true,
        highScore: newHighScore,
      };
      gameLoopRef.current = null;
      render();
      return;
    }

    stateRef.current = {
      ...state,
      playerX,
      bullets,
      enemies,
      score,
      lives,
    };
    render();

    gameLoopRef.current = requestAnimationFrame(loop);
  }, [render]);

  const startGame = useCallback(() => {
    stopLoop();
    stateRef.current = { ...createInitialState(stateRef.current.highScore), isPlaying: true };
    lastShotRef.current = performance.now();
    lastEnemySpawnRef.current = performance.now();
    keysPressed.current.clear();
    render();
    gameLoopRef.current = requestAnimationFrame(loop);
  }, [loop, render, stopLoop]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlaying || s.isGameOver) return;
    stateRef.current = { ...s, isPaused: !s.isPaused };
    render();
    // 恢复游戏时重启循环
    if (!stateRef.current.isPaused && gameLoopRef.current === null) {
      gameLoopRef.current = requestAnimationFrame(loop);
    }
  }, [loop, render]);

  const resetGame = useCallback(() => {
    stopLoop();
    stateRef.current = createInitialState(stateRef.current.highScore);
    lastShotRef.current = 0;
    lastEnemySpawnRef.current = 0;
    keysPressed.current.clear();
    render();
  }, [render, stopLoop]);

  const setPlayerX = useCallback((x: number) => {
    const clamped = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, x));
    if (stateRef.current.playerX !== clamped) {
      stateRef.current = { ...stateRef.current, playerX: clamped };
      render();
    }
  }, [render]);

  // 键盘监听 - 只挂载一次
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      if (key === ' ') {
        e.preventDefault();
        const s = stateRef.current;
        if (!s.isPlaying || s.isGameOver) {
          startGame();
        } else {
          togglePause();
        }
      } else if (key === 'r') {
        e.preventDefault();
        resetGame();
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
  }, [startGame, togglePause, resetGame]);

  // 组件卸载时清理 RAF
  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return {
    gameState: stateRef.current,
    startGame,
    togglePause,
    resetGame,
    setPlayerX,
  };
};