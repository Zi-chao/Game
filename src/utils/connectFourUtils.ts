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

// 全局评估函数：评估整个棋盘
const evaluateBoard = (board: ConnectFourCell[][], aiPlayer: ConnectFourCell): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;
  let score = 0;

  // 中央列偏好
  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (board[r][centerCol] === aiPlayer) score += 3;
    else if (board[r][centerCol] === opponent) score -= 3;
  }

  // 评分所有可能的4格窗口
  // 水平窗口
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], aiPlayer);
    }
  }
  // 垂直窗口
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      score += scoreWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], aiPlayer);
    }
  }
  // 正斜窗口
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], aiPlayer);
    }
  }
  // 反斜窗口
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]], aiPlayer);
    }
  }

  return score;
};

// 评分单个4格窗口
const scoreWindow = (window: ConnectFourCell[], aiPlayer: ConnectFourCell): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;
  let aiCount = 0;
  let oppCount = 0;
  let empty = 0;

  for (const cell of window) {
    if (cell === aiPlayer) aiCount++;
    else if (cell === opponent) oppCount++;
    else empty++;
  }

  if (aiCount > 0 && oppCount > 0) return 0; // 双方都有，无法形成四连

  if (aiCount === 4) return 100;
  else if (aiCount === 3 && empty === 1) return 5;
  else if (aiCount === 2 && empty === 2) return 2;

  if (oppCount === 4) return -100;
  else if (oppCount === 3 && empty === 1) return -5;
  else if (oppCount === 2 && empty === 2) return -2;

  return 0;
};

// MiniMax + Alpha-Beta 剪枝
const minimax = (
  board: ConnectFourCell[][],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: ConnectFourCell,
): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;

  // 检查终局
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== 0) {
        const winCells = checkWin(board, r, c, board[r][c]);
        if (winCells) {
          return board[r][c] === aiPlayer ? 10000 + depth : -10000 - depth;
        }
      }
    }
  }

  if (depth === 0 || isBoardFull(board)) {
    return evaluateBoard(board, aiPlayer);
  }

  // 获取可走的列
  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (getLowestEmptyRow(board, c) >= 0) validCols.push(c);
  }

  // 走法排序：中间列优先
  validCols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const col of validCols) {
      const dropResult = dropPiece(board, col, aiPlayer);
      if (!dropResult) continue;
      const score = minimax(dropResult.board, depth - 1, false, alpha, beta, aiPlayer);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of validCols) {
      const dropResult = dropPiece(board, col, opponent);
      if (!dropResult) continue;
      const score = minimax(dropResult.board, depth - 1, true, alpha, beta, aiPlayer);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const aiSelectColumn = (board: ConnectFourCell[][], aiPlayer: ConnectFourCell): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;
  const DEPTH = 5;

  // 检查立即赢棋
  for (let col = 0; col < COLS; col++) {
    if (getLowestEmptyRow(board, col) < 0) continue;
    const dropResult = dropPiece(board, col, aiPlayer);
    if (!dropResult) continue;
    if (checkWin(dropResult.board, dropResult.row, col, aiPlayer)) {
      return col;
    }
  }

  // 检查必须防守的位置（对手立即赢）
  for (let col = 0; col < COLS; col++) {
    if (getLowestEmptyRow(board, col) < 0) continue;
    const dropResult = dropPiece(board, col, opponent);
    if (!dropResult) continue;
    if (checkWin(dropResult.board, dropResult.row, col, opponent)) {
      return col;
    }
  }

  // 使用 MiniMax 搜索
  let bestScore = -Infinity;
  let bestCol = 3;

  // 走法排序：中间列优先
  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (getLowestEmptyRow(board, c) >= 0) validCols.push(c);
  }
  validCols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));

  for (const col of validCols) {
    const dropResult = dropPiece(board, col, aiPlayer);
    if (!dropResult) continue;
    const score = minimax(dropResult.board, DEPTH - 1, false, -Infinity, Infinity, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
};