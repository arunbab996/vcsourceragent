import { useState } from 'react'
import ScoreBadge from './ScoreBadge'
import SignalBadge from './SignalBadge'

function ExternalLinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const SOURCE_LABELS = {
  producthunt: { label: 'Product Hunt', icon: '🔶', color: 'text-orange-400' },
  github: { label: 'GitHub', icon: '🐙', color: 'text-slate-300' },
  yc: { label: 'YC', icon: '🏆', color: 'text-amber-400' },
}

export default function DealCard({ deal }) {
  const [expanded, setExpanded] = useState(false)
  const { launch, enrichment, scoring, lowInfo, source } = deal
  const signals = [...(enrichment.notableSignals || []), ...(lowInfo ? ['Low Info'] : [])]
  const sourceInfo = SOURCE_LABELS[source] || SOURCE_LABELS.producthunt

  const scoreBorderColor =
    scoring.score >= 8
      ? 'border-emerald-500/30'
      : scoring.score >= 6
      ? 'border-amber-500/20'
      : 'border-slate-700/50'

  return (
    <div
      className={`bg-[#111118] border rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-600/60 ${scoreBorderColor}`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
            {launch.thumbnail ? (
              <img src={launch.thumbnail} alt={launch.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-500">
                {launch.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white leading-tight">
                  {enrichment.companyName}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5 leading-snug">
                  {enrichment.tagline}
                </p>
              </div>
              <ScoreBadge score={scoring.score} />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-500">
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-medium">
                {enrichment.vertical}
              </span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                {enrichment.stage}
              </span>
              {enrichment.location && (
                <span className="flex items-center gap-1">
                  <span>📍</span> {enrichment.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span>▲</span> {launch.votes} votes
              </span>
            </div>
          </div>
        </div>

        {/* Founders */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-slate-500 text-xs">Founders:</span>
          <span className="text-slate-300">
            {enrichment.founderNames?.join(', ') || 'Unknown'}
          </span>
        </div>

        {/* Signals row */}
        {signals.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {signals.map(s => <SignalBadge key={s} signal={s} />)}
          </div>
        )}

        {/* Score reason */}
        <p className="mt-3 text-xs text-slate-500 italic leading-relaxed">
          "{scoring.scoreReason}"
        </p>

        {/* Action row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-3">
            <a
              href={launch.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs ${sourceInfo.color} hover:opacity-80 transition-opacity`}
            >
              {sourceInfo.icon} {sourceInfo.label} <ExternalLinkIcon />
            </a>
            {launch.website && (
              <a
                href={launch.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Website <ExternalLinkIcon />
              </a>
            )}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? 'Less' : 'Full Profile'}
            <ChevronIcon open={expanded} />
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-slate-800/60 px-5 py-4 space-y-4 bg-[#0d0d14]">
          {/* Analyst notes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Analyst Notes</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{enrichment.enrichmentNotes}</p>
          </div>

          {/* Traction */}
          {enrichment.tractionSignals && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Traction Signals</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{enrichment.tractionSignals}</p>
            </div>
          )}

          {/* Founder profiles */}
          {deal.research?.founders?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Founder Research</h4>
              <div className="space-y-3">
                {deal.research.founders.map((founder, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{founder.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        founder.confidence === 'high' ? 'bg-emerald-900/50 text-emerald-400' :
                        founder.confidence === 'medium' ? 'bg-amber-900/50 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {founder.confidence} confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{founder.background}</p>
                    {founder.education && (
                      <p className="text-xs text-slate-500 mt-1">🎓 {founder.education}</p>
                    )}
                    {founder.priorStartups?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">🚀 Prior: {founder.priorStartups.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red flags */}
          {scoring.redFlags?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">Red Flags</h4>
              <ul className="space-y-1">
                {scoring.redFlags.map((f, i) => (
                  <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                    <span className="mt-0.5 text-red-500">⚠</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pass to partners */}
          {scoring.passToPartners && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Recommended for partner review
            </div>
          )}
        </div>
      )}
    </div>
  )
}
