import { useState, useCallback, useMemo, useEffect } from 'react';
import { OthelloMode } from '../types/game';

interface ChessGameProps {
  onBack: () => void;
}

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type Piece = { type: PieceType; color: 1 | 2 };

const BOARD_SIZE = 8;
const CELL_SIZE = 64;

const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  // color 1 = 白方（棋盘下方，从 row 6,7 行向上推进）
  // color 2 = 黑方（棋盘上方，从 row 0,1 行向下推进）
  backRow.forEach((type, col) => {
    board[7][col] = { type, color: 1 }; // 白方在底部
    board[0][col] = { type, color: 2 }; // 黑方在顶部
  });

  for (let col = 0; col < BOARD_SIZE; col++) {
    board[6][col] = { type: 'pawn', color: 1 };
    board[1][col] = { type: 'pawn', color: 2 };
  }

  return board;
};

const getPieceSymbol = (piece: Piece): string => {
  // 白方用空心（轮廓）符号，黑方用实心符号
  const whiteSymbols: Record<PieceType, string> = {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  };
  const blackSymbols: Record<PieceType, string> = {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  };
  return piece.color === 1 ? whiteSymbols[piece.type] : blackSymbols[piece.type];
};

export const ChessGame = ({ onBack }: ChessGameProps) => {
  const [board, setBoard] = useState<(Piece | null)[][]>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [mode, setMode] = useState<OthelloMode>(() => {
    const saved = sessionStorage.getItem('game_mode_chess') as OthelloMode | null;
    return saved === 'pve' || saved === 'pvp' ? saved : 'pvp';
  });
  const [status, setStatus] = useState<'playing' | 'won'>('playing');
  const [winner, setWinner] = useState<0 | 1 | 2>(0);

  const reset = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer(1);
    setSelected(null);
    setStatus('playing');
    setWinner(0);
  }, []);

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    if (piece.color !== currentPlayer) return false;

    const target = board[toRow][toCol];
    if (target && target.color === currentPlayer) return false;

    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    switch (piece.type) {
      case 'king':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      case 'queen':
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          let r = fromRow + stepR;
          let c = fromCol + stepC;
          while (r !== toRow || c !== toCol) {
            if (board[r][c] !== null) return false;
            r += stepR;
            c += stepC;
          }
          return true;
        }
        return false;
      case 'rook':
        if (dr === 0 || dc === 0) {
          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          let r = fromRow + stepR;
          let c = fromCol + stepC;
          while (r !== toRow || c !== toCol) {
            if (board[r][c] !== null) return false;
            r += stepR;
            c += stepC;
          }
          return true;
        }
        return false;
      case 'bishop':
        if (Math.abs(dr) === Math.abs(dc)) {
          const stepR = dr / Math.abs(dr);
          const stepC = dc / Math.abs(dc);
          let r = fromRow + stepR;
          let c = fromCol + stepC;
          while (r !== toRow || c !== toCol) {
            if (board[r][c] !== null) return false;
            r += stepR;
            c += stepC;
          }
          return true;
        }
        return false;
      case 'knight':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'pawn':
        // color 1 (白方) 从底部向上走 dr=-1，color 2 (黑方) 从顶部向下走 dr=+1
        const direction = piece.color === 1 ? -1 : 1;
        if (dc === 0 && dr === direction && target === null) return true;
        if (dc === 0 && dr === direction * 2 && target === null && board[fromRow + direction][fromCol] === null) {
          return piece.color === 1 ? fromRow === 6 : fromRow === 1;
        }
        if (Math.abs(dc) === 1 && dr === direction && target && target.color !== currentPlayer) return true;
        return false;
    }
    return false;
  };

  // 计算选中棋子的所有可走位置
  const validMoves = useMemo(() => {
    if (!selected) return [];
    const moves: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isValidMove(selected.row, selected.col, r, c)) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  }, [selected, board, currentPlayer]);

  const handleCellClick = (row: number, col: number) => {
    if (status !== 'playing') return;
    if (mode === 'pve' && currentPlayer === 2) return;

    const piece = board[row][col];

    if (selected) {
      if (selected.row === row && selected.col === col) {
        setSelected(null);
        return;
      }
      if (isValidMove(selected.row, selected.col, row, col)) {
        const newBoard = board.map(r => [...r]);
        if (newBoard[row][col]?.type === 'king') {
          setStatus('won');
          setWinner(currentPlayer);
        }
        newBoard[row][col] = newBoard[selected.row][selected.col];
        newBoard[selected.row][selected.col] = null;

        if (newBoard[row][col]?.type === 'pawn') {
          if ((currentPlayer === 1 && row === 0) || (currentPlayer === 2 && row === 7)) {
            newBoard[row][col] = { type: 'queen', color: currentPlayer };
          }
        }

        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
      setSelected(null);
    } else if (piece && piece.color === currentPlayer) {
      setSelected({ row, col });
    }
  };

  const getAllValidMoves = useMemo(() => {
    const moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c];
        if (piece && piece.color === currentPlayer) {
          for (let tr = 0; tr < BOARD_SIZE; tr++) {
            for (let tc = 0; tc < BOARD_SIZE; tc++) {
              if (isValidMove(r, c, tr, tc)) {
                moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc });
              }
            }
          }
        }
      }
    }
    return moves;
  }, [board, currentPlayer]);

  const getMovesForColorChess = (boardState: (Piece | null)[][], color: 1 | 2): Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> => {
    const moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          for (let tr = 0; tr < BOARD_SIZE; tr++) {
            for (let tc = 0; tc < BOARD_SIZE; tc++) {
              if (isValidMove(r, c, tr, tc)) {
                moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc });
              }
            }
          }
        }
      }
    }
    return moves;
  };

  const evaluateBoardChess = (boardState: (Piece | null)[][]): number => {
    // AI 是玩家2，所以从玩家2视角评估
    const pieceValues: Record<PieceType, number> = {
      king: 10000,
      queen: 900,
      rook: 500,
      bishop: 330,
      knight: 320,
      pawn: 100,
    };

    let score = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = boardState[r][c];
        if (piece) {
          const baseValue = pieceValues[piece.type];
          // AI = color 2 为正向
          const multiplier = piece.color === 2 ? 1 : -1;
          let positionBonus = 0;

          // 位置奖励：中心化、推进
          if (piece.type === 'pawn') {
            // 越靠近对方底线越好
            if (piece.color === 2) positionBonus = r * 15;
            else positionBonus = (BOARD_SIZE - 1 - r) * 15;
          } else if (piece.type === 'knight' || piece.type === 'bishop') {
            // 中心化
            const centerDist = Math.abs(c - 3.5) + Math.abs(r - 3.5);
            positionBonus = (7 - centerDist) * 5;
          } else if (piece.type === 'king') {
            // 开局阶段王应该在后方
            if (piece.color === 2 && r < 2) positionBonus = 20;
            if (piece.color === 1 && r > 5) positionBonus = 20;
          }

          score += multiplier * (baseValue + positionBonus);
        }
      }
    }
    return score;
  };

  const minimaxChess = (
    boardState: (Piece | null)[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
  ): number => {
    if (depth === 0) {
      return evaluateBoardChess(boardState);
    }

    const color = isMaximizing ? 2 : 1;
    const moves = getMovesForColorChess(boardState, color);

    if (moves.length === 0) {
      return isMaximizing ? -100000 : 100000;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = boardState.map(r => [...r]);
        const movingPiece = newBoard[move.fromRow][move.fromCol];
        newBoard[move.toRow][move.toCol] = movingPiece;
        newBoard[move.fromRow][move.fromCol] = null;

        // 兵升变
        if (movingPiece?.type === 'pawn' && move.toRow === 0) {
          newBoard[move.toRow][move.toCol] = { type: 'queen', color: 2 };
        }

        const score = minimaxChess(newBoard, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = boardState.map(r => [...r]);
        const movingPiece = newBoard[move.fromRow][move.fromCol];
        newBoard[move.toRow][move.toCol] = movingPiece;
        newBoard[move.fromRow][move.fromCol] = null;

        // 兵升变
        if (movingPiece?.type === 'pawn' && move.toRow === BOARD_SIZE - 1) {
          newBoard[move.toRow][move.toCol] = { type: 'queen', color: 1 };
        }

        const score = minimaxChess(newBoard, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const findBestAiMove = useCallback((): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null => {
    const moves = getAllValidMoves;
    if (moves.length === 0) return null;

    // 优先吃王
    for (const move of moves) {
      const target = board[move.toRow][move.toCol];
      if (target?.type === 'king') {
        return move;
      }
    }

    // 走法排序：吃子走法优先
    const moveOrder = [...moves].sort((a, b) => {
      const targetA = board[a.toRow][a.toCol];
      const targetB = board[b.toRow][b.toCol];
      const valueA = targetA ? ({ king: 10000, queen: 900, rook: 500, bishop: 330, knight: 320, pawn: 100 }[targetA.type]) : 0;
      const valueB = targetB ? ({ king: 10000, queen: 900, rook: 500, bishop: 330, knight: 320, pawn: 100 }[targetB.type]) : 0;
      return valueB - valueA;
    }).slice(0, 25);

    const DEPTH = 3;
    let bestMove = moveOrder[0];
    let bestScore = -Infinity;

    for (const move of moveOrder) {
      const newBoard = board.map(r => [...r]);
      const movingPiece = newBoard[move.fromRow][move.fromCol];
      newBoard[move.toRow][move.toCol] = movingPiece;
      newBoard[move.fromRow][move.fromCol] = null;

      // 兵升变
      let immediateScore = 0;
      if (movingPiece?.type === 'pawn' && move.toRow === 0) {
        newBoard[move.toRow][move.toCol] = { type: 'queen', color: 2 };
        immediateScore += 800;
      }

      const captured = board[move.toRow][move.toCol];
      if (captured) {
        immediateScore += ({ king: 10000, queen: 900, rook: 500, bishop: 330, knight: 320, pawn: 100 }[captured.type]) * 1.2;
      }

      const score = minimaxChess(newBoard, DEPTH - 1, false, -Infinity, Infinity) + immediateScore;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }, [getAllValidMoves, board, currentPlayer]);

  useEffect(() => {
    if (mode === 'pve' && currentPlayer === 2 && status === 'playing') {
      const timer = setTimeout(() => {
        const move = findBestAiMove();
        if (move) {
          const newBoard = board.map(r => [...r]);
          if (newBoard[move.toRow][move.toCol]?.type === 'king') {
            setStatus('won');
            setWinner(2);
          }
          newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
          newBoard[move.fromRow][move.fromCol] = null;

          if (newBoard[move.toRow][move.toCol]?.type === 'pawn') {
            if ((currentPlayer === 2 && move.toRow === 7)) {
              newBoard[move.toRow][move.toCol] = { type: 'queen', color: 2 };
            }
          }

          setBoard(newBoard);
          setCurrentPlayer(1);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode, currentPlayer, status, findBestAiMove, board]);

  const boardSize = BOARD_SIZE * CELL_SIZE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 mb-4 mt-8">
        ♟️ 国际象棋
      </h1>

      <div className="flex gap-2 mb-3">
        {(['pve', 'pvp'] as OthelloMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {m === 'pve' ? '🤖 人机对战' : '👥 双人对战'}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">当前</div>
          <div className="text-xl font-bold">
            {currentPlayer === 1 ? <span className="text-white">白方</span> : <span className="text-gray-300">黑方</span>}
          </div>
        </div>
      </div>

      <div className="relative" style={{ width: boardSize, height: boardSize }}>
        {board.map((row, r) => row.map((cell, c) => {
          const isSelected = selected?.row === r && selected?.col === c;
          const isLightSquare = (r + c) % 2 === 0;
          return (
            <div
              key={`square-${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className={`absolute flex items-center justify-center transition-all cursor-pointer ${
                isLightSquare ? 'bg-slate-700' : 'bg-amber-200'
              } ${isSelected ? 'z-10' : ''}`}
              style={{
                left: c * CELL_SIZE,
                top: r * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                boxShadow: isSelected ? 'inset 0 0 0 4px #facc15' : 'none',
              }}
            >
              {cell && (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                  cell.color === 1
                    ? 'bg-white border-2 border-gray-300'
                    : 'bg-gray-900 border-2 border-gray-700'
                }`}>
                  <span className={`text-3xl font-bold leading-none ${
                    cell.color === 1 ? 'text-gray-800' : 'text-white'
                  }`}>
                    {getPieceSymbol(cell)}
                  </span>
                </div>
              )}
            </div>
          );
        }))}

        {/* 可走位置高亮 */}
        {selected && validMoves.map(m => (
          <div
            key={`move-${m.row}-${m.col}`}
            className="absolute pointer-events-none flex items-center justify-center animate-pulse"
            style={{
              left: m.col * CELL_SIZE,
              top: m.row * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          >
            {board[m.row][m.col] ? (
              // 可吃：红色边框
              <div
                className="rounded-full"
                style={{
                  width: CELL_SIZE - 8,
                  height: CELL_SIZE - 8,
                  border: '4px solid #ef4444',
                  boxShadow: '0 0 12px #ef4444',
                  opacity: 0.7,
                }}
              />
            ) : (
              // 可走：绿色小圆点
              <div
                className="rounded-full"
                style={{
                  width: CELL_SIZE / 3,
                  height: CELL_SIZE / 3,
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                  opacity: 0.8,
                }}
              />
            )}
          </div>
        ))}

        {status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <div className="text-4xl font-bold mb-2">
              {winner === 1 ? <span className="text-white">白方获胜！</span> : <span className="text-gray-300">黑方获胜！</span>}
            </div>
            <button
              onClick={reset}
              className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={reset} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105">
          重新开始
        </button>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center max-w-md">
        <p>点击己方棋子选中，绿点=可走，红圈=可吃 | 吃掉对方王即获胜</p>
      </div>
    </div>
  );
};