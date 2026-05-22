import { useState } from 'react'
import { ProductHuntLogo, GitHubLogo, YCLogo } from './Logos'

const SOURCE_LOGO = { producthunt: ProductHuntLogo, github: GitHubLogo, yc: YCLogo }
const SOURCE_LINK = { producthunt: 'Product Hunt', github: 'GitHub', yc: 'HN' }

function scoreColor(n) {
  if (n >= 8) return '#22C55E'
  if (n >= 6) return '#EAB308'
  return '#404040'
}

function Signal({ label }) {
  return (
    <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] text-[#555] bg-[#1C1C1C] border border-white/[0.05]">
      {label}
    </span>
  )
}

function ExpandIcon({ open }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

export default function DealCard({ deal }) {
  const [open, setOpen] = useState(false)
  const { launch, enrichment, scoring, source, research } = deal
  const Logo = SOURCE_LOGO[source] || ProductHuntLogo
  const founders = (enrichment.founderNames || []).filter(n => n && n !== 'Unknown')
  const signals  = enrichment.notableSignals || []

  return (
    <div className="border-b border-white/[0.05] last:border-0">
      {/* Row */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {/* Score */}
        <div className="w-6 flex-shrink-0 pt-0.5 text-right">
          <span className="text-[14px] font-semibold tabular" style={{ color: scoreColor(scoring.score) }}>
            {scoring.score}
          </span>
        </div>

        {/* Logo */}
        <div className="w-8 h-8 flex-shrink-0 rounded bg-[#1C1C1C] border border-white/[0.06] overflow-hidden flex items-center justify-center mt-0.5">
          {launch.thumbnail
            ? <img src={launch.thumbnail} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
            : <span className="text-[13px] font-medium text-[#404040]">{(enrichment.companyName || launch.name).charAt(0)}</span>
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-[#E2E2E2]">{enrichment.companyName}</span>
            {scoring.passToPartners && (
              <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-px rounded border border-violet-500/20">
                Pass to partners
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#555] mt-0.5 line-clamp-1 leading-snug">{enrichment.tagline}</p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
            {founders.length > 0 && (
              <span className="text-[11px] text-[#737373]">{founders.join(', ')}</span>
            )}
            {founders.length > 0 && (enrichment.vertical || enrichment.stage) && (
              <span className="text-[#2A2A2A]">·</span>
            )}
            {enrichment.vertical && <span className="text-[11px] text-[#555]">{enrichment.vertical}</span>}
            {enrichment.stage && enrichment.stage !== 'Unknown' && (
              <>
                <span className="text-[#2A2A2A]">·</span>
                <span className="text-[11px] text-[#555]">{enrichment.stage}</span>
              </>
            )}
            {enrichment.location && (
              <>
                <span className="text-[#2A2A2A]">·</span>
                <span className="text-[11px] text-[#555]">{enrichment.location}</span>
              </>
            )}
            {signals.map(s => <Signal key={s} label={s} />)}
          </div>
        </div>

        {/* Right: source logo + votes + expand */}
        <div className="flex-shrink-0 flex items-center gap-2.5 pt-0.5">
          <span className="text-[#404040]"><Logo size={14} /></span>
          {launch.votes > 0 && (
            <span className="text-[11px] text-[#404040] tabular">{launch.votes}</span>
          )}
          <span className="text-[#333]"><ExpandIcon open={open} /></span>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="bg-[#111] border-t border-white/[0.04] px-4 py-4 ml-9 space-y-4">

          {/* Quick links */}
          <div className="flex gap-4">
            {launch.url && (
              <a href={launch.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#E2E2E2] transition-colors">
                {SOURCE_LINK[source]} <ExternalIcon />
              </a>
            )}
            {launch.website && (
              <a href={launch.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#E2E2E2] transition-colors">
                Website <ExternalIcon />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Analyst notes */}
            {enrichment.enrichmentNotes && (
              <Section title="Notes">
                <p className="text-[12px] text-[#737373] leading-relaxed">{enrichment.enrichmentNotes}</p>
              </Section>
            )}

            {/* Score reasoning */}
            <Section title="Score reasoning">
              <p className="text-[12px] text-[#737373] leading-relaxed">{scoring.scoreReason}</p>
              {scoring.redFlags?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {scoring.redFlags.map((f, i) => (
                    <li key={i} className="text-[11px] text-red-500/70 flex items-start gap-1">
                      <span className="flex-shrink-0 mt-0.5">↳</span> {f}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* Traction */}
          {enrichment.tractionSignals && (
            <Section title="Traction">
              <p className="text-[12px] text-[#737373] leading-relaxed">{enrichment.tractionSignals}</p>
            </Section>
          )}

          {/* Founder research */}
          {research?.founders?.filter(f => f.background && f.background !== 'No background information found').length > 0 && (
            <Section title="Founders">
              <div className="space-y-2">
                {research.founders.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[#E2E2E2]">{f.name}</span>
                        <span className={`text-[10px] ${f.confidence === 'high' ? 'text-emerald-600' : f.confidence === 'medium' ? 'text-amber-700' : 'text-[#333]'}`}>
                          {f.confidence}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#555] leading-relaxed mt-0.5">{f.background}</p>
                      {f.priorStartups?.length > 0 && (
                        <p className="text-[11px] text-[#444] mt-0.5">Prior: {f.priorStartups.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#404040] uppercase tracking-widest mb-1.5">{title}</p>
      {children}
    </div>
  )
}
