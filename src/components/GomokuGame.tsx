import { useGomoku } from '../hooks/useGomoku';
import { BOARD_SIZE, CELL_SIZE } from '../utils/gomokuUtils';

interface GomokuGameProps {
  onBack: () => void;
}

export const GomokuGame = ({ onBack }: GomokuGameProps) => {
  const { state, best, reset, placeStone } = useGomoku();
  const boardWidth = (BOARD_SIZE - 1) * CELL_SIZE;
  const padding = CELL_SIZE / 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105 z-20"
      >
        ← 返回首页
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-4 mt-8">
        ⚫⚪ 五子棋
      </h1>

      {/* 信息栏 */}
      <div className="flex gap-3 mb-3">
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">当前</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {state.currentPlayer === 1 ? (
              <>
                <div className="w-4 h-4 rounded-full bg-black border-2 border-white"></div>
                <span className="text-white">玩家</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-white"></div>
                <span className="text-amber-400">电脑</span>
              </>
            )}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">步数</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{state.moves}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
          <div className="text-slate-400 text-xs">战绩</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {best.wins}胜 {best.losses}负
          </div>
        </div>
      </div>

      {/* 棋盘 */}
      <div
        className="relative bg-amber-700 rounded-lg shadow-2xl border-4 border-amber-900"
        style={{ padding, width: boardWidth + padding * 2, height: boardWidth + padding * 2 }}
      >
        <div
          className="relative"
          style={{ width: boardWidth, height: boardWidth }}
        >
          {/* 网格线 */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={boardWidth}
            height={boardWidth}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <g key={i}>
                <line
                  x1={0}
                  y1={i * CELL_SIZE}
                  x2={boardWidth}
                  y2={i * CELL_SIZE}
                  stroke="#3b1f00"
                  strokeWidth="1"
                />
                <line
                  x1={i * CELL_SIZE}
                  y1={0}
                  x2={i * CELL_SIZE}
                  y2={boardWidth}
                  stroke="#3b1f00"
                  strokeWidth="1"
                />
              </g>
            ))}
            {/* 星位 */}
            {[
              [3, 3], [3, 11], [11, 3], [11, 11], [7, 7],
            ].map(([r, c], i) => (
              <circle
                key={i}
                cx={c * CELL_SIZE}
                cy={r * CELL_SIZE}
                r="3"
                fill="#3b1f00"
              />
            ))}
          </svg>

          {/* 落子点 */}
          {state.board.map((row, r) =>
            row.map((cell, c) => {
              if (cell === 0) return null;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`absolute rounded-full shadow-lg ${
                    cell === 1
                      ? 'bg-gradient-to-br from-gray-700 to-black border border-gray-500'
                      : 'bg-gradient-to-br from-white to-gray-300 border border-gray-200'
                  }`}
                  style={{
                    left: c * CELL_SIZE - CELL_SIZE / 2 + 1,
                    top: r * CELL_SIZE - CELL_SIZE / 2 + 1,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2,
                  }}
                />
              );
            })
          )}

          {/* 可点击区域 */}
          {state.status === 'playing' && state.currentPlayer === 1 && (
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)` }}>
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
                const r = Math.floor(idx / BOARD_SIZE);
                const c = idx % BOARD_SIZE;
                if (state.board[r][c] !== 0) return <div key={idx}></div>;
                return (
                  <button
                    key={idx}
                    onClick={() => placeStone(r, c)}
                    className="hover:bg-amber-500/30 transition-all"
                  ></button>
                );
              })}
            </div>
          )}
        </div>

        {state.status === 'won' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            {state.winner === 1 ? (
              <>
                <div className="text-4xl mb-2 animate-bounce">🏆</div>
                <div className="text-4xl font-bold text-amber-400 mb-2 animate-pulse">你赢了！</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">💔</div>
                <div className="text-4xl font-bold text-red-400 mb-2">电脑获胜</div>
              </>
            )}
            <div className="text-xl text-white mb-1">用了 {state.moves} 步</div>
            <button
              onClick={reset}
              className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
        {state.status === 'draw' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-yellow-400 mb-4">🤝 平局！</div>
            <button
              onClick={reset}
              className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          重新开始
        </button>
      </div>

      <div className="mt-4 text-slate-400 text-xs text-center">
        <p>点击棋盘空位落子（黑棋=玩家，白棋=电脑）</p>
        <p>五子连成一线即获胜</p>
      </div>
    </div>
  );
};