import { useState, useCallback, useEffect } from 'react';
import { GomokuState, GomokuMode } from '../types/game';
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
    setState(prev => ({ ...prev, mode }));
  }, []);

  const placeStone = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing' || prev.winner !== null) return prev;
      if (prev.board[row][col] !== 0) return prev;

      const newBoard = prev.board.map(r => [...r]);
      newBoard[row][col] = prev.currentPlayer;

      if (checkWin(newBoard, row, col, prev.currentPlayer)) {
        if (prev.mode === 'pve' && prev.currentPlayer === 1) {
          saveBest(best.wins + 1, best.losses);
        } else if (prev.mode === 'pve' && prev.currentPlayer === 2) {
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
    if (state.mode === 'pve' && state.status === 'playing' && state.currentPlayer === 2 && state.winner === null) {
      const timer = setTimeout(() => {
        const { row, col } = findBestMove(state.board, 2);
        setState(prev => {
          if (prev.mode !== 'pve' || prev.currentPlayer !== 2 || prev.winner !== null) return prev;
          if (prev.board[row][col] !== 0) return prev;

          const newBoard = prev.board.map(r => [...r]);
          newBoard[row][col] = 2;

          if (checkWin(newBoard, row, col, 2)) {
            saveBest(best.wins, best.losses + 1);
            return {
              ...prev,
              board: newBoard,
              winner: 2,
              status: 'won',
              moves: prev.moves + 1,
            };
          }

          return {
            ...prev,
            board: newBoard,
            currentPlayer: 1,
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
    reset,
    placeStone,
    setMode,
  };
};