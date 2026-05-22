import { useState } from 'react'
import SignalBadge from './SignalBadge'

const SOURCE_META = {
  producthunt: { label: 'Product Hunt', icon: '🔶', linkLabel: 'View on PH' },
  github:      { label: 'GitHub',        icon: '🐙', linkLabel: 'View repo' },
  yc:          { label: 'YC',            icon: '🏆', linkLabel: 'YC profile' },
}

function ScoreRing({ score }) {
  const color =
    score >= 8 ? '#34d399' :
    score >= 6 ? '#fbbf24' :
    '#64748b'
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
      <span className="text-[10px] text-slate-600 font-medium">/ 10</span>
    </div>
  )
}

function ExternalIcon() {
  return (
    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function DealCard({ deal }) {
  const [expanded, setExpanded] = useState(false)
  const { launch, enrichment, scoring, lowInfo, source } = deal
  const meta = SOURCE_META[source] || SOURCE_META.producthunt
  const signals = [...(enrichment.notableSignals || []), ...(lowInfo ? ['Low Info'] : [])]

  const topBorder =
    scoring.score >= 8 ? 'border-t-emerald-500/60' :
    scoring.score >= 6 ? 'border-t-amber-500/40' :
    'border-t-slate-800/60'

  return (
    <div className={`bg-[#111118] border border-slate-800/60 border-t-2 ${topBorder} rounded-xl overflow-hidden transition-all hover:border-slate-700/60`}>

      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Logo */}
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            {launch.thumbnail
              ? <img src={launch.thumbnail} alt={launch.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
              : <span className="text-lg font-bold text-slate-500">{(enrichment.companyName || launch.name).charAt(0)}</span>
            }
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title + score */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-white leading-tight">
                    {enrichment.companyName}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-medium">
                    {meta.icon} {source === 'yc' && launch.batch ? launch.batch : meta.label}
                  </span>
                  {scoring.passToPartners && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      ★ Pass to partners
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5 leading-snug line-clamp-2">{enrichment.tagline}</p>
              </div>
              <ScoreRing score={scoring.score} />
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <Pill>{enrichment.vertical}</Pill>
              <Pill>{enrichment.stage}</Pill>
              {enrichment.location && <Pill>📍 {enrichment.location}</Pill>}
              {launch.votes > 0 && <Pill>▲ {launch.votes}</Pill>}
            </div>

            {/* Founders */}
            <div className="mt-2.5 flex items-baseline gap-1.5 text-sm">
              <span className="text-[11px] text-slate-500 flex-shrink-0">Founders</span>
              <span className="text-slate-300 text-[13px]">
                {enrichment.founderNames?.filter(n => n && n !== 'Unknown').join(', ') || <span className="text-slate-600 italic text-xs">Researching…</span>}
              </span>
            </div>

            {/* Signals */}
            {signals.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {signals.map(s => <SignalBadge key={s} signal={s} />)}
              </div>
            )}

            {/* Score reason */}
            <p className="mt-2.5 text-[12px] text-slate-500 italic leading-relaxed">
              "{scoring.scoreReason}"
            </p>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-800/50">
          <div className="flex items-center gap-4">
            {launch.url && (
              <a href={launch.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                {meta.linkLabel} <ExternalIcon />
              </a>
            )}
            {launch.website && (
              <a href={launch.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                Website <ExternalIcon />
              </a>
            )}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? 'Collapse' : 'Full profile'}
            <ChevronIcon open={expanded} />
          </button>
        </div>
      </div>

      {/* Expanded profile */}
      {expanded && (
        <div className="border-t border-slate-800/50 bg-[#0d0d13] px-5 py-4 space-y-5">

          {/* Analyst notes */}
          <Section title="Analyst Notes">
            <p className="text-sm text-slate-300 leading-relaxed">{enrichment.enrichmentNotes}</p>
          </Section>

          {/* Traction */}
          {enrichment.tractionSignals && (
            <Section title="Traction Signals">
              <p className="text-sm text-slate-300 leading-relaxed">{enrichment.tractionSignals}</p>
            </Section>
          )}

          {/* Founder research */}
          {deal.research?.founders?.length > 0 && (
            <Section title="Founder Research">
              <div className="space-y-2">
                {deal.research.founders.map((f, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">{f.name}</span>
                      <ConfidencePill level={f.confidence} />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.background}</p>
                    {f.education && <p className="text-xs text-slate-500 mt-1">🎓 {f.education}</p>}
                    {f.priorStartups?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">🚀 Prior: {f.priorStartups.join(', ')}</p>
                    )}
                    {f.location && <p className="text-xs text-slate-500 mt-1">📍 {f.location}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Research notes */}
          {deal.research?.researchNotes && (
            <Section title="Research Notes">
              <p className="text-xs text-slate-400 leading-relaxed">{deal.research.researchNotes}</p>
            </Section>
          )}

          {/* Red flags */}
          {scoring.redFlags?.length > 0 && (
            <Section title="Red Flags" titleClass="text-red-400">
              <ul className="space-y-1">
                {scoring.redFlags.map((f, i) => (
                  <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span> {f}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Pill({ children }) {
  return (
    <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/30 rounded text-[11px] text-slate-400">
      {children}
    </span>
  )
}

function Section({ title, children, titleClass = 'text-slate-400' }) {
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${titleClass}`}>{title}</p>
      {children}
    </div>
  )
}

function ConfidencePill({ level }) {
  const styles = {
    high: 'bg-emerald-900/50 text-emerald-400',
    medium: 'bg-amber-900/50 text-amber-400',
    low: 'bg-slate-800 text-slate-500',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles[level] || styles.low}`}>
      {level} confidence
    </span>
  )
}
