import { useEffect, useRef } from 'react';
import { usePlaneGame } from '../hooks/usePlaneGame';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  BULLET_WIDTH,
  BULLET_HEIGHT,
} from '../utils/planeUtils';

interface PlaneGameProps {
  onBack: () => void;
}

export const PlaneGame = ({ onBack }: PlaneGameProps) => {
  const { gameState, startGame, togglePause, resetGame, setPlayerX } = usePlaneGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制游戏
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 星空背景
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制星星
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const starPositions = [
      [50, 50], [120, 80], [200, 30], [300, 100], [350, 60],
      [80, 200], [150, 250], [250, 200], [320, 280], [380, 220],
      [30, 350], [100, 400], [200, 380], [280, 420], [350, 380],
    ];
    starPositions.forEach(([x, y]) => {
      ctx.fillRect(x, y, 2, 2);
    });

    // 绘制子弹
    gameState.bullets.forEach(bullet => {
      const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + BULLET_HEIGHT);
      gradient.addColorStop(0, '#fbbf24');
      gradient.addColorStop(1, '#f59e0b');
      ctx.fillStyle = gradient;
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);

      // 子弹光晕
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.fillRect(bullet.x - 2, bullet.y - 2, BULLET_WIDTH + 4, BULLET_HEIGHT + 4);
    });

    // 绘制敌机
    gameState.enemies.forEach(enemy => {
      // 敌机主体
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
      ctx.lineTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.x + enemy.width, enemy.y);
      ctx.closePath();
      ctx.fill();

      // 敌机细节
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);

      // 敌机驾驶舱
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(enemy.x + enemy.width / 2 - 3, enemy.y + 8, 6, 6);
    });

    // 绘制玩家飞机
    if (!gameState.isGameOver) {
      const px = gameState.playerX;
      const py = GAME_HEIGHT - PLAYER_HEIGHT;

      // 飞机机身
      const gradient = ctx.createLinearGradient(px, py, px, py + PLAYER_HEIGHT);
      gradient.addColorStop(0, '#60a5fa');
      gradient.addColorStop(1, '#2563eb');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(px + PLAYER_WIDTH / 2, py);
      ctx.lineTo(px, py + PLAYER_HEIGHT);
      ctx.lineTo(px + PLAYER_WIDTH, py + PLAYER_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // 机翼
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(px - 5, py + PLAYER_HEIGHT * 0.5, 5, PLAYER_HEIGHT * 0.4);
      ctx.fillRect(px + PLAYER_WIDTH, py + PLAYER_HEIGHT * 0.5, 5, PLAYER_HEIGHT * 0.4);

      // 驾驶舱
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(px + PLAYER_WIDTH / 2 - 5, py + 10, 10, 10);

      // 引擎火焰
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + PLAYER_WIDTH / 2 - 3, py + PLAYER_HEIGHT, 6, 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + PLAYER_WIDTH / 2 - 2, py + PLAYER_HEIGHT, 4, 6);
    }
  }, [gameState]);

  // 触屏控制
  const handleTouch = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const targetX = (x / rect.width) * GAME_WIDTH - PLAYER_WIDTH / 2;
    setPlayerX(targetX);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-4 mt-8">
        ✈️ 飞机大战
      </h1>

      <div className="flex gap-6 items-start">
        {/* 游戏画布 */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
            className="rounded-lg shadow-2xl border-4 border-orange-600 cursor-none"
            style={{ touchAction: 'none' }}
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
                  <div className="text-4xl font-bold text-orange-400 mb-4">飞机大战</div>
                  <div className="text-sm text-slate-300 text-center max-w-xs">
                    ← → 或 A/D 移动飞机<br />
                    空格 自动射击<br />
                    躲避敌机并击落它们！
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
            <div className="text-2xl font-bold text-orange-400 font-mono">{gameState.score}</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-700 min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">最高分</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono">{gameState.highScore}</div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-slate-700 min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">生命</div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-2xl ${i < gameState.lives ? 'text-red-500' : 'text-slate-600'}`}>
                  ♥
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-3 mt-4 flex-wrap justify-center">
        {!gameState.isPlaying || gameState.isGameOver ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-orange-600/30"
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

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p className="hidden md:block">← → 移动 | 空格 自动射击 | P 暂停 | R 重新开始</p>
        <p className="md:hidden">触屏左右滑动控制飞机</p>
      </div>
    </div>
  );
};