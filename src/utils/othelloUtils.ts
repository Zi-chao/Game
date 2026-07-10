import { OthelloCell } from '../types/game';

export const BOARD_SIZE = 8;
export const CELL_SIZE = 50;

export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export const createInitialBoard = (): OthelloCell[][] => {
  const board: OthelloCell[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0) as OthelloCell[]
  );
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = 2;
  board[mid - 1][mid] = 1;
  board[mid][mid - 1] = 1;
  board[mid][mid] = 2;
  return board;
};

// 找某方向上能翻转的所有对方棋子
const findFlips = (
  board: OthelloCell[][],
  row: number,
  col: number,
  player: OthelloCell,
): Array<[number, number]> => {
  if (board[row][col] !== 0) return [];

  const opponent = player === 1 ? 2 : 1;
  const flips: Array<[number, number]> = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line: Array<[number, number]> = [];
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    if (
      line.length > 0 &&
      r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
      board[r][c] === player
    ) {
      flips.push(...line);
    }
  }

  return flips;
};

// 获取所有合法落子位置
export const getValidMoves = (board: OthelloCell[][], player: OthelloCell): Array<{ row: number; col: number; flips: Array<[number, number]> }> => {
  const moves: Array<{ row: number; col: number; flips: Array<[number, number]> }> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const flips = findFlips(board, r, c, player);
      if (flips.length > 0) {
        moves.push({ row: r, col: c, flips });
      }
    }
  }
  return moves;
};

// 落子并翻转
export const makeMove = (
  board: OthelloCell[][],
  row: number,
  col: number,
  player: OthelloCell,
): OthelloCell[][] | null => {
  const flips = findFlips(board, row, col, player);
  if (flips.length === 0) return null;

  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = player;
  for (const [r, c] of flips) {
    newBoard[r][c] = player;
  }
  return newBoard;
};

export const countPieces = (board: OthelloCell[][]): { black: number; white: number } => {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 1) black++;
      else if (cell === 2) white++;
    }
  }
  return { black, white };
};

// 评估函数：从AI视角评估整个棋盘
const evaluateBoard = (board: OthelloCell[][], aiPlayer: OthelloCell): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;

  // 位置权重表（角落和边缘权重高）
  const weights = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, 1, 1, 1, 1, -2, 10],
    [5, -2, 1, 1, 1, 1, -2, 5],
    [5, -2, 1, 1, 1, 1, -2, 5],
    [10, -2, 1, 1, 1, 1, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100],
  ];

  let aiScore = 0;
  let oppScore = 0;
  let aiMobility = 0;
  let oppMobility = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === aiPlayer) {
        aiScore += weights[r][c];
      } else if (board[r][c] === opponent) {
        oppScore += weights[r][c];
      }
    }
  }

  // 行动力（合法落子位置数）
  aiMobility = getValidMoves(board, aiPlayer).length;
  oppMobility = getValidMoves(board, opponent).length;

  // 棋子数量差异（终局时重要）
  const { black, white } = countPieces(board);
  const aiPieces = aiPlayer === 1 ? black : white;
  const oppPieces = aiPlayer === 1 ? white : black;

  // 总得分 = 位置权重 + 行动力差异 + 棋子数差异
  return (aiScore - oppScore) * 10 + (aiMobility - oppMobility) * 5 + (aiPieces - oppPieces) * 2;
};

// MiniMax + Alpha-Beta 剪枝
const minimax = (
  board: OthelloCell[][],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: OthelloCell,
): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;

  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const currentPlayer = isMaximizing ? aiPlayer : opponent;
  const moves = getValidMoves(board, currentPlayer);

  // 如果当前玩家无合法走法，跳过
  if (moves.length === 0) {
    const nextMoves = getValidMoves(board, isMaximizing ? opponent : aiPlayer);
    if (nextMoves.length === 0) {
      // 游戏结束
      return evaluateBoard(board, aiPlayer);
    }
    return minimax(board, depth - 1, !isMaximizing, alpha, beta, aiPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.row, move.col, aiPlayer);
      if (!newBoard) continue;
      const score = minimax(newBoard, depth - 1, false, alpha, beta, aiPlayer);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.row, move.col, opponent);
      if (!newBoard) continue;
      const score = minimax(newBoard, depth - 1, true, alpha, beta, aiPlayer);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// AI: 使用 MiniMax + Alpha-Beta 选择最佳走法
export const aiSelectMove = (
  board: OthelloCell[][],
  moves: Array<{ row: number; col: number; flips: Array<[number, number]> }>,
  aiPlayer: OthelloCell = 2,
): { row: number; col: number; flips: Array<[number, number]> } | null => {
  if (moves.length === 0) return null;

  const DEPTH = 4;

  let bestScore = -Infinity;
  let bestMoves: Array<{ row: number; col: number; flips: Array<[number, number]> }> = [];

  for (const move of moves) {
    const newBoard = makeMove(board, move.row, move.col, aiPlayer);
    if (!newBoard) continue;

    const score = minimax(newBoard, DEPTH - 1, false, -Infinity, Infinity, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};