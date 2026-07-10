import { useState, useEffect, useCallback } from 'react';
import { Page } from '../types/game';

// 页面到 URL 路径的映射
export const pageToPath: Record<Page, string> = {
  'home': '/',
  'single-mode': '/single',
  'versus-mode': '/versus',
  'board-games': '/board',
  'snake': '/game/snake',
  'tetris': '/game/tetris',
  'plane': '/game/plane',
  'minesweeper': '/game/minesweeper',
  'tank': '/game/tank',
  'memory': '/game/memory',
  'hop': '/game/hop',
  'gomoku': '/game/gomoku',
  'othello': '/game/othello',
  'tictactoe': '/game/tictactoe',
  'connectfour': '/game/connectfour',
  'xiangqi': '/game/xiangqi',
  'chess': '/game/chess',
  'snake-versus': '/game/snake-versus',
  'plane-versus': '/game/plane-versus',
  'pong': '/game/pong',
};

// URL 路径到页面的映射
export const pathToPage: Record<string, Page> = Object.entries(pageToPath).reduce((acc, [page, path]) => {
  acc[path] = page as Page;
  return acc;
}, {} as Record<string, Page>);

// 根据当前URL获取初始页面
export const getInitialPage = (): Page => {
  const path = window.location.pathname;
  return pathToPage[path] || 'home';
};

// 自定义Hook：使用URL路径作为路由
export const useRouter = () => {
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());

  // 监听浏览器前进/后退
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 导航到新页面
  const navigate = useCallback((page: Page) => {
    const path = pageToPath[page];
    if (path) {
      window.history.pushState({}, '', path);
      setCurrentPage(page);
    }
  }, []);

  // 返回上一页
  const back = useCallback(() => {
    window.history.back();
  }, []);

  return { currentPage, navigate, back };
};

// 判断是否是游戏页面（用于返回时跳到正确的上一级）
export const getBackPage = (currentPage: Page): Page => {
  const singleGames = ['snake', 'tetris', 'plane', 'minesweeper', 'tank', 'memory', 'hop'];
  const versusGames = ['snake-versus', 'plane-versus', 'pong'];
  const boardGames = ['gomoku', 'othello', 'tictactoe', 'connectfour', 'xiangqi', 'chess'];

  if (singleGames.includes(currentPage)) return 'single-mode';
  if (versusGames.includes(currentPage)) return 'versus-mode';
  if (boardGames.includes(currentPage)) return 'board-games';
  return 'home';
};
