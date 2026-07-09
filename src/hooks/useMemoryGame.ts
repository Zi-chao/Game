import { useState, useCallback, useRef, useEffect } from 'react';
import { MemoryState } from '../types/game';
import { createCards, GRID_SIZES } from '../utils/memoryUtils';

export type MemoryDifficulty = keyof typeof GRID_SIZES;

const HIGH_SCORE_KEY = 'memory_best';

const getBest = (diff: MemoryDifficulty): number => {
  const key = `${HIGH_SCORE_KEY}_${diff}`;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : 0;
};

const saveBest = (diff: MemoryDifficulty, moves: number) => {
  const key = `${HIGH_SCORE_KEY}_${diff}`;
  const current = getBest(diff);
  if (current === 0 || moves < current) {
    localStorage.setItem(key, moves.toString());
  }
};

export const useMemoryGame = (difficulty: MemoryDifficulty) => {
  const config = GRID_SIZES[difficulty];

  const [state, setState] = useState<MemoryState>(() => ({
    cards: createCards(config.pairs),
    flippedIds: [],
    moves: 0,
    matches: 0,
    status: 'idle',
    time: 0,
  }));

  const checkTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    if (checkTimerRef.current) return;
    startTimeRef.current = performance.now();
    checkTimerRef.current = window.setInterval(() => {
      setState(prev => {
        if (prev.status !== 'playing') return prev;
        return { ...prev, time: Math.floor((performance.now() - startTimeRef.current) / 1000) };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (checkTimerRef.current) {
      clearInterval(checkTimerRef.current);
      checkTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    setState({
      cards: createCards(config.pairs),
      flippedIds: [],
      moves: 0,
      matches: 0,
      status: 'idle',
      time: 0,
    });
  }, [config, stopTimer]);

  useEffect(() => {
    reset();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const flipCard = useCallback((id: number) => {
    setState(prev => {
      if (prev.status === 'won') return prev;
      const card = prev.cards.find(c => c.id === id);
      if (!card || card.isMatched || card.isFlipped) return prev;
      if (prev.flippedIds.includes(id)) return prev;
      if (prev.flippedIds.length >= 2) return prev;

      const newFlipped = [...prev.flippedIds, id];
      const newCards = prev.cards.map(c =>
        c.id === id ? { ...c, isFlipped: true } : c
      );

      // 开始游戏
      if (prev.status === 'idle') {
        startTimer();
      }

      // 检查匹配
      if (newFlipped.length === 2) {
        const [id1, id2] = newFlipped;
        const card1 = newCards.find(c => c.id === id1);
        const card2 = newCards.find(c => c.id === id2);
        const isMatch = card1 && card2 && card1.emoji === card2.emoji;
        const newMoves = prev.moves + 1;

        if (isMatch) {
          const matchedCards = newCards.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, isMatched: true } : c
          );
          const newMatches = prev.matches + 1;
          const won = newMatches === config.pairs;

          if (won) {
            stopTimer();
            saveBest(difficulty, newMoves);
          }

          return {
            ...prev,
            cards: matchedCards,
            flippedIds: [],
            moves: newMoves,
            matches: newMatches,
            status: won ? 'won' : 'playing',
          };
        } else {
          // 不匹配，1秒后翻回
          setTimeout(() => {
            setState(s => ({
              ...s,
              cards: s.cards.map(c =>
                c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c
              ),
              flippedIds: [],
            }));
          }, 800);
          return {
            ...prev,
            cards: newCards,
            flippedIds: newFlipped,
            moves: newMoves,
            status: 'playing',
          };
        }
      }

      return {
        ...prev,
        cards: newCards,
        flippedIds: newFlipped,
        status: 'playing',
      };
    });
  }, [config.pairs, difficulty, startTimer, stopTimer]);

  return {
    state,
    bestMoves: getBest(difficulty),
    reset,
    flipCard,
  };
};