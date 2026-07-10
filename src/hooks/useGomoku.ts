import { useState, useCallback, useEffect, useRef } from 'react';
import { GomokuState, GomokuMode, AiSide } from '../types/game';
import { createEmptyBoard, checkWin, findBestMove } from '../utils/gomokuUtils';

const HIGH_SCORE_KEY = 'gomoku_best';

const getBest = (): { wins: number; losses: number } => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? JSON.parse(saved) : { wins: 0, losses: 0 };
};

const saveBest = (wins: number, losses: number) => {
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify({ wins, losses }));
};

export const useGomoku = () => {
  const [state, setState] = useState<GomokuState>(() => ({
    board: createEmptyBoard(),
    currentPlayer: 1,
    winner: null,
    status: 'playing',
    moves: 0,
    mode: 'pve',
  }));

  // AI 执哪一方：1=执黑(先手)  2=执白(后手)，默认 2（玩家先手）
  const [aiSide, setAiSideState] = useState<AiSide>(2);
  const aiSideRef = useRef<AiSide>(2);

  const best = getBest();

  const reset = useCallback(() => {
    setState(prev => ({
      board: createEmptyBoard(),
      currentPlayer: 1,
      winner: null,
      status: 'playing',
      moves: 0,
      mode: prev.mode,
    }));
  }, []);

  const setMode = useCallback((mode: GomokuMode) => {
    setState(prev => ({
      board: createEmptyBoard(),
      currentPlayer: 1,
      winner: null,
      status: 'playing',
      moves: 0,
      mode,
    }));
  }, []);

  const setAiSide = useCallback((side: AiSide) => {
    aiSideRef.current = side;
    setAiSideState(side);
    // aiSide=1: AI 执黑先手 -> currentPlayer 应该=1 (AI先手)
    // aiSide=2: 玩家执黑先手 -> currentPlayer=1 (玩家先手)
    // 实际上颜色1是先手方，所以 currentPlayer 始终=1
    setState(prev => ({
      board: createEmptyBoard(),
      currentPlayer: 1,
      winner: null,
      status: 'playing',
      moves: 0,
      mode: prev.mode,
    }));
  }, []);

  const placeStone = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing' || prev.winner !== null) return prev;
      if (prev.board[row][col] !== 0) return prev;
      if (prev.mode === 'pve' && prev.currentPlayer === aiSideRef.current) return prev;

      const newBoard = prev.board.map(r => [...r]);
      newBoard[row][col] = prev.currentPlayer;

      if (checkWin(newBoard, row, col, prev.currentPlayer)) {
        // 玩家（人类）胜利：aiSide 玩家是 1 则 currentPlayer=1 表示 AI 赢
        if (prev.mode === 'pve' && prev.currentPlayer !== aiSideRef.current) {
          // 玩家胜利
          saveBest(best.wins + 1, best.losses);
        } else if (prev.mode === 'pve') {
          // AI 胜利
          saveBest(best.wins, best.losses + 1);
        }
        return {
          ...prev,
          board: newBoard,
          winner: prev.currentPlayer,
          status: 'won',
          moves: prev.moves + 1,
        };
      }

      if (prev.moves + 1 >= 15 * 15) {
        return {
          ...prev,
          board: newBoard,
          winner: 0,
          status: 'draw',
          moves: prev.moves + 1,
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        moves: prev.moves + 1,
      };
    });
  }, [best]);

  useEffect(() => {
    const aiPlayer = aiSideRef.current;
    if (state.mode === 'pve' && state.status === 'playing' && state.currentPlayer === aiPlayer && state.winner === null) {
      const timer = setTimeout(() => {
        const { row, col } = findBestMove(state.board, aiPlayer);
        setState(prev => {
          if (prev.mode !== 'pve' || prev.currentPlayer !== aiPlayer || prev.winner !== null) return prev;
          if (prev.board[row][col] !== 0) return prev;

          const newBoard = prev.board.map(r => [...r]);
          newBoard[row][col] = aiPlayer;

          if (checkWin(newBoard, row, col, aiPlayer)) {
            saveBest(best.wins, best.losses + 1);
            return {
              ...prev,
              board: newBoard,
              winner: aiPlayer,
              status: 'won',
              moves: prev.moves + 1,
            };
          }

          return {
            ...prev,
            board: newBoard,
            currentPlayer: aiPlayer === 1 ? 2 : 1,
            moves: prev.moves + 1,
          };
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, state.board, state.status, state.winner, state.mode, best]);

  return {
    state,
    best,
    aiSide,
    reset,
    placeStone,
    setMode,
    setAiSide,
  };
};