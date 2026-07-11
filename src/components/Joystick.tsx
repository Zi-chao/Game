import { useState, useRef, useCallback } from 'react';
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

    const threshold = maxRadius * 0.25;
    let direction: Direction | null = null;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        direction = dy > 0 ? 'DOWN' : 'UP';
      }
    }
    onChange(direction);
  }, [onChange]);

  const handleStart = (clientX: number, clientY: number, id: number) => {
    pointerIdRef.current = id;
    setActive(true);
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    pointerIdRef.current = null;
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onChange(null);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <div className="text-xs text-slate-300">{label}</div>}
      <div
        ref={baseRef}
        className="relative rounded-full bg-slate-800/60 border-4 border-slate-600 touch-none select-none"
        style={{ width: size, height: size }}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.changedTouches[0];
          if (touch) handleStart(touch.clientX, touch.clientY, touch.identifier);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === pointerIdRef.current) {
              updatePosition(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
              break;
            }
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === pointerIdRef.current) {
              handleEnd();
              break;
            }
          }
        }}
        onTouchCancel={handleEnd}
        onMouseDown={(e) => {
          e.preventDefault();
          handleStart(e.clientX, e.clientY, -1);
        }}
        onMouseMove={(e) => {
          if (pointerIdRef.current === -1) updatePosition(e.clientX, e.clientY);
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
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
