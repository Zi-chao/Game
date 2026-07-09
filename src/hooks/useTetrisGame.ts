import { useState, useCallback, useEffect, useRef } from 'react';
import { TetrisGameState, Tetromino } from '../types/game';
import {
  createEmptyBoard,
  getRandomTetromino,
  rotate,
  isValidMove,
  mergePiece,
  clearLines,
  calculateScore,
  getDropSpeed,
} from '../utils/tetrisUtils';

const HIGH_SCORE_KEY = 'tetris_high_score';

export const useTetrisGame = () => {
  const [gameState, setGameState] = useState<TetrisGameState>(() => ({
    board: createEmptyBoard(),
    currentPiece: null,
    score: 0,
    highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10),
    level: 1,
    lines: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
  }));

  const gameLoopRef = useRef<number | null>(null);
  const pieceRef = useRef<Tetromino | null>(null);

  const spawnNewPiece = useCallback(() => {
    const piece = getRandomTetromino();
    pieceRef.current = piece;
    return piece;
  }, []);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    pieceRef.current = null;
    setGameState(prev => ({
      board: createEmptyBoard(),
      currentPiece: null,
      score: 0,
      highScore: prev.highScore,
      level: 1,
      lines: 0,
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
    }));
  }, []);

  const startGame = useCallback(() => {
    const piece = spawnNewPiece();
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
      currentPiece: piece,
    }));
  }, [spawnNewPiece]);

  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const move = useCallback((dirX: number, dirY: number): boolean => {
    let moved = false;
    setGameState(prev => {
      if (!prev.currentPiece || !prev.isPlaying || prev.isPaused || prev.isGameOver) {
        return prev;
      }
      const piece = prev.currentPiece;
      if (isValidMove(prev.board, piece, dirX, dirY)) {
        const newPiece = { ...piece, x: piece.x + dirX, y: piece.y + dirY };
        pieceRef.current = newPiece;
        moved = true;
        return { ...prev, currentPiece: newPiece };
      }
      return prev;
    });
    return moved;
  }, []);

  const rotatePiece = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || !prev.isPlaying || prev.isPaused || prev.isGameOver) {
        return prev;
      }
      const piece = prev.currentPiece;
      const rotated = rotate(piece.shape);
      // 简单的墙踢检测
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (isValidMove(prev.board, piece, kick, 0, rotated)) {
          const newPiece = { ...piece, shape: rotated, x: piece.x + kick };
          pieceRef.current = newPiece;
          return { ...prev, currentPiece: newPiece };
        }
      }
      return prev;
    });
  }, []);

  const drop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || !prev.isPlaying || prev.isPaused || prev.isGameOver) {
        return prev;
      }
      const piece = prev.currentPiece;
      if (isValidMove(prev.board, piece, 0, 1)) {
        const newPiece = { ...piece, y: piece.y + 1 };
        pieceRef.current = newPiece;
        return { ...prev, currentPiece: newPiece };
      } else {
        // 锁定方块
        const merged = mergePiece(prev.board, piece);
        const { board: clearedBoard, cleared } = clearLines(merged);
        const newLines = prev.lines + cleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        const scoreGained = calculateScore(cleared) * prev.level;
        const newScore = prev.score + scoreGained;

        // 生成新方块
        const newPiece = getRandomTetromino();
        pieceRef.current = newPiece;

        // 检查游戏结束
        if (!isValidMove(clearedBoard, newPiece)) {
          const newHighScore = Math.max(newScore, prev.highScore);
          localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
          return {
            ...prev,
            board: clearedBoard,
            currentPiece: newPiece,
            score: newScore,
            lines: newLines,
            level: newLevel,
            isPlaying: false,
            isGameOver: true,
            highScore: newHighScore,
          };
        }

        return {
          ...prev,
          board: clearedBoard,
          currentPiece: newPiece,
          score: newScore,
          lines: newLines,
          level: newLevel,
        };
      }
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || !prev.isPlaying || prev.isPaused || prev.isGameOver) {
        return prev;
      }
      let piece = prev.currentPiece;
      let dropDistance = 0;
      while (isValidMove(prev.board, piece, 0, 1)) {
        piece = { ...piece, y: piece.y + 1 };
        dropDistance++;
      }
      const merged = mergePiece(prev.board, piece);
      const { board: clearedBoard, cleared } = clearLines(merged);
      const newLines = prev.lines + cleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const scoreGained = (calculateScore(cleared) + dropDistance) * prev.level;
      const newScore = prev.score + scoreGained;

      const newPiece = getRandomTetromino();
      pieceRef.current = newPiece;

      if (!isValidMove(clearedBoard, newPiece)) {
        const newHighScore = Math.max(newScore, prev.highScore);
        localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
        return {
          ...prev,
          board: clearedBoard,
          currentPiece: newPiece,
          score: newScore,
          lines: newLines,
          level: newLevel,
          isPlaying: false,
          isGameOver: true,
          highScore: newHighScore,
        };
      }

      return {
        ...prev,
        board: clearedBoard,
        currentPiece: newPiece,
        score: newScore,
        lines: newLines,
        level: newLevel,
      };
    });
  }, []);

  // 游戏循环
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
      const speed = getDropSpeed(gameState.level);
      gameLoopRef.current = window.setInterval(drop, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.level, drop]);

  return {
    gameState,
    startGame,
    togglePause,
    resetGame,
    move,
    rotatePiece,
    hardDrop,
  };
};