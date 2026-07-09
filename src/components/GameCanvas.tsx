import { useEffect, useRef } from 'react';
import { SnakeGameState } from '../types/game';
import { GRID_SIZE, CELL_SIZE } from '../utils/gameUtils';

interface GameCanvasProps {
  gameState: SnakeGameState;
}

export const GameCanvas = ({ gameState }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a365d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    const drawFood = () => {
      const { x, y } = gameState.food;
      const centerX = x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = y * CELL_SIZE + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 3;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#ee5a5a');
      gradient.addColorStop(1, '#cc4444');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const drawSnake = () => {
      gameState.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;

        let gradient;
        if (isHead) {
          gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
          gradient.addColorStop(0, '#4ade80');
          gradient.addColorStop(1, '#22c55e');
        } else {
          const alpha = 1 - (index / gameState.snake.length) * 0.4;
          gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
          gradient.addColorStop(0, `rgba(74, 222, 128, ${alpha})`);
          gradient.addColorStop(1, `rgba(34, 197, 94, ${alpha})`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        ctx.strokeStyle = isHead ? '#166534' : '#15803d';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        if (isHead) {
          ctx.fillStyle = '#000';
          const eyeSize = 4;
          const eyeOffset = 6;

          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x + CELL_SIZE - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    drawFood();
    drawSnake();
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GRID_SIZE * CELL_SIZE}
      height={GRID_SIZE * CELL_SIZE}
      className="rounded-lg shadow-2xl border-4 border-emerald-600"
    />
  );
};