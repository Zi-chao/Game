import { useEffect, useRef } from 'react';
import { usePong } from '../hooks/usePong';
import { ClearCacheButton } from './ClearCacheButton';
import { GameControls } from './GameControls';
import { OrientationPrompt } from './OrientationPrompt';

interface PongGameProps {
  onBack: () => void;
}

export const PongGame = ({ onBack }: PongGameProps) => {
  const { state, requiredScore, start, reset, togglePause, setMobileMove, gameWidth, gameHeight } = usePong();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 中线
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, gameHeight / 2);
    ctx.lineTo(gameWidth, gameHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 玩家1挡板（底部，绿色）
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10;
    ctx.fillRect(
      state.paddle1.x,
      state.paddle1.y,
      state.paddle1.width,
      state.paddle1.height
    );
    ctx.shadowBlur = 0;

    // 玩家2挡板（顶部，蓝色）
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.fillRect(
      state.paddle2.x,
      state.paddle2.y,
      state.paddle2.width,
      state.paddle2.height
    );
    ctx.shadowBlur = 0;

    // 球
    const gradient = ctx.createRadialGradient(
      state.ball.x,
      state.ball.y,
      0,
      state.ball.x,
      state.ball.y,
      state.ball.radius
    );
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [state, gameWidth, gameHeight]);

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

      {/* 玩家1控制 - 在游戏下方（移动端） */}
      <div className="md:hidden w-full mt-3 px-4 select-none">
        <div className="flex flex-col items-center">
          <div className="text-xs text-emerald-300 mb-1">🟢 P1</div>
          <div className="flex gap-2">
            <button
              onTouchStart={(e) => { e.preventDefault(); setMobileMove(1, 'left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setMobileMove(1, 'left', false); }}
              onTouchCancel={() => setMobileMove(1, 'left', false)}
              className="w-14 h-14 bg-emerald-700 active:bg-emerald-500 text-white text-xl rounded-lg font-bold touch-none"
            >
              ←
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); setMobileMove(1, 'right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setMobileMove(1, 'right', false); }}
              onTouchCancel={() => setMobileMove(1, 'right', false)}
              className="w-14 h-14 bg-emerald-700 active:bg-emerald-500 text-white text-xl rounded-lg font-bold touch-none"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-2xl">
        <canvas
          ref={canvasRef}
          width={gameWidth}
          height={gameHeight}
          className="rounded-lg shadow-2xl border-2 md:border-4 border-purple-700 w-full"
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
                <div className="text-4xl md:text-5xl mb-2 animate-bounce">🏆</div>
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
                  <span className="text-emerald-300">🟢 玩家1</span> A/D 移动<br />
                  <span className="text-blue-300">🔵 玩家2</span> 方向键移动<br />
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

      {/* 玩家1控制 - 在游戏下方（移动端） */}
      <div className="md:hidden w-full mt-3 px-4 select-none">
        <div className="flex flex-col items-center">
          <div className="text-xs text-emerald-300 mb-1">🟢 P1</div>
          <div className="flex gap-2">
            <button
              onTouchStart={(e) => { e.preventDefault(); setMobileMove(1, 'left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setMobileMove(1, 'left', false); }}
              onTouchCancel={() => setMobileMove(1, 'left', false)}
              className="w-14 h-14 bg-emerald-700 active:bg-emerald-500 text-white text-xl rounded-lg font-bold touch-none"
            >
              ←
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); setMobileMove(1, 'right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); setMobileMove(1, 'right', false); }}
              onTouchCancel={() => setMobileMove(1, 'right', false)}
              className="w-14 h-14 bg-emerald-700 active:bg-emerald-500 text-white text-xl rounded-lg font-bold touch-none"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block mt-3 text-slate-400 text-xs text-center">
        <p>🟢 A/D 移动挡板 | 🔵 ← → 移动挡板 | 空格 开始/暂停 | R 重置</p>
      </div>
    </div>
  );
};