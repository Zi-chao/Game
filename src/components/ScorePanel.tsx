interface ScorePanelProps {
  score: number;
  highScore: number;
}

export const ScorePanel = ({ score, highScore }: ScorePanelProps) => {
  return (
    <div className="flex justify-between items-center w-full max-w-[500px] mb-4">
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">当前分数</div>
        <div className="text-3xl font-bold text-emerald-400 font-mono">{score}</div>
      </div>
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">最高分</div>
        <div className="text-3xl font-bold text-yellow-400 font-mono">{highScore}</div>
      </div>
    </div>
  );
};