export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 40;
export const ENEMY_WIDTH = 30;
export const ENEMY_HEIGHT = 30;
export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 12;
export const PLAYER_SPEED = 5;
export const BULLET_SPEED = 8;
export const ENEMY_SPEED_MIN = 1;
export const ENEMY_SPEED_MAX = 3;
export const ENEMY_SPAWN_INTERVAL = 800;
export const BULLET_FIRE_INTERVAL = 250;

export const checkRectCollision = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};