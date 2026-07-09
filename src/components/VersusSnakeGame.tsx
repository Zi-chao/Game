import { useEffect, useRef } from 'react';
import { useVersusSnake } from '../hooks/useVersusSnake';
import { VERSUS_GRID_SIZE, VERSUS_CELL_SIZE } from '../utils/versusUtils';

interface VersusSnakeGameProps {
  onBack: () => void;
}

export const VersusSnakeGame = ({ onBack }: VersusSnakeGameProps) => {
  const { state, best, start, reset, togglePause, changeDirection1, changeDirection2 } = useVersusSnake();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    for (let i = 0; i <= VERSUS_GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * VERSUS_CELL_SIZE, 0);
      ctx.lineTo(i * VERSUS_CELL_SIZE, VERSUS_GRID_SIZE * VERSUS_CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * VERSUS_CELL_SIZE);
      ctx.lineTo(VERSUS_GRID_SIZE * VERSUS_CELL_SIZE, i * VERSUS_CELL_SIZE);
      ctx.stroke();
    }

    // 中线
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制蛇1（绿色）
    state.snake1.forEach((seg, idx) => {
      const isHead = idx === 0;
      const x = seg.x * VERSUS_CELL_SIZE;
      const y = seg.y * VERSUS_CELL_SIZE;
      ctx.fillStyle = isHead ? '#22c55e' : `rgba(34, 197, 94, ${1 - idx * 0.05})`;
      ctx.fillRect(x + 1, y + 1, VERSUS_CELL_SIZE - 2, VERSUS_CELL_SIZE - 2);
      if (isHead) {
        ctx.fillStyle = '#000';
        const eyeSize = 2;
        ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
        ctx.fillRect(x + VERSUS_CELL_SIZE - 6, y + 4, eyeSize, eyeSize);
      }
    });

    // 绘制蛇2（蓝色）
    state.snake2.forEach((seg, idx) => {
      const isHead = idx === 0;
      const x = seg.x * VERSUS_CELL_SIZE;
      const y = seg.y * VERSUS_CELL_SIZE;
      ctx.fillStyle = isHead ? '#3b82f6' : `rgba(59, 130, 246, ${1 - idx * 0.05})`;
      ctx.fillRect(x + 1, y + 1, VERSUS_CELL_SIZE - 2, VERSUS_CELL_SIZE - 2);
      if (isHead) {
        ctx.fillStyle = '#000';
        const eyeSize = 2;
        ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
        ctx.fillRect(x + VERSUS_CELL_SIZE - 6, y + 4, eyeSize, eyeSize);
      }
    });

    // 食物
    const fx = state.food.x * VERSUS_CELL_SIZE;
    const fy = state.food.y * VERSUS_CELL_SIZE;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(
      fx + VERSUS_CELL_SIZE / 2,
      fy + VERSUS_CELL_SIZE / 2,
      VERSUS_CELL_SIZE / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-3 mt-8">
        🐍 贪吃蛇对战
      </h1>

      {/* 分数面板 */}
      <div className="flex gap-4 mb-3">
        <div className="bg-emerald-900/40 border-2 border-emerald-500 rounded-xl px-5 py-2">
          <div className="text-emerald-300 text-xs">🟢 玩家1 (WASD)</div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{state.score1}</div>
          {best.p1 > 0 && (
            <div className="text-emerald-500 text-xs">最高: {best.p1}</div>
          )}
        </div>
        <div className="bg-blue-900/40 border-2 border-blue-500 rounded-xl px-5 py-2">
          <div className="text-blue-300 text-xs">🔵 玩家2 (方向键)</div>
          <div className="text-3xl font-bold text-blue-400 font-mono">{state.score2}</div>
          {best.p2 > 0 && (
            <div className="text-blue-500 text-xs">最高: {best.p2}</div>
          )}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={VERSUS_GRID_SIZE * VERSUS_CELL_SIZE}
          height={VERSUS_GRID_SIZE * VERSUS_CELL_SIZE}
          className="rounded-lg shadow-2xl border-4 border-emerald-700"
        />

        {(state.winner !== null || !state.isPlaying) && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            {state.winner === 1 && (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-emerald-400 mb-2 animate-pulse">玩家1获胜！</div>
                <div className="text-xl text-white mb-1">玩家1: {state.score1} - 玩家2: {state.score2}</div>
              </>
            )}
            {state.winner === 2 && (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-blue-400 mb-2 animate-pulse">玩家2获胜！</div>
                <div className="text-xl text-white mb-1">玩家1: {state.score1} - 玩家2: {state.score2}</div>
              </>
            )}
            {state.winner === 0 && state.score1 + state.score2 > 0 && (
              <>
                <div className="text-4xl font-bold text-yellow-400 mb-2">🤝 平局！</div>
                <div className="text-xl text-white mb-1">玩家1: {state.score1} - 玩家2: {state.score2}</div>
              </>
            )}
            {!state.isPlaying && state.winner === null && (
              <>
                <div className="text-3xl font-bold text-emerald-400 mb-4">贪吃蛇对战</div>
                <div className="text-sm text-slate-300 text-center mb-2 max-w-xs">
                  <span className="text-emerald-300">🟢 玩家1</span> 使用 WASD 控制<br />
                  <span className="text-blue-300">🔵 玩家2</span> 使用方向键控制<br />
                  吃食物得分，撞墙或撞对方蛇身失败
                </div>
              </>
            )}
            {state.isPaused && (
              <div className="text-3xl font-bold text-amber-400 mb-2">游戏暂停</div>
            )}
            <button
              onClick={state.winner !== null || !state.isPlaying ? start : togglePause}
              className="mt-4 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {state.winner !== null ? '再来一局' : state.isPlaying ? '继续' : '开始游戏'}
            </button>
            {(state.winner !== null || state.score1 > 0 || state.score2 > 0) && (
              <button
                onClick={reset}
                className="mt-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all"
              >
                重置
              </button>
            )}
          </div>
        )}
      </div>

      {/* 移动端控制 - 玩家1 */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:hidden">
        <div>
          <div className="text-xs text-emerald-300 text-center mb-1">玩家1</div>
          <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
            <div></div>
            <button
              onClick={() => changeDirection1('UP')}
              className="aspect-square bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold"
            >
              W
            </button>
            <div></div>
            <button
              onClick={() => changeDirection1('LEFT')}
              className="aspect-square bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold"
            >
              A
            </button>
            <button
              onClick={() => changeDirection1('DOWN')}
              className="aspect-square bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold"
            >
              S
            </button>
            <button
              onClick={() => changeDirection1('RIGHT')}
              className="aspect-square bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold"
            >
              D
            </button>
          </div>
        </div>
        <div>
          <div className="text-xs text-blue-300 text-center mb-1">玩家2</div>
          <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
            <div></div>
            <button
              onClick={() => changeDirection2('UP')}
              className="aspect-square bg-blue-700 hover:bg-blue-600 text-white rounded font-bold"
            >
              ↑
            </button>
            <div></div>
            <button
              onClick={() => changeDirection2('LEFT')}
              className="aspect-square bg-blue-700 hover:bg-blue-600 text-white rounded font-bold"
            >
              ←
            </button>
            <button
              onClick={() => changeDirection2('DOWN')}
              className="aspect-square bg-blue-700 hover:bg-blue-600 text-white rounded font-bold"
            >
              ↓
            </button>
            <button
              onClick={() => changeDirection2('RIGHT')}
              className="aspect-square bg-blue-700 hover:bg-blue-600 text-white rounded font-bold"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p className="hidden md:block">🟢 WASD | 🔵 方向键 | 空格 开始/暂停 | R 重置</p>
        <p className="md:hidden">玩家1点左侧按钮 / 玩家2点右侧按钮</p>
      </div>
    </div>
  );
};