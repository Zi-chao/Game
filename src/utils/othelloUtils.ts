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

// AI: 选择翻转最多对方棋子的位置，加上位置权重
export const aiSelectMove = (
  board: OthelloCell[][],
  moves: Array<{ row: number; col: number; flips: Array<[number, number]> }>,
): { row: number; col: number; flips: Array<[number, number]> } | null => {
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves: Array<{ row: number; col: number; flips: Array<[number, number]> }> = [];

  // 角落权重极高，边缘次之
  const cornerPositions = [
    [0, 0], [0, BOARD_SIZE - 1],
    [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1],
  ];
  const isCorner = ([r, c]: number[]) =>
    cornerPositions.some(([cr, cc]) => cr === r && cc === c);
  const isEdge = ([r, c]: number[]) =>
    r === 0 || r === BOARD_SIZE - 1 || c === 0 || c === BOARD_SIZE - 1;

  for (const move of moves) {
    let score = move.flips.length * 5;

    if (isCorner([move.row, move.col])) score += 100;
    else if (isEdge([move.row, move.col])) score += 10;

    // 移动后稳定性：检查周围是否都是己方
    let stableCount = 0;
    for (const [dr, dc] of DIRECTIONS) {
      const r = move.row + dr;
      const c = move.col + dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        // 简化：检查 8 个方向是否形成己方连接
        let r2 = r + dr;
        let c2 = c + dc;
        while (r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE) {
          if (board[r2][c2] === 2) { // AI 是 2
            stableCount++;
            break;
          }
          r2 += dr;
          c2 += dc;
        }
      }
    }
    score += stableCount * 3;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};