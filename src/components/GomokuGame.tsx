import { useEffect, useState, useRef } from 'react';
import { useGomoku } from '../hooks/useGomoku';
import { BOARD_SIZE } from '../utils/gomokuUtils';
import { OrientationPrompt } from './OrientationPrompt';
import { GameControls } from './GameControls';
import { GomokuMode } from '../types/game';
import { AiSideSelector } from './AiSideSelector';
import { ClearCacheButton } from './ClearCacheButton';
import { useGamepad } from '../hooks/useGamepad';

interface GomokuGameProps {
  onBack: () => void;
}

export const GomokuGame = ({ onBack }: GomokuGameProps) => {
  const { state, best, aiSide, reset, placeStone, setMode, setAiSide } = useGomoku();
  const gamepad = useGamepad();
  const [cellSize, setCellSize] = useState(36);
  const [cursor, setCursor] = useState({ row: 7, col: 7 });
  const lastMoveDirRef = useRef<string | null>(null);
  // 人类玩家：与 aiSide 相反
  const humanPlayer: 1 | 2 = aiSide === 1 ? 2 : 1;


  // 手柄光标移动
  useEffect(() => {
    if (!gamepad.connected) return;
    if (state.status !== 'playing') return;
    if (state.mode === 'pve' && state.currentPlayer !== humanPlayer) return;
    if (gamepad.direction && gamepad.direction !== lastMoveDirRef.current) {
      lastMoveDirRef.current = gamepad.direction;
      if (gamepad.direction === 'LEFT' && cursor.col > 0) setCursor({ ...cursor, col: cursor.col - 1 });
      else if (gamepad.direction === 'RIGHT' && cursor.col < BOARD_SIZE - 1) setCursor({ ...cursor, col: cursor.col + 1 });
      else if (gamepad.direction === 'UP' && cursor.row > 0) setCursor({ ...cursor, row: cursor.row - 1 });
      else if (gamepad.direction === 'DOWN' && cursor.row < BOARD_SIZE - 1) setCursor({ ...cursor, row: cursor.row + 1 });
    } else if (!gamepad.direction) {
      lastMoveDirRef.current = null;
    }
  }, [gamepad.direction, cursor, state.status, state.mode, state.currentPlayer, humanPlayer]);

  // 手柄 A 键落子
  useEffect(() => {
    if (!gamepad.connected) return;
    if (!gamepad.buttons.a) return;
    if (state.status !== 'playing') return;
    if (state.mode === 'pve' && state.currentPlayer !== humanPlayer) return;
    if (state.board[cursor.row][cursor.col] === 0) {
      placeStone(cursor.row, cursor.col);
    }
  }, [gamepad.buttons.a, cursor, state, placeStone]);

  // 从sessionStorage读取模式
  useEffect(() => {
    const savedMode = sessionStorage.getItem('game_mode_gomoku') as GomokuMode | null;
    if (savedMode && (savedMode === 'pve' || savedMode === 'pvp')) {
      setMode(savedMode);
    }
  }, [setMode]);

  useEffect(() => {
    const checkSize = () => {
      const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (isMobile) {
        const maxWidth = window.innerWidth - 32;
        const size = Math.floor(maxWidth / BOARD_SIZE);
        setCellSize(Math.max(size, 24));
      } else {
        setCellSize(36);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    window.addEventListener('orientationchange', checkSize);
    return () => {
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('orientationchange', checkSize);
    };
  }, []);

  // 点击位置转格子坐标：点击 canvas 任意位置，找出最近的可下子格子
  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.status !== 'playing') return;
    if (state.mode === 'pve' && state.currentPlayer !== humanPlayer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round(x / cellSize);
    const row = Math.round(y / cellSize);

    const exactX = col * cellSize;
    const exactY = row * cellSize;
    const distance = Math.sqrt(Math.pow(x - exactX, 2) + Math.pow(y - exactY, 2));

    if (distance > cellSize / 3) return;

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    if (state.board[row][col] !== 0) return;

    placeStone(row, col);
  };

  const boardWidth = (BOARD_SIZE - 1) * cellSize;
  const padding = cellSize / 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center pt-[85px] p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <ClearCacheButton storageKeys={['gomoku_best']} onCleared={() => window.location.reload()} />
      <GameControls />
      <OrientationPrompt mode="portrait" />

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-4 mt-8">
        ⚫⚪ 五子棋
      </h1>

      <AiSideSelector
        mode={state.mode}
        aiSide={aiSide}
        onChangeMode={(m) => setMode(m)}
        onChangeAiSide={(s) => setAiSide(s)}
      />

      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">当前</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {state.currentPlayer === humanPlayer ? (
              <span className="text-amber-300">🙋 玩家</span>
            ) : (
              <span className="text-amber-400">🤖 电脑</span>
            )}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">步数</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{state.moves}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">战绩</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {best.wins}胜 {best.losses}负
          </div>
        </div>
      </div>

      {/* 棋盘 */}
      <div
        className="relative bg-amber-700 rounded-lg shadow-2xl border-4 border-amber-900"
        style={{ padding, width: boardWidth + padding * 2, height: boardWidth + padding * 2 }}
      >
        <div
          className="relative cursor-pointer"
          style={{ width: boardWidth, height: boardWidth }}
          onClick={handleBoardClick}
        >
          {/* 网格线 */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={boardWidth}
            height={boardWidth}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <g key={i}>
                <line
                  x1={0}
                  y1={i * cellSize}
                  x2={boardWidth}
                  y2={i * cellSize}
                  stroke="#3b1f00"
                  strokeWidth="1"
                />
                <line
                  x1={i * cellSize}
                  y1={0}
                  x2={i * cellSize}
                  y2={boardWidth}
                  stroke="#3b1f00"
                  strokeWidth="1"
                />
              </g>
            ))}
            {/* 星位 */}
            {[
              [3, 3], [3, 11], [11, 3], [11, 11], [7, 7],
            ].map(([r, c], i) => (
              <circle
                key={i}
                cx={c * cellSize}
                cy={r * cellSize}
                r="3"
                fill="#3b1f00"
              />
            ))}
          </svg>

          {/* 落子位置预览（玩家回合） */}
          {state.status === 'playing' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
                backgroundSize: `${cellSize}px ${cellSize}px`,
                backgroundPosition: `${cellSize / 2}px ${cellSize / 2}px`,
              }}
            />
          )}

          {/* 已落子 */}
          {state.board.map((row, r) =>
            row.map((cell, c) => {
              if (cell === 0) return null;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`absolute rounded-full shadow-lg pointer-events-none ${
                    cell === 1
                      ? 'bg-gradient-to-br from-gray-700 to-black border border-gray-500'
                      : 'bg-gradient-to-br from-white to-gray-300 border border-gray-200'
                  }`}
                  style={{
                    left: c * cellSize - cellSize / 2 + 2,
                    top: r * cellSize - cellSize / 2 + 2,
                    width: cellSize - 4,
                    height: cellSize - 4,
                  }}
                />
              );
            })
          )}

          {/* 黄色光标高亮（玩家回合且该位置可下子） */}
          {state.status === 'playing' &&
           !(state.mode === 'pve' && state.currentPlayer !== humanPlayer) &&
           state.board[cursor.row][cursor.col] === 0 && (
            <div
              className="absolute rounded-full border-4 border-yellow-300 pointer-events-none animate-pulse"
              style={{
                left: cursor.col * cellSize - cellSize / 2 + 2,
                top: cursor.row * cellSize - cellSize / 2 + 2,
                width: cellSize - 4,
                height: cellSize - 4,
                boxShadow: '0 0 20px rgba(252, 211, 77, 0.8), inset 0 0 20px rgba(252, 211, 77, 0.3)',
              }}
            />
          )}
        </div>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            {state.winner === humanPlayer ? (
              <>
                <div className="text-4xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-amber-400 mb-2 animate-pulse">
                  {state.mode === 'pve' ? '你赢了！' : '黑棋获胜！'}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">{state.mode === 'pve' ? '💔' : '🏆'}</div>
                <div className="text-4xl font-bold text-red-400 mb-2">
                  {state.mode === 'pve' ? '电脑获胜' : '白棋获胜！'}
                </div>
              </>
            )}
            <div className="text-xl text-white mb-1">用了 {state.moves} 步</div>
            <button
              onClick={reset}
              className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
        {state.status === 'draw' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-yellow-400 mb-4">🤝 平局！</div>
            <button
              onClick={reset}
              className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重新开始
        </button>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击交叉点附近落子 | 五子连成一线即获胜</p>
        <p>{state.mode === 'pve' ? '你执' + (humanPlayer === 1 ? '黑' : '白') + '，电脑执' + (aiSide === 1 ? '黑' : '白') : '玩家1执黑，玩家2执白'}</p>
      </div>
    </div>
  );
};