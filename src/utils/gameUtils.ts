import { Position, Direction } from '../types/game';

export const GRID_SIZE = 20;
export const CELL_SIZE = 25;

export const getInitialSnake = (): Position[] => [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export const getRandomFood = (snake: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  return food;
};

export const moveSnake = (snake: Position[], direction: Direction): Position[] => {
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

export const checkCollision = (snake: Position[]): boolean => {
  const head = snake[0];
  const body = snake.slice(1);

  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }

  return body.some(segment => segment.x === head.x && segment.y === head.y);
};

export const checkFoodCollision = (snake: Position[], food: Position): boolean => {
  const head = snake[0];
  return head.x === food.x && head.y === food.y;
};

export const growSnake = (snake: Position[]): Position[] => {
  const tail = snake[snake.length - 1];
  return [...snake, tail];
};

export const getSpeed = (score: number): number => {
  return Math.max(100, 150 - score * 2);
};

export const getHighScore = (): number => {
  const saved = localStorage.getItem('snake_high_score');
  return saved ? parseInt(saved, 10) : 0;
};

export const saveHighScore = (score: number): void => {
  localStorage.setItem('snake_high_score', score.toString());
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