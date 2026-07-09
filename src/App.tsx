import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { SingleModePage } from './components/SingleModePage';
import { VersusModePage } from './components/VersusModePage';
import { SnakeGame } from './components/SnakeGame';
import { TetrisGame } from './components/TetrisGame';
import { PlaneGame } from './components/PlaneGame';
import { MinesweeperGame } from './components/MinesweeperGame';
import { TankGame } from './components/TankGame';
import { MemoryGame } from './components/MemoryGame';
import { HopGame } from './components/HopGame';
import { GomokuGame } from './components/GomokuGame';
import { PlumberGame } from './components/PlumberGame';
import { VersusSnakeGame } from './components/VersusSnakeGame';
import { VersusPlaneGame } from './components/VersusPlaneGame';
import { PongGame } from './components/PongGame';
import { Page } from './types/game';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleSelectMode = (page: Page) => {
    setCurrentPage(page);
  };

  const handleSelectGame = (page: Page) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    const singleGames = ['snake', 'tetris', 'plane', 'minesweeper', 'tank', 'memory', 'hop', 'gomoku', 'plumber'];
    const versusGames = ['snake-versus', 'plane-versus', 'pong'];
    if (singleGames.includes(currentPage)) {
      setCurrentPage('single-mode');
    } else if (versusGames.includes(currentPage)) {
      setCurrentPage('versus-mode');
    } else {
      setCurrentPage('home');
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
      {currentPage === 'snake' && <SnakeGame onBack={handleBack} />}
      {currentPage === 'tetris' && <TetrisGame onBack={handleBack} />}
      {currentPage === 'plane' && <PlaneGame onBack={handleBack} />}
      {currentPage === 'minesweeper' && <MinesweeperGame onBack={handleBack} />}
      {currentPage === 'tank' && <TankGame onBack={handleBack} />}
      {currentPage === 'memory' && <MemoryGame onBack={handleBack} />}
      {currentPage === 'hop' && <HopGame onBack={handleBack} />}
      {currentPage === 'gomoku' && <GomokuGame onBack={handleBack} />}
      {currentPage === 'plumber' && <PlumberGame onBack={handleBack} />}
      {currentPage === 'snake-versus' && <VersusSnakeGame onBack={handleBack} />}
      {currentPage === 'plane-versus' && <VersusPlaneGame onBack={handleBack} />}
      {currentPage === 'pong' && <PongGame onBack={handleBack} />}
    </>
  );
}

export default App;