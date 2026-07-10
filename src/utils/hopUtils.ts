import { HopLevel, HopDot } from '../types/game';

export const HOP_GRID_SIZE = 9;
export const HOP_CELL_SIZE = 50;

const HIGH_SCORE_KEY = 'hop_best';
const LEVEL_RECORDS_KEY = 'hop_level_records';

// 每关的记录：通关最少步数 和 通关次数
export interface LevelRecord {
  bestMoves: number;     // 该关最少步数（0 表示未通关）
  clearedCount: number;  // 该关累计通关次数
  lastPlayed: number;    // 上次通关时间戳
}

export type LevelRecords = Record<number, LevelRecord>;

export const getAllLevelRecords = (): LevelRecords => {
  const saved = localStorage.getItem(LEVEL_RECORDS_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
};

export const getLevelRecord = (levelIndex: number): LevelRecord => {
  const all = getAllLevelRecords();
  return all[levelIndex] || { bestMoves: 0, clearedCount: 0, lastPlayed: 0 };
};

export const saveLevelRecord = (levelIndex: number, moves: number) => {
  const all = getAllLevelRecords();
  const current = all[levelIndex] || { bestMoves: 0, clearedCount: 0, lastPlayed: 0 };
  all[levelIndex] = {
    bestMoves: current.bestMoves === 0 ? moves : Math.min(current.bestMoves, moves),
    clearedCount: current.clearedCount + 1,
    lastPlayed: Date.now(),
  };
  localStorage.setItem(LEVEL_RECORDS_KEY, JSON.stringify(all));
};

// 清除单个关卡记录（最少步数、通关次数、上次通关时间）
export const clearLevelRecord = (levelIndex: number) => {
  const all = getAllLevelRecords();
  delete all[levelIndex];
  localStorage.setItem(LEVEL_RECORDS_KEY, JSON.stringify(all));
};

// 清除所有跳跳乐记录（含最高关卡统计）
export const clearAllHopRecords = () => {
  localStorage.removeItem(LEVEL_RECORDS_KEY);
  localStorage.removeItem(HIGH_SCORE_KEY);
};

const getBest = (): number => {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? parseInt(saved, 10) : 0;
};

const saveBest = (clearedLevels: number) => {
  const current = getBest();
  if (clearedLevels > current) {
    localStorage.setItem(HIGH_SCORE_KEY, clearedLevels.toString());
  }
};

// 检查两点之间是否在一条线上（水平/垂直/对角）
const isAligned = (r1: number, c1: number, r2: number, c2: number): boolean => {
  const dr = Math.abs(r2 - r1);
  const dc = Math.abs(c2 - c1);
  return dr === 0 || dc === 0 || dr === dc;
};

// 使用回溯算法生成可一笔画的关卡
const generateSolvableLevel = (numDots: number, levelName: string): HopLevel => {
  const centerRow = Math.floor(HOP_GRID_SIZE / 2);
  const centerCol = Math.floor(HOP_GRID_SIZE / 2);

  // 使用随机种子保证不同关卡有不同的布局
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const dots: HopDot[] = [{ row: centerRow, col: centerCol }];
    const used = new Set<string>();
    used.add(`${centerRow},${centerCol}`);

    // 在中心周围 ±3 范围内随机散布点，确保每个点都和之前的某个点对齐
    const range = 3;
    let placed = 1;
    let tries = 0;
    while (placed < numDots && tries < 300) {
      tries++;
      const r = centerRow + Math.floor(Math.random() * (range * 2 + 1)) - range;
      const c = centerCol + Math.floor(Math.random() * (range * 2 + 1)) - range;
      if (r < 0 || r >= HOP_GRID_SIZE || c < 0 || c >= HOP_GRID_SIZE) continue;
      const k = `${r},${c}`;
      if (used.has(k)) continue;
      // 新点必须和至少一个已有点对齐（保证可连通）
      if (!dots.some(d => isAligned(d.row, d.col, r, c))) continue;
      used.add(k);
      dots.push({ row: r, col: c });
      placed++;
    }

    if (placed < numDots) continue; // 本次未能放置足够的点，重新尝试

    // 验证关卡可解：使用回溯算法找一笔画路径
    const order = findHamiltonPath(dots, centerRow, centerCol);
    if (order) {
      // 按解法顺序重排 dots（让玩家更容易看出可解路径）
      const orderedDots = order.map(idx => dots[idx]);
      return {
        name: levelName,
        dots: orderedDots,
        startRow: centerRow,
        startCol: centerCol,
      };
    }
    // 本次生成的图不可一笔画，重新尝试
  }

  // 兜底：使用最简单的可解布局（十字形）
  return generateFallbackLevel(numDots, levelName);
};

// 回溯查找一笔画路径（哈密顿路径）
const findHamiltonPath = (
  dots: HopDot[],
  startRow: number,
  startCol: number,
): number[] | null => {
  const startIdx = dots.findIndex(d => d.row === startRow && d.col === startCol);
  if (startIdx < 0) return null;

  const visited = new Set<number>([startIdx]);
  const path: number[] = [startIdx];

  const dfs = (current: number): boolean => {
    if (path.length === dots.length) return true;
    const cur = dots[current];
    for (let i = 0; i < dots.length; i++) {
      if (visited.has(i)) continue;
      const next = dots[i];
      if (isAligned(cur.row, cur.col, next.row, next.col)) {
        visited.add(i);
        path.push(i);
        if (dfs(i)) return true;
        path.pop();
        visited.delete(i);
      }
    }
    return false;
  };

  return dfs(startIdx) ? path : null;
};

// 兜底关卡：保证可解
const generateFallbackLevel = (numDots: number, levelName: string): HopLevel => {
  const centerRow = Math.floor(HOP_GRID_SIZE / 2);
  const centerCol = Math.floor(HOP_GRID_SIZE / 2);
  const dots: HopDot[] = [{ row: centerRow, col: centerCol }];

  // 十字形向外扩展，每个点都在水平/垂直/对角线上
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // 上下左右
    [-1, -1], [-1, 1], [1, -1], [1, 1], // 四对角
  ];

  let dirIdx = 0;
  let step = 1;
  while (dots.length < numDots) {
    const [dr, dc] = directions[dirIdx % directions.length];
    const r = centerRow + dr * step;
    const c = centerCol + dc * step;
    if (r >= 0 && r < HOP_GRID_SIZE && c >= 0 && c < HOP_GRID_SIZE) {
      const k = `${r},${c}`;
      if (!dots.some(d => `${d.row},${d.col}` === k)) {
        dots.push({ row: r, col: c });
      }
    }
    dirIdx++;
    if (dirIdx % directions.length === 0) step++;
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
    levels.push(generateSolvableLevel(numDots, `第${i + 1}关`));
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