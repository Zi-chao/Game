import { HopLevel, HopDot } from '../types/game';

// 跳棋关卡设计 - 类似"一笔画"跳棋，棋子必须跳遍所有点
// 玩法：棋子只能斜向或直线跳到下一个空格
export const HOP_LEVELS: HopLevel[] = [
  {
    name: '第1关',
    startRow: 4,
    startCol: 4,
    dots: [
      { row: 4, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 5 },
      { row: 3, col: 4 }, { row: 5, col: 4 },
      { row: 3, col: 3 }, { row: 5, col: 5 },
    ],
  },
  {
    name: '第2关',
    startRow: 4,
    startCol: 4,
    dots: [
      { row: 2, col: 3 }, { row: 2, col: 5 },
      { row: 3, col: 2 }, { row: 3, col: 6 },
      { row: 4, col: 4 },
      { row: 5, col: 2 }, { row: 5, col: 6 },
      { row: 6, col: 3 }, { row: 6, col: 5 },
    ],
  },
  {
    name: '第3关',
    startRow: 4,
    startCol: 4,
    dots: [
      { row: 1, col: 1 }, { row: 1, col: 7 },
      { row: 2, col: 4 },
      { row: 4, col: 1 }, { row: 4, col: 7 },
      { row: 4, col: 4 },
      { row: 6, col: 4 },
      { row: 7, col: 1 }, { row: 7, col: 7 },
    ],
  },
];

export const HOP_GRID_SIZE = 9;
export const HOP_CELL_SIZE = 50;

export const canHopTo = (
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  visited: HopDot[],
): boolean => {
  // 必须在网格内
  if (toRow < 0 || toRow >= HOP_GRID_SIZE || toCol < 0 || toCol >= HOP_GRID_SIZE) {
    return false;
  }
  // 不能跳到已访问的位置
  if (visited.some(v => v.row === toRow && v.col === toCol)) {
    return false;
  }
  // 跳棋规则：水平、垂直或对角线方向，且必须跳过至少一个点
  const dRow = Math.abs(toRow - fromRow);
  const dCol = Math.abs(toCol - fromCol);

  // 水平
  if (dRow === 0 && dCol > 0) return true;
  // 垂直
  if (dCol === 0 && dRow > 0) return true;
  // 对角线
  if (dRow === dCol && dRow > 0) return true;

  return false;
};

export const checkHopWin = (visited: HopDot[], totalDots: number): boolean => {
  return visited.length >= totalDots;
};