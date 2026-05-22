export default function ScoreBadge({ score }) {
  const color =
    score >= 8
      ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/30'
      : score >= 6
      ? 'text-amber-400 bg-amber-400/10 ring-amber-400/30'
      : 'text-slate-400 bg-slate-400/10 ring-slate-400/30'

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 ${color} text-sm font-bold`}>
      <span className="text-xs font-medium opacity-70">Score</span>
      <span>{score}/10</span>
    </div>
  )
}
