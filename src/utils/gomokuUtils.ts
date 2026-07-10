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

// 检测某一方在某个方向上的"模式"
// 从(r,c)开始向(dr,dc)方向延伸，统计连续子和两端状态
// 返回：0=无, 1=眠二, 2=活二, 3=眠三, 4=活三, 5=眠四, 6=活四, 7=五连
const detectPattern = (
  board: CellValue[][],
  r: number,
  c: number,
  dr: number,
  dc: number,
  player: CellValue,
): number => {
  // 正向连续子数量
  let forwardCount = 0;
  let rr = r + dr;
  let cc = c + dc;
  while (rr >= 0 && rr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE && board[rr][cc] === player) {
    forwardCount++;
    rr += dr;
    cc += dc;
  }
  // 正向末端状态：空格=活，对方子或边界=死
  const forwardOpen = (rr >= 0 && rr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE && board[rr][cc] === 0);

  // 反向连续子数量（包含起点）
  let backwardCount = 0;
  let br = r - dr;
  let bc = c - dc;
  while (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE && board[br][bc] === player) {
    backwardCount++;
    br -= dr;
    bc -= dc;
  }
  // 反向末端状态
  const backwardOpen = (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE && board[br][bc] === 0);

  const total = 1 + forwardCount + backwardCount;  // 包含起点(r,c)
  const openEnds = (forwardOpen ? 1 : 0) + (backwardOpen ? 1 : 0);

  if (total >= 5) return 7;
  if (total === 4) {
    return openEnds >= 1 ? 6 : 5;  // 活四/眠四
  }
  if (total === 3) {
    if (openEnds === 2) return 4;  // 活三
    if (openEnds === 1) return 3;  // 眠三
    return 3;  // 都是死
  }
  if (total === 2) {
    if (openEnds === 2) return 2;  // 活二
    return 1;  // 眠二
  }
  return 0;
};

// 全局评估函数：评估整个棋盘的得分（从AI视角）
const evaluateWholeBoard = (board: CellValue[][], aiPlayer: CellValue): number => {
  let score = 0;

  // 扫描所有有棋子的位置
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) continue;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (const [dr, dc] of directions) {
        // 只从每个连续段的开头开始评估
        const pr = r - dr;
        const pc = c - dc;
        if (pr >= 0 && pr < BOARD_SIZE && pc >= 0 && pc < BOARD_SIZE && board[pr][pc] === board[r][c]) continue;

        const pattern = detectPattern(board, r, c, dr, dc, board[r][c]);
        if (board[r][c] === aiPlayer) {
          if (pattern === 7) return 100000;
          if (pattern === 6) score += 50000;  // 活四
          else if (pattern === 5) score += 1000;  // 眠四
          else if (pattern === 4) score += 5000;  // 活三
          else if (pattern === 3) score += 100;  // 眠三
          else if (pattern === 2) score += 50;  // 活二
          else if (pattern === 1) score += 10;
        } else {
          if (pattern === 7) return -100000;
          if (pattern === 6) score -= 50000;  // 对方活四
          else if (pattern === 5) score -= 1000;
          else if (pattern === 4) score -= 5000;  // 对方活三
          else if (pattern === 3) score -= 100;
          else if (pattern === 2) score -= 50;
          else if (pattern === 1) score -= 10;
        }
      }
    }
  }

  return score;
};

// 获取候选位置：距离已有棋子2格以内的空位
const getCandidates = (board: CellValue[][]): Array<{ row: number; col: number }> => {
  const candidates: Array<{ row: number; col: number }> = [];
  const seen = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) {
        // 在已有棋子周围2格内找空位
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === 0) {
              const key = `${nr},${nc}`;
              if (!seen.has(key)) {
                seen.add(key);
                candidates.push({ row: nr, col: nc });
              }
            }
          }
        }
      }
    }
  }
  return candidates;
};

// 立即吃子和防守检测
const immediateCheck = (board: CellValue[][], row: number, col: number, player: CellValue): boolean => {
  board[row][col] = player;
  const result = checkWin(board, row, col, player);
  board[row][col] = 0;
  return result;
};

// MiniMax + Alpha-Beta 剪枝
const minimax = (
  board: CellValue[][],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: CellValue,
): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;

  // 检查胜负
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0 && checkWin(board, r, c, board[r][c])) {
        return board[r][c] === aiPlayer ? 100000 + depth : -100000 - depth;
      }
    }
  }

  if (depth === 0) {
    return evaluateWholeBoard(board, aiPlayer);
  }

  const candidates = getCandidates(board);
  if (candidates.length === 0) {
    return evaluateWholeBoard(board, aiPlayer);
  }

  // 走法排序：基于即时评分
  const sortedMoves = candidates.map(move => {
    let priority = 0;
    // 立即赢棋
    if (immediateCheck(board, move.row, move.col, isMaximizing ? aiPlayer : opponent)) {
      priority += 100000;
    }
    // 阻断对手四连
    if (immediateCheck(board, move.row, move.col, isMaximizing ? opponent : aiPlayer)) {
      priority += 90000;
    }
    return { move, priority };
  }).sort((a, b) => b.priority - a.priority).slice(0, 30).map(m => m.move);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of sortedMoves) {
      const newBoard = board.map(r => [...r]);
      newBoard[move.row][move.col] = aiPlayer;
      const score = minimax(newBoard, depth - 1, false, alpha, beta, aiPlayer);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of sortedMoves) {
      const newBoard = board.map(r => [...r]);
      newBoard[move.row][move.col] = opponent;
      const score = minimax(newBoard, depth - 1, true, alpha, beta, aiPlayer);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// AI 寻找最佳落子位置
export const findBestMove = (
  board: CellValue[][],
  aiPlayer: CellValue,
): { row: number; col: number } => {
  const opponent = aiPlayer === 1 ? 2 : 1;

  // 第一手默认走中心
  let hasPiece = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) { hasPiece = true; break; }
    }
    if (hasPiece) break;
  }
  if (!hasPiece) return { row: 7, col: 7 };

  // 检查立即赢棋
  const candidates = getCandidates(board);
  for (const move of candidates) {
    if (immediateCheck(board, move.row, move.col, aiPlayer)) {
      return { row: move.row, col: move.col };
    }
  }

  // 检查对手立即赢棋的位置（必须防守）
  for (const move of candidates) {
    if (immediateCheck(board, move.row, move.col, opponent)) {
      return { row: move.row, col: move.col };
    }
  }

  // 使用 MiniMax + Alpha-Beta 搜索
  const sortedMoves = candidates.map(move => {
    let priority = 0;
    if (immediateCheck(board, move.row, move.col, aiPlayer)) priority += 100000;
    if (immediateCheck(board, move.row, move.col, opponent)) priority += 90000;

    // 评估此位置下子后的局势
    const newBoard = board.map(r => [...r]);
    newBoard[move.row][move.col] = aiPlayer;
    const score = evaluateWholeBoard(newBoard, aiPlayer);
    priority += score;

    return { move, priority };
  }).sort((a, b) => b.priority - a.priority).slice(0, 20);

  let bestScore = -Infinity;
  let bestMove = { row: 7, col: 7 };
  const DEPTH = 4;

  for (const { move } of sortedMoves) {
    const newBoard = board.map(r => [...r]);
    newBoard[move.row][move.col] = aiPlayer;
    const score = minimax(newBoard, DEPTH - 1, false, -Infinity, Infinity, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

// 保留旧 API 用于其他用途
export const evaluatePosition = (
  board: CellValue[][],
  _row: number,
  _col: number,
  player: CellValue,
): number => {
  return evaluateWholeBoard(board, player);
};