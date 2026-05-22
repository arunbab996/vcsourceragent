export default function StatsBar({ deals, isRunning }) {
  if (deals.length === 0) return null

  const avg = (deals.reduce((s, d) => s + d.scoring.score, 0) / deals.length).toFixed(1)
  const highConviction = deals.filter(d => d.scoring.score >= 8).length
  const passToPartners = deals.filter(d => d.scoring.passToPartners).length
  const bySource = deals.reduce((acc, d) => {
    acc[d.source] = (acc[d.source] || 0) + 1
    return acc
  }, {})

  const SOURCE_ICONS = { producthunt: '🔶', github: '🐙', yc: '🏆' }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard label="Total Deals" value={deals.length} sub={isRunning ? 'processing…' : Object.entries(bySource).map(([s, n]) => `${SOURCE_ICONS[s] || s} ${n}`).join('  ')} />
      <StatCard label="Avg Score" value={avg} sub="out of 10" accent />
      <StatCard label="High Conviction" value={highConviction} sub="scored 8+" color="text-emerald-400" />
      <StatCard label="Pass to Partners" value={passToPartners} sub="recommended" color="text-violet-400" />
    </div>
  )
}

function StatCard({ label, value, sub, color, accent }) {
  return (
    <div className="bg-[#111118] border border-slate-800/60 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${color || (accent ? 'text-white' : 'text-white')}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-600 mt-0.5 truncate">{sub}</p>}
    </div>
  )
}
