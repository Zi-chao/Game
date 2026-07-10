// AI 使用 minimax 评估

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const checkWinner = (board: (0 | 1 | 2)[]): { winner: 0 | 1 | 2 | null; line: number[] | null } => {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 1 | 2, line };
    }
  }
  return { winner: null, line: null };
};

export const checkDraw = (board: (0 | 1 | 2)[]): boolean => {
  return board.every(c => c !== 0);
};

const minimax = (board: (0 | 1 | 2)[], depth: number, isMaximizing: boolean): number => {
  const { winner } = checkWinner(board);
  if (winner === 2) return 10 - depth;
  if (winner === 1) return depth - 10;
  if (checkDraw(board)) return 0;

  const available = board.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of available) {
      board[move] = 2;
      best = Math.max(best, minimax(board, depth + 1, false));
      board[move] = 0;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of available) {
      board[move] = 1;
      best = Math.min(best, minimax(board, depth + 1, true));
      board[move] = 0;
    }
    return best;
  }
};

export const aiMove = (board: (0 | 1 | 2)[]): number => {
  const available = board.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);
  if (available.length === 0) return -1;
  if (available.length === 9) {
    return [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
  }

  let bestScore = -Infinity;
  let bestMove = available[0];
  for (const move of available) {
    const newBoard = [...board];
    newBoard[move] = 2;
    const score = minimax(newBoard, 0, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
};