import { Tetromino, TetrominoType } from '../types/game';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 28;

export const TETROMINOES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export const COLORS: Record<TetrominoType, string> = {
  I: '#00f5ff',
  O: '#ffd700',
  T: '#a855f7',
  S: '#22c55e',
  Z: '#ef4444',
  J: '#3b82f6',
  L: '#f97316',
};

export const createEmptyBoard = (): number[][] =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

export const getRandomTetromino = (): Tetromino => {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    shape: TETROMINOES[type],
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOES[type][0].length / 2),
    y: 0,
  };
};

export const rotate = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
};

export const isValidMove = (
  board: number[][],
  piece: Tetromino,
  offsetX: number = 0,
  offsetY: number = 0,
  shape: number[][] = piece.shape
): boolean => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = piece.x + c + offsetX;
        const newY = piece.y + r + offsetY;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false;
        }
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
      }
    }
  }
  return true;
};

export const mergePiece = (board: number[][], piece: Tetromino): number[][] => {
  const newBoard = board.map(row => [...row]);
  const colorIndex = Object.keys(TETROMINOES).indexOf(piece.type) + 1;
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const newY = piece.y + r;
        const newX = piece.x + c;
        if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
          newBoard[newY][newX] = colorIndex;
        }
      }
    }
  }
  return newBoard;
};

export const clearLines = (board: number[][]): { board: number[][]; cleared: number } => {
  let cleared = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== 0)) {
      cleared++;
      return false;
    }
    return true;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  return { board: newBoard, cleared };
};

export const calculateScore = (lines: number): number => {
  const scores = [0, 100, 300, 500, 800];
  return scores[lines] || 0;
};

export const getDropSpeed = (level: number): number => {
  return Math.max(100, 800 - (level - 1) * 100);
};