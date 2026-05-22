import { useState } from 'react'
import { ProductHuntLogo, GitHubLogo, YCLogo, ShowHNLogo } from './Logos'
import VerticalBadge from './VerticalBadge'

const SOURCE_LOGO = { producthunt: ProductHuntLogo, github: GitHubLogo, yc: YCLogo, showhn: ShowHNLogo }
const SOURCE_LINK = { producthunt: 'Product Hunt', github: 'GitHub', yc: 'HN Launch', showhn: 'Show HN' }

function scoreColor(n) {
  if (n >= 8) return '#22C55E'
  if (n >= 6) return '#EAB308'
  return '#4B5563'
}

function Signal({ label }) {
  return (
    <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] text-[#6B6B6B] bg-[#1C1C1C] border border-white/[0.06] whitespace-nowrap">
      {label}
    </span>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

export default function DealCard({ deal }) {
  const [open, setOpen] = useState(false)
  const { launch, enrichment, scoring, source, research } = deal
  const Logo    = SOURCE_LOGO[source] || ProductHuntLogo
  const founders = (enrichment.founderNames || []).filter(n => n && n !== 'Unknown')
  const signals  = enrichment.notableSignals || []

  return (
    <div className="border-b border-white/[0.05] last:border-0">
      {/* Row */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.025] transition-colors group"
        onClick={() => setOpen(o => !o)}
      >
        {/* Score */}
        <div className="w-6 flex-shrink-0 pt-[3px] text-right">
          <span className="text-[13px] font-semibold tabular-nums leading-none" style={{ color: scoreColor(scoring.score) }}>
            {scoring.score}
          </span>
        </div>

        {/* Logo */}
        <div className="w-8 h-8 flex-shrink-0 rounded-md bg-[#1C1C1C] border border-white/[0.07] overflow-hidden flex items-center justify-center mt-0.5">
          {launch.thumbnail
            ? <img src={launch.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
            : <span className="text-[12px] font-semibold text-[#555]">{(enrichment.companyName || launch.name).charAt(0).toUpperCase()}</span>
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-white leading-none">{enrichment.companyName}</span>
            <VerticalBadge vertical={enrichment.vertical} />
            {enrichment.stage && enrichment.stage !== 'Unknown' && (
              <span className="text-[10px] text-[#555] bg-[#1A1A1A] border border-white/[0.05] px-1.5 py-px rounded">
                {enrichment.stage}
              </span>
            )}
            {scoring.passToPartners && (
              <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-px rounded border border-blue-500/20">
                ↑ Partners
              </span>
            )}
          </div>

          {/* Tagline */}
          <p className="text-[12px] text-[#8C8C8C] mt-1 line-clamp-1 leading-snug">{enrichment.tagline}</p>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
            {founders.length > 0 && (
              <span className="text-[11px] text-[#7A7A7A]">{founders.join(', ')}</span>
            )}
            {founders.length > 0 && enrichment.location && <span className="text-[#2E2E2E]">·</span>}
            {enrichment.location && (
              <span className="text-[11px] text-[#5A5A5A]">{enrichment.location}</span>
            )}
            {signals.map(s => <Signal key={s} label={s} />)}
          </div>
        </div>

        {/* Right meta */}
        <div className="flex-shrink-0 flex items-center gap-2 pt-0.5">
          <span className="text-[#555] group-hover:text-[#777] transition-colors">
            <Logo size={14} />
          </span>
          {launch.votes > 0 && (
            <span className="text-[11px] text-[#4A4A4A] tabular-nums">{launch.votes}</span>
          )}
          <span className="text-[#333] group-hover:text-[#555] transition-colors">
            <ChevronIcon open={open} />
          </span>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="bg-[#0D0D0D] border-t border-white/[0.04] px-4 py-4 ml-[2.75rem] space-y-4">

          {/* Links */}
          <div className="flex gap-4">
            {launch.url && (
              <a href={launch.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#6B6B6B] hover:text-[#E2E2E2] transition-colors">
                {SOURCE_LINK[source] || 'View'} <LinkIcon />
              </a>
            )}
            {launch.website && (
              <a href={launch.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#6B6B6B] hover:text-[#E2E2E2] transition-colors">
                Website <LinkIcon />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrichment.enrichmentNotes && (
              <Detail title="Notes">
                <p className="text-[12px] text-[#8A8A8A] leading-relaxed">{enrichment.enrichmentNotes}</p>
              </Detail>
            )}
            <Detail title="Score reasoning">
              <p className="text-[12px] text-[#8A8A8A] leading-relaxed">{scoring.scoreReason}</p>
              {scoring.redFlags?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {scoring.redFlags.map((f, i) => (
                    <li key={i} className="text-[11px] text-[#7A4040] flex items-start gap-1.5">
                      <span className="flex-shrink-0">↳</span>{f}
                    </li>
                  ))}
                </ul>
              )}
            </Detail>
          </div>

          {enrichment.tractionSignals && (
            <Detail title="Traction">
              <p className="text-[12px] text-[#8A8A8A] leading-relaxed">{enrichment.tractionSignals}</p>
            </Detail>
          )}

          {research?.founders?.filter(f => f.background && f.background !== 'No background information found').length > 0 && (
            <Detail title="Founders">
              <div className="space-y-3">
                {research.founders.map((f, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-medium text-[#D4D4D4]">{f.name}</span>
                      <span className={`text-[10px] ${f.confidence === 'high' ? 'text-emerald-700' : f.confidence === 'medium' ? 'text-amber-800' : 'text-[#3A3A3A]'}`}>
                        {f.confidence}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#666] leading-relaxed">{f.background}</p>
                    {f.priorStartups?.length > 0 && (
                      <p className="text-[11px] text-[#4A4A4A] mt-0.5">Prior: {f.priorStartups.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </Detail>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#484848] uppercase tracking-widest mb-1.5">{title}</p>
      {children}
    </div>
  )
}
