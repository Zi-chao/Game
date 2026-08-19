import { useEffect, useRef } from 'react';
import { usePong } from '../hooks/usePong';
import { ClearCacheButton } from './ClearCacheButton';
import { GameControls } from './GameControls';
import { OrientationPrompt } from './OrientationPrompt';
import { useGamepad } from '../hooks/useGamepad';

interface PongGameProps {
  onBack: () => void;
}

export const PongGame = ({ onBack }: PongGameProps) => {
  const { state, requiredScore, start, reset, togglePause, setPaddlePos, gameWidth, gameHeight } = usePong();
  const gamepad = useGamepad();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 跟踪每个手指的分配：identifier -> 1|2
  const touchAssignRef = useRef<Map<number, 1 | 2>>(new Map());

  // 手柄控制玩家2（顶部挡板）
  useEffect(() => {
    if (!gamepad.connected) return;
    const ax = gamepad.rawAxes.x;
    if (Math.abs(ax) > 0.2) {
      setPaddlePos(2, state.paddle2.x + ax * 20);
    }
  }, [gamepad.rawAxes.x, gamepad.connected, state.paddle2.x, setPaddlePos]);

  // canvas 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // 中间分界线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, gameHeight / 2);
    ctx.lineTo(gameWidth, gameHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 玩家区域标签
    ctx.fillStyle = 'rgba(96, 165, 250, 0.12)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('P2 区域', 10, 30);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
    ctx.fillText('P1 区域', 10, gameHeight - 10);

    // 中点圆
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(gameWidth / 2, gameHeight / 2, 30, 0, Math.PI * 2);
    ctx.fill();

    // 挡板
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;
    ctx.fillRect(state.paddle1.x, state.paddle1.y, state.paddle1.width, state.paddle1.height);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#60a5fa';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 8;
    ctx.fillRect(state.paddle2.x, state.paddle2.y, state.paddle2.width, state.paddle2.height);
    ctx.shadowBlur = 0;

    // 球
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [state, gameWidth, gameHeight]);

  // 全屏触屏跟随：监听 window 上的 touch 事件，处理所有手指
  useEffect(() => {
    const handleTouches = (e: TouchEvent) => {
      // 排除按钮和交互元素，让原生 click 触发
      const t = e.target as HTMLElement;
      if (t?.closest('button') || t?.tagName === 'BUTTON' || t?.tagName === 'INPUT') return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = gameWidth / rect.width;

      const assign = touchAssignRef.current;
      const currentIds = new Set<number>();

      for (let i = 0; i < e.touches.length; i++) {
        const tt = e.touches[i];
        currentIds.add(tt.identifier);
        const xInGame = (tt.clientX - rect.left) * scaleX;
        const screenMid = window.innerHeight / 2;
        const isTop = tt.clientY < screenMid;

        let player = assign.get(tt.identifier);
        if (!player) {
          if (isTop && !Array.from(assign.values()).includes(2)) player = 2;
          else if (!isTop && !Array.from(assign.values()).includes(1)) player = 1;
          else player = isTop ? 2 : 1;
          assign.set(tt.identifier, player);
        }

        if (player === 2) setPaddlePos(2, xInGame - state.paddle2.width / 2);
        else setPaddlePos(1, xInGame - state.paddle1.width / 2);
      }

      for (const id of assign.keys()) {
        if (!currentIds.has(id)) assign.delete(id);
      }
    };

    window.addEventListener('touchstart', handleTouches, { passive: false });
    window.addEventListener('touchmove', handleTouches, { passive: false });
    window.addEventListener('touchend', handleTouches, { passive: false });
    window.addEventListener('touchcancel', handleTouches, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouches);
      window.removeEventListener('touchmove', handleTouches);
      window.removeEventListener('touchend', handleTouches);
      window.removeEventListener('touchcancel', handleTouches);
    };
  }, [gameWidth, gameHeight, setPaddlePos, state.paddle1.width, state.paddle2.width]);

  // 鼠标拖动（桌面测试）
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('button')) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const xInGame = (e.clientX - rect.left) * (gameWidth / rect.width);
      const screenMid = window.innerHeight / 2;
      const isTop = e.clientY < screenMid;
      if (isTop) setPaddlePos(2, xInGame - state.paddle2.width / 2);
      else setPaddlePos(1, xInGame - state.paddle1.width / 2);

      const onMove = (ev: MouseEvent) => {
        if ((ev.target as HTMLElement)?.closest('button')) return;
        const xInGame2 = (ev.clientX - rect.left) * (gameWidth / rect.width);
        const isTop2 = ev.clientY < screenMid;
        if (isTop2) setPaddlePos(2, xInGame2 - state.paddle2.width / 2);
        else setPaddlePos(1, xInGame2 - state.paddle1.width / 2);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [gameWidth, gameHeight, setPaddlePos, state.paddle1.width, state.paddle2.width]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center pt-[85px] p-2 md:p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-2 left-2 md:top-4 md:left-4 px-3 py-1.5 md:px-4 md:py-2 bg-slate-700/80 hover:bg-slate-600 text-white text-sm md:text-base rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回
      </button>

      <ClearCacheButton storageKeys={['pong_best']} onCleared={() => window.location.reload()} />
      <GameControls />
      <OrientationPrompt mode="portrait" />

      <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-2 md:mb-3 mt-6 md:mt-8">
        🏓 重力小球
      </h1>

      {/* 分数面板 */}
      <div className="flex gap-2 md:gap-4 mb-2 md:mb-3 text-xs md:text-sm">
        <div className="bg-emerald-900/40 border-2 border-emerald-500 rounded-xl px-3 py-1.5 md:px-5 md:py-2">
          <div className="text-emerald-300 text-xs">🟢 玩家1</div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono">{state.score1}</div>
        </div>
        <div className="bg-blue-900/40 border-2 border-blue-500 rounded-xl px-3 py-1.5 md:px-5 md:py-2">
          <div className="text-blue-300 text-xs">🔵 玩家2</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-400 font-mono">{state.score2}</div>
        </div>
        <div className="bg-slate-800 rounded-xl px-3 py-1.5 md:px-4 md:py-2 border border-slate-700 flex flex-col justify-center">
          <div className="text-slate-400 text-xs">胜利</div>
          <div className="text-base md:text-lg font-bold text-amber-400 font-mono">{requiredScore}球</div>
        </div>
      </div>

      <div className="relative w-full max-w-2xl">
        <canvas
          ref={canvasRef}
          width={gameWidth}
          height={gameHeight}
          className="rounded-lg shadow-2xl border-2 md:border-4 border-purple-700 w-full touch-none"
          style={{ aspectRatio: `${gameWidth} / ${gameHeight}` }}
        />

        {(state.winner !== null || !state.isPlaying) && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center pt-[85px] p-4">
            {state.winner === 1 && (
              <>
                <div className="text-4xl md:text-5xl mb-2 animate-bounce">🏆</div>
                <div className="text-2xl md:text-4xl font-bold text-emerald-400 mb-2 animate-pulse">玩家1获胜！</div>
              </>
            )}
            {state.winner === 2 && (
              <>
                <div className="text-4xl md:text-5ml mb-2 animate-bounce">🏆</div>
                <div className="text-2xl md:text-4xl font-bold text-blue-400 mb-2 animate-pulse">玩家2获胜！</div>
              </>
            )}
            {state.winner !== null && (
              <div className="text-base md:text-xl text-white mb-1">
                {state.score1} - {state.score2}
              </div>
            )}
            {!state.isPlaying && state.winner === null && (
              <>
                <div className="text-2xl md:text-3xl font-bold text-purple-400 mb-3">重力小球</div>
                <div className="text-xs md:text-sm text-slate-300 text-center mb-2 max-w-md">
                  <span className="text-emerald-300">🟢 玩家1</span> A/D 或触屏下方<br />
                  <span className="text-blue-300">🔵 玩家2</span> 方向键 或触屏上方<br />
                  反弹球让对方接不住！先得 {requiredScore} 分
                </div>
              </>
            )}
            {state.isPaused && (
              <div className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">游戏暂停</div>
            )}
            <button
              onClick={state.winner !== null || !state.isPlaying ? start : togglePause}
              className="mt-3 px-6 py-2 md:px-8 md:py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm md:text-base font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {state.winner !== null ? '再来一局' : state.isPlaying ? '继续' : '开始游戏'}
            </button>
            {state.winner !== null && (
              <button
                onClick={reset}
                className="mt-2 px-5 py-1.5 md:px-6 md:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs md:text-sm transition-all"
              >
                重置
              </button>
            )}
          </div>
        )}
      </div>

      {/* 触屏控制提示 */}
      <div className="md:hidden mt-3 text-center text-xs text-slate-400 px-4">
        <p>👆 全屏双点触控：上 = P2，下 = P1（按 X 坐标跟随）</p>
      </div>

      <div className="hidden md:block mt-3 text-slate-400 text-xs text-center">
        <p>🟢 A/D 移动挡板 | 🔵 ← → 移动挡板 | 空格 开始/暂停 | R 重置</p>
      </div>
    </div>
  );
};
