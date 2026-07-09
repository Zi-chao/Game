import { useState, useCallback, useEffect, useRef } from 'react';
import { MinesweeperState, Difficulty } from '../types/game';
import {
  DIFFICULTY_CONFIGS,
  createEmptyBoard,
  placeMines,
  revealCell,
  toggleFlag,
  revealAllMines,
  countRevealed,
  countFlags,
  checkWin,
} from '../utils/minesweeperUtils';

const HIGH_SCORE_KEY = 'minesweeper_best_time';

const getBestTime = (diff: Difficulty): number => {
  const key = `${HIGH_SCORE_KEY}_${diff}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : 0;
};

const saveBestTime = (diff: Difficulty, time: number) => {
  const key = `${HIGH_SCORE_KEY}_${diff}`;
  const current = getBestTime(diff);
  if (current === 0 || time < current) {
    localStorage.setItem(key, time.toString());
  }
};

export const useMinesweeper = (difficulty: Difficulty) => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [state, setState] = useState<MinesweeperState>(() => ({
    board: createEmptyBoard(config.rows, config.cols),
    rows: config.rows,
    cols: config.cols,
    mineCount: config.mines,
    flagCount: 0,
    revealedCount: 0,
    status: 'idle',
    time: 0,
  }));

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    if (timerRef.current) return;
    startTimeRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      setState(prev => {
        if (prev.status !== 'playing') return prev;
        return { ...prev, time: Math.floor((performance.now() - startTimeRef.current) / 1000) };
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = useCallback(() => {
    stopTimer();
    setState({
      board: createEmptyBoard(config.rows, config.cols),
      rows: config.rows,
      cols: config.cols,
      mineCount: config.mines,
      flagCount: 0,
      revealedCount: 0,
      status: 'idle',
      time: 0,
    });
  }, [config]);

  useEffect(() => {
    reset();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const handleLeftClick = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'lost' || prev.status === 'won') return prev;
      const cell = prev.board[row][col];
      if (cell.state === 'flagged') return prev;

      let board = prev.board;

      // 第一次点击时布雷
      if (prev.status === 'idle') {
        board = placeMines(board, prev.mineCount, row, col);
        startTimer();
      }

      if (board[row][col].isMine) {
        const revealedBoard = revealAllMines(board);
        stopTimer();
        return {
          ...prev,
          board: revealedBoard,
          status: 'lost',
        };
      }

      const newBoard = revealCell(board, row, col);
      const revealedCount = countRevealed(newBoard);

      if (checkWin(newBoard, prev.mineCount)) {
        stopTimer();
        saveBestTime(difficulty, prev.time + 1);
        return {
          ...prev,
          board: newBoard,
          revealedCount,
          status: 'won',
        };
      }

      return {
        ...prev,
        board: newBoard,
        revealedCount,
        status: 'playing',
      };
    });
  }, [difficulty]);

  const handleRightClick = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status === 'lost' || prev.status === 'won') return prev;
      if (prev.status === 'idle') return prev; // 不允许在第一次点击前标记
      const newBoard = toggleFlag(prev.board, row, col);
      return {
        ...prev,
        board: newBoard,
        flagCount: countFlags(newBoard),
      };
    });
  }, []);

  return {
    state,
    bestTime: getBestTime(difficulty),
    reset,
    handleLeftClick,
    handleRightClick,
  };
};