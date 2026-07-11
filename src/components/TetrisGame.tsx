import { useEffect, useRef, useCallback } from 'react';
import { useTetrisGame } from '../hooks/useTetrisGame';
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, COLORS } from '../utils/tetrisUtils';
import { GameControls } from './GameControls';
import { OrientationPrompt } from './OrientationPrompt';
import { ClearCacheButton } from './ClearCacheButton';

interface TetrisGameProps {
  onBack: () => void;
}

export const TetrisGame = ({ onBack }: TetrisGameProps) => {
  const { gameState, startGame, togglePause, resetGame, move, rotatePiece, hardDrop } = useTetrisGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  // 绘制游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格
    ctx.strokeStyle = '#1a365d';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= BOARD_HEIGHT; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= BOARD_WIDTH; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }

    // 已锁定的方块
    gameState.board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const colorIndex = cell - 1;
          const colors = Object.values(COLORS);
          ctx.fillStyle = colors[colorIndex] || '#888';
          ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      });
    });

    // 当前方块
    if (gameState.currentPiece) {
      const { shape, x, y, type } = gameState.currentPiece;
      ctx.fillStyle = COLORS[type];
      shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            ctx.fillRect(
              (x + c) * CELL_SIZE + 1,
              (y + r) * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              (x + c) * CELL_SIZE + 1,
              (y + r) * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        });
      });

      // 幽灵方块（预览落点）
      if (gameState.isPlaying && !gameState.isGameOver) {
        let ghostY = y;
        while (isValidGhostPosition(gameState.board, shape, x, ghostY + 1)) {
          ghostY++;
        }
        ctx.fillStyle = COLORS[type] + '30';
        shape.forEach((row, r) => {
          row.forEach((cell, c) => {
            if (cell && ghostY + r >= 0) {
              ctx.fillRect(
                (x + c) * CELL_SIZE + 1,
                (ghostY + r) * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
              );
              ctx.strokeStyle = COLORS[type] + '60';
              ctx.lineWidth = 1;
              ctx.strokeRect(
                (x + c) * CELL_SIZE + 1,
                (ghostY + r) * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
              );
            }
          });
        });
      }
    }
  }, [gameState]);

  const isValidGhostPosition = (board: number[][], shape: number[][], x: number, y: number): boolean => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newY >= BOARD_HEIGHT) return false;
          if (newY >= 0 && board[newY][newX]) return false;
        }
      }
    }
    return true;
  };

  // 键盘控制
  const handleKey = useCallback((e: KeyboardEvent, isDown: boolean) => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      if (e.key === ' ' && isDown) {
        e.preventDefault();
        if (!gameState.isPlaying || gameState.isGameOver) {
          startGame();
        } else {
          togglePause();
        }
      }
      return;
    }

    const key = e.key.toLowerCase();

    if (isDown) {
      if (keysPressed.current.has(key)) return;
      keysPressed.current.add(key);

      switch (key) {
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          move(1, 0);
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          move(0, 1);
          break;
        case 'arrowup':
        case 'w':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
          e.preventDefault();
          togglePause();
          break;
        case 'r':
          e.preventDefault();
          resetGame();
          break;
      }
    } else {
      keysPressed.current.delete(key);
    }
  }, [gameState, startGame, togglePause, move, rotatePiece, hardDrop, resetGame]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => handleKey(e, true);
    const keyUpHandler = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [handleKey]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center pt-[85px] p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <ClearCacheButton storageKeys={['tetris_high_score']} onCleared={() => window.location.reload()} />
      <GameControls />
      <OrientationPrompt mode="portrait" />

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 mt-8">
        🧩 俄罗斯方块
      </h1>

      <div className="flex gap-6 items-start">
        {/* 游戏画布 */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH * CELL_SIZE}
            height={BOARD_HEIGHT * CELL_SIZE}
            className="rounded-lg shadow-2xl border-4 border-purple-600"
          />

          {/* 游戏状态遮罩 */}
          {(gameState.isPaused || gameState.isGameOver || !gameState.isPlaying) && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
              {gameState.isGameOver ? (
                <>
                  <div className="text-4xl font-bold text-red-500 mb-4 animate-pulse">游戏结束</div>
                  <div className="text-2xl text-white mb-6">最终得分: {gameState.score}</div>
                  {gameState.score >= gameState.highScore && gameState.score > 0 && (
                    <div className="text-xl text-yellow-400 mb-4 animate-bounce">🎉 新纪录！</div>
                  )}
                </>
              ) : gameState.isPaused ? (
                <div className="text-4xl font-bold text-amber-400">游戏暂停</div>
              ) : (
                <>
                  <div className="text-4xl font-bold text-purple-400 mb-4">俄罗斯方块</div>
                  <div className="text-sm text-slate-300 text-center max-w-xs">
                    使用方向键或 WASD 控制<br />
                    ↑ 旋转  ↓ 加速下落<br />
                    空格 瞬间落下
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-700 min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">分数</div>
            <div className="text-2xl font-bold text-purple-400 font-mono">{gameState.score}</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-700 min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">最高分</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">{gameState.highScore}</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-700 min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">等级</div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{gameState.level}</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-700 min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">行数</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{gameState.lines}</div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-3 mt-4 flex-wrap justify-center">
        {!gameState.isPlaying || gameState.isGameOver ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-600/30"
          >
            {gameState.isGameOver ? '再来一局' : '开始游戏'}
          </button>
        ) : (
          <button
            onClick={togglePause}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-amber-600/30"
          >
            {gameState.isPaused ? '继续游戏' : '暂停'}
          </button>
        )}
        <button
          onClick={resetGame}
          className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          重新开始
        </button>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center hidden md:block">
        <p>← → 移动 | ↑ 旋转 | ↓ 加速 | 空格 瞬间落下 | P 暂停 | R 重新开始</p>
      </div>

      {/* 移动端控制 */}
      <div className="md:hidden w-full mt-3 px-3 select-none">
        <div className="text-xs text-purple-300 text-center mb-2">点击按钮控制</div>
        <div className="flex justify-center gap-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onTouchStart={(e) => { e.preventDefault(); move(-1, 0); }}
              className="w-14 h-14 bg-purple-700 active:bg-purple-500 text-white text-2xl rounded-lg font-bold touch-none"
            >
              ←
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); move(1, 0); }}
              className="w-14 h-14 bg-purple-700 active:bg-purple-500 text-white text-2xl rounded-lg font-bold touch-none"
            >
              →
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); rotatePiece(); }}
              className="w-14 h-14 bg-purple-700 active:bg-purple-500 text-white text-xl rounded-lg font-bold touch-none"
            >
              ↻
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); move(0, 1); }}
              className="w-14 h-14 bg-purple-700 active:bg-purple-500 text-white text-2xl rounded-lg font-bold touch-none"
            >
              ↓
            </button>
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
            className="w-14 h-28 bg-purple-800 active:bg-purple-600 text-white text-sm rounded-lg font-bold touch-none flex flex-col items-center justify-center pt-20"
          >
            ⬇<br/>瞬间
          </button>
        </div>
      </div>

      <div className="mt-2 text-slate-400 text-xs text-center md:hidden">
        <p>触屏按钮控制方块移动</p>
      </div>
    </div>
  );
};