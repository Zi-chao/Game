import { useEffect, useRef } from 'react';
import { useTankGame } from '../hooks/useTankGame';
import {
  TILE_SIZE,
  TANK_SIZE,
  BULLET_SIZE,
  MAP_COLS,
  MAP_ROWS,
  TILE_BRICK,
  TILE_STEEL,
  TILE_WATER,
  TILE_BASE,
} from '../utils/tankUtils';

interface TankGameProps {
  onBack: () => void;
}

const drawTank = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: string,
  color: string
) => {
  ctx.save();
  ctx.translate(x + TANK_SIZE / 2, y + TANK_SIZE / 2);

  const angleMap: Record<string, number> = {
    UP: 0,
    RIGHT: Math.PI / 2,
    DOWN: Math.PI,
    LEFT: -Math.PI / 2,
  };
  ctx.rotate(angleMap[direction] || 0);

  // 车身
  ctx.fillStyle = color;
  ctx.fillRect(-TANK_SIZE / 2 + 2, -TANK_SIZE / 2 + 2, TANK_SIZE - 4, TANK_SIZE - 4);

  // 履带
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-TANK_SIZE / 2 + 1, -TANK_SIZE / 2, 5, TANK_SIZE);
  ctx.fillRect(TANK_SIZE / 2 - 6, -TANK_SIZE / 2, 5, TANK_SIZE);

  // 炮管
  ctx.fillStyle = '#000';
  ctx.fillRect(-2, -TANK_SIZE / 2 - 6, 4, TANK_SIZE / 2 + 4);

  ctx.restore();
};

export const TankGame = ({ onBack }: TankGameProps) => {
  const { gameState, map, requiredKills, killCount, start, reset } = useTankGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制地图
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tile = map[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        switch (tile) {
          case TILE_BRICK:
            ctx.fillStyle = '#a05a2c';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#7a4520';
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = '#a05a2c';
            ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
            break;
          case TILE_STEEL:
            ctx.fillStyle = '#9ca3af';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            break;
          case TILE_WATER:
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#60a5fa';
            const wave = Math.sin((Date.now() / 300) + c + r) * 2;
            ctx.fillRect(x + 2 + wave, y + 4, TILE_SIZE - 4, 2);
            ctx.fillRect(x + 2 - wave, y + 10, TILE_SIZE - 4, 2);
            break;
          case TILE_BASE:
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            break;
        }
      }
    }

    // 绘制玩家坦克
    drawTank(ctx, gameState.player.x, gameState.player.y, gameState.player.direction, '#22c55e');

    // 绘制敌坦克
    gameState.enemies.forEach(enemy => {
      drawTank(ctx, enemy.x, enemy.y, enemy.direction, '#ef4444');
    });

    // 绘制子弹
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 'player' ? '#fbbf24' : '#fb7185';
      ctx.fillRect(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE);
      ctx.fillStyle = bullet.owner === 'player' ? 'rgba(251,191,36,0.3)' : 'rgba(251,113,133,0.3)';
      ctx.fillRect(bullet.x - 2, bullet.y - 2, BULLET_SIZE + 4, BULLET_SIZE + 4);
    });
  }, [gameState, map]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-4 mt-8">
        🪖 坦克大战
      </h1>

      {/* 信息栏 */}
      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">分数</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{gameState.score}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">最高分</div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{gameState.highScore}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">生命</div>
          <div className="text-xl font-bold text-red-400">
            {'♥'.repeat(gameState.lives) + '♡'.repeat(3 - gameState.lives)}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">进度</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{killCount}/{requiredKills}</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={MAP_COLS * TILE_SIZE}
          height={MAP_ROWS * TILE_SIZE}
          className="rounded-lg shadow-2xl border-4 border-amber-600"
        />

        {(gameState.status === 'idle' || gameState.status === 'lost' || gameState.status === 'won') && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            {gameState.status === 'lost' ? (
              <>
                <div className="text-4xl font-bold text-red-500 mb-4">基地陷落！</div>
                <div className="text-2xl text-white mb-6">最终得分: {gameState.score}</div>
              </>
            ) : gameState.status === 'won' ? (
              <>
                <div className="text-4xl font-bold text-emerald-400 mb-4 animate-bounce">🎉 胜利！</div>
                <div className="text-2xl text-white mb-6">最终得分: {gameState.score}</div>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold text-amber-400 mb-4">坦克大战</div>
                <div className="text-sm text-slate-300 text-center mb-6 max-w-xs">
                  方向键移动 | 空格 或 J 射击<br />
                  摧毁所有敌方坦克，保护基地！
                </div>
              </>
            )}
            <button
              onClick={gameState.status === 'idle' ? start : reset}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {gameState.status === 'idle' ? '开始游戏' : '再来一局'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>← → ↑ ↓ 移动 | 空格/J 射击 | Enter 开始/重玩</p>
      </div>
    </div>
  );
};