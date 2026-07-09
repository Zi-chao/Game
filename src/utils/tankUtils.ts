export const TILE_SIZE = 32;
export const MAP_COLS = 15;
export const MAP_ROWS = 13;

// 地图元素: 0=空地, 1=砖墙(可破坏), 2=钢墙(不可破坏), 3=水域, 4=基地
export const TILE_EMPTY = 0;
export const TILE_BRICK = 1;
export const TILE_STEEL = 2;
export const TILE_WATER = 3;
export const TILE_BASE = 4;

export const generateMap = (): number[][] => {
  const map: number[][] = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(0));

  // 边界墙
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        map[r][c] = TILE_STEEL;
      }
    }
  }

  // 随机砖墙
  for (let r = 1; r < MAP_ROWS - 1; r++) {
    for (let c = 1; c < MAP_COLS - 1; c++) {
      // 玩家起点和基地周围留空
      if ((r === 1 || r === 2) && c >= 6 && c <= 8) continue;
      if (r >= MAP_ROWS - 3 && c >= 6 && c <= 8) continue;
      if (Math.random() < 0.35) {
        map[r][c] = TILE_BRICK;
      }
    }
  }

  // 基地
  map[MAP_ROWS - 2][7] = TILE_BASE;
  map[MAP_ROWS - 2][6] = TILE_BRICK;
  map[MAP_ROWS - 2][8] = TILE_BRICK;
  map[MAP_ROWS - 3][6] = TILE_BRICK;
  map[MAP_ROWS - 3][8] = TILE_BRICK;

  // 一些水域
  for (let i = 0; i < 5; i++) {
    const r = 3 + Math.floor(Math.random() * (MAP_ROWS - 7));
    const c = 1 + Math.floor(Math.random() * (MAP_COLS - 2));
    if (map[r][c] === 0) {
      map[r][c] = TILE_WATER;
    }
  }

  // 一些钢墙
  for (let i = 0; i < 4; i++) {
    const r = 2 + Math.floor(Math.random() * (MAP_ROWS - 4));
    const c = 1 + Math.floor(Math.random() * (MAP_COLS - 2));
    if (map[r][c] === 0) {
      map[r][c] = TILE_STEEL;
    }
  }

  return map;
};

export const checkRectCollision = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean => {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
};

export const tankAtTile = (x: number, y: number): { row: number; col: number } => {
  return {
    row: Math.floor(y / TILE_SIZE),
    col: Math.floor(x / TILE_SIZE),
  };
};

export const TANK_SIZE = TILE_SIZE;
export const BULLET_SIZE = 8;
export const BULLET_SPEED = 5;
export const TANK_SPEED = 2;
export const ENEMY_SHOOT_INTERVAL = 1500;
export const ENEMY_MOVE_INTERVAL = 600;
export const ENEMY_SPAWN_INTERVAL = 5000;
export const MAX_ENEMIES = 3;