import { useEffect, useRef } from 'react';
import { useVersusPlane } from '../hooks/useVersusPlane';
import { OrientationPrompt } from './OrientationPrompt';
import { ClearCacheButton } from './ClearCacheButton';

interface VersusPlaneGameProps {
  onBack: () => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 36;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 14;

export const VersusPlaneGame = ({ onBack }: VersusPlaneGameProps) => {
  const { state, requiredScore, start, reset, togglePause, setPlayer1X, setPlayer2X, fire1, fire2 } = useVersusPlane();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fire1HeldRef = useRef(false);
  const fire2HeldRef = useRef(false);
  const fire1IntervalRef = useRef<number | null>(null);
  const fire2IntervalRef = useRef<number | null>(null);

  const startFire1 = () => {
    if (fire1HeldRef.current) return;
    fire1HeldRef.current = true;
    fire1();
    fire1IntervalRef.current = window.setInterval(() => {
      if (fire1HeldRef.current) fire1();
    }, 350);
  };
  const stopFire1 = () => {
    fire1HeldRef.current = false;
    if (fire1IntervalRef.current) {
      clearInterval(fire1IntervalRef.current);
      fire1IntervalRef.current = null;
    }
  };

  const startFire2 = () => {
    if (fire2HeldRef.current) return;
    fire2HeldRef.current = true;
    fire2();
    fire2IntervalRef.current = window.setInterval(() => {
      if (fire2HeldRef.current) fire2();
    }, 350);
  };
  const stopFire2 = () => {
    fire2HeldRef.current = false;
    if (fire2IntervalRef.current) {
      clearInterval(fire2IntervalRef.current);
      fire2IntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopFire1();
      stopFire2();
    };
  }, []);

  const handleTouch1 = (e: React.TouchEvent) => {
    if (!state.isPlaying || state.isPaused || state.winner !== null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const targetX = (x / rect.width) * GAME_WIDTH - PLAYER_WIDTH / 2;
    setPlayer1X(targetX);
  };

  const handleTouch2 = (e: React.TouchEvent) => {
    if (!state.isPlaying || state.isPaused || state.winner !== null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const targetX = (x / rect.width) * GAME_WIDTH - PLAYER_WIDTH / 2;
    setPlayer2X(targetX);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 玩家1区域（底部）渐变
    const gradient1 = ctx.createLinearGradient(0, GAME_HEIGHT - 100, 0, GAME_HEIGHT);
    gradient1.addColorStop(0, 'rgba(34, 197, 94, 0)');
    gradient1.addColorStop(1, 'rgba(34, 197, 94, 0.15)');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);

    // 玩家2区域（顶部）渐变
    const gradient2 = ctx.createLinearGradient(0, 0, 0, 100);
    gradient2.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
    gradient2.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, GAME_WIDTH, 100);

    // 中线
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT / 2);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 玩家1（底部，绿色）
    const p1x = state.player1X;
    const p1y = GAME_HEIGHT - PLAYER_HEIGHT;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(p1x + PLAYER_WIDTH / 2, p1y);
    ctx.lineTo(p1x, p1y + PLAYER_HEIGHT);
    ctx.lineTo(p1x + PLAYER_WIDTH, p1y + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(p1x - 4, p1y + PLAYER_HEIGHT * 0.3, 4, PLAYER_HEIGHT * 0.4);
    ctx.fillRect(p1x + PLAYER_WIDTH, p1y + PLAYER_HEIGHT * 0.3, 4, PLAYER_HEIGHT * 0.4);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(p1x + PLAYER_WIDTH / 2 - 4, p1y + 8, 8, 8);
    // 引擎火焰
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(p1x + PLAYER_WIDTH / 2 - 3, p1y + PLAYER_HEIGHT, 6, 6);

    // 玩家2（顶部，蓝色，朝下）
    const p2x = state.player2X;
    ctx.save();
    ctx.translate(p2x + PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
    ctx.rotate(Math.PI);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_HEIGHT / 2);
    ctx.lineTo(-PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
    ctx.lineTo(PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-PLAYER_WIDTH / 2 - 4, -PLAYER_HEIGHT * 0.3, 4, PLAYER_HEIGHT * 0.4);
    ctx.fillRect(PLAYER_WIDTH / 2, -PLAYER_HEIGHT * 0.3, 4, PLAYER_HEIGHT * 0.4);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(-4, -8, 8, 8);
    ctx.restore();

    // 子弹
    state.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 1 ? '#fbbf24' : '#fb7185';
      ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
      // 光晕
      ctx.fillStyle = bullet.owner === 1
        ? 'rgba(251, 191, 36, 0.3)'
        : 'rgba(251, 113, 133, 0.3)';
      ctx.fillRect(bullet.x - 2, bullet.y - 2, BULLET_WIDTH + 4, BULLET_HEIGHT + 4);
    });
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex flex-col items-center justify-center p-2 md:p-4 relative">
      <OrientationPrompt />
      <button
        onClick={onBack}
        className="absolute top-2 left-2 md:top-4 md:left-4 px-3 py-1.5 md:px-4 md:py-2 bg-slate-700/80 hover:bg-slate-600 text-white text-sm md:text-base rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回
      </button>

      <ClearCacheButton storageKeys={['versus_plane_best']} onCleared={() => window.location.reload()} />

      {/* 玩家2控制 - 倒置显示在标题上方，触摸区域 */}
      <div className="md:hidden w-full mt-2 px-3 select-none">
        <div className="text-xs text-blue-300 text-center mb-1">🔵 玩家2 (倒着玩)</div>
        <div className="flex flex-col items-center gap-1 rotate-180">
          <button
            onPointerDown={(e) => { e.preventDefault(); startFire2(); }}
            onPointerUp={stopFire2}
            onPointerLeave={stopFire2}
            onPointerCancel={stopFire2}
            onClick={() => fire2()}
            className="w-14 h-12 bg-blue-700 active:bg-blue-500 text-white text-sm rounded-lg font-bold flex items-center justify-center cursor-pointer select-none"
            style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <span className="rotate-180">🔥 射击</span>
          </button>
          {/* 触摸移动区域 */}
          <div
            onTouchMove={handleTouch2}
            onTouchStart={handleTouch2}
            className="w-full h-16 bg-blue-900/30 border-2 border-blue-500/50 rounded-lg flex items-center justify-center"
            style={{ touchAction: 'none' }}
          >
            <span className="text-blue-400 text-xs rotate-180">← 触摸滑动移动 →</span>
          </div>
        </div>
      </div>

      <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-2 md:mb-3 mt-4 md:mt-8">
        ✈️ 飞机大战对战
      </h1>

      {/* 分数面板 */}
      <div className="flex gap-2 md:gap-4 mb-2 md:mb-3">
        <div className="bg-emerald-900/40 border-2 border-emerald-500 rounded-xl px-3 py-1.5 md:px-5 md:py-2">
          <div className="text-emerald-300 text-xs">🟢 玩家1</div>
          <div className="flex items-center gap-1">
            <div className="text-xl md:text-3xl font-bold text-emerald-400 font-mono">{state.score1}</div>
            <div className="text-base md:text-lg text-red-400">
              {'♥'.repeat(Math.max(0, state.lives1)) + '♡'.repeat(Math.max(0, 3 - state.lives1))}
            </div>
          </div>
        </div>
        <div className="bg-blue-900/40 border-2 border-blue-500 rounded-xl px-3 py-1.5 md:px-5 md:py-2">
          <div className="text-blue-300 text-xs">🔵 玩家2</div>
          <div className="flex items-center gap-1">
            <div className="text-xl md:text-3xl font-bold text-blue-400 font-mono">{state.score2}</div>
            <div className="text-base md:text-lg text-red-400">
              {'♥'.repeat(Math.max(0, state.lives2)) + '♡'.repeat(Math.max(0, 3 - state.lives2))}
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl px-3 py-1.5 md:px-4 md:py-2 border border-slate-700 flex flex-col justify-center">
          <div className="text-slate-400 text-xs">胜利条件</div>
          <div className="text-base md:text-lg font-bold text-amber-400 font-mono">{requiredScore} 击杀</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="rounded-lg shadow-2xl border-2 md:border-4 border-amber-700 max-w-full"
          style={{ maxHeight: '50vh', height: 'auto' }}
        />

        {(state.winner !== null || !state.isPlaying) && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            {state.winner === 1 && (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-emerald-400 mb-2 animate-pulse">玩家1获胜！</div>
              </>
            )}
            {state.winner === 2 && (
              <>
                <div className="text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-blue-400 mb-2 animate-pulse">玩家2获胜！</div>
              </>
            )}
            {state.winner !== null && (
              <div className="text-xl text-white mb-1">
                {state.score1} - {state.score2}
              </div>
            )}
            {!state.isPlaying && state.winner === null && (
              <>
                <div className="text-3xl font-bold text-orange-400 mb-4">飞机大战对战</div>
                <div className="text-sm text-slate-300 text-center mb-2 max-w-md">
                  <span className="text-emerald-300">🟢 玩家1</span> 在底部，WASD左右移动，空格射击<br />
                  <span className="text-blue-300">🔵 玩家2</span> 在顶部，方向键左右移动，回车射击<br />
                  先获得 {requiredScore} 次击杀获胜
                </div>
              </>
            )}
            {state.isPaused && (
              <div className="text-3xl font-bold text-amber-400 mb-2">游戏暂停</div>
            )}
            <button
              onClick={state.winner !== null || !state.isPlaying ? start : togglePause}
              className="mt-4 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {state.winner !== null ? '再来一局' : state.isPlaying ? '继续' : '开始游戏'}
            </button>
            {state.winner !== null && (
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

      {/* 玩家1控制 - 在游戏下方 */}
      <div className="md:hidden w-full mt-2 px-3 select-none">
        <div className="text-xs text-emerald-300 text-center mb-1">🟢 玩家1</div>
        <div className="flex flex-col items-center gap-1">
          <button
            onPointerDown={(e) => { e.preventDefault(); startFire1(); }}
            onPointerUp={stopFire1}
            onPointerLeave={stopFire1}
            onPointerCancel={stopFire1}
            onClick={() => fire1()}
            className="w-14 h-12 bg-emerald-700 active:bg-emerald-500 text-white text-sm rounded-lg font-bold flex items-center justify-center cursor-pointer select-none"
            style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            🔥 射击
          </button>
          {/* 触摸移动区域 */}
          <div
            onTouchMove={handleTouch1}
            onTouchStart={handleTouch1}
            className="w-full h-16 bg-emerald-900/30 border-2 border-emerald-500/50 rounded-lg flex items-center justify-center"
            style={{ touchAction: 'none' }}
          >
            <span className="text-emerald-400 text-xs">← 触摸滑动移动 →</span>
          </div>
        </div>
      </div>

      <div className="mt-2 md:mt-4 text-slate-400 text-xs text-center">
        <p className="hidden md:block">🟢 A/D 移动 + 空格射击 | 🔵 ← → 移动 + 回车射击 | R 重置</p>
        <p className="md:hidden">玩家1触摸下方区域移动 / 玩家2触摸上方区域移动(倒置)</p>
      </div>
    </div>
  );
};