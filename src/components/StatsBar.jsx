const SOURCE_ABBR = {
  producthunt: 'PH',
  github:      'GH',
  yc:          'YC',
  showhn:      'HN',
  edgar:       'SEC',
}

export default function StatsBar({ deals, isRunning }) {
  if (!deals.length) return null

  const avg           = (deals.reduce((s, d) => s + d.scoring.score, 0) / deals.length).toFixed(1)
  const highConviction = deals.filter(d => d.scoring.score >= 8).length
  const partners       = deals.filter(d => d.scoring.passToPartners).length
  const bySource       = deals.reduce((a, d) => { a[d.source] = (a[d.source] || 0) + 1; return a }, {})

  return (
    <div className="flex items-center gap-6 px-1 mb-4 border-b border-white/[0.04] pb-3">
      <Stat label="Total"           value={deals.length} sub={isRunning ? 'loading' : null} />
      <Divider />
      <Stat label="Avg score"       value={avg} />
      <Divider />
      <Stat label="Score 8+"        value={highConviction} color="#22C55E" />
      <Divider />
      <Stat label="Pass to partners" value={partners}      color="#60A5FA" />
      <Divider />
      <div className="flex items-center gap-3 ml-auto">
        {Object.entries(bySource).map(([src, n]) => (
          <span key={src} className="text-[11px] text-[#666]">
            <span className="text-[#909090]">{n}</span> {SOURCE_ABBR[src] || src}
          </span>
        ))}
        {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
      </div>
    </div>
  )
}

function Stat({ label, value, color, sub }) {
  return (
    <div>
      <span className="text-[11px] text-[#666] block">{label}</span>
      <span className="text-[15px] font-semibold tabular" style={color ? { color } : { color: '#E8E8E8' }}>
        {value}
        {sub && <span className="text-[10px] text-[#555] ml-1 font-normal">{sub}</span>}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="h-6 w-px bg-white/[0.05]" />
}
