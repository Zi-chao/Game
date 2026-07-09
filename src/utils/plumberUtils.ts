import { PlumberLevel, PlumberCell, PipeType } from '../types/game';

export const PIPE_GRID_SIZE = 6;
export const PIPE_CELL_SIZE = 60;

// 管道连接方向：上、右、下、左
// 直管 [上,下] 或 [左,右]
// 弯管 [上,右], [右,下], [下,左], [左,上]
// 三通 [缺一个方向]
// 端点 [只有一个方向]

export const PIPE_SHAPES: Record<PipeType, number[]> = {
  empty: [],
  straight: [1, 0, 1, 0],  // 上、下
  corner: [1, 1, 0, 0],    // 上、右
  t_junction: [1, 1, 1, 0], // 上、右、下
  cross: [1, 1, 1, 1],
  end: [1, 0, 0, 0],       // 只有上
};

// 获取当前旋转后的连接方向 [up, right, down, left]
export const getConnections = (cell: PlumberCell): boolean[] => {
  const shape = PIPE_SHAPES[cell.type];
  if (shape.length === 0) return [false, false, false, false];

  const rotated = [false, false, false, false];
  const rotations = cell.rotation / 90;

  for (let i = 0; i < 4; i++) {
    rotated[i] = shape[(i - rotations + 4) % 4] === 1;
  }
  return rotated;
};

// 检查两个相邻格子是否正确连接
export const checkConnection = (
  grid: PlumberCell[][],
  row: number,
  col: number,
  direction: number, // 0=上, 1=右, 2=下, 3=左
): { connected: boolean; nextRow: number; nextCol: number } | null => {
  const cell = grid[row][col];
  if (!cell) return null;

  const connections = getConnections(cell);
  if (!connections[direction]) return null;

  // 计算下一个格子
  let nextRow = row;
  let nextCol = col;
  let oppositeDir = direction;
  switch (direction) {
    case 0: nextRow = row - 1; oppositeDir = 2; break;
    case 1: nextCol = col + 1; oppositeDir = 3; break;
    case 2: nextRow = row + 1; oppositeDir = 0; break;
    case 3: nextCol = col - 1; oppositeDir = 1; break;
  }

  if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[0].length) {
    return null;
  }

  const nextCell = grid[nextRow][nextCol];
  if (!nextCell || nextCell.type === 'empty') return null;

  const nextConnections = getConnections(nextCell);
  if (!nextConnections[oppositeDir]) return null;

  return { connected: true, nextRow, nextCol };
};

// 从源头开始追踪连接
export const traceFromSource = (grid: PlumberCell[][], sourceRow: number, sourceCol: number): Set<string> => {
  const visited = new Set<string>();
  const stack: Array<{ row: number; col: number; fromDir: number }> = [];

  // 源头向下追踪（假设源头朝下开口）
  if (sourceRow + 1 < grid.length) {
    stack.push({ row: sourceRow + 1, col: sourceCol, fromDir: 0 });
  }
  if (sourceCol + 1 < grid[0].length) {
    stack.push({ row: sourceRow, col: sourceCol + 1, fromDir: 3 });
  }

  while (stack.length > 0) {
    const { row, col, fromDir } = stack.pop()!;
    const key = `${row}-${col}`;
    if (visited.has(key)) continue;

    const cell = grid[row][col];
    if (!cell || cell.type === 'empty') continue;

    const connections = getConnections(cell);
    // 这个格子必须在来向有连接
    if (!connections[fromDir]) continue;

    visited.add(key);

    // 4个方向延伸（除了来向）
    for (let dir = 0; dir < 4; dir++) {
      if (dir === fromDir) continue;
      if (!connections[dir]) continue;

      let nr = row;
      let nc = col;
      let opposite = dir;
      switch (dir) {
        case 0: nr = row - 1; opposite = 2; break;
        case 1: nc = col + 1; opposite = 3; break;
        case 2: nr = row + 1; opposite = 0; break;
        case 3: nc = col - 1; opposite = 1; break;
      }

      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;
      const nextKey = `${nr}-${nc}`;
      if (visited.has(nextKey)) continue;

      stack.push({ row: nr, col: nc, fromDir: opposite });
    }
  }

  return visited;
};

// 检查关卡是否完成：从源头追踪是否能到达终点
export const checkPlumberWin = (
  grid: PlumberCell[][],
  sourcePos: { row: number; col: number },
  targetPos: { row: number; col: number },
): boolean => {
  const visited = traceFromSource(grid, sourcePos.row, sourcePos.col);
  return visited.has(`${targetPos.row}-${targetPos.col}`);
};

// 关卡设计 - 起点在左侧，终点在右侧
const createLevel = (
  layout: Array<Array<{ type: PipeType; rot?: number }>>,
  source: { row: number; col: number },
  target: { row: number; col: number },
): PlumberLevel => {
  const grid: PlumberCell[][] = layout.map(row =>
    row.map(item => ({
      type: item.type,
      rotation: item.rot ?? 0,
    }))
  );
  grid[source.row][source.col].isSource = true;
  grid[target.row][target.col].isTarget = true;
  // 起点和终点的旋转固定
  grid[source.row][source.col].rotation = 0; // 朝右
  grid[target.row][target.col].rotation = 0; // 朝右（实际朝左）
  return { grid, sourcePos: source, targetPos: target };
};

export const PLUMBER_LEVELS: PlumberLevel[] = [
  createLevel(
    [
      [
        { type: 'end', rot: 1 }, // 起点，朝右
        { type: 'corner', rot: 0 }, // 右上弯
        { type: 'straight', rot: 1 },
        { type: 'corner', rot: 3 }, // 左下弯
        { type: 'end', rot: 3 }, // 终点，朝左
        { type: 'empty' },
      ],
      [
        { type: 'empty' },
        { type: 'corner', rot: 1 }, // 右下弯
        { type: 'straight', rot: 0 },
        { type: 'corner', rot: 2 }, // 左上弯
        { type: 'empty' },
        { type: 'empty' },
      ],
      [
        { type: 'empty' },
        { type: 'end', rot: 2 }, // 朝下
        { type: 'empty' },
        { type: 'end', rot: 2 }, // 朝下
        { type: 'empty' },
        { type: 'empty' },
      ],
    ],
    { row: 0, col: 0 },
    { row: 0, col: 4 },
  ),
  createLevel(
    [
      [
        { type: 'end', rot: 1 },
        { type: 'corner', rot: 0 },
        { type: 'straight', rot: 1 },
        { type: 'empty' },
        { type: 'empty' },
        { type: 'end', rot: 3 },
      ],
      [
        { type: 'empty' },
        { type: 'corner', rot: 1 },
        { type: 'corner', rot: 3 },
        { type: 'straight', rot: 1 },
        { type: 'corner', rot: 2 },
        { type: 'empty' },
      ],
      [
        { type: 'empty' },
        { type: 'empty' },
        { type: 'empty' },
        { type: 'corner', rot: 0 },
        { type: 'corner', rot: 1 },
        { type: 'empty' },
      ],
      [
        { type: 'empty' },
        { type: 'end', rot: 0 },
        { type: 'corner', rot: 1 },
        { type: 'corner', rot: 2 },
        { type: 'end', rot: 2 },
        { type: 'empty' },
      ],
    ],
    { row: 0, col: 0 },
    { row: 0, col: 5 },
  ),
  createLevel(
    [
      [
        { type: 'end', rot: 1 },
        { type: 'corner', rot: 0 },
        { type: 'straight', rot: 1 },
        { type: 'corner', rot: 2 },
        { type: 'straight', rot: 1 },
        { type: 'empty' },
      ],
      [
        { type: 'empty' },
        { type: 'corner', rot: 1 },
        { type: 't_junction', rot: 0 },
        { type: 'corner', rot: 1 },
        { type: 'corner', rot: 2 },
        { type: 'end', rot: 3 },
      ],
      [
        { type: 'empty' },
        { type: 'end', rot: 0 },
        { type: 'corner', rot: 3 },
        { type: 'empty' },
        { type: 'corner', rot: 0 },
        { type: 'corner', rot: 1 },
      ],
      [
        { type: 'empty' },
        { type: 'empty' },
        { type: 'empty' },
        { type: 'empty' },
        { type: 'empty' },
        { type: 'corner', rot: 2 },
      ],
    ],
    { row: 0, col: 0 },
    { row: 1, col: 5 },
  ),
];