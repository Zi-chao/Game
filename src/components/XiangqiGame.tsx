import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { OthelloMode, AiSide } from '../types/game';
import { AiSideSelector } from './AiSideSelector';
import { OrientationPrompt } from './OrientationPrompt';
import { GameControls } from './GameControls';
import { ClearCacheButton } from './ClearCacheButton';
import { useGamepad } from '../hooks/useGamepad';

interface XiangqiGameProps {
  onBack: () => void;
}

type PieceType = 'king' | 'guard' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'soldier';
type Piece = { type: PieceType; color: 1 | 2 };

// 棋盘 10 行 9 列（交叉点）
const BOARD_ROWS = 10;
const BOARD_COLS = 9;
const LOGIC_POINT_SPACING = 56; // 逻辑单位
const LOGIC_PIECE_SIZE = 44;
const LOGIC_PADDING = 28;

// 玩家始终在下方 (row 5~9)，AI 在上方 (row 0~4)
// color=1 表示玩家（始终在下方）, color=2 表示 AI（始终在上方）
// 这样玩家的棋子永远是 color=1, AI 永远是 color=2
// 注意：这与传统的"color=1红方在上"语义不同，但保证玩家始终在下方
const createInitialBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));

  // 玩家位置 (row 5~9, 下方) - color=1
  const playerPieces: { type: PieceType; row: number; col: number }[] = [
    { type: 'chariot', row: 9, col: 0 }, { type: 'chariot', row: 9, col: 8 },
    { type: 'horse', row: 9, col: 1 }, { type: 'horse', row: 9, col: 7 },
    { type: 'elephant', row: 9, col: 2 }, { type: 'elephant', row: 9, col: 6 },
    { type: 'guard', row: 9, col: 3 }, { type: 'guard', row: 9, col: 5 },
    { type: 'king', row: 9, col: 4 },
    { type: 'cannon', row: 7, col: 1 }, { type: 'cannon', row: 7, col: 7 },
    { type: 'soldier', row: 6, col: 0 }, { type: 'soldier', row: 6, col: 2 },
    { type: 'soldier', row: 6, col: 4 }, { type: 'soldier', row: 6, col: 6 },
    { type: 'soldier', row: 6, col: 8 },
  ];

  // AI 位置 (row 0~4, 上方) - color=2
  const aiPieces: { type: PieceType; row: number; col: number }[] = [
    { type: 'chariot', row: 0, col: 0 }, { type: 'chariot', row: 0, col: 8 },
    { type: 'horse', row: 0, col: 1 }, { type: 'horse', row: 0, col: 7 },
    { type: 'elephant', row: 0, col: 2 }, { type: 'elephant', row: 0, col: 6 },
    { type: 'guard', row: 0, col: 3 }, { type: 'guard', row: 0, col: 5 },
    { type: 'king', row: 0, col: 4 },
    { type: 'cannon', row: 2, col: 1 }, { type: 'cannon', row: 2, col: 7 },
    { type: 'soldier', row: 3, col: 0 }, { type: 'soldier', row: 3, col: 2 },
    { type: 'soldier', row: 3, col: 4 }, { type: 'soldier', row: 3, col: 6 },
    { type: 'soldier', row: 3, col: 8 },
  ];

  // color=1 = 玩家（永远在 row 5~9 下方）
  // color=2 = AI（永远在 row 0~4 上方）
  playerPieces.forEach(p => board[p.row][p.col] = { type: p.type, color: 1 });
  aiPieces.forEach(p => board[p.row][p.col] = { type: p.type, color: 2 });

  return board;
};

// 根据玩家视角返回棋子符号
// playerColor: 玩家执哪一方（1=玩家, 2=AI）
// 玩家在下方时，我们希望玩家棋子显示"将/卒"(黑方风格)或"帅/兵"(红方风格)？
// 用户期望：玩家执红先手时看到"帅/兵"，执黑后手时看到"将/卒"
// 即：始终让玩家的棋子显示为红方字符
const getPieceSymbol = (piece: Piece): string => {
  const redSymbols: Record<PieceType, string> = {
    king: '帅', guard: '仕', elephant: '相', horse: '马', chariot: '车', cannon: '炮', soldier: '兵',
  };
  const blackSymbols: Record<PieceType, string> = {
    king: '将', guard: '士', elephant: '象', horse: '马', chariot: '车', cannon: '炮', soldier: '卒',
  };
  // color=1 = 玩家 -> 显示红字符（帅/兵等）
  // color=2 = AI -> 显示黑字符（将/卒等）
  return piece.color === 1 ? redSymbols[piece.type] : blackSymbols[piece.type];
};

export const XiangqiGame = ({ onBack }: XiangqiGameProps) => {
  // 玩家始终在下方 (color=1), AI 始终在上方 (color=2)
  // aiSide=1: AI 先手 -> currentPlayer 初始为 2 (AI)
  // aiSide=2: 玩家先手 -> currentPlayer 初始为 1 (玩家)
  const [aiSide, setAiSide] = useState<AiSide>(1);
  const [board, setBoard] = useState<(Piece | null)[][]>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(2);  // 默认 AI 先手
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [mode, setMode] = useState<OthelloMode>(() => {
    const saved = sessionStorage.getItem('game_mode_xiangqi') as OthelloMode | null;
    return saved === 'pve' || saved === 'pvp' ? saved : 'pvp';
  });
  const [status, setStatus] = useState<'playing' | 'won'>('playing');
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [check, setCheck] = useState<0 | 1 | 2>(0);
  const [cursor, setCursor] = useState({ row: 9, col: 4 });
  const lastDirRef = useRef<string | null>(null);
  const gamepad = useGamepad();


  // 手柄光标移动
  useEffect(() => {
    if (!gamepad.connected) return;
    if (status !== 'playing') return;
    if (gamepad.direction && gamepad.direction !== lastDirRef.current) {
      lastDirRef.current = gamepad.direction;
      if (gamepad.direction === 'LEFT' && cursor.col > 0) setCursor({ ...cursor, col: cursor.col - 1 });
      else if (gamepad.direction === 'RIGHT' && cursor.col < BOARD_COLS - 1) setCursor({ ...cursor, col: cursor.col + 1 });
      else if (gamepad.direction === 'UP' && cursor.row > 0) setCursor({ ...cursor, row: cursor.row - 1 });
      else if (gamepad.direction === 'DOWN' && cursor.row < BOARD_ROWS - 1) setCursor({ ...cursor, row: cursor.row + 1 });
    } else if (!gamepad.direction) {
      lastDirRef.current = null;
    }
  }, [gamepad.direction, cursor, status]);

  // 手柄 B 键：取消选择
  useEffect(() => {
    if (!gamepad.connected) return;
    if (!gamepad.buttons.b) return;
    if (selected) setSelected(null);
  }, [gamepad.buttons.b, selected]);

  // 容器引用：用于测量实际可用尺寸
  const containerRef = useRef<HTMLDivElement>(null);

  // 实际渲染尺寸
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const reset = useCallback(() => {
    setBoard(createInitialBoard());
    // currentPlayer 根据 aiSide 决定
    // aiSide=1: AI 先手 (color=2) -> 2
    // aiSide=2: 玩家先手 (color=1) -> 1
    setCurrentPlayer(aiSide === 1 ? 2 : 1);
    setSelected(null);
    setStatus('playing');
    setWinner(0);
    setCheck(0);
  }, [aiSide]);

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    if (piece.color !== currentPlayer) return false;

    const target = board[toRow][toCol];
    if (target && target.color === currentPlayer) return false;

    const dr = toRow - fromRow;
    const dc = toCol - fromCol;

    // 玩家 (color=1) 永远在下方 row 5~9, AI (color=2) 永远在 row 0~4
    // 玩家兵/将/士向上进攻 (dr < 0), AI 兵/将/士向下进攻 (dr > 0)
    // 但红方(传统规则color=1)是向上进攻, 黑方(传统规则color=2)是向下进攻
    // 我们的 color=1=玩家在下方 -> 与传统红方规则一致 (向上进攻)
    // 我们的 color=2=AI在上方 -> 与传统黑方规则一致 (向下进攻)
    // 所以 direction 规则保持原样即可：color=1 -> direction=1 (dr=1, 即向 row 增大方向)
    // 等等：中国象棋中"前进"对于红方(在下方)是 dr=-1(向上)
    // 原代码：piece.color === 1 ? 1 : -1 表示 color=1 前进是 dr=+1
    // 但 color=1 (玩家) 在下方，向上应该是 dr=-1
    // 所以原来的方向是反的！
    // 修正：color=1 (玩家在下方) -> direction = -1 (向上)
    //      color=2 (AI 在上方) -> direction = +1 (向下)
    // 同样修正 king, guard, elephant 的活动区域

    switch (piece.type) {
      case 'king':
        if (Math.abs(dr) + Math.abs(dc) === 1 &&
            toCol >= 3 && toCol <= 5 &&
            (piece.color === 1 ? toRow >= 7 && toRow <= 9 : toRow >= 0 && toRow <= 2)) {
          return true;
        }
        if (dc === 0 && target?.type === 'king') {
          const minRow = Math.min(fromRow, toRow);
          const maxRow = Math.max(fromRow, toRow);
          let hasObstacle = false;
          for (let r = minRow + 1; r < maxRow; r++) {
            if (board[r][fromCol] !== null) {
              hasObstacle = true;
              break;
            }
          }
          if (!hasObstacle) {
            return true;
          }
        }
        return false;
      case 'guard':
        return Math.abs(dr) === 1 && Math.abs(dc) === 1 &&
               toCol >= 3 && toCol <= 5 &&
               (piece.color === 1 ? toRow >= 7 && toRow <= 9 : toRow >= 0 && toRow <= 2);
      case 'elephant':
        return Math.abs(dr) === 2 && Math.abs(dc) === 2 &&
               (piece.color === 1 ? toRow >= 5 : toRow <= 4) &&
               board[fromRow + dr/2][fromCol + dc/2] === null;
      case 'horse':
        if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) {
          if (Math.abs(dr) === 2) {
            if (board[fromRow + dr/2][fromCol] !== null) return false;
          } else {
            if (board[fromRow][fromCol + dc/2] !== null) return false;
          }
          return true;
        }
        return false;
      case 'chariot':
        if (dr === 0 || dc === 0) {
          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          let r = fromRow + stepR;
          let c = fromCol + stepC;
          while (r !== toRow || c !== toCol) {
            if (board[r][c] !== null) return false;
            r += stepR;
            c += stepC;
          }
          return true;
        }
        return false;
      case 'cannon':
        if (dr === 0 || dc === 0) {
          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          let r = fromRow + stepR;
          let c = fromCol + stepC;
          let count = 0;
          while (r !== toRow || c !== toCol) {
            if (board[r][c] !== null) count++;
            if (count > 1) return false;
            r += stepR;
            c += stepC;
          }
          if (target) return count === 1;
          return count === 0;
        }
        return false;
      case 'soldier': {
        // 玩家 (color=1) 在下方，向上进攻：direction = -1
        // AI (color=2) 在上方，向下进攻：direction = +1
        const direction = piece.color === 1 ? -1 : 1;
        if (dr === direction && dc === 0) return true;
        // 过河后可以横移
        if (piece.color === 1 && toRow <= 4 && dr === 0 && Math.abs(dc) === 1) return true;
        if (piece.color === 2 && toRow >= 5 && dr === 0 && Math.abs(dc) === 1) return true;
        return false;
      }
      default:
        return false;
    }
  };

  const checkKing = useCallback((boardState: (Piece | null)[][]): 0 | 1 | 2 => {
    let redKingPos: { row: number; col: number } | null = null;
    let blackKingPos: { row: number; col: number } | null = null;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = boardState[r][c];
        if (piece?.type === 'king') {
          if (piece.color === 1) {
            redKingPos = { row: r, col: c };
          } else {
            blackKingPos = { row: r, col: c };
          }
        }
      }
    }

    if (redKingPos && blackKingPos && redKingPos.col === blackKingPos.col) {
      const minRow = Math.min(redKingPos.row, blackKingPos.row);
      const maxRow = Math.max(redKingPos.row, blackKingPos.row);
      let hasObstacle = false;
      for (let r = minRow + 1; r < maxRow; r++) {
        if (boardState[r][redKingPos.col] !== null) {
          hasObstacle = true;
          break;
        }
      }
      if (!hasObstacle) {
        return 2;
      }
    }

    const isUnderAttack = (kingPos: { row: number; col: number }, attackerColor: 1 | 2): boolean => {
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const piece = boardState[r][c];
          if (piece && piece.color === attackerColor) {
            if (piece.type === 'cannon') {
              const dr = kingPos.row - r;
              const dc = kingPos.col - c;
              if (dr === 0 || dc === 0) {
                const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
                const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
                let rr = r + stepR;
                let cc = c + stepC;
                let count = 0;
                while (rr !== kingPos.row || cc !== kingPos.col) {
                  if (boardState[rr][cc] !== null) count++;
                  rr += stepR;
                  cc += stepC;
                }
                if (count === 1) return true;
              }
            } else if (piece.type === 'chariot') {
              const dr = kingPos.row - r;
              const dc = kingPos.col - c;
              if (dr === 0 || dc === 0) {
                const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
                const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
                let rr = r + stepR;
                let cc = c + stepC;
                let hasBlock = false;
                while (rr !== kingPos.row || cc !== kingPos.col) {
                  if (boardState[rr][cc] !== null) {
                    hasBlock = true;
                    break;
                  }
                  rr += stepR;
                  cc += stepC;
                }
                if (!hasBlock) return true;
              }
            } else if (piece.type === 'horse') {
              const dr = Math.abs(kingPos.row - r);
              const dc = Math.abs(kingPos.col - c);
              if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) {
                if (dr === 2) {
                  if (boardState[r + (kingPos.row - r) / 2][c] === null) return true;
                } else {
                  if (boardState[r][c + (kingPos.col - c) / 2] === null) return true;
                }
              }
            } else if (piece.type === 'soldier') {
              const dr = kingPos.row - r;
              const dc = kingPos.col - c;
              if (piece.color === 1) {
                if ((dr === 1 && dc === 0) || (kingPos.row >= 5 && dr === 0 && Math.abs(dc) === 1)) {
                  return true;
                }
              } else {
                if ((dr === -1 && dc === 0) || (kingPos.row <= 4 && dr === 0 && Math.abs(dc) === 1)) {
                  return true;
                }
              }
            } else if (piece.type === 'elephant') {
              const dr = Math.abs(kingPos.row - r);
              const dc = Math.abs(kingPos.col - c);
              if (dr === 2 && dc === 2) {
                if (boardState[r + (kingPos.row - r) / 2][c + (kingPos.col - c) / 2] === null) {
                  return true;
                }
              }
            } else if (piece.type === 'guard') {
              const dr = Math.abs(kingPos.row - r);
              const dc = Math.abs(kingPos.col - c);
              if (dr === 1 && dc === 1 && kingPos.col >= 3 && kingPos.col <= 5) {
                if (piece.color === 1 && kingPos.row >= 0 && kingPos.row <= 2) return true;
                if (piece.color === 2 && kingPos.row >= 7 && kingPos.row <= 9) return true;
              }
            }
          }
        }
      }
      return false;
    };

    if (redKingPos && isUnderAttack(redKingPos, 2)) return 1;
    if (blackKingPos && isUnderAttack(blackKingPos, 1)) return 2;
    return 0;
  }, []);

  const validMoves = useMemo(() => {
    if (!selected) return [];
    const moves: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (isValidMove(selected.row, selected.col, r, c)) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  }, [selected, board, currentPlayer]);

  // 计算实际像素尺寸
  const measuredSize = useMemo(() => {
    const totalLogicWidth = (BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2;
    const totalLogicHeight = (BOARD_ROWS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2;
    const aspectRatio = totalLogicWidth / totalLogicHeight;

    if (boardSize.width > 0 && boardSize.height > 0) {
      // 棋盘大小：保持纵横比，填充容器
      const containerAspect = boardSize.width / boardSize.height;
      let boardPxWidth: number;
      let boardPxHeight: number;
      if (containerAspect > aspectRatio) {
        boardPxHeight = boardSize.height;
        boardPxWidth = boardPxHeight * aspectRatio;
      } else {
        boardPxWidth = boardSize.width;
        boardPxHeight = boardPxWidth / aspectRatio;
      }
      // 简单的换算：1 逻辑单位 = (boardPxWidth / totalLogicWidth) 像素
      const scale = boardPxWidth / totalLogicWidth;
      return {
        width: boardPxWidth,
        height: boardPxHeight,
        padding: LOGIC_PADDING * scale,
        pointSpacing: LOGIC_POINT_SPACING * scale,
        pieceSize: LOGIC_PIECE_SIZE * scale,
      };
    }
    return { width: 0, height: 0, padding: 0, pointSpacing: 0, pieceSize: 0 };
  }, [boardSize]);

  // 测量棋盘实际尺寸
  useLayoutEffect(() => {
    const updateSize = () => {
      // 使用棋盘 div 的尺寸（直接接收点击的元素）
      const board = document.querySelector('[data-xiangqi-board]') as HTMLElement | null;
      if (board) {
        setBoardSize({ width: board.clientWidth, height: board.clientHeight });
        return;
      }
      const el = containerRef.current;
      if (el) {
        setBoardSize({ width: el.clientWidth, height: el.clientHeight });
      }
    };
    updateSize();
    // 延迟再次测量，确保 SVG 渲染完成
    const timer = setTimeout(updateSize, 50);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const getAllValidMoves = useMemo(() => {
    const moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (piece && piece.color === currentPlayer) {
          for (let tr = 0; tr < BOARD_ROWS; tr++) {
            for (let tc = 0; tc < BOARD_COLS; tc++) {
              if (isValidMove(r, c, tr, tc)) {
                moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc });
              }
            }
          }
        }
      }
    }
    return moves;
  }, [board, currentPlayer]);

  const pieceValues: Record<PieceType, number> = {
    king: 10000,
    chariot: 900,
    cannon: 450,
    horse: 400,
    elephant: 200,
    guard: 200,
    soldier: 100,
  };

  const evaluateBoard = (boardState: (Piece | null)[][]): number => {
    let score = 0;

    // AI 永远是 color=2 (上方 row 0~4), 玩家永远是 color=1 (下方 row 5~9)
    // AI 进攻方向：向 row 增大方向 (向下)
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = boardState[r][c];
        if (piece) {
          const baseValue = pieceValues[piece.type];
          // AI = color=2 -> multiplier = 1 (AI视角看自己)
          // 玩家 = color=1 -> multiplier = -1
          const multiplier = piece.color === 2 ? 1 : -1;
          let positionBonus = 0;

          // AI (color=2) 在上方，进攻方向向下 (r 越大越好)
          if (piece.color === 2) {
            switch (piece.type) {
              case 'soldier':
                positionBonus = r * 60;
                if (r >= 5) positionBonus += 100; // 过河
                break;
              case 'horse':
              case 'chariot':
              case 'cannon':
                positionBonus = r * 25;
                break;
            }
          } else {
            // 玩家 (color=1) 在下方，进攻方向向上 (r 越小越好)
            switch (piece.type) {
              case 'soldier':
                positionBonus = (BOARD_ROWS - 1 - r) * 60;
                if (r <= 4) positionBonus += 100; // 过河
                break;
              case 'horse':
              case 'chariot':
              case 'cannon':
                positionBonus = (BOARD_ROWS - 1 - r) * 25;
                break;
            }
          }

          score += multiplier * (baseValue + positionBonus);
        }
      }
    }

    const checkResult = checkKing(boardState);
    // checkResult=1: 玩家被将 (颜色1), 扣分
    // checkResult=2: AI被将 (颜色2), 加分
    if (checkResult === 1) {
      score -= 3000;
    } else if (checkResult === 2) {
      score += 3000;
    }

    return score;
  };

  const getMovesForColor = (boardState: (Piece | null)[][], color: 1 | 2): Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> => {
    const moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number }> = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          for (let tr = 0; tr < BOARD_ROWS; tr++) {
            for (let tc = 0; tc < BOARD_COLS; tc++) {
              const target = boardState[tr][tc];
              if (target && target.color === color) continue;
              const dr = tr - r;
              const dc = tc - c;
              let valid = false;
              switch (piece.type) {
                case 'king':
                  if (Math.abs(dr) + Math.abs(dc) === 1 && tc >= 3 && tc <= 5) {
                    if (piece.color === 1 && tr >= 0 && tr <= 2) valid = true;
                    if (piece.color === 2 && tr >= 7 && tr <= 9) valid = true;
                  }
                  if (!valid && dc === 0 && target?.type === 'king') {
                    const minRow = Math.min(r, tr);
                    const maxRow = Math.max(r, tr);
                    let hasObstacle = false;
                    for (let rr = minRow + 1; rr < maxRow; rr++) {
                      if (boardState[rr][r] !== null) { hasObstacle = true; break; }
                    }
                    if (!hasObstacle) valid = true;
                  }
                  break;
                case 'guard':
                  valid = Math.abs(dr) === 1 && Math.abs(dc) === 1 && tc >= 3 && tc <= 5;
                  if (valid) {
                    if (piece.color === 1 && (tr < 0 || tr > 2)) valid = false;
                    if (piece.color === 2 && (tr < 7 || tr > 9)) valid = false;
                  }
                  break;
                case 'elephant':
                  valid = Math.abs(dr) === 2 && Math.abs(dc) === 2;
                  if (valid) {
                    if (piece.color === 1 && tr > 4) valid = false;
                    if (piece.color === 2 && tr < 5) valid = false;
                    if (boardState[r + dr/2][c + dc/2] !== null) valid = false;
                  }
                  break;
                case 'horse':
                  if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) {
                    if (Math.abs(dr) === 2) {
                      if (boardState[r + dr/2][c] === null) valid = true;
                    } else {
                      if (boardState[r][c + dc/2] === null) valid = true;
                    }
                  }
                  break;
                case 'chariot':
                  if (dr === 0 || dc === 0) {
                    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
                    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
                    let rr = r + stepR, cc = c + stepC;
                    let blocked = false;
                    while (rr !== tr || cc !== tc) {
                      if (boardState[rr][cc] !== null) { blocked = true; break; }
                      rr += stepR; cc += stepC;
                    }
                    if (!blocked) valid = true;
                  }
                  break;
                case 'cannon':
                  if (dr === 0 || dc === 0) {
                    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
                    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
                    let rr = r + stepR, cc = c + stepC;
                    let count = 0;
                    while (rr !== tr || cc !== tc) {
                      if (boardState[rr][cc] !== null) count++;
                      if (count > 1) break;
                      rr += stepR; cc += stepC;
                    }
                    if (count <= 1 && ((target && count === 1) || (!target && count === 0))) valid = true;
                  }
                  break;
                case 'soldier':
                  const dir = piece.color === 1 ? 1 : -1;
                  if (dr === dir && dc === 0) valid = true;
                  if (piece.color === 1 && tr >= 5 && dr === 0 && Math.abs(dc) === 1) valid = true;
                  if (piece.color === 2 && tr <= 4 && dr === 0 && Math.abs(dc) === 1) valid = true;
                  break;
              }
              if (valid) moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: tc });
            }
          }
        }
      }
    }
    return moves;
  };

  const minimax = (boardState: (Piece | null)[][], depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
    if (depth === 0) {
      return evaluateBoard(boardState);
    }

    // AI 永远是 color=2, 玩家永远是 color=1
    // isMaximizing: AI 走棋 -> color=2
    // !isMaximizing: 玩家走棋 -> color=1
    const color = isMaximizing ? 2 : 1;

    const moves = getMovesForColor(boardState, color);

    if (moves.length === 0) {
      // 无子可走 = 输棋
      return isMaximizing ? -100000 : 100000;
    }

    // 走法排序：吃子走法优先，应将走法次之
    const sortedMoves = [...moves].sort((a, b) => {
      const targetA = boardState[a.toRow][a.toCol];
      const targetB = boardState[b.toRow][b.toCol];
      const scoreA = targetA ? pieceValues[targetA.type] : 0;
      const scoreB = targetB ? pieceValues[targetB.type] : 0;
      return scoreB - scoreA;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of sortedMoves) {
        const newBoard = boardState.map(r => [...r]);
        newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
        newBoard[move.fromRow][move.fromCol] = null;

        const score = minimax(newBoard, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of sortedMoves) {
        const newBoard = boardState.map(r => [...r]);
        newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
        newBoard[move.fromRow][move.fromCol] = null;

        const score = minimax(newBoard, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  // pieceValues 已在外部定义

  const findBestAiMove = useCallback((): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null => {
    const moves = getAllValidMoves;
    if (moves.length === 0) return null;

    // 优先检查：能直接吃王
    for (const move of moves) {
      const target = board[move.toRow][move.toCol];
      if (target?.type === 'king') {
        return move;
      }
    }

    let bestMove = moves[0];
    let bestScore = -Infinity;
    const DEPTH = 3;

    for (const move of moves) {
      const newBoard = board.map(r => [...r]);
      const capturedPiece = newBoard[move.toRow][move.toCol];
      newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
      newBoard[move.fromRow][move.fromCol] = null;

      // 立即评分：吃子得分（避免深度搜索中的误差）
      const captureValues: Record<PieceType, number> = {
        king: 10000,
        chariot: 900,
        cannon: 450,
        horse: 400,
        elephant: 200,
        guard: 200,
        soldier: 100,
      };
      let immediateScore = 0;
      if (capturedPiece) {
        immediateScore += captureValues[capturedPiece.type] * 1.5;
      }

      // 如果是帅的移动，大幅减分
      const movingPiece = board[move.fromRow][move.fromCol];
      if (movingPiece?.type === 'king') {
        immediateScore -= 50;
      }

      // 检查走完后是否被将：如果是，扣分（避免送将）
      // checkKing=1: 玩家被将 (color=1), 无影响
      // checkKing=2: AI被将 (color=2), 严重问题
      const checkScore = checkKing(newBoard);
      if (checkScore === 2) {
        // AI (color=2) 被将 - 严重问题
        immediateScore -= 500;
      }

      const score = minimax(newBoard, DEPTH, false, -Infinity, Infinity) + immediateScore;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // 调试输出
    console.log('AI选择的走法:', bestMove, '得分:', bestScore, '候选数量:', moves.length);

    return bestMove;
  }, [getAllValidMoves, board]);

  useEffect(() => {
    // AI 永远是 color=2
    if (mode === 'pve' && currentPlayer === 2 && status === 'playing') {
      const timer = setTimeout(() => {
        const move = findBestAiMove();
        if (move) {
          const newBoard = board.map(r => [...r]);
          if (newBoard[move.toRow][move.toCol]?.type === 'king') {
            setStatus('won');
            setWinner(2);  // AI 获胜
            setCheck(0);
          } else {
            newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
            newBoard[move.fromRow][move.fromCol] = null;
            const newCheck = checkKing(newBoard);
            setCheck(newCheck);
            if (newCheck !== 0) {
              setTimeout(() => {
                setCheck(0);
              }, 2000);
            }
          }
          setBoard(newBoard);
          setCurrentPlayer(1);  // 切换到玩家
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode, currentPlayer, status, findBestAiMove, board, checkKing]);

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (status !== 'playing') return;
    // AI 永远是 color=2, 玩家永远是 color=1
    if (mode === 'pve' && currentPlayer === 2) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;

    const totalLogicWidth = (BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2;
    const totalLogicHeight = (BOARD_ROWS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2;

    const containerAspect = rect.width / rect.height;
    const logicAspect = totalLogicWidth / totalLogicHeight;

    let effectiveWidth: number;
    let effectiveHeight: number;
    let offsetX: number = 0;
    let offsetY: number = 0;

    if (containerAspect > logicAspect) {
      effectiveHeight = rect.height;
      effectiveWidth = rect.height * logicAspect;
      offsetX = (rect.width - effectiveWidth) / 2;
    } else {
      effectiveWidth = rect.width;
      effectiveHeight = rect.width / logicAspect;
      offsetY = (rect.height - effectiveHeight) / 2;
    }

    const scale = effectiveWidth / totalLogicWidth;
    const x = (e.clientX - rect.left - offsetX) / scale - LOGIC_PADDING;
    const y = (e.clientY - rect.top - offsetY) / scale - LOGIC_PADDING;

    const col = Math.round(x / LOGIC_POINT_SPACING);
    const row = Math.round(y / LOGIC_POINT_SPACING);

    const cx = col * LOGIC_POINT_SPACING;
    const cy = row * LOGIC_POINT_SPACING;
    const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    if (distance > LOGIC_POINT_SPACING * 0.6) return;

    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return;

    const piece = board[row][col];

    if (selected) {
      if (selected.row === row && selected.col === col) {
        setSelected(null);
        return;
      }
      if (isValidMove(selected.row, selected.col, row, col)) {
        const newBoard = board.map(r => [...r]);
        if (newBoard[row][col]?.type === 'king') {
          setStatus('won');
          setWinner(currentPlayer);
          setCheck(0);
        } else {
          newBoard[row][col] = newBoard[selected.row][selected.col];
          newBoard[selected.row][selected.col] = null;
          const newCheck = checkKing(newBoard);
          setCheck(newCheck);
          if (newCheck !== 0) {
            setTimeout(() => {
              setCheck(0);
            }, 2000);
          }
        }
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
      setSelected(null);
    } else if (piece && piece.color === currentPlayer) {
      setSelected({ row, col });
    }
  };

  const boardAspectRatio = ((BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2) /
                          ((BOARD_ROWS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex flex-col items-center justify-center pt-[85px] p-2 md:p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-2 left-2 md:top-4 md:left-4 px-3 py-1.5 md:px-4 md:py-2 bg-slate-700/80 hover:bg-slate-600 text-white text-sm md:text-base rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回
      </button>

      <ClearCacheButton storageKeys={[]} onCleared={() => window.location.reload()} label="🗑️ 清除缓存" />
      <GameControls />
      <OrientationPrompt mode="portrait" />

      <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 mb-2 md:mb-3 mt-6 md:mt-8">
        🐘 中国象棋
      </h1>

      <AiSideSelector
        mode={mode}
        aiSide={aiSide}
        onChangeMode={(m) => { setMode(m); reset(); }}
        onChangeAiSide={(s) => {
          setAiSide(s);
          setBoard(createInitialBoard());
          // aiSide=1: AI 先手 -> currentPlayer=2
          // aiSide=2: 玩家先手 -> currentPlayer=1
          setCurrentPlayer(s === 1 ? 2 : 1);
          setSelected(null);
          setStatus('playing');
          setWinner(0);
          setCheck(0);
        }}
      />

      <div className="flex gap-3 mb-2 md:mb-3">
        <div className="bg-slate-800 rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">当前</div>
          <div className="text-lg md:text-xl font-bold">
            {mode === 'pve' ? (
              currentPlayer === 1 ? (
                <span className="text-amber-300">🙋 玩家</span>
              ) : (
                <span className="text-amber-400">🤖 电脑</span>
              )
            ) : currentPlayer === 1 ? (
              <span className="text-red-400">下方(玩家)</span>
            ) : (
              <span className="text-gray-300">上方(玩家)</span>
            )}
          </div>
        </div>
        {check !== 0 && (
          <div className="bg-red-600 rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-red-500 animate-pulse">
            <div className="text-red-200 text-xs">将军!</div>
            <div className="text-lg md:text-xl font-bold text-white">
              {check === 1 ? '玩家被将' : '电脑被将'}
            </div>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative"
        style={{
          width: `min(90vw, 560px)`,
          aspectRatio: `${boardAspectRatio}`,
        }}
      >
        {/* 棋盘 - 实际渲染区域，与 onClick 一一对应 */}
        <div
          data-xiangqi-board
          className="absolute inset-0 bg-amber-100 rounded-lg shadow-2xl cursor-pointer overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 0 5px #78350f, 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
          onClick={handleBoardClick}
        >
          {measuredSize.pointSpacing > 0 && (
            <>
              {/* SVG 层 - 棋盘线、楚河汉界、棋子 */}
              <svg
                viewBox={`0 0 ${(BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2} ${(BOARD_ROWS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING * 2}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 pointer-events-none w-full h-full"
              >
                {/* 横向线（10 条） */}
                {Array.from({ length: BOARD_ROWS }).map((_, i) => {
                  const y = LOGIC_PADDING + i * LOGIC_POINT_SPACING;
                  return (
                    <line
                      key={`h-${i}`}
                      x1={LOGIC_PADDING}
                      y1={y}
                      x2={(BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING}
                      y2={y}
                      stroke="#3a2412"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* 纵向线（9 列）：col=0 和 col=8 保留完整竖线，中间列在楚河汉界处断开 */}
                {Array.from({ length: BOARD_COLS }).map((_, i) => {
                  const x = LOGIC_PADDING + i * LOGIC_POINT_SPACING;
                  const riverYTop = LOGIC_PADDING + 4 * LOGIC_POINT_SPACING;
                  const riverYBottom = LOGIC_PADDING + 5 * LOGIC_POINT_SPACING;
                  const isEdgeCol = i === 0 || i === BOARD_COLS - 1;
                  if (isEdgeCol) {
                    return (
                      <g key={`v-${i}`}>
                        <line x1={x} y1={LOGIC_PADDING} x2={x} y2={riverYTop} stroke="#3a2412" strokeWidth="1.5" />
                        <line x1={x} y1={riverYBottom} x2={x} y2={(BOARD_ROWS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING} stroke="#3a2412" strokeWidth="1.5" />
                      </g>
                    );
                  } else {
                    return (
                      <g key={`v-${i}`}>
                        <line x1={x} y1={LOGIC_PADDING} x2={x} y2={riverYTop} stroke="#3a2412" strokeWidth="1.5" />
                        <line x1={x} y1={riverYBottom} x2={x} y2={(BOARD_ROWS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING} stroke="#3a2412" strokeWidth="1.5" />
                      </g>
                    );
                  }
                })}

                <g>
                  <line
                    x1={LOGIC_PADDING}
                    y1={LOGIC_PADDING + 4.5 * LOGIC_POINT_SPACING}
                    x2={LOGIC_PADDING + 10}
                    y2={LOGIC_PADDING + 4.5 * LOGIC_POINT_SPACING}
                    stroke="#3a2412"
                    strokeWidth="3"
                  />
                  <text
                    x={LOGIC_PADDING + 3 * LOGIC_POINT_SPACING}
                    y={LOGIC_PADDING + 4.5 * LOGIC_POINT_SPACING}
                    fontSize="20"
                    fill="#3a2412"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    楚河
                  </text>
                  <text
                    x={LOGIC_PADDING + 6 * LOGIC_POINT_SPACING}
                    y={LOGIC_PADDING + 4.5 * LOGIC_POINT_SPACING}
                    fontSize="20"
                    fill="#3a2412"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontWeight="bold"
                    fontFamily="serif"
                  >
                    汉界
                  </text>
                  <line
                    x1={(BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING - 10}
                    y1={LOGIC_PADDING + 4.5 * LOGIC_POINT_SPACING}
                    x2={(BOARD_COLS - 1) * LOGIC_POINT_SPACING + LOGIC_PADDING}
                    y2={LOGIC_PADDING + 4.5 * LOGIC_POINT_SPACING}
                    stroke="#3a2412"
                    strokeWidth="3"
                  />
                </g>

                {/* 九宫格斜线 - 红方（row 0..2） */}
                <line
                  x1={LOGIC_PADDING + 3 * LOGIC_POINT_SPACING}
                  y1={LOGIC_PADDING + 0 * LOGIC_POINT_SPACING}
                  x2={LOGIC_PADDING + 5 * LOGIC_POINT_SPACING}
                  y2={LOGIC_PADDING + 2 * LOGIC_POINT_SPACING}
                  stroke="#3a2412"
                  strokeWidth="1.5"
                />
                <line
                  x1={LOGIC_PADDING + 5 * LOGIC_POINT_SPACING}
                  y1={LOGIC_PADDING + 0 * LOGIC_POINT_SPACING}
                  x2={LOGIC_PADDING + 3 * LOGIC_POINT_SPACING}
                  y2={LOGIC_PADDING + 2 * LOGIC_POINT_SPACING}
                  stroke="#3a2412"
                  strokeWidth="1.5"
                />
                {/* 九宫格斜线 - 黑方（row 7..9） */}
                <line
                  x1={LOGIC_PADDING + 3 * LOGIC_POINT_SPACING}
                  y1={LOGIC_PADDING + 7 * LOGIC_POINT_SPACING}
                  x2={LOGIC_PADDING + 5 * LOGIC_POINT_SPACING}
                  y2={LOGIC_PADDING + 9 * LOGIC_POINT_SPACING}
                  stroke="#3a2412"
                  strokeWidth="1.5"
                />
                <line
                  x1={LOGIC_PADDING + 5 * LOGIC_POINT_SPACING}
                  y1={LOGIC_PADDING + 7 * LOGIC_POINT_SPACING}
                  x2={LOGIC_PADDING + 3 * LOGIC_POINT_SPACING}
                  y2={LOGIC_PADDING + 9 * LOGIC_POINT_SPACING}
                  stroke="#3a2412"
                  strokeWidth="1.5"
                />

                {/* 炮和兵位置的角标 */}
                {[
                  { r: 2, c: 1 }, { r: 2, c: 7 },
                  { r: 7, c: 1 }, { r: 7, c: 7 },
                  { r: 3, c: 0 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8 },
                  { r: 6, c: 0 }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8 },
                ].map((p, i) => {
                  const cx = LOGIC_PADDING + p.c * LOGIC_POINT_SPACING;
                  const cy = LOGIC_PADDING + p.r * LOGIC_POINT_SPACING;
                  const armLen = 6;
                  const gap = 5;
                  const drawCorner = (dx: number, dy: number) => (
                    <g key={`${i}-${dx}-${dy}`}>
                      <line x1={cx + dx * gap} y1={cy + dy * gap} x2={cx + dx * (gap + armLen)} y2={cy + dy * gap} stroke="#3a2412" strokeWidth="1.5" />
                      <line x1={cx + dx * gap} y1={cy + dy * gap} x2={cx + dx * gap} y2={cy + dy * (gap + armLen)} stroke="#3a2412" strokeWidth="1.5" />
                    </g>
                  );
                  return (
                    <g key={`marker-${i}`}>
                      {p.c > 0 && p.r > 0 && drawCorner(-1, -1)}
                      {p.c < BOARD_COLS - 1 && p.r > 0 && drawCorner(1, -1)}
                      {p.c > 0 && p.r < BOARD_ROWS - 1 && drawCorner(-1, 1)}
                      {p.c < BOARD_COLS - 1 && p.r < BOARD_ROWS - 1 && drawCorner(1, 1)}
                    </g>
                  );
                })}

                {/* 可走位置高亮 */}
                {selected && validMoves.map(m => {
                  const isCapture = board[m.row][m.col] !== null;
                  const cx = LOGIC_PADDING + m.col * LOGIC_POINT_SPACING;
                  const cy = LOGIC_PADDING + m.row * LOGIC_POINT_SPACING;
                  if (isCapture) {
                    return (
                      <circle
                        key={`move-${m.row}-${m.col}`}
                        cx={cx}
                        cy={cy}
                        r={LOGIC_PIECE_SIZE / 2 + 3}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="3"
                        opacity="0.9"
                      />
                    );
                  } else {
                    return (
                      <circle
                        key={`move-${m.row}-${m.col}`}
                        cx={cx}
                        cy={cy}
                        r={LOGIC_PIECE_SIZE / 4}
                        fill="#22c55e"
                        opacity="0.85"
                      />
                    );
                  }
                })}

                {/* 棋子 */}
                {board.map((row, r) => row.map((cell, c) => {
                  if (!cell) return null;
                  const isSelected = selected?.row === r && selected?.col === c;
                  const cx = LOGIC_PADDING + c * LOGIC_POINT_SPACING;
                  const cy = LOGIC_PADDING + r * LOGIC_POINT_SPACING;
                  const pieceRadius = LOGIC_PIECE_SIZE / 2;
                  const isPlayerPiece = cell.color === 1;
                  const fillColor = isPlayerPiece ? '#ef4444' : '#1f2937';
                  const borderColor = isPlayerPiece ? '#fca5a5' : '#4b5563';
                  return (
                    <g key={`piece-${r}-${c}`}>
                      {/* 棋子阴影 */}
                      <circle cx={cx} cy={cy + 1} r={pieceRadius} fill="rgba(0,0,0,0.3)" />
                      {/* 棋子主体 */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={pieceRadius}
                        fill={fillColor}
                        stroke={borderColor}
                        strokeWidth="2"
                      />
                      {/* 选中光晕 */}
                      {isSelected && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={pieceRadius + 3}
                          fill="none"
                          stroke="#facc15"
                          strokeWidth="3"
                        />
                      )}
                      {/* 棋子文字 */}
                      <text
                        x={cx}
                        y={cy}
                        fontSize={pieceRadius * 0.85}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontWeight="bold"
                        fontFamily="serif"
                        pointerEvents="none"
                      >
                        {getPieceSymbol(cell)}
                      </text>
                    </g>
                  );
                }))}

                {/* 黄色光标高亮（当前光标位置） */}
                {status === 'playing' && (() => {
                  const ccx = LOGIC_PADDING + cursor.col * LOGIC_POINT_SPACING;
                  const ccy = LOGIC_PADDING + cursor.row * LOGIC_POINT_SPACING;
                  return (
                    <g key="cursor" pointerEvents="none">
                      <circle
                        cx={ccx}
                        cy={ccy}
                        r={LOGIC_PIECE_SIZE / 2 + 2}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth="3"
                        opacity="0.9"
                      >
                        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  );
                })()}
              </svg>
            </>
          )}

          {status === 'won' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-30">
              <div className="text-5xl mb-2 animate-bounce">🏆</div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {mode === 'pve' ? (
                  winner === 1 ? (
                    <span className="text-amber-300">你赢了！</span>
                  ) : (
                    <span className="text-red-400">电脑获胜</span>
                  )
                ) : winner === 1 ? (
                  <span className="text-red-400">下方(玩家1)获胜！</span>
                ) : (
                  <span className="text-gray-300">上方(玩家2)获胜！</span>
                )}
              </div>
              <button
                onClick={reset}
                className="mt-4 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                再来一局
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-3 md:mt-4">
        <button onClick={reset} className="px-5 py-1.5 md:px-6 md:py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm md:text-base font-bold rounded-lg transition-all transform hover:scale-105">
          重新开始
        </button>
      </div>

      <div className="mt-2 md:mt-4 text-slate-400 text-xs text-center max-w-md px-2">
        <p>点击棋子选中，绿点=可走，红圈=可吃 | 吃掉对方将/帅即获胜</p>
      </div>
    </div>
  );
};