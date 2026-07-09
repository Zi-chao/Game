import { MineCell, Difficulty } from '../types/game';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: '简单' },
  medium: { rows: 16, cols: 16, mines: 40, label: '中等' },
  hard: { rows: 16, cols: 30, mines: 99, label: '困难' },
};

export const CELL_SIZE = 32;

export const createEmptyBoard = (rows: number, cols: number): MineCell[][] => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      state: 'hidden' as const,
      neighborMines: 0,
    }))
  );
};

export const placeMines = (
  board: MineCell[][],
  mines: number,
  safeRow: number,
  safeCol: number
): MineCell[][] => {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  let placed = 0;

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    // 第一次点击位置及其周围不放雷
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    if (newBoard[r][c].isMine) continue;
    newBoard[r][c].isMine = true;
    placed++;
  }

  // 计算邻居雷数
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[r][c].neighborMines = count;
    }
  }

  return newBoard;
};

export const revealCell = (board: MineCell[][], row: number, col: number): MineCell[][] => {
  const rows = board.length;
  const cols = board[0].length;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return board;
  if (board[row][col].state !== 'hidden') return board;
  if (board[row][col].isMine) return board;

  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const queue: [number, number][] = [[row, col]];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (newBoard[r][c].state !== 'hidden') continue;
    newBoard[r][c].state = 'revealed';

    if (newBoard[r][c].neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newBoard[nr][nc].isMine && newBoard[nr][nc].state === 'hidden') {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return newBoard;
};

export const toggleFlag = (board: MineCell[][], row: number, col: number): MineCell[][] => {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const cell = newBoard[row][col];
  if (cell.state === 'revealed') return newBoard;
  cell.state = cell.state === 'flagged' ? 'hidden' : 'flagged';
  return newBoard;
};

export const revealAllMines = (board: MineCell[][]): MineCell[][] => {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      state: cell.isMine ? 'revealed' : cell.state,
    }))
  );
};

export const countRevealed = (board: MineCell[][]): number => {
  return board.flat().filter(c => c.state === 'revealed').length;
};

export const countFlags = (board: MineCell[][]): number => {
  return board.flat().filter(c => c.state === 'flagged').length;
};

export const checkWin = (board: MineCell[][], mineCount: number): boolean => {
  const totalCells = board.length * board[0].length;
  const revealed = countRevealed(board);
  return revealed === totalCells - mineCount;
};