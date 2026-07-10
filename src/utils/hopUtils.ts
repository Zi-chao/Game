import { HopLevel, HopDot } from '../types/game';

export const HOP_GRID_SIZE = 9;
export const HOP_CELL_SIZE = 50;

// 跳棋关卡 - 随机生成保证所有点互相可达（可一笔画）
const generateHopLevel = (numDots: number, levelName: string): HopLevel => {
  // 中心点
  const centerRow = Math.floor(HOP_GRID_SIZE / 2);
  const centerCol = Math.floor(HOP_GRID_SIZE / 2);

  const dots: HopDot[] = [{ row: centerRow, col: centerCol }];
  const used = new Set<string>();
  used.add(`${centerRow},${centerCol}`);

  // 在中心周围散布点
  let attempts = 0;
  while (dots.length < numDots && attempts < 200) {
    attempts++;
    const range = 3; // 在中心 ±3 范围内随机
    const r = centerRow + Math.floor(Math.random() * (range * 2 + 1)) - range;
    const c = centerCol + Math.floor(Math.random() * (range * 2 + 1)) - range;
    if (r < 0 || r >= HOP_GRID_SIZE || c < 0 || c >= HOP_GRID_SIZE) continue;
    const k = `${r},${c}`;
    if (used.has(k)) continue;
    // 至少要有一个方向（水平/垂直/对角）能跳到中心
    const dr = Math.abs(r - centerRow);
    const dc = Math.abs(c - centerCol);
    const validJump =
      dr === 0 || dc === 0 || dr === dc;
    if (!validJump) continue;
    used.add(k);
    dots.push({ row: r, col: c });
  }

  return {
    name: levelName,
    dots,
    startRow: centerRow,
    startCol: centerCol,
  };
};

// 预生成一批可玩关卡
const generateAllLevels = (): HopLevel[] => {
  const levels: HopLevel[] = [];
  for (let i = 0; i < 6; i++) {
    const numDots = 7 + i * 2; // 7, 9, 11, 13, 15, 17
    levels.push(generateHopLevel(numDots, `第${i + 1}关`));
  }
  return levels;
};

export const HOP_LEVELS: HopLevel[] = generateAllLevels();

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
  // 跳棋规则：水平、垂直或对角线方向
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