import { ConnectFourCell } from '../types/game';

export const ROWS = 6;
export const COLS = 7;

export const createEmptyBoard = (): ConnectFourCell[][] => {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as ConnectFourCell[]);
};

// 找到某列最底下的空位
export const getLowestEmptyRow = (board: ConnectFourCell[][], col: number): number => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return -1;
};

export const dropPiece = (
  board: ConnectFourCell[][],
  col: number,
  player: ConnectFourCell,
): { board: ConnectFourCell[][]; row: number } | null => {
  const row = getLowestEmptyRow(board, col);
  if (row < 0) return null;
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = player;
  return { board: newBoard, row };
};

export const checkWin = (
  board: ConnectFourCell[][],
  row: number,
  col: number,
  player: ConnectFourCell,
): Array<{ row: number; col: number }> | null => {
  const directions = [
    [0, 1],   // 横
    [1, 0],   // 竖
    [1, 1],   // 正斜
    [1, -1],  // 反斜
  ];

  for (const [dr, dc] of directions) {
    const cells: Array<{ row: number; col: number }> = [{ row, col }];

    // 正向
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      cells.push({ row: r, col: c });
    }

    // 反向
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      cells.unshift({ row: r, col: c });
    }

    if (cells.length >= 4) return cells.slice(0, 4);
  }
  return null;
};

export const isBoardFull = (board: ConnectFourCell[][]): boolean => {
  return board[0].every(cell => cell !== 0);
};

// AI 评分：评估某列的落子价值
const scorePosition = (board: ConnectFourCell[][], col: number, player: ConnectFourCell): number => {
  const row = getLowestEmptyRow(board, col);
  if (row < 0) return -Infinity;

  let score = 0;
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 0;
    let empty = 0;

    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const cell = board[r][c];
      if (cell === player) count++;
      else if (cell === 0) empty++;
    }

    if (count === 3 && empty >= 1) score += 100;
    else if (count === 2 && empty >= 2) score += 10;
    else if (count === 1 && empty >= 3) score += 1;

    // 防守分（对手）
    const opponent = player === 1 ? 2 : 1;
    let oppCount = 0;
    let oppEmpty = 0;
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const cell = board[r][c];
      if (cell === opponent) oppCount++;
      else if (cell === 0) oppEmpty++;
    }
    if (oppCount === 3 && oppEmpty >= 1) score += 90;
  }

  // 中央列偏好
  score += (3 - Math.abs(col - 3)) * 2;

  return score;
};

export const aiSelectColumn = (board: ConnectFourCell[][], aiPlayer: ConnectFourCell): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;
  let bestScore = -Infinity;
  let bestCol = 3;

  for (let col = 0; col < COLS; col++) {
    if (getLowestEmptyRow(board, col) < 0) continue;

    // 攻防评分
    const aiScore = scorePosition(board, col, aiPlayer);
    const oppScore = scorePosition(board, col, opponent);
    const totalScore = aiScore + oppScore * 1.1; // 略偏防守

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCol = col;
    }
  }

  return bestCol;
};