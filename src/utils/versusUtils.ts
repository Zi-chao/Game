import { Position, Direction } from '../types/game';

export const VERSUS_GRID_SIZE = 25;
export const VERSUS_CELL_SIZE = 22;

export const getVersusInitialSnake1 = (): Position[] => [
  { x: 5, y: 12 },
  { x: 4, y: 12 },
  { x: 3, y: 12 },
];

export const getVersusInitialSnake2 = (): Position[] => [
  { x: 19, y: 12 },
  { x: 20, y: 12 },
  { x: 21, y: 12 },
];

export const moveSnakeByDirection = (
  snake: Position[],
  direction: Direction,
): Position[] => {
  const head = snake[0];
  let newHead: Position = { x: head.x, y: head.y };
  switch (direction) {
    case 'UP':
      newHead = { x: head.x, y: head.y - 1 };
      break;
    case 'DOWN':
      newHead = { x: head.x, y: head.y + 1 };
      break;
    case 'LEFT':
      newHead = { x: head.x - 1, y: head.y };
      break;
    case 'RIGHT':
      newHead = { x: head.x + 1, y: head.y };
      break;
  }
  return [newHead, ...snake.slice(0, -1)];
};

export const checkWallCollision = (pos: Position): boolean => {
  return pos.x < 0 || pos.x >= VERSUS_GRID_SIZE || pos.y < 0 || pos.y >= VERSUS_GRID_SIZE;
};

export const checkSelfCollision = (snake: Position[]): boolean => {
  const head = snake[0];
  const body = snake.slice(1);
  return body.some(seg => seg.x === head.x && seg.y === head.y);
};

export const checkBodyCollision = (snake: Position[], other: Position[]): boolean => {
  const head = snake[0];
  return other.some(seg => seg.x === head.x && seg.y === head.y);
};

export const getRandomVersusFood = (snake1: Position[], snake2: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * VERSUS_GRID_SIZE),
      y: Math.floor(Math.random() * VERSUS_GRID_SIZE),
    };
  } while (
    snake1.some(s => s.x === food.x && s.y === food.y) ||
    snake2.some(s => s.x === food.x && s.y === food.y)
  );
  return food;
};

export const growSnakeAt = (snake: Position[]): Position[] => {
  const tail = snake[snake.length - 1];
  return [...snake, tail];
};

export const isValidDirectionChange = (current: Direction, next: Direction): boolean => {
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };
  return opposites[current] !== next;
};