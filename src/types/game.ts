export type Page =
  | 'home'
  | 'single-mode'
  | 'versus-mode'
  | 'snake'
  | 'tetris'
  | 'plane'
  | 'minesweeper'
  | 'tank'
  | 'memory'
  | 'hop'
  | 'gomoku'
  | 'plumber'
  | 'snake-versus'
  | 'plane-versus'
  | 'pong';

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface SnakeGameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
  highScore: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
}

export interface TetrisGameState {
  board: number[][];
  currentPiece: Tetromino | null;
  score: number;
  highScore: number;
  level: number;
  lines: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface Bullet {
  x: number;
  y: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface PlaneGameState {
  playerX: number;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  highScore: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  lives: number;
}

// 扫雷
export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface MineCell {
  isMine: boolean;
  state: CellState;
  neighborMines: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MinesweeperState {
  board: MineCell[][];
  rows: number;
  cols: number;
  mineCount: number;
  flagCount: number;
  revealedCount: number;
  status: 'idle' | 'playing' | 'won' | 'lost';
  time: number;
}

// 坦克
export interface Tank {
  x: number;
  y: number;
  direction: Direction;
  type: 'player' | 'enemy';
  cooldown: number;
}

export interface TankBullet {
  x: number;
  y: number;
  direction: Direction;
  owner: 'player' | 'enemy';
}

export interface TankGameState {
  player: Tank;
  enemies: Tank[];
  bullets: TankBullet[];
  score: number;
  highScore: number;
  lives: number;
  status: 'idle' | 'playing' | 'won' | 'lost';
}

// 记忆翻牌
export interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryState {
  cards: MemoryCard[];
  flippedIds: number[];
  moves: number;
  matches: number;
  status: 'idle' | 'playing' | 'won';
  time: number;
}

// 跳跳乐
export interface HopDot {
  row: number;
  col: number;
}
// 跳跳乐
export interface HopLevel {
  name?: string;
  dots: HopDot[];
  startRow: number;
  startCol: number;
}

export interface HopState {
  level: HopLevel;
  levelIndex: number;
  currentRow: number;
  currentCol: number;
  visited: HopDot[];
  status: 'playing' | 'won';
  bestMoves: number;
  moves: number;
}

// 五子棋
export type CellValue = 0 | 1 | 2; // 0=空, 1=黑(玩家), 2=白(AI)

export interface GomokuState {
  board: CellValue[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2 | null;
  status: 'playing' | 'won' | 'draw';
  moves: number;
}

// 接水管
export type PipeType = 'empty' | 'straight' | 'corner' | 'cross' | 't_junction' | 'end';

export interface PlumberCell {
  type: PipeType;
  rotation: number; // 0, 90, 180, 270
  isSource?: boolean;
  isTarget?: boolean;
  connected?: boolean;
}

export interface PlumberLevel {
  grid: PlumberCell[][];
  sourcePos: { row: number; col: number };
  targetPos: { row: number; col: number };
}

export interface PlumberState {
  level: PlumberLevel;
  levelIndex: number;
  status: 'playing' | 'won';
  moves: number;
  bestMoves: number;
}

// 双人重力小球
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PongState {
  ball: Ball;
  paddle1: Paddle;
  paddle2: Paddle;
  score1: number;
  score2: number;
  winner: 0 | 1 | 2 | null;
  isPlaying: boolean;
  isPaused: boolean;
}

// 双人贪吃蛇
export interface VersusSnakeState {
  snake1: Position[];
  snake2: Position[];
  food: Position;
  direction1: Direction;
  direction2: Direction;
  score1: number;
  score2: number;
  winner: 0 | 1 | 2 | null;
  isPlaying: boolean;
  isPaused: boolean;
}

// 双人飞机大战
export interface VersusPlaneBullet {
  x: number;
  y: number;
  owner: 1 | 2;
}

export interface VersusPlaneState {
  player1X: number;
  player2X: number;
  bullets: VersusPlaneBullet[];
  score1: number;
  score2: number;
  lives1: number;
  lives2: number;
  winner: 0 | 1 | 2 | null;
  isPlaying: boolean;
  isPaused: boolean;
}