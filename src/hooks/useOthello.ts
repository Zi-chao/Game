import { useState, useCallback } from 'react';
import { OthelloState, OthelloMode } from '../types/game';
import {
  createInitialBoard,
  getValidMoves,
  makeMove,
  countPieces,
  aiSelectMove,
} from '../utils/othelloUtils';

const HIGH_SCORE_KEY = 'othello_best';

const getBest = (): { wins: number; losses: number } => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? JSON.parse(saved) : { wins: 0, losses: 0 };
};

export const useOthello = () => {
  const [state, setState] = useState<OthelloState>(() => {
    const board = createInitialBoard();
    const validMoves = getValidMoves(board, 1);
    return {
      board,
      currentPlayer: 1,
      mode: 'pve',
      blackScore: 2,
      whiteScore: 2,
      validMoves,
      status: 'playing',
      lastPass: false,
    };
  });

  const [best, setBest] = useState(getBest());

  const computeScores = (board: OthelloState['board']) => {
    const { black, white } = countPieces(board);
    return { blackScore: black, whiteScore: white };
  };

  const updateValidMoves = (board: OthelloState['board'], player: 1 | 2) => {
    return getValidMoves(board, player);
  };

  const reset = useCallback((mode?: OthelloMode) => {
    setState(prev => {
      const board = createInitialBoard();
      const validMoves = getValidMoves(board, 1);
      return {
        board,
        currentPlayer: 1,
        mode: mode || prev.mode,
        blackScore: 2,
        whiteScore: 2,
        validMoves,
        status: 'playing',
        lastPass: false,
      };
    });
  }, []);

  const setMode = useCallback((mode: OthelloMode) => {
    const board = createInitialBoard();
    const validMoves = getValidMoves(board, 1);
    setState({
      board,
      currentPlayer: 1,
      mode,
      blackScore: 2,
      whiteScore: 2,
      validMoves,
      status: 'playing',
      lastPass: false,
    });
  }, []);

  const endGame = useCallback((board: OthelloState['board']) => {
    const { black, white } = countPieces(board);
    let winner: 0 | 1 | 2 = 0;
    if (black > white) winner = 1;
    else if (white > black) winner = 2;

    setBest(prev => {
      const updated = { ...prev };
      if (winner === 1) updated.wins += 1;
      else if (winner === 2) updated.losses += 1;
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(updated));
      return updated;
    });

    return { blackScore: black, whiteScore: white, winner };
  }, []);

  // 玩家落子（pvp 模式下双方都能调用）
  const playerMove = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      // pve 模式只允许玩家1下棋；pvp 模式当前玩家都能下
      if (prev.mode === 'pve' && prev.currentPlayer !== 1) return prev;
      const isValid = prev.validMoves.some(m => m.row === row && m.col === col);
      if (!isValid) return prev;

      const currentPlayer = prev.currentPlayer;
      const newBoard = makeMove(prev.board, row, col, currentPlayer);
      if (!newBoard) return prev;

      const scores = computeScores(newBoard);
      // 切换到对方
      const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1;
      let nextPlayer: 1 | 2 = opponent;
      let nextValidMoves = updateValidMoves(newBoard, opponent);

      // 如果对方无合法落子
      if (nextValidMoves.length === 0) {
        // 检查己方是否也无落子（双方都无则结束）
        const selfMoves = updateValidMoves(newBoard, currentPlayer);
        if (selfMoves.length === 0) {
          const endResult = endGame(newBoard);
          return {
            ...prev,
            board: newBoard,
            blackScore: endResult.blackScore,
            whiteScore: endResult.whiteScore,
            status: 'won',
            currentPlayer: opponent,
            validMoves: [],
            lastPass: true,
          };
        }
        // 对方 pass，回到当前玩家
        return {
          ...prev,
          board: newBoard,
          blackScore: scores.blackScore,
          whiteScore: scores.whiteScore,
          currentPlayer: currentPlayer,
          validMoves: selfMoves,
          lastPass: true,
        };
      }

      return {
        ...prev,
        board: newBoard,
        blackScore: scores.blackScore,
        whiteScore: scores.whiteScore,
        currentPlayer: nextPlayer,
        validMoves: nextValidMoves,
        lastPass: false,
      };
    });
  }, [endGame]);

  // AI 落子
  const aiMove = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'pve' || prev.currentPlayer !== 2 || prev.status !== 'playing') return prev;

      const aiMoveResult = aiSelectMove(prev.board, prev.validMoves);
      if (!aiMoveResult) return prev;

      const newBoard = makeMove(prev.board, aiMoveResult.row, aiMoveResult.col, 2);
      if (!newBoard) return prev;

      const scores = computeScores(newBoard);
      // 切换到玩家1
      let nextPlayer: 1 | 2 = 1;
      let nextValidMoves = updateValidMoves(newBoard, 1);

      // 玩家1无合法落子
      if (nextValidMoves.length === 0) {
        // 检查AI自己是否还有落子
        const aiNextMoves = updateValidMoves(newBoard, 2);
        if (aiNextMoves.length === 0) {
          // 双方都无落子，结束
          const endResult = endGame(newBoard);
          return {
            ...prev,
            board: newBoard,
            blackScore: endResult.blackScore,
            whiteScore: endResult.whiteScore,
            status: 'won',
            currentPlayer: 1,
            validMoves: [],
          };
        }
        // 玩家pass，AI继续
        return {
          ...prev,
          board: newBoard,
          blackScore: scores.blackScore,
          whiteScore: scores.whiteScore,
          currentPlayer: 2,
          validMoves: aiNextMoves,
          lastPass: true,
        };
      }

      return {
        ...prev,
        board: newBoard,
        blackScore: scores.blackScore,
        whiteScore: scores.whiteScore,
        currentPlayer: nextPlayer,
        validMoves: nextValidMoves,
        lastPass: false,
      };
    });
  }, [endGame]);

  return {
    state,
    best,
    playerMove,
    aiMove,
    reset,
    setMode,
  };
};