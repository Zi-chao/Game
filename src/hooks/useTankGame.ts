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
import { astar, Point } from '../utils/astarUtils';

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

// 敌人从地图左右上方内部出生，避开钢墙
const ENEMY_SPAWN_POSITIONS = [
  { x: TILE_SIZE, y: TILE_SIZE },
  { x: 13 * TILE_SIZE, y: TILE_SIZE },
];

const createEnemy = (id: number): Tank => {
  const pos = ENEMY_SPAWN_POSITIONS[id % ENEMY_SPAWN_POSITIONS.length];
  // 左侧敌人向下向右，右侧敌人向下向左
  const initialDir = pos.x < MAP_COLS * TILE_SIZE / 2 ? 'DOWN' : 'DOWN';
  return {
    x: pos.x,
    y: pos.y,
    direction: initialDir,
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
  const mobileMoveRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean; shoot: boolean }>({
    up: false, down: false, left: false, right: false, shoot: false,
  });
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
    if (keysPressed.current.has('arrowup') || keysPressed.current.has('w') || mobileMoveRef.current.up) {
      newDir = 'UP';
      newPlayerY -= TANK_SPEED;
    } else if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s') || mobileMoveRef.current.down) {
      newDir = 'DOWN';
      newPlayerY += TANK_SPEED;
    } else if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a') || mobileMoveRef.current.left) {
      newDir = 'LEFT';
      newPlayerX -= TANK_SPEED;
    } else if (keysPressed.current.has('arrowright') || keysPressed.current.has('d') || mobileMoveRef.current.right) {
      newDir = 'RIGHT';
      newPlayerX += TANK_SPEED;
    }
    if (canTankMove(newPlayerX, newPlayerY, enemies)) {
      player = { ...player, x: newPlayerX, y: newPlayerY, direction: newDir };
    } else {
      player = { ...player, direction: newDir };
    }

    // 玩家射击
    if ((keysPressed.current.has(' ') || keysPressed.current.has('j') || mobileMoveRef.current.shoot) && player.cooldown <= 0) {
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

    // 敌坦克AI：智能路径规划和战术决策
    const survivingEnemies: Tank[] = [];
    const baseTile = tankAtTile((MAP_COLS * TILE_SIZE) / 2, (MAP_ROWS - 2) * TILE_SIZE);

    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i];
      const lastMove = lastEnemyMoveRef.current.get(i) || 0;
      const lastShot = lastEnemyShotRef.current.get(i) || 0;

      // 检查是否被玩家子弹威胁
      let threatened = false;
      let threatDir: Direction | null = null;
      let shouldShootBrick = false;
      let shootDir: Direction = enemy.direction;
      for (const b of bullets) {
        if (b.owner === 'player') {
          const dx = enemy.x - b.x;
          const dy = enemy.y - b.y;
          if (b.direction === 'UP' && dy > 0 && dy < 3 * TILE_SIZE && Math.abs(dx) < TILE_SIZE) {
            threatened = true; threatDir = 'DOWN';
          } else if (b.direction === 'DOWN' && dy < 0 && dy > -3 * TILE_SIZE && Math.abs(dx) < TILE_SIZE) {
            threatened = true; threatDir = 'UP';
          } else if (b.direction === 'LEFT' && dx > 0 && dx < 3 * TILE_SIZE && Math.abs(dy) < TILE_SIZE) {
            threatened = true; threatDir = 'RIGHT';
          } else if (b.direction === 'RIGHT' && dx < 0 && dx > -3 * TILE_SIZE && Math.abs(dy) < TILE_SIZE) {
            threatened = true; threatDir = 'LEFT';
          }
        }
      }

      // 按格子步进
      if (currentTime - lastMove > ENEMY_MOVE_INTERVAL) {
        lastEnemyMoveRef.current.set(i, currentTime);

        const alignedX = Math.round(enemy.x / TILE_SIZE) * TILE_SIZE;
        const alignedY = Math.round(enemy.y / TILE_SIZE) * TILE_SIZE;
        const currentTile = tankAtTile(alignedX, alignedY);

        // 智能目标选择：优先追击玩家（距离近时），否则攻击基地
        const distToPlayer = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        let target: Point;
        if (distToPlayer < 5 * TILE_SIZE || Math.random() < 0.6) {
          target = tankAtTile(player.x, player.y);
        } else {
          target = baseTile;
        }

        const isWalkable = (row: number, col: number): boolean => {
          if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
          const tile = mapRef.current[row][col];
          if (tile === TILE_STEEL || tile === TILE_WATER || tile === TILE_BASE) {
            return false;
          }
          for (let j = 0; j < enemies.length; j++) {
            if (j === i) continue;
            const t = enemies[j];
            if (Math.abs(t.x - col * TILE_SIZE) < TILE_SIZE && Math.abs(t.y - row * TILE_SIZE) < TILE_SIZE) {
              return false;
            }
          }
          if (Math.abs(player.x - col * TILE_SIZE) < TILE_SIZE && Math.abs(player.y - row * TILE_SIZE) < TILE_SIZE) {
            return false;
          }
          return true;
        };

        const path = astar(currentTile, target, isWalkable);

        if (!path || path.length <= 1) {
          const checkDirection = (dir: Direction): boolean => {
            let nx = enemy.x, ny = enemy.y;
            let dist = 0;
            while (dist < 5 * TILE_SIZE) {
              if (dir === 'UP') ny -= TILE_SIZE;
              else if (dir === 'DOWN') ny += TILE_SIZE;
              else if (dir === 'LEFT') nx -= TILE_SIZE;
              else if (dir === 'RIGHT') nx += TILE_SIZE;
              dist += TILE_SIZE;
              const row = Math.floor(ny / TILE_SIZE);
              const col = Math.floor(nx / TILE_SIZE);
              if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
              const tile = mapRef.current[row][col];
              if (tile === TILE_BRICK) return true;
              if (tile === TILE_STEEL || tile === TILE_WATER) return false;
            }
            return false;
          };

          const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          for (const d of dirs) {
            if (checkDirection(d)) {
              shouldShootBrick = true;
              shootDir = d;
              break;
            }
          }
        }

        if (threatened && threatDir) {
          // 紧急躲避：优先向威胁方向的反方向移动
          let nx = enemy.x, ny = enemy.y;
          if (threatDir === 'UP') ny -= TILE_SIZE;
          else if (threatDir === 'DOWN') ny += TILE_SIZE;
          else if (threatDir === 'LEFT') nx -= TILE_SIZE;
          else if (threatDir === 'RIGHT') nx += TILE_SIZE;
          if (canTankMove(nx, ny, [player, ...enemies.filter((_, idx) => idx !== i)])) {
            enemy = { ...enemy, x: nx, y: ny, direction: threatDir };
          } else if (path && path.length > 1) {
            // 躲不开就按原计划移动
            const nextTile = path[1];
            const tx = nextTile.col * TILE_SIZE;
            const ty = nextTile.row * TILE_SIZE;
            let newDir: Direction = enemy.direction;
            if (ty < alignedY) newDir = 'UP';
            else if (ty > alignedY) newDir = 'DOWN';
            else if (tx < alignedX) newDir = 'LEFT';
            else if (tx > alignedX) newDir = 'RIGHT';
            if (canTankMove(tx, ty, [player, ...enemies.filter((_, idx) => idx !== i)])) {
              enemy = { ...enemy, x: tx, y: ty, direction: newDir };
            }
          }
        } else if (path && path.length > 1) {
          const nextTile = path[1];
          const tx = nextTile.col * TILE_SIZE;
          const ty = nextTile.row * TILE_SIZE;

          let newDir: Direction = enemy.direction;
          if (ty < alignedY) newDir = 'UP';
          else if (ty > alignedY) newDir = 'DOWN';
          else if (tx < alignedX) newDir = 'LEFT';
          else if (tx > alignedX) newDir = 'RIGHT';

          // 检查前方是否有子弹威胁
          let safeToMove = true;
          for (const b of bullets) {
            if (b.owner === 'player') {
              const isInLineOfFire = (newDir === 'UP' && b.direction === 'UP' && b.y < ty && Math.abs(b.x - tx) < TILE_SIZE) ||
                                    (newDir === 'DOWN' && b.direction === 'DOWN' && b.y > ty && Math.abs(b.x - tx) < TILE_SIZE) ||
                                    (newDir === 'LEFT' && b.direction === 'LEFT' && b.x < tx && Math.abs(b.y - ty) < TILE_SIZE) ||
                                    (newDir === 'RIGHT' && b.direction === 'RIGHT' && b.x > tx && Math.abs(b.y - ty) < TILE_SIZE);
              if (isInLineOfFire) safeToMove = false;
            }
          }

          const targetTileRow = Math.floor(ty / TILE_SIZE);
          const targetTileCol = Math.floor(tx / TILE_SIZE);
          const targetTile = mapRef.current[targetTileRow]?.[targetTileCol];

          if (safeToMove && (canTankMove(tx, ty, [player, ...enemies.filter((_, idx) => idx !== i)]) || targetTile === TILE_BRICK)) {
            enemy = { ...enemy, x: tx, y: ty, direction: newDir };
            if (targetTile === TILE_BRICK) {
              mapRef.current[targetTileRow][targetTileCol] = TILE_EMPTY;
            }
          } else if (!safeToMove) {
            // 前方有威胁，尝试横向移动
            const sideDirs = newDir === 'UP' || newDir === 'DOWN' ? ['LEFT', 'RIGHT'] : ['UP', 'DOWN'];
            for (const sd of sideDirs) {
              let sx = enemy.x, sy = enemy.y;
              if (sd === 'UP') sy -= TILE_SIZE;
              else if (sd === 'DOWN') sy += TILE_SIZE;
              else if (sd === 'LEFT') sx -= TILE_SIZE;
              else if (sd === 'RIGHT') sx += TILE_SIZE;
              if (canTankMove(sx, sy, [player, ...enemies.filter((_, idx) => idx !== i)])) {
                enemy = { ...enemy, x: sx, y: sy, direction: newDir };
                break;
              }
            }
          }
        } else {
          const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          for (let k = dirs.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [dirs[k], dirs[j]] = [dirs[j], dirs[k]];
          }
          let moved = false;
          for (const d of dirs) {
            let nx = enemy.x;
            let ny = enemy.y;
            if (d === 'UP') ny -= TILE_SIZE;
            else if (d === 'DOWN') ny += TILE_SIZE;
            else if (d === 'LEFT') nx -= TILE_SIZE;
            else if (d === 'RIGHT') nx += TILE_SIZE;
            if (canTankMove(nx, ny, [player, ...enemies.filter((_, idx) => idx !== i)])) {
              enemy = { ...enemy, x: nx, y: ny, direction: d };
              moved = true;
              break;
            }
          }
          if (!moved && Math.random() < 0.3) {
            enemy = { ...enemy, direction: dirs[0] };
          }
        }
      }

      // 精准射击：玩家在同一行或同一列时才射击
      let shouldShoot = false;
      let shootDirection = enemy.direction;
      const inLineOfFire = 
        (enemy.direction === 'UP' && player.x >= enemy.x - TILE_SIZE && player.x <= enemy.x + TILE_SIZE && player.y < enemy.y) ||
        (enemy.direction === 'DOWN' && player.x >= enemy.x - TILE_SIZE && player.x <= enemy.x + TILE_SIZE && player.y > enemy.y) ||
        (enemy.direction === 'LEFT' && player.y >= enemy.y - TILE_SIZE && player.y <= enemy.y + TILE_SIZE && player.x < enemy.x) ||
        (enemy.direction === 'RIGHT' && player.y >= enemy.y - TILE_SIZE && player.y <= enemy.y + TILE_SIZE && player.x > enemy.x);

      if (inLineOfFire && currentTime - lastShot > ENEMY_SHOOT_INTERVAL) {
        shouldShoot = true;
      } else if (shouldShootBrick && currentTime - lastShot > ENEMY_SHOOT_INTERVAL) {
        shouldShoot = true;
        shootDirection = shootDir;
      } else if (currentTime - lastShot > ENEMY_SHOOT_INTERVAL * 2 && Math.random() < 0.1) {
        shouldShoot = true;
      }

      if (shouldShoot) {
        lastEnemyShotRef.current.set(i, currentTime);
        enemy = { ...enemy, direction: shootDirection };
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

  const setMobileMove = useCallback((dir: 'up' | 'down' | 'left' | 'right' | 'shoot', pressed: boolean) => {
    mobileMoveRef.current[dir] = pressed;
  }, []);

  return {
    gameState: stateRef.current,
    map: mapRef.current,
    requiredKills: REQUIRED_KILLS,
    killCount: killCountRef.current,
    start,
    reset,
    setMobileMove,
  };
};