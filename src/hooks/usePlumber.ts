import { useState, useCallback } from 'react';
import { PlumberState } from '../types/game';
import { PLUMBER_LEVELS, checkPlumberWin } from '../utils/plumberUtils';

const HIGH_SCORE_KEY = 'plumber_best';

const getBest = (): number => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? parseInt(saved, 10) : 0;
};

const saveBest = (levelIdx: number) => {
  const current = getBest();
  if (levelIdx + 1 > current) {
    localStorage.setItem(HIGH_SCORE_KEY, (levelIdx + 1).toString());
  }
};

export const usePlumber = () => {
  const [state, setState] = useState<PlumberState>(() => ({
    level: PLUMBER_LEVELS[0],
    levelIndex: 0,
    status: 'playing',
    moves: 0,
    bestMoves: getBest(),
  }));

  const reset = useCallback(() => {
    setState({
      level: PLUMBER_LEVELS[0],
      levelIndex: 0,
      status: 'playing',
      moves: 0,
      bestMoves: state.bestMoves,
    });
  }, [state.bestMoves]);

  const restartLevel = useCallback(() => {
    setState(prev => ({
      ...prev,
      level: PLUMBER_LEVELS[prev.levelIndex],
      status: 'playing',
      moves: 0,
    }));
  }, []);

  const rotateCell = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      const cell = prev.level.grid[row][col];
      // 起点和终点不能旋转
      if (cell.isSource || cell.isTarget) return prev;
      // empty 类型不能旋转
      if (cell.type === 'empty') return prev;

      const newGrid = prev.level.grid.map((r, ri) =>
        ri === row
          ? r.map((c, ci) =>
              ci === col ? { ...c, rotation: (c.rotation + 90) % 360 } : c
            )
          : r
      );

      const won = checkPlumberWin(newGrid, prev.level.sourcePos, prev.level.targetPos);
      if (won) {
        saveBest(prev.levelIndex);
        return {
          ...prev,
          level: { ...prev.level, grid: newGrid },
          moves: prev.moves + 1,
          status: 'won',
        };
      }

      return {
        ...prev,
        level: { ...prev.level, grid: newGrid },
        moves: prev.moves + 1,
      };
    });
  }, []);

  const nextLevel = useCallback(() => {
    setState(prev => {
      const nextIdx = (prev.levelIndex + 1) % PLUMBER_LEVELS.length;
      return {
        ...prev,
        level: PLUMBER_LEVELS[nextIdx],
        levelIndex: nextIdx,
        status: 'playing',
        moves: 0,
      };
    });
  }, []);

  return {
    state,
    totalLevels: PLUMBER_LEVELS.length,
    reset,
    restartLevel,
    rotateCell,
    nextLevel,
  };
};