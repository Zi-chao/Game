import { useState, useCallback, useRef } from 'react';
import { OthelloState, OthelloMode, AiSide } from '../types/game';
import {
  createInitialBoard,
  getValidMoves,
  makeMove,
  countPieces,
  aiSelectMove,
} from '../utils/othelloUtils';

const HIGH_SCORE_KEY = 'othello_best';

const getBest = (): { wins: number; losses: number } => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? JSON.parse(saved) : { wins: 0, losses: 0 };
};

export const useOthello = () => {
  const [state, setState] = useState<OthelloState>(() => {
    const board = createInitialBoard();
    const validMoves = getValidMoves(board, 1);
    return {
      board,
      currentPlayer: 1,
      mode: 'pve',
      blackScore: 2,
      whiteScore: 2,
      validMoves,
      status: 'playing',
      lastPass: false,
    };
  });

  // AI 执哪一方：1=执黑(先手)  2=执白(后手)，默认 2（玩家先手）
  const [aiSide, setAiSideState] = useState<AiSide>(2);
  const aiSideRef = useRef<AiSide>(2);

  const setAiSide = useCallback((side: AiSide) => {
    aiSideRef.current = side;
    setAiSideState(side);
    const board = createInitialBoard();
    const firstPlayer: 1 | 2 = 1;
    const validMoves = getValidMoves(board, firstPlayer);
    setState({
      board,
      currentPlayer: firstPlayer,
      mode: state.mode,
      blackScore: 2,
      whiteScore: 2,
      validMoves,
      status: 'playing',
      lastPass: false,
    });
  }, [state.mode]);

  const [best, setBest] = useState(getBest());

  const computeScores = (board: OthelloState['board']) => {
    const { black, white } = countPieces(board);
    return { blackScore: black, whiteScore: white };
  };

  const updateValidMoves = (board: OthelloState['board'], player: 1 | 2) => {
    return getValidMoves(board, player);
  };

  const reset = useCallback((mode?: OthelloMode) => {
    setState(prev => {
      const board = createInitialBoard();
      const m = mode || prev.mode;
      const firstPlayer: 1 | 2 = 1;
      const validMoves = getValidMoves(board, firstPlayer);
      return {
        board,
        currentPlayer: firstPlayer,
        mode: m,
        blackScore: 2,
        whiteScore: 2,
        validMoves,
        status: 'playing',
        lastPass: false,
      };
    });
  }, []);

  const setMode = useCallback((mode: OthelloMode) => {
    const board = createInitialBoard();
    const firstPlayer: 1 | 2 = 1;
    const validMoves = getValidMoves(board, firstPlayer);
    setState({
      board,
      currentPlayer: firstPlayer,
      mode,
      blackScore: 2,
      whiteScore: 2,
      validMoves,
      status: 'playing',
      lastPass: false,
    });
  }, []);

  const endGame = useCallback((board: OthelloState['board']) => {
    const { black, white } = countPieces(board);
    let winner: 0 | 1 | 2 = 0;
    if (black > white) winner = 1;
    else if (white > black) winner = 2;

    setBest(prev => {
      const updated = { ...prev };
      // winner=1 是黑方，winner=2 是白方
      // 玩家是否赢取决于玩家执哪一方（aiSide）
      const playerWins = (winner === 1 && aiSideRef.current === 1) || (winner === 2 && aiSideRef.current === 2);
      const playerLoses = (winner === 1 && aiSideRef.current === 2) || (winner === 2 && aiSideRef.current === 1);
      if (playerWins) updated.wins += 1;
      else if (playerLoses) updated.losses += 1;
      // 平局不计入胜负
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(updated));
      return updated;
    });

    return { blackScore: black, whiteScore: white, winner };
  }, []);

  // 玩家落子（pvp 模式下双方都能调用）
  const playerMove = useCallback((row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      // pve 模式只允许玩家下棋（非AI回合）；pvp 模式当前玩家都能下
      if (prev.mode === 'pve' && prev.currentPlayer === aiSideRef.current) return prev;
      const isValid = prev.validMoves.some(m => m.row === row && m.col === col);
      if (!isValid) return prev;

      const currentPlayer = prev.currentPlayer;
      const newBoard = makeMove(prev.board, row, col, currentPlayer);
      if (!newBoard) return prev;

      const scores = computeScores(newBoard);
      // 切换到对方
      const opponent: 1 | 2 = currentPlayer === 1 ? 2 : 1;
      let nextValidMoves = updateValidMoves(newBoard, opponent);

      // 如果对方无合法落子
      if (nextValidMoves.length === 0) {
        // 检查己方是否也无落子（双方都无则结束）
        const selfMoves = updateValidMoves(newBoard, currentPlayer);
        if (selfMoves.length === 0) {
          const endResult = endGame(newBoard);
          return {
            ...prev,
            board: newBoard,
            blackScore: endResult.blackScore,
            whiteScore: endResult.whiteScore,
            status: 'won',
            currentPlayer: opponent,
            validMoves: [],
            lastPass: true,
          };
        }
        // 对方 pass，当前玩家继续走 - validMoves 应该是当前玩家的合法走法
        return {
          ...prev,
          board: newBoard,
          blackScore: scores.blackScore,
          whiteScore: scores.whiteScore,
          currentPlayer: currentPlayer,
          validMoves: selfMoves,
          lastPass: true,
        };
      }

      return {
        ...prev,
        board: newBoard,
        blackScore: scores.blackScore,
        whiteScore: scores.whiteScore,
        currentPlayer: opponent,
        validMoves: nextValidMoves,
        lastPass: false,
      };
    });
  }, [endGame]);

// AI 落子
  const aiMove = useCallback(() => {
    const aiPlayer = aiSideRef.current;
    const humanPlayer: 1 | 2 = aiPlayer === 1 ? 2 : 1;
    setState(prev => {
      if (prev.mode !== 'pve' || prev.currentPlayer !== aiPlayer || prev.status !== 'playing') return prev;

      if (prev.validMoves.length === 0) {
        const playerMoves = updateValidMoves(prev.board, humanPlayer);
        if (playerMoves.length === 0) {
          const endResult = endGame(prev.board);
          return {
            ...prev,
            blackScore: endResult.blackScore,
            whiteScore: endResult.whiteScore,
            status: 'won',
            currentPlayer: humanPlayer,
            validMoves: [],
            lastPass: true,
          };
        }
        return {
          ...prev,
          currentPlayer: humanPlayer,
          validMoves: playerMoves,
          lastPass: true,
        };
      }

      const aiMoveResult = aiSelectMove(prev.board, prev.validMoves, aiPlayer);
      if (!aiMoveResult) {
        // AI选择失败，也pass
        const playerMoves = updateValidMoves(prev.board, humanPlayer);
        if (playerMoves.length === 0) {
          const endResult = endGame(prev.board);
          return {
            ...prev,
            blackScore: endResult.blackScore,
            whiteScore: endResult.whiteScore,
            status: 'won',
            currentPlayer: humanPlayer,
            validMoves: [],
            lastPass: true,
          };
        }
        return {
          ...prev,
          currentPlayer: humanPlayer,
          validMoves: playerMoves,
          lastPass: true,
        };
      }

      const newBoard = makeMove(prev.board, aiMoveResult.row, aiMoveResult.col, aiPlayer);
      if (!newBoard) return prev;

      const scores = computeScores(newBoard);
      // 切换到玩家
      let nextValidMoves = updateValidMoves(newBoard, humanPlayer);

      // 玩家无合法落子
      if (nextValidMoves.length === 0) {
        // 检查AI自己是否还有落子
        const aiNextMoves = updateValidMoves(newBoard, aiPlayer);
        if (aiNextMoves.length === 0) {
          // 双方都无落子，结束
          const endResult = endGame(newBoard);
          return {
            ...prev,
            board: newBoard,
            blackScore: endResult.blackScore,
            whiteScore: endResult.whiteScore,
            status: 'won',
            currentPlayer: humanPlayer,
            validMoves: [],
            lastPass: true,
          };
        }
        // 玩家pass，AI继续 - 保持 currentPlayer=aiPlayer 让 useEffect 重新触发
        return {
          ...prev,
          board: newBoard,
          blackScore: scores.blackScore,
          whiteScore: scores.whiteScore,
          currentPlayer: aiPlayer,
          validMoves: aiNextMoves,
          lastPass: true,
        };
      }

      return {
        ...prev,
        board: newBoard,
        blackScore: scores.blackScore,
        whiteScore: scores.whiteScore,
        currentPlayer: humanPlayer,
        validMoves: nextValidMoves,
        lastPass: false,
      };
    });
  }, [endGame]);

  return {
    state,
    best,
    aiSide,
    playerMove,
    aiMove,
    reset,
    setMode,
    setAiSide,
  };
};