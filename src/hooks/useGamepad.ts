import { useEffect, useState } from 'react';

export type GamepadDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;

export interface GamepadState {
  connected: boolean;
  id: string | null;
  direction: GamepadDirection;
  rawAxes: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    lt: boolean;
    rt: boolean;
    start: boolean;
    select: boolean;
  };
  triggerLeft: number;
  triggerRight: number;
  rawButtons: boolean[];
}

const DEADZONE = 0.3;

const DISCONNECTED: GamepadState = {
  connected: false,
  id: null,
  direction: null,
  rawAxes: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
  buttons: { a: false, b: false, x: false, y: false, lb: false, rb: false, lt: false, rt: false, start: false, select: false },
  triggerLeft: 0,
  triggerRight: 0,
  rawButtons: [],
};

export const useGamepad = (): GamepadState => {
  const [state, setState] = useState<GamepadState>(DISCONNECTED);

  useEffect(() => {
    let mounted = true;

    const readBtn = (gp: Gamepad, idx: number): boolean => gp.buttons[idx]?.pressed || false;
    const readVal = (gp: Gamepad, idx: number): number => {
      const btn: any = gp.buttons[idx];
      return (btn?.value ?? (btn?.pressed ? 1 : 0)) as number;
    };

    const poll = () => {
      if (!mounted) return;
      const gps = navigator.getGamepads?.() || [];
      let gp: Gamepad | null = null;
      for (let i = 0; i < gps.length; i++) {
        if (gps[i]) { gp = gps[i] as Gamepad; break; }
      }
      if (!gp) {
        setState(prev => prev.connected ? DISCONNECTED : prev);
        return;
      }
      const lx = gp.axes[0] || 0;
      const ly = gp.axes[1] || 0;
      const rx = gp.axes[2] || 0;
      const ry = gp.axes[3] || 0;

      let direction: GamepadDirection = null;
      if (gp.buttons[12]?.pressed) direction = 'UP';
      else if (gp.buttons[13]?.pressed) direction = 'DOWN';
      else if (gp.buttons[14]?.pressed) direction = 'LEFT';
      else if (gp.buttons[15]?.pressed) direction = 'RIGHT';
      else if (Math.abs(lx) > DEADZONE || Math.abs(ly) > DEADZONE) {
        if (Math.abs(lx) > Math.abs(ly)) direction = lx > 0 ? 'RIGHT' : 'LEFT';
        else direction = ly > 0 ? 'DOWN' : 'UP';
      }

      const next: GamepadState = {
        connected: true,
        id: gp.id,
        direction,
        rawAxes: { x: lx, y: ly },
        rightStick: { x: rx, y: ry },
        buttons: {
          a: readBtn(gp, 0),
          b: readBtn(gp, 1),
          x: readBtn(gp, 2),
          y: readBtn(gp, 3),
          lb: readBtn(gp, 4),
          rb: readBtn(gp, 5),
          lt: readVal(gp, 6) > 0.1,
          rt: readVal(gp, 7) > 0.1,
          start: readBtn(gp, 9),
          select: readBtn(gp, 8),
        },
        triggerLeft: readVal(gp, 6),
        triggerRight: readVal(gp, 7),
        rawButtons: gp.buttons.map((b: any) => b?.pressed || false),
      };
      setState(prev => {
        // 简单去重：所有字段都相同时跳过
        if (
          prev.connected === next.connected &&
          prev.direction === next.direction &&
          prev.buttons.a === next.buttons.a &&
          prev.buttons.b === next.buttons.b &&
          prev.buttons.x === next.buttons.x &&
          prev.buttons.y === next.buttons.y &&
          prev.buttons.lb === next.buttons.lb &&
          prev.buttons.rb === next.buttons.rb &&
          prev.buttons.lt === next.buttons.lt &&
          prev.buttons.rt === next.buttons.rt &&
          prev.buttons.start === next.buttons.start &&
          prev.buttons.select === next.buttons.select &&
          prev.rawButtons.length === next.rawButtons.length &&
          !prev.rawButtons.some((v, i) => v !== next.rawButtons[i])
        ) return prev;
        return next;
      });
    };

    const interval = setInterval(poll, 16);
    poll();
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
};
