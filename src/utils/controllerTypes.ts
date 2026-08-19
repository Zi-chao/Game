// 手柄类型定义
export type ControllerType = 'xbox' | 'switch' | 'ps' | 'gulikit' | 'unknown';

// 根据 gamepad.id 检测手柄类型
export const detectControllerType = (id: string | null): ControllerType => {
  if (!id) return 'unknown';
  const lower = id.toLowerCase();
  // Xbox
  if (lower.includes('xbox') || lower.includes('xinput') || lower.includes('045e')) return 'xbox';
  // PS
  if (lower.includes('dualshock') || lower.includes('dualsense') || lower.includes('playstation') || lower.includes('054c')) return 'ps';
  // 谷粒
  if (lower.includes('gulikit') || lower.includes('ns09') || lower.includes('ns38') || lower.includes('ns39') || lower.includes('ns59')) return 'gulikit';
  // Switch
  if (lower.includes('switch') || lower.includes('pro controller') || lower.includes('057e')) return 'switch';
  return 'unknown';
};

// 不同手柄的按键名称
export const BUTTON_LABELS: Record<ControllerType, Record<number, string>> = {
  xbox: {
    0: 'A', 1: 'B', 2: 'X', 3: 'Y',
    4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
    8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
    12: 'D↑', 13: 'D↓', 14: 'D←', 15: 'D→', 16: 'Home',
  },
  switch: {
    0: 'B', 1: 'A', 2: 'Y', 3: 'X',  // 注意：Switch 布局 A/B X/Y 与 Xbox 相反
    4: 'L', 5: 'R', 6: 'ZL', 7: 'ZR',
    8: 'Minus', 9: 'Plus', 10: 'L3', 11: 'R3',
    12: 'D↑', 13: 'D↓', 14: 'D←', 15: 'D→', 16: 'Home',
  },
  ps: {
    0: '✕', 1: '○', 2: '□', 3: '△',
    4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
    8: 'Share', 9: 'Options', 10: 'L3', 11: 'R3',
    12: 'D↑', 13: 'D↓', 14: 'D←', 15: 'D→', 16: 'PS',
  },
  gulikit: {
    // 谷粒手柄在 PC 模式下通常使用 XInput 布局（Xbox）
    0: 'A', 1: 'B', 2: 'X', 3: 'Y',
    4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
    8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
    12: 'D↑', 13: 'D↓', 14: 'D←', 15: 'D→', 16: 'Home',
  },
  unknown: {
    0: 'Btn0', 1: 'Btn1', 2: 'Btn2', 3: 'Btn3',
    4: 'Btn4', 5: 'Btn5', 6: 'Btn6', 7: 'Btn7',
    8: 'Btn8', 9: 'Btn9', 10: 'Btn10', 11: 'Btn11',
    12: 'Btn12', 13: 'Btn13', 14: 'Btn14', 15: 'Btn15', 16: 'Btn16',
  },
};
