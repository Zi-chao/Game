import { CellValue } from '../types/game';

export const BOARD_SIZE = 15;
export const CELL_SIZE = 36;

export const createEmptyBoard = (): CellValue[][] => {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0) as CellValue[]);
};

export const checkWin = (
  board: CellValue[][],
  row: number,
  col: number,
  player: CellValue,
): boolean => {
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 对角线
    [1, -1],  // 反对角线
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    // 正向
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
      if (board[r][c] !== player) break;
      count++;
    }
    // 反向
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
      if (board[r][c] !== player) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
};

// 评估棋盘上某一方的得分
const evaluateLine = (
  board: CellValue[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: CellValue,
): number => {
  let count = 0;
  let empty = 0;

  for (let i = 0; i < 5; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
    if (board[r][c] === player) count++;
    else if (board[r][c] === 0) empty++;
    else break;
  }

  // 加上后续延伸
  for (let i = 1; i < 5; i++) {
    const r = row - dr * i;
    const c = col - dc * i;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break;
    if (board[r][c] === player) count++;
    else if (board[r][c] === 0) empty++;
    else break;
  }

  // 评分规则
  if (count >= 5) return 100000;
  if (count === 4 && empty >= 2) return 10000;
  if (count === 4 && empty === 1) return 1000;
  if (count === 3 && empty >= 2) return 500;
  if (count === 3 && empty === 1) return 100;
  if (count === 2 && empty >= 2) return 50;
  if (count === 2 && empty === 1) return 10;
  if (count === 1 && empty >= 2) return 5;

  return 0;
};

export const evaluatePosition = (
  board: CellValue[][],
  row: number,
  col: number,
  player: CellValue,
): number => {
  if (board[row][col] !== 0) return -1;
  const tempBoard = board.map(r => [...r]);
  tempBoard[row][col] = player;

  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];

  let score = 0;
  for (const [dr, dc] of directions) {
    score += evaluateLine(tempBoard, row, col, dr, dc, player);
  }
  return score;
};

// AI 寻找最佳落子位置
export const findBestMove = (
  board: CellValue[][],
  aiPlayer: CellValue,
): { row: number; col: number } => {
  let bestScore = -1;
  let bestRow = 7;
  let bestCol = 7;

  // 优先在已有棋子附近搜索
  const candidates: Array<{ row: number; col: number; priority: number }> = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) {
        // 计算此位置距离最近棋子的最小距离
        let minDist = BOARD_SIZE * 2;
        for (let i = 0; i < BOARD_SIZE; i++) {
          for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) {
              const dist = Math.abs(i - r) + Math.abs(j - c);
              if (dist < minDist) minDist = dist;
            }
          }
        }
        candidates.push({ row: r, col: c, priority: minDist });
      }
    }
  }

  // 优先搜索距离已有棋子3格内的位置
  candidates.sort((a, b) => a.priority - b.priority);
  const searchRange = candidates.slice(0, 80);

  for (const { row, col } of searchRange) {
    // 攻击分
    const aiScore = evaluatePosition(board, row, col, aiPlayer);
    // 防守分（对手是玩家）
    const opponent = aiPlayer === 1 ? 2 : 1;
    const defenseScore = evaluatePosition(board, row, col, opponent);

    const totalScore = aiScore * 1.1 + defenseScore; // 略偏攻击

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestRow = row;
      bestCol = col;
    }
  }

  return { row: bestRow, col: bestCol };
};