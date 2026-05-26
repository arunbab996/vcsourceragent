import { ProductHuntLogo, GitHubLogo, YCLogo, ShowHNLogo, HNHiringLogo, EdgarLogo } from './Logos'
import VerticalBadge from './VerticalBadge'

const SOURCE_LOGO = {
  producthunt: ProductHuntLogo,
  github:      GitHubLogo,
  yc:          YCLogo,
  showhn:      ShowHNLogo,
  hnhiring:    HNHiringLogo,
  edgar:       EdgarLogo,
}

function LinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function Signal({ label }) {
  return (
    <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] text-[#888] bg-[#1C1C1C] border border-white/[0.07] whitespace-nowrap">
      {label}
    </span>
  )
}

export default function TableView({ deals }) {
  if (!deals.length) return null

  return (
    <div className="border border-white/[0.05] rounded-md overflow-hidden">
      {/* Header row */}
      <div className="grid items-center gap-3 px-4 py-2 border-b border-white/[0.07] bg-[#0D0D0D]"
        style={{ gridTemplateColumns: '2fr 1fr 90px 1.5fr 1.5fr 60px' }}>
        {['Company', 'Vertical', 'Stage', 'Founders', 'Signals', ''].map((h, i) => (
          <span key={i} className="text-[10px] font-semibold text-[#505050] uppercase tracking-widest">{h}</span>
        ))}
      </div>

      {/* Data rows */}
      {deals.map(deal => {
        const { launch, enrichment, source } = deal
        const Logo     = SOURCE_LOGO[source]
        const founders = (enrichment.founderNames || [])
          .filter(n => n && typeof n === 'string' && n !== 'Unknown' && !/^\[?redacted\]?$/i.test(n.trim()))
        const signals  = enrichment.notableSignals || []

        return (
          <div
            key={`${source}_${deal.id}`}
            className="grid items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group"
            style={{ gridTemplateColumns: '2fr 1fr 90px 1.5fr 1.5fr 60px' }}
          >
            {/* Company */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 flex-shrink-0 rounded bg-[#1C1C1C] border border-white/[0.07] overflow-hidden flex items-center justify-center">
                {launch.thumbnail
                  ? <img src={launch.thumbnail} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  : <span className="text-[11px] font-semibold text-[#666]">
                      {(enrichment.companyName || launch.name).charAt(0).toUpperCase()}
                    </span>
                }
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-white truncate leading-tight">
                  {enrichment.companyName}
                </p>
                {enrichment.location && (
                  <p className="text-[10px] text-[#555] truncate leading-tight mt-px">
                    {enrichment.location}
                  </p>
                )}
              </div>
            </div>

            {/* Vertical */}
            <div className="min-w-0">
              <VerticalBadge vertical={enrichment.vertical} />
            </div>

            {/* Stage */}
            <div>
              {enrichment.stage && enrichment.stage !== 'Unknown'
                ? <span className="text-[10px] text-[#666] bg-[#1A1A1A] border border-white/[0.06] px-1.5 py-px rounded">
                    {enrichment.stage}
                  </span>
                : <span className="text-[#333]">—</span>
              }
            </div>

            {/* Founders */}
            <div className="text-[11px] text-[#909090] truncate min-w-0">
              {founders.length
                ? founders.join(', ')
                : <span className="text-[#333]">—</span>
              }
            </div>

            {/* Signals */}
            <div className="flex flex-wrap gap-1 min-w-0">
              {signals.slice(0, 3).map(s => <Signal key={s} label={s} />)}
              {signals.length > 3 && (
                <span className="text-[10px] text-[#555]">+{signals.length - 3}</span>
              )}
            </div>

            {/* Source + link */}
            <div className="flex items-center justify-end gap-2 flex-shrink-0">
              {launch.votes > 0 && (
                <span className="text-[10px] text-[#555] tabular-nums">{launch.votes}</span>
              )}
              {Logo && (
                <span className="text-[#555] group-hover:text-[#888] transition-colors">
                  <Logo size={12} />
                </span>
              )}
              {launch.url && (
                <a
                  href={launch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#444] hover:text-[#999] transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <LinkIcon />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
