import { useState, useCallback } from 'react';
import { HopState, HopDot } from '../types/game';
import { HOP_LEVELS, canHopTo, checkHopWin, saveLevelRecord, clearLevelRecord, clearAllHopRecords } from '../utils/hopUtils';

const HIGH_SCORE_KEY = 'hop_best';

const getBest = (): number => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? parseInt(saved, 10) : 0;
};

const saveBest = (clearedLevels: number) => {
  const current = getBest();
  if (clearedLevels > current) {
    localStorage.setItem(HIGH_SCORE_KEY, clearedLevels.toString());
  }
};

export const useHop = () => {
  const [state, setState] = useState<HopState>(() => {
    const level = HOP_LEVELS[0];
    return {
      level,
      levelIndex: 0,
      currentRow: level.startRow,
      currentCol: level.startCol,
      visited: [{ row: level.startRow, col: level.startCol }],
      status: 'playing',
      moves: 0,
      bestMoves: getBest(),
    };
  });

  const reset = useCallback(() => {
    const level = HOP_LEVELS[0];
    setState({
      level,
      levelIndex: 0,
      currentRow: level.startRow,
      currentCol: level.startCol,
      visited: [{ row: level.startRow, col: level.startCol }],
      status: 'playing',
      moves: 0,
      bestMoves: state.bestMoves,
    });
  }, [state.bestMoves]);

  const restartLevel = useCallback(() => {
    setState(prev => {
      const level = HOP_LEVELS[prev.levelIndex];
      return {
        ...prev,
        currentRow: level.startRow,
        currentCol: level.startCol,
        visited: [{ row: level.startRow, col: level.startCol }],
        status: 'playing',
        moves: 0,
      };
    });
  }, []);

  const hopTo = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;

      // 检查目标是否是关卡中合法点
      const isValidDot = prev.level.dots.some(d => d.row === row && d.col === col);
      if (!isValidDot) return prev;

      // 检查是否能跳到该点
      if (!canHopTo(prev.currentRow, prev.currentCol, row, col, prev.visited)) {
        return prev;
      }

      const newVisited: HopDot[] = [...prev.visited, { row, col }];
      const newMoves = prev.moves + 1;

      // 检查是否获胜（访问了所有关卡点）
      if (checkHopWin(newVisited, prev.level.dots.length)) {
        saveBest(prev.levelIndex + 1);
        saveLevelRecord(prev.levelIndex, newMoves);
        return {
          ...prev,
          visited: newVisited,
          moves: newMoves,
          currentRow: row,
          currentCol: col,
          status: 'won',
        };
      }

      return {
        ...prev,
        visited: newVisited,
        moves: newMoves,
        currentRow: row,
        currentCol: col,
      };
    });
  }, []);

  const nextLevel = useCallback(() => {
    setState(prev => {
      const nextIdx = (prev.levelIndex + 1) % HOP_LEVELS.length;
      const level = HOP_LEVELS[nextIdx];
      return {
        ...prev,
        level,
        levelIndex: nextIdx,
        currentRow: level.startRow,
        currentCol: level.startCol,
        visited: [{ row: level.startRow, col: level.startCol }],
        status: 'playing',
        moves: 0,
      };
    });
  }, []);

  // 清除当前关卡的胜负记录（步数/通关次数）
  const clearCurrentLevelRecord = useCallback(() => {
    clearLevelRecord(state.levelIndex);
    setState(prev => ({ ...prev, bestMoves: 0 }));
  }, [state.levelIndex]);

  // 清除所有跳跳乐记录（含最高关卡）
  const clearAllRecords = useCallback(() => {
    clearAllHopRecords();
    setState(prev => ({ ...prev, bestMoves: 0 }));
  }, []);

  return {
    state,
    totalLevels: HOP_LEVELS.length,
    reset,
    restartLevel,
    hopTo,
    nextLevel,
    clearCurrentLevelRecord,
    clearAllRecords,
  };
};