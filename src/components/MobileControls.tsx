import { Direction } from '../types/game';
import { VirtualJoystick } from './VirtualJoystick';

export type MobileControlsProps = {
  onChangeDirection: (direction: Direction) => void;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan';
  label?: string;
};

export { VirtualJoystick as MobileControls };
