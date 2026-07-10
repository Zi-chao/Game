import { useState, useCallback, useRef } from 'react';
import { TicTacToeState, OthelloMode, AiSide } from '../types/game';
import { checkWinner, checkDraw, aiMove } from '../utils/tictactoeUtils';

const HIGH_SCORE_KEY = 'tictactoe_best';

const getBest = (): { wins: number; losses: number; draws: number } => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? JSON.parse(saved) : { wins: 0, losses: 0, draws: 0 };
};

const saveBest = (result: 'win' | 'loss' | 'draw') => {
  const current = getBest();
  const updated = {
    wins: current.wins + (result === 'win' ? 1 : 0),
    losses: current.losses + (result === 'loss' ? 1 : 0),
    draws: current.draws + (result === 'draw' ? 1 : 0),
  };
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(updated));
};

export const useTicTacToe = () => {
  const [state, setState] = useState<TicTacToeState>(() => ({
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    currentPlayer: 1,
    mode: 'pve',
    winner: null,
    status: 'playing',
    winningLine: null,
  }));

  // AI 执哪一方：1=执X(先手)  2=执O(后手)，默认 2（玩家先手）
  const [aiSide, setAiSideState] = useState<AiSide>(2);
  const aiSideRef = useRef<AiSide>(2);

  const [best, setBest] = useState(getBest());

  const reset = useCallback((mode?: OthelloMode) => {
    setState(prev => ({
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      currentPlayer: 1,
      mode: mode || prev.mode,
      winner: null,
      status: 'playing',
      winningLine: null,
    }));
  }, []);

  const setMode = useCallback((mode: OthelloMode) => {
    setState({
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      currentPlayer: 1,
      mode,
      winner: null,
      status: 'playing',
      winningLine: null,
    });
  }, []);

  const setAiSide = useCallback((side: AiSide) => {
    aiSideRef.current = side;
    setAiSideState(side);
    setState(prev => ({
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      currentPlayer: 1,
      mode: prev.mode,
      winner: null,
      status: 'playing',
      winningLine: null,
    }));
  }, []);

  const makeMove = useCallback((index: number) => {
    setState(prev => {
      if (prev.status !== 'playing' || prev.winner !== null) return prev;
      if (prev.board[index] !== 0) return prev;
      if (prev.mode === 'pve' && prev.currentPlayer === aiSideRef.current) return prev;

      const newBoard = [...prev.board];
      newBoard[index] = prev.currentPlayer;

      const { winner, line } = checkWinner(newBoard);
      if (winner !== null) {
        if (prev.mode === 'pve') {
          if (winner !== aiSideRef.current) saveBest('win');
          else saveBest('loss');
          setBest(getBest());
        }
        return {
          ...prev,
          board: newBoard,
          winner,
          status: 'won',
          winningLine: line,
          currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        };
      }

      if (checkDraw(newBoard)) {
        if (prev.mode === 'pve') saveBest('draw');
        setBest(getBest());
        return {
          ...prev,
          board: newBoard,
          status: 'draw',
          currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      };
    });
  }, []);

  // AI 自动落子（在 pve 模式下，AI 回合时自动调用）
  const aiMakeMove = useCallback(() => {
    const aiPlayer = aiSideRef.current;
    setState(prev => {
      if (prev.mode !== 'pve' || prev.currentPlayer !== aiPlayer || prev.status !== 'playing') return prev;
      const move = aiMove([...prev.board], aiPlayer);
      if (move < 0) return prev;

      const newBoard = [...prev.board];
      newBoard[move] = aiPlayer;

      const { winner, line } = checkWinner(newBoard);
      if (winner !== null) {
        saveBest('loss');
        setBest(getBest());
        return {
          ...prev,
          board: newBoard,
          winner,
          status: 'won',
          winningLine: line,
        };
      }

      if (checkDraw(newBoard)) {
        saveBest('draw');
        setBest(getBest());
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
    makeMove,
    aiMakeMove,
    reset,
    setMode,
    setAiSide,
  };
};