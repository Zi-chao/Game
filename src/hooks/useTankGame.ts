import { useState, useCallback, useRef, useEffect } from 'react';
import { TankGameState, Tank, TankBullet, Direction } from '../types/game';
import {
  TILE_SIZE,
  TANK_SIZE,
  BULLET_SIZE,
  BULLET_SPEED,
  TANK_SPEED,
  ENEMY_SHOOT_INTERVAL,
  ENEMY_MOVE_INTERVAL,
  ENEMY_SPAWN_INTERVAL,
  MAX_ENEMIES,
  MAP_COLS,
  MAP_ROWS,
  generateMap,
  checkRectCollision,
  tankAtTile,
  TILE_BRICK,
  TILE_STEEL,
  TILE_WATER,
  TILE_BASE,
  TILE_EMPTY,
} from '../utils/tankUtils';

const HIGH_SCORE_KEY = 'tank_high_score';
const ENEMY_KILL_SCORE = 100;
const REQUIRED_KILLS = 10; // 需要击毁 10 个敌坦克才能胜利

const createPlayer = (): Tank => ({
  x: 7 * TILE_SIZE,
  y: TILE_SIZE,
  direction: 'UP',
  type: 'player',
  cooldown: 0,
});

// 敌人只从地图左右上角出生，避开玩家中间位置
const ENEMY_SPAWN_POSITIONS = [
  { x: 0, y: TILE_SIZE },
  { x: 14 * TILE_SIZE, y: TILE_SIZE },
];

const createEnemy = (id: number): Tank => {
  const pos = ENEMY_SPAWN_POSITIONS[id % ENEMY_SPAWN_POSITIONS.length];
  return {
    x: pos.x,
    y: pos.y,
    direction: 'DOWN',
    type: 'enemy',
    cooldown: 0,
  };
};

export const useTankGame = () => {
  const stateRef = useRef<TankGameState>({
    player: createPlayer(),
    enemies: [createEnemy(0)],
    bullets: [],
    score: 0,
    highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10),
    lives: 3,
    status: 'idle',
  });

  // 已击毁敌人数（胜利条件）
  const killCountRef = useRef<number>(0);
  const baseAliveRef = useRef<boolean>(true);

  const mapRef = useRef<number[][]>(generateMap());
  const [, setTick] = useState(0);
  const render = useCallback(() => setTick(t => t + 1), []);

  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastEnemyShotRef = useRef<Map<number, number>>(new Map());
  const lastEnemyMoveRef = useRef<Map<number, number>>(new Map());
  const lastEnemySpawnRef = useRef<number>(0);

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current !== null) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopLoop();
    mapRef.current = generateMap();
    stateRef.current = {
      player: createPlayer(),
      enemies: [createEnemy(0)],
      bullets: [],
      score: 0,
      highScore: stateRef.current.highScore,
      lives: 3,
      status: 'idle',
    };
    killCountRef.current = 0;
    baseAliveRef.current = true;
    lastEnemyShotRef.current.clear();
    lastEnemyMoveRef.current.clear();
    keysPressed.current.clear();
    render();
  }, [render, stopLoop]);

  const start = useCallback(() => {
    stopLoop();
    mapRef.current = generateMap();
    stateRef.current = {
      ...stateRef.current,
      player: createPlayer(),
      enemies: [createEnemy(0)],
      bullets: [],
      score: 0,
      lives: 3,
      status: 'playing',
    };
    killCountRef.current = 0;
    baseAliveRef.current = true;
    lastEnemyShotRef.current.clear();
    lastEnemyMoveRef.current.clear();
    lastEnemySpawnRef.current = performance.now();
    keysPressed.current.clear();
    render();
    gameLoopRef.current = requestAnimationFrame(loop);
  }, [render, stopLoop]);

  // 检测坦克与地图的碰撞 (otherTanks: 其他坦克列表，不含自身)
  const canTankMove = (x: number, y: number, otherTanks: Tank[]): boolean => {
    // 检查地图
    const corners = [
      { x, y },
      { x: x + TANK_SIZE - 1, y },
      { x, y: y + TANK_SIZE - 1 },
      { x: x + TANK_SIZE - 1, y: y + TANK_SIZE - 1 },
    ];
    for (const c of corners) {
      const { row, col } = tankAtTile(c.x, c.y);
      if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
      const tile = mapRef.current[row][col];
      if (tile === TILE_BRICK || tile === TILE_STEEL || tile === TILE_WATER || tile === TILE_BASE) {
        return false;
      }
    }
    // 检查与其他坦克的碰撞
    for (const t of otherTanks) {
      if (checkRectCollision(x, y, TANK_SIZE, TANK_SIZE, t.x, t.y, TANK_SIZE, TANK_SIZE)) {
        return false;
      }
    }
    return true;
  };

  // 子弹移动。返回是否击中基地
  const moveBullets = (
    bullets: TankBullet[],
  ): { bullets: TankBullet[]; bricks: Array<{ r: number; c: number }>; baseHit: boolean } => {
    const result: TankBullet[] = [];
    const bricks: Array<{ r: number; c: number }> = [];
    let baseHit = false;

    for (const b of bullets) {
      let newX = b.x;
      let newY = b.y;
      switch (b.direction) {
        case 'UP': newY -= BULLET_SPEED; break;
        case 'DOWN': newY += BULLET_SPEED; break;
        case 'LEFT': newX -= BULLET_SPEED; break;
        case 'RIGHT': newX += BULLET_SPEED; break;
      }

      // 越界
      if (newX < 0 || newY < 0 || newX >= MAP_COLS * TILE_SIZE || newY >= MAP_ROWS * TILE_SIZE) {
        continue;
      }

      // 检查地图碰撞
      const { row, col } = tankAtTile(newX + BULLET_SIZE / 2, newY + BULLET_SIZE / 2);
      const tile = mapRef.current[row]?.[col];
      if (tile === TILE_BRICK) {
        bricks.push({ r: row, c: col });
        continue;
      } else if (tile === TILE_STEEL) {
        continue;
      } else if (tile === TILE_BASE) {
        // 击中基地！只有敌人子弹能击毁基地
        if (b.owner === 'enemy') {
          baseHit = true;
        }
        continue;
      }

      result.push({ ...b, x: newX, y: newY });
    }

    return { bullets: result, bricks, baseHit };
  };

  const loop = (currentTime: number) => {
    const state = stateRef.current;
    if (state.status !== 'playing') {
      gameLoopRef.current = null;
      return;
    }

    let { player, enemies, bullets, score, lives } = state;

    // 玩家移动
    let newPlayerX = player.x;
    let newPlayerY = player.y;
    let newDir = player.direction;
    if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) {
      newDir = 'UP';
      newPlayerY -= TANK_SPEED;
    } else if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) {
      newDir = 'DOWN';
      newPlayerY += TANK_SPEED;
    } else if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
      newDir = 'LEFT';
      newPlayerX -= TANK_SPEED;
    } else if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
      newDir = 'RIGHT';
      newPlayerX += TANK_SPEED;
    }
    if (canTankMove(newPlayerX, newPlayerY, enemies)) {
      player = { ...player, x: newPlayerX, y: newPlayerY, direction: newDir };
    } else {
      player = { ...player, direction: newDir };
    }

    // 玩家射击
    if ((keysPressed.current.has(' ') || keysPressed.current.has('j')) && player.cooldown <= 0) {
      const bx = player.x + TANK_SIZE / 2 - BULLET_SIZE / 2;
      const by = player.y + TANK_SIZE / 2 - BULLET_SIZE / 2;
      bullets.push({
        x: bx,
        y: by,
        direction: player.direction,
        owner: 'player',
      });
      player = { ...player, cooldown: 500 };
    }
    if (player.cooldown > 0) {
      player = { ...player, cooldown: player.cooldown - 16 };
    }

    // 敌坦克AI：选定方向后按格子步进，撞墙再换方向
    const survivingEnemies: Tank[] = [];
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i];
      const lastMove = lastEnemyMoveRef.current.get(i) || 0;
      const lastShot = lastEnemyShotRef.current.get(i) || 0;

      // 按格子步进
      if (currentTime - lastMove > ENEMY_MOVE_INTERVAL) {
        lastEnemyMoveRef.current.set(i, currentTime);

        // 对齐到格子
        const alignedX = Math.round(enemy.x / TILE_SIZE) * TILE_SIZE;
        const alignedY = Math.round(enemy.y / TILE_SIZE) * TILE_SIZE;

        // 尝试朝当前方向移动一格
        let nx = alignedX;
        let ny = alignedY;
        switch (enemy.direction) {
          case 'UP': ny -= TILE_SIZE; break;
          case 'DOWN': ny += TILE_SIZE; break;
          case 'LEFT': nx -= TILE_SIZE; break;
          case 'RIGHT': nx += TILE_SIZE; break;
        }

        if (canTankMove(nx, ny, [player, ...enemies.filter((_, idx) => idx !== i)])) {
          enemy = { ...enemy, x: nx, y: ny };
          // 8% 概率主动换方向
          if (Math.random() < 0.08) {
            const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(d => d !== enemy.direction) as Direction[];
            enemy = { ...enemy, direction: dirs[Math.floor(Math.random() * dirs.length)] };
          }
        } else {
          // 撞墙，找一个能走的方向
          const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(d => d !== enemy.direction) as Direction[];
          const validDirs = dirs.filter(d => {
            let tx = alignedX;
            let ty = alignedY;
            switch (d) {
              case 'UP': ty -= TILE_SIZE; break;
              case 'DOWN': ty += TILE_SIZE; break;
              case 'LEFT': tx -= TILE_SIZE; break;
              case 'RIGHT': tx += TILE_SIZE; break;
            }
            return canTankMove(tx, ty, [player, ...enemies.filter((_, idx) => idx !== i)]);
          });
          if (validDirs.length > 0) {
            enemy = { ...enemy, direction: validDirs[Math.floor(Math.random() * validDirs.length)] };
          }
        }
      }

      // 射击
      if (currentTime - lastShot > ENEMY_SHOOT_INTERVAL + Math.random() * 1000) {
        lastEnemyShotRef.current.set(i, currentTime);
        const bx = enemy.x + TANK_SIZE / 2 - BULLET_SIZE / 2;
        const by = enemy.y + TANK_SIZE / 2 - BULLET_SIZE / 2;
        bullets.push({
          x: bx,
          y: by,
          direction: enemy.direction,
          owner: 'enemy',
        });
      }

      survivingEnemies.push(enemy);
    }
    enemies = survivingEnemies;

    // 生成新敌坦克
    if (currentTime - lastEnemySpawnRef.current > ENEMY_SPAWN_INTERVAL && enemies.length < MAX_ENEMIES) {
      lastEnemySpawnRef.current = currentTime;
      enemies.push(createEnemy(enemies.length));
    }

    // 子弹移动
    const { bullets: movedBullets, bricks, baseHit } = moveBullets(bullets);
    bullets = movedBullets;

    // 销毁砖块
    for (const { r, c } of bricks) {
      mapRef.current[r][c] = TILE_EMPTY;
    }

    // 检测子弹命中敌坦克
    const newSurvivingEnemies: Tank[] = [];
    for (const enemy of enemies) {
      let hit = false;
      for (const b of bullets) {
        if (b.owner === 'player' && checkRectCollision(b.x, b.y, BULLET_SIZE, BULLET_SIZE, enemy.x, enemy.y, TANK_SIZE, TANK_SIZE)) {
          hit = true;
          bullets = bullets.filter(bb => bb !== b);
          score += ENEMY_KILL_SCORE;
          killCountRef.current += 1;
          break;
        }
      }
      if (!hit) newSurvivingEnemies.push(enemy);
    }
    enemies = newSurvivingEnemies;

    // 检测敌人子弹命中玩家
    let playerHit = false;
    for (const b of bullets) {
      if (b.owner === 'enemy' && checkRectCollision(b.x, b.y, BULLET_SIZE, BULLET_SIZE, player.x, player.y, TANK_SIZE, TANK_SIZE)) {
        playerHit = true;
        bullets = bullets.filter(bb => bb !== b);
        break;
      }
    }

    // 基地被击中
    if (baseHit) {
      baseAliveRef.current = false;
    }

    if (!baseAliveRef.current) {
      // 基地陷落，游戏失败
      const newHigh = Math.max(score, state.highScore);
      localStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
      stateRef.current = {
        ...state,
        player,
        enemies,
        bullets,
        score,
        lives: 0,
        status: 'lost',
        highScore: newHigh,
      };
      render();
      return;
    }

    if (playerHit) {
      lives -= 1;
      if (lives <= 0) {
        const newHigh = Math.max(score, state.highScore);
        localStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
        stateRef.current = {
          ...state,
          player,
          enemies,
          bullets,
          score,
          lives: 0,
          status: 'lost',
          highScore: newHigh,
        };
        render();
        return;
      }
      // 重生玩家
      player = createPlayer();
    }

    // 胜利条件：击毁指定数量敌人
    if (killCountRef.current >= REQUIRED_KILLS) {
      const newHigh = Math.max(score, state.highScore);
      localStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
      stateRef.current = {
        ...state,
        player,
        enemies,
        bullets,
        score,
        lives,
        status: 'won',
        highScore: newHigh,
      };
      render();
      return;
    }

    stateRef.current = {
      ...state,
      player,
      enemies,
      bullets,
      score,
      lives,
    };
    render();

    gameLoopRef.current = requestAnimationFrame(loop);
  };

  // 键盘监听 - 只挂载一次
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      if (key === 'enter') {
        e.preventDefault();
        const s = stateRef.current;
        if (s.status !== 'playing') {
          start();
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
  }, [start]);

  // 卸载时停止循环
  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return {
    gameState: stateRef.current,
    map: mapRef.current,
    requiredKills: REQUIRED_KILLS,
    killCount: killCountRef.current,
    start,
    reset,
  };
};