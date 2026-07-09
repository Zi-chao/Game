import { MemoryCard } from '../types/game';

export const CARD_EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥑', '🍉', '🥭', '🍊', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

export const GRID_SIZES = {
  easy: { pairs: 6, cols: 4 },
  medium: { pairs: 8, cols: 4 },
  hard: { pairs: 12, cols: 6 },
};

export const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const createCards = (pairs: number): MemoryCard[] => {
  const selected = CARD_EMOJIS.slice(0, pairs);
  const cards: MemoryCard[] = [];
  selected.forEach((emoji, idx) => {
    cards.push({ id: idx * 2, emoji, isFlipped: false, isMatched: false });
    cards.push({ id: idx * 2 + 1, emoji, isFlipped: false, isMatched: false });
  });
  return shuffleArray(cards);
};