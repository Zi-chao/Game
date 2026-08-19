import { useState, useRef, useCallback, useEffect } from 'react';
import { Direction } from '../types/game';

interface JoystickProps {
  onChange: (direction: Direction | null) => void;
  color?: string;
  size?: number;
  label?: string;
}

export const Joystick = ({ onChange, color = '#22c55e', size = 120, label }: JoystickProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  // 用 ref 保存最新的 onChange，避免 effect 频繁重建
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setPosition({ x: dx, y: dy });

    // 去掉死区：只要不在中心就触发方向
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    let direction: Direction | null = null;
    if (distanceFromCenter > 2) {
      // 极小死区 (2px)，只过滤手指静止时的抖动
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        // 屏幕坐标系: dy < 0 = 手指在 Joystick 顶部
        // 推顶部 = 'UP' = 蛇向屏幕上方走 (y-1)
        direction = dy > 0 ? 'DOWN' : 'UP';
      }
    }
    // 调试日志（按 F12 控制台查看）
    console.log(`[Joystick] dy=${dy.toFixed(0)} dx=${dx.toFixed(0)} -> ${direction}`);
    onChangeRef.current(direction);
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number, id: number) => {
    pointerIdRef.current = id;
    setActive(true);
    updatePosition(clientX, clientY);
  }, [updatePosition]);

  const handleEnd = useCallback(() => {
    pointerIdRef.current = null;
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onChangeRef.current(null);
  }, []);

  // 在 window 上全局监听 pointermove/pointerup，确保手指滑出 Joystick 边界后仍能控制
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pointerIdRef.current === null) return;
      if (e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (pointerIdRef.current === null) return;
      if (e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      handleEnd();
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { passive: false });
    window.addEventListener('pointercancel', onUp, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [updatePosition, handleEnd]);

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <div className="text-xs text-slate-300">{label}</div>}
      <div
        ref={baseRef}
        className="relative rounded-full bg-slate-800/60 border-4 border-slate-600 touch-none select-none"
        style={{ width: size, height: size, touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          // 尝试捕获 pointer 到 Joystick 上（部分浏览器支持）
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          handleStart(e.clientX, e.clientY, e.pointerId);
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-lg pointer-events-none font-bold">
          <span style={{ position: 'absolute', top: 6 }}>↑</span>
          <span style={{ position: 'absolute', bottom: 6 }}>↓</span>
          <span style={{ position: 'absolute', left: 6 }}>←</span>
          <span style={{ position: 'absolute', right: 6 }}>→</span>
        </div>
        <div
          className="absolute rounded-full border-2"
          style={{
            width: size / 2.5,
            height: size / 2.5,
            left: '50%',
            top: '50%',
            background: `radial-gradient(circle, ${color}cc, ${color}88)`,
            borderColor: color,
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
            boxShadow: active ? `0 0 20px ${color}` : 'none',
            transition: active ? 'none' : 'transform 0.2s',
          }}
        />
      </div>
    </div>
  );
};
