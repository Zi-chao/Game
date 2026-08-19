import { useRef, useState } from 'react';
import { Direction } from '../types/game';

interface VirtualJoystickProps {
  onChangeDirection: (direction: Direction) => void;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan';
  label?: string;
}

const colorMap = {
  emerald: { base: 'bg-emerald-900/60 border-emerald-500', thumb: 'bg-emerald-400 border-emerald-300', text: 'text-emerald-300' },
  blue: { base: 'bg-blue-900/60 border-blue-500', thumb: 'bg-blue-400 border-blue-300', text: 'text-blue-300' },
  amber: { base: 'bg-amber-900/60 border-amber-500', thumb: 'bg-amber-400 border-amber-300', text: 'text-amber-300' },
  rose: { base: 'bg-rose-900/60 border-rose-500', thumb: 'bg-rose-400 border-rose-300', text: 'text-rose-300' },
  purple: { base: 'bg-purple-900/60 border-purple-500', thumb: 'bg-purple-400 border-purple-300', text: 'text-purple-300' },
  cyan: { base: 'bg-cyan-900/60 border-cyan-500', thumb: 'bg-cyan-400 border-cyan-300', text: 'text-cyan-300' },
};

const SIZE = 130;       // 摇杆底盘直径
const THUMB = 60;       // 摇杆头直径
const DEADZONE = 0.35;  // 死区（0-1 比例）

export const VirtualJoystick = ({ onChangeDirection, color = 'emerald', label }: VirtualJoystickProps) => {
  const c = colorMap[color];
  const baseRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ x: 0, y: 0, active: false });
  const lastDirRef = useRef<Direction | null>(null);
  const activeRef = useRef(false);

  const handleMove = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const maxR = rect.width / 2 - THUMB / 2;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setThumb({ x: dx, y: dy, active: true });

    // 死区判断
    const ratio = dist / maxR;
    if (ratio < DEADZONE) {
      if (lastDirRef.current) {
        lastDirRef.current = null;
      }
      return;
    }
    // 角度判断方向（取最大分量）
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    let dir: Direction;
    if (ax > ay) dir = dx > 0 ? 'RIGHT' : 'LEFT';
    else dir = dy > 0 ? 'DOWN' : 'UP';
    if (dir !== lastDirRef.current) {
      lastDirRef.current = dir;
      onChangeDirection(dir);
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    activeRef.current = true;
    handleMove(clientX, clientY);
  };

  const handleEnd = () => {
    activeRef.current = false;
    setThumb({ x: 0, y: 0, active: false });
    lastDirRef.current = null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => {
      if (!activeRef.current) return;
      ev.preventDefault();
      handleMove(ev.clientX, ev.clientY);
    };
    const onUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handleStart(t.clientX, t.clientY);
    const onMove = (ev: TouchEvent) => {
      if (!activeRef.current) return;
      ev.preventDefault();
      const tt = ev.touches[0];
      if (tt) handleMove(tt.clientX, tt.clientY);
    };
    const onEnd = () => {
      handleEnd();
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  return (
    <div className="mt-3 select-none">
      {label && <div className={`text-xs text-center mb-1 ${c.text}`}>{label}</div>}
      <div className="flex justify-center">
        <div
          ref={baseRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className={`relative rounded-full border-2 ${c.base} touch-none flex items-center justify-center`}
          style={{ width: SIZE, height: SIZE }}
        >
          {/* 中心十字标 */}
          <div className={`absolute w-1 h-1 rounded-full ${c.thumb} opacity-50`} />
          {/* 四向指示标 */}
          <div className={`absolute top-1 text-xs ${c.text} opacity-50`}>↑</div>
          <div className={`absolute bottom-1 text-xs ${c.text} opacity-50`}>↓</div>
          <div className={`absolute left-2 text-xs ${c.text} opacity-50`}>←</div>
          <div className={`absolute right-2 text-xs ${c.text} opacity-50`}>→</div>
          {/* 摇杆头 */}
          <div
            className={`absolute rounded-full border-2 ${c.thumb} shadow-lg transition-transform`}
            style={{
              width: THUMB,
              height: THUMB,
              transform: `translate(${thumb.x}px, ${thumb.y}px) scale(${thumb.active ? 1.1 : 1})`,
              boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
