import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { SingleModePage } from './components/SingleModePage';
import { VersusModePage } from './components/VersusModePage';
import { BoardGamesPage } from './components/BoardGamesPage';
import { ModeSelectDialog } from './components/ModeSelectDialog';
import { SnakeGame } from './components/SnakeGame';
import { TetrisGame } from './components/TetrisGame';
import { PlaneGame } from './components/PlaneGame';
import { MinesweeperGame } from './components/MinesweeperGame';
import { TankGame } from './components/TankGame';
import { MemoryGame } from './components/MemoryGame';
import { HopGame } from './components/HopGame';
import { GomokuGame } from './components/GomokuGame';
import { OthelloGame } from './components/OthelloGame';
import { TicTacToeGame } from './components/TicTacToeGame';
import { ConnectFourGame } from './components/ConnectFourGame';
import { XiangqiGame } from './components/XiangqiGame';
import { ChessGame } from './components/ChessGame';
import { VersusSnakeGame } from './components/VersusSnakeGame';
import { VersusPlaneGame } from './components/VersusPlaneGame';
import { PongGame } from './components/PongGame';
import { Page, OthelloMode } from './types/game';
import { useRouter, getBackPage } from './utils/router';

interface DialogState {
  show: boolean;
  page: Page;
  title: string;
  emoji: string;
}

function App() {
  const { currentPage, navigate, back } = useRouter();
  const [dialogState, setDialogState] = useState<DialogState>({
    show: false,
    page: 'home',
    title: '',
    emoji: '',
  });

  const handleSelectMode = (page: Page) => {
    navigate(page);
  };

  const handleSelectGame = (page: Page) => {
    // 棋类游戏：弹出模式选择对话框
    const boardGameInfo: Record<string, { title: string; emoji: string }> = {
      gomoku: { title: '五子棋', emoji: '⚫' },
      othello: { title: '黑白棋', emoji: '⚪' },
      tictactoe: { title: '三连棋', emoji: '❌' },
      connectfour: { title: '四子棋', emoji: '🔴' },
      xiangqi: { title: '中国象棋', emoji: '🐘' },
      chess: { title: '国际象棋', emoji: '♟️' },
    };

    const info = boardGameInfo[page];
    if (info) {
      setDialogState({
        show: true,
        page,
        title: info.title,
        emoji: info.emoji,
      });
    } else {
      navigate(page);
    }
  };

  const handleSelectBoardGameMode = (mode: OthelloMode) => {
    // 将模式保存到 sessionStorage，让游戏组件读取
    sessionStorage.setItem(`game_mode_${dialogState.page}`, mode);
    const targetPage = dialogState.page;
    setDialogState({ ...dialogState, show: false });
    navigate(targetPage);
  };

  const handleBack = () => {
    const backPage = getBackPage(currentPage);
    if (window.history.length > 1 && backPage !== 'home') {
      back();
    } else {
      navigate(backPage);
    }
  };

  return (
    <>
      {currentPage === 'home' && <HomePage onSelectMode={handleSelectMode} />}
      {currentPage === 'single-mode' && (
        <SingleModePage onSelectGame={handleSelectGame} onBack={handleBack} />
      )}
      {currentPage === 'versus-mode' && (
        <VersusModePage onSelectGame={handleSelectGame} onBack={handleBack} />
      )}
      {currentPage === 'board-games' && (
        <BoardGamesPage onSelectGame={handleSelectGame} onBack={handleBack} />
      )}
      {currentPage === 'snake' && <SnakeGame onBack={handleBack} />}
      {currentPage === 'tetris' && <TetrisGame onBack={handleBack} />}
      {currentPage === 'plane' && <PlaneGame onBack={handleBack} />}
      {currentPage === 'minesweeper' && <MinesweeperGame onBack={handleBack} />}
      {currentPage === 'tank' && <TankGame onBack={handleBack} />}
      {currentPage === 'memory' && <MemoryGame onBack={handleBack} />}
      {currentPage === 'hop' && <HopGame onBack={handleBack} />}
      {currentPage === 'gomoku' && <GomokuGame onBack={handleBack} />}
      {currentPage === 'othello' && <OthelloGame onBack={handleBack} />}
      {currentPage === 'tictactoe' && <TicTacToeGame onBack={handleBack} />}
      {currentPage === 'connectfour' && <ConnectFourGame onBack={handleBack} />}
      {currentPage === 'xiangqi' && <XiangqiGame onBack={handleBack} />}
      {currentPage === 'chess' && <ChessGame onBack={handleBack} />}

      {currentPage === 'snake-versus' && <VersusSnakeGame onBack={handleBack} />}
      {currentPage === 'plane-versus' && <VersusPlaneGame onBack={handleBack} />}
      {currentPage === 'pong' && <PongGame onBack={handleBack} />}

      {dialogState.show && (
        <ModeSelectDialog
          gameTitle={dialogState.title}
          emoji={dialogState.emoji}
          onSelectMode={handleSelectBoardGameMode}
          onCancel={() => setDialogState({ ...dialogState, show: false })}
        />
      )}
    </>
  );
}

export default App;