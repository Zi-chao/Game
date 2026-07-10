// A* 路径搜索

export interface Point {
  row: number;
  col: number;
}

interface Node {
  point: Point;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

const heuristic = (a: Point, b: Point): number => {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
};

const key = (p: Point): string => `${p.row},${p.col}`;

export const astar = (
  start: Point,
  goal: Point,
  isWalkable: (row: number, col: number) => boolean,
): Point[] | null => {
  const openSet: Node[] = [];
  const closedSet = new Set<string>();
  const openMap = new Map<string, Node>();

  const startNode: Node = {
    point: start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };

  openSet.push(startNode);
  openMap.set(key(start), startNode);

  const directions = [
    { dr: -1, dc: 0 }, // 上
    { dr: 1, dc: 0 },  // 下
    { dr: 0, dc: -1 }, // 左
    { dr: 0, dc: 1 },  // 右
  ];

  while (openSet.length > 0) {
    // 找 f 最小的节点
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = openSet[lowestIdx];
    openSet.splice(lowestIdx, 1);
    openMap.delete(key(current.point));
    closedSet.add(key(current.point));

    // 找到目标
    if (current.point.row === goal.row && current.point.col === goal.col) {
      const path: Point[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift(node.point);
        node = node.parent;
      }
      return path;
    }

    for (const dir of directions) {
      const newPoint: Point = {
        row: current.point.row + dir.dr,
        col: current.point.col + dir.dc,
      };
      const k = key(newPoint);
      if (closedSet.has(k)) continue;
      if (!isWalkable(newPoint.row, newPoint.col)) continue;

      const tentativeG = current.g + 1;
      const existing = openMap.get(k);
      if (existing && tentativeG >= existing.g) continue;

      const newNode: Node = {
        point: newPoint,
        g: tentativeG,
        h: heuristic(newPoint, goal),
        f: tentativeG + heuristic(newPoint, goal),
        parent: current,
      };
      openSet.push(newNode);
      openMap.set(k, newNode);
    }
  }

  return null;
};