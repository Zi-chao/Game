import { useState, useCallback, useRef } from 'react';
import { ConnectFourState, OthelloMode, AiSide } from '../types/game';
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

  // AI 执哪一方：1=执红(先手)  2=执黄(后手)，默认 2（玩家先手）
  const [aiSide, setAiSideState] = useState<AiSide>(2);
  const aiSideRef = useRef<AiSide>(2);

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

  const setAiSide = useCallback((side: AiSide) => {
    aiSideRef.current = side;
    setAiSideState(side);
    setState(prev => ({
      board: createEmptyBoard(),
      currentPlayer: 1,
      mode: prev.mode,
      winner: null,
      status: 'playing',
      winningCells: null,
    }));
  }, []);

  const dropAt = useCallback((col: number) => {
    setState(prev => {
      if (prev.status !== 'playing' || prev.winner !== null) return prev;
      if (prev.mode === 'pve' && prev.currentPlayer === aiSideRef.current) return prev;

      const result = dropPiece(prev.board, col, prev.currentPlayer);
      if (!result) return prev;

      const { board: newBoard, row } = result;
      const winningCells = checkWin(newBoard, row, col, prev.currentPlayer);
      if (winningCells) {
        if (prev.mode === 'pve') {
          if (prev.currentPlayer !== aiSideRef.current) saveBest('win');
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
    const aiPlayer = aiSideRef.current;
    setState(prev => {
      if (prev.mode !== 'pve' || prev.currentPlayer !== aiPlayer || prev.status !== 'playing') return prev;
      const col = aiSelectColumn(prev.board, aiPlayer);
      const result = dropPiece(prev.board, col, aiPlayer);
      if (!result) return prev;

      const { board: newBoard, row } = result;
      const winningCells = checkWin(newBoard, row, col, aiPlayer);
      if (winningCells) {
        // AI 赢了 -> 玩家输了
        saveBest('loss');
        setBest(getBest());
        return {
          ...prev,
          board: newBoard,
          winner: aiPlayer,
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
        currentPlayer: aiPlayer === 1 ? 2 : 1,
      };
    });
  }, []);

  return {
    state,
    best,
    aiSide,
    dropAt,
    aiDrop,
    reset,
    setMode,
    setAiSide,
  };
};