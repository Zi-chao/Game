import { useEffect, useRef } from 'react';
import { usePlumber } from '../hooks/usePlumber';
import { PIPE_CELL_SIZE, getConnections } from '../utils/plumberUtils';
import { PlumberCell } from '../types/game';

interface PlumberGameProps {
  onBack: () => void;
}

const drawPipe = (
  ctx: CanvasRenderingContext2D,
  cell: PlumberCell,
  x: number,
  y: number,
  size: number,
) => {
  if (cell.type === 'empty') return;

  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((cell.rotation * Math.PI) / 180);

  const strokeColor = cell.isSource ? '#22c55e' : cell.isTarget ? '#ef4444' : '#60a5fa';
  const fillColor = cell.isSource ? '#16a34a' : cell.isTarget ? '#dc2626' : '#3b82f6';

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  const r = size / 2 - 4;

  if (cell.type === 'straight') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (cell.type === 'corner') {
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (cell.type === 't_junction') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(0, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (cell.type === 'cross') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    for (const [cx, cy] of [[0, -r], [0, r], [-r, 0], [r, 0]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (cell.type === 'end') {
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, -r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

const drawWater = (
  ctx: CanvasRenderingContext2D,
  cell: PlumberCell,
  connections: boolean[],
  size: number,
) => {
  if (cell.type === 'empty') return;

  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate((cell.rotation * Math.PI) / 180);

  const r = size / 2 - 4;

  ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  if (cell.type === 'straight') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();
  } else if (cell.type === 'corner') {
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, 0);
    ctx.stroke();
  } else if (cell.type === 't_junction') {
    if (connections[0] && connections[2]) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();
    }
    if (connections[0] && connections[1]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, 0);
      ctx.stroke();
    }
    if (connections[1] && connections[2]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI / 2);
      ctx.stroke();
    }
  } else if (cell.type === 'cross') {
    if (connections[0] && connections[2]) {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();
    }
    if (connections[1] && connections[3]) {
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    }
  } else if (cell.type === 'end' && connections[0]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r);
    ctx.stroke();
  }

  ctx.restore();
};

export const PlumberGame = ({ onBack }: PlumberGameProps) => {
  const { state, totalLevels, reset, restartLevel, rotateCell, nextLevel } = usePlumber();
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // 渲染所有 canvas
  useEffect(() => {
    const grid = state.level.grid;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const idx = r * grid[r].length + c;
        const canvas = canvasRefs.current[idx];
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const cell = grid[r][c];
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (cell.type === 'empty') continue;

        const connections = getConnections(cell);
        drawWater(ctx, cell, connections, PIPE_CELL_SIZE);
        drawPipe(ctx, cell, 0, 0, PIPE_CELL_SIZE);
      }
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 mt-8">
        🔧 接水管
      </h1>

      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">关卡</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {state.levelIndex + 1}/{totalLevels}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">旋转次数</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{state.moves}</div>
        </div>
        {state.bestMoves > 0 && (
          <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
            <div className="text-slate-400 text-xs">最高关卡</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">{state.bestMoves}</div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 border border-cyan-700 rounded-lg px-4 py-2 mb-3">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-300">起点（水源）</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-red-300">终点</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-blue-300">管道（点击旋转）</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="inline-grid gap-1 p-3 bg-slate-800 rounded-xl border-4 border-cyan-700 shadow-2xl"
          style={{
            gridTemplateColumns: `repeat(${state.level.grid[0].length}, ${PIPE_CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${state.level.grid.length}, ${PIPE_CELL_SIZE}px)`,
          }}
        >
          {state.level.grid.flatMap((row, r) =>
            row.map((cell, c) => {
              const idx = r * row.length + c;
              const isInteractive = cell.type !== 'empty' && !cell.isSource && !cell.isTarget;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => isInteractive && rotateCell(r, c)}
                  disabled={!isInteractive || state.status !== 'playing'}
                  className={`relative flex items-center justify-center transition-all ${
                    isInteractive ? 'hover:bg-cyan-700/30 cursor-pointer' : 'cursor-default'
                  } ${state.status === 'playing' && isInteractive ? 'hover:scale-105' : ''}`}
                  style={{
                    width: PIPE_CELL_SIZE,
                    height: PIPE_CELL_SIZE,
                  }}
                >
                  <canvas
                    ref={el => {
                      canvasRefs.current[idx] = el;
                    }}
                    width={PIPE_CELL_SIZE}
                    height={PIPE_CELL_SIZE}
                    style={{ width: PIPE_CELL_SIZE, height: PIPE_CELL_SIZE, pointerEvents: 'none' }}
                  />
                </button>
              );
            })
          )}
        </div>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-emerald-400 mb-4 animate-bounce">💧 通水了！</div>
            <div className="text-xl text-white mb-1">用 {state.moves} 次旋转</div>
            {state.levelIndex + 1 < totalLevels ? (
              <button
                onClick={nextLevel}
                className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                下一关
              </button>
            ) : (
              <div className="text-yellow-400 mt-2 animate-pulse">⭐ 全部通关！</div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={restartLevel}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重玩本关
        </button>
        <button
          onClick={reset}
          className="px-6 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重新开始
        </button>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击管道格子旋转 90° | 连接绿点（水源）到红点（终点）让水流通</p>
      </div>
    </div>
  );
};