import { useState, useCallback } from 'react';
import { ConnectFourState, OthelloMode } from '../types/game';
import { createEmptyBoard, dropPiece, checkWin, isBoardFull, aiSelectColumn } from '../utils/connectFourUtils';

const HIGH_SCORE_KEY = 'connectfour_best';

const getBest = (): { wins: number; losses: number } => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? JSON.parse(saved) : { wins: 0, losses: 0 };
};

const saveBest = (result: 'win' | 'loss') => {
  const current = getBest();
  const updated = {
    wins: current.wins + (result === 'win' ? 1 : 0),
    losses: current.losses + (result === 'loss' ? 1 : 0),
  };
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(updated));
};

export const useConnectFour = () => {
  const [state, setState] = useState<ConnectFourState>(() => ({
    board: createEmptyBoard(),
    currentPlayer: 1,
    mode: 'pve',
    winner: null,
    status: 'playing',
    winningCells: null,
  }));

  const [best, setBest] = useState(getBest());

  const reset = useCallback((mode?: OthelloMode) => {
    setState(prev => ({
      board: createEmptyBoard(),
      currentPlayer: 1,
      mode: mode || prev.mode,
      winner: null,
      status: 'playing',
      winningCells: null,
    }));
  }, []);

  const setMode = useCallback((mode: OthelloMode) => {
    setState({
      board: createEmptyBoard(),
      currentPlayer: 1,
      mode,
      winner: null,
      status: 'playing',
      winningCells: null,
    });
  }, []);

  const dropAt = useCallback((col: number) => {
    setState(prev => {
      if (prev.status !== 'playing' || prev.winner !== null) return prev;
      if (prev.mode === 'pve' && prev.currentPlayer === 2) return prev;

      const result = dropPiece(prev.board, col, prev.currentPlayer);
      if (!result) return prev;

      const { board: newBoard, row } = result;
      const winningCells = checkWin(newBoard, row, col, prev.currentPlayer);
      if (winningCells) {
        if (prev.mode === 'pve') {
          if (prev.currentPlayer === 1) saveBest('win');
          else saveBest('loss');
          setBest(getBest());
        }
        return {
          ...prev,
          board: newBoard,
          winner: prev.currentPlayer,
          status: 'won',
          winningCells,
        };
      }

      if (isBoardFull(newBoard)) {
        return {
          ...prev,
          board: newBoard,
          status: 'draw',
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      };
    });
  }, []);

  const aiDrop = useCallback(() => {
    setState(prev => {
      if (prev.mode !== 'pve' || prev.currentPlayer !== 2 || prev.status !== 'playing') return prev;
      const col = aiSelectColumn(prev.board, 2);
      const result = dropPiece(prev.board, col, 2);
      if (!result) return prev;

      const { board: newBoard, row } = result;
      const winningCells = checkWin(newBoard, row, col, 2);
      if (winningCells) {
        saveBest('loss');
        setBest(getBest());
        return {
          ...prev,
          board: newBoard,
          winner: 2,
          status: 'won',
          winningCells,
        };
      }

      if (isBoardFull(newBoard)) {
        return {
          ...prev,
          board: newBoard,
          status: 'draw',
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: 1,
      };
    });
  }, []);

  return {
    state,
    best,
    dropAt,
    aiDrop,
    reset,
    setMode,
  };
};