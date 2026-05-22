import { ProductHuntLogo, GitHubLogo, YCLogo, ShowHNLogo } from './Logos'

const LOGO = { producthunt: ProductHuntLogo, github: GitHubLogo, yc: YCLogo, showhn: ShowHNLogo }

export default function Sidebar({ sources, selectedSources, onToggleSource, filters, onFiltersChange, deals, isRunning }) {
  const verticals = [...new Set(deals.map(d => d.enrichment?.vertical).filter(Boolean))].sort()
  const anyFilter = filters.minScore > 1 || filters.vertical || filters.stage || filters.signal || filters.source
  const clear = () => onFiltersChange({ minScore: 1, vertical: '', stage: '', signal: '', source: '', sort: 'score' })

  return (
    <div className="space-y-5">

      {/* Sources */}
      <div>
        <p className="text-[10px] font-semibold text-[#404040] uppercase tracking-widest mb-2">Sources</p>
        <div className="space-y-0.5">
          {sources.map(src => {
            const Logo = LOGO[src.id]
            const active = selectedSources.includes(src.id)
            return (
              <button
                key={src.id}
                onClick={() => !isRunning && src.requires && onToggleSource(src.id)}
                disabled={!src.requires}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[12px] transition-colors ${
                  !src.requires
                    ? 'text-[#333] cursor-not-allowed'
                    : active
                    ? 'bg-white/[0.04] text-[#E2E2E2]'
                    : 'text-[#737373] hover:text-[#E2E2E2] hover:bg-white/[0.03]'
                }`}
              >
                <span className={`flex-shrink-0 ${!src.requires ? 'opacity-30' : ''}`}>
                  <Logo size={14} />
                </span>
                <span>{src.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                {!src.requires && <span className="ml-auto text-[10px] text-[#333]">no key</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-white/[0.05]" />

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[#404040] uppercase tracking-widest">Filters</p>
          {anyFilter && (
            <button onClick={clear} className="text-[10px] text-[#555] hover:text-[#E2E2E2] transition-colors">
              Clear
            </button>
          )}
        </div>

        <div className="space-y-3">
          <Field label="Min score">
            <div className="flex gap-1 flex-wrap">
              {[1, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => onFiltersChange({ ...filters, minScore: n })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filters.minScore === n
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1C1C1C] text-[#737373] hover:text-[#E2E2E2] border border-white/[0.06]'
                  }`}
                >
                  {n === 1 ? 'All' : `${n}+`}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Source">
            <Select value={filters.source} onChange={v => onFiltersChange({ ...filters, source: v })}>
              <option value="">All sources</option>
              <option value="producthunt">Product Hunt</option>
              <option value="github">GitHub</option>
              <option value="yc">YC</option>
            </Select>
          </Field>

          <Field label="Stage">
            <Select value={filters.stage} onChange={v => onFiltersChange({ ...filters, stage: v })}>
              <option value="">All stages</option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Unknown">Unknown</option>
            </Select>
          </Field>

          <Field label="Vertical">
            <Select value={filters.vertical} onChange={v => onFiltersChange({ ...filters, vertical: v })}>
              <option value="">All verticals</option>
              {verticals.map(v => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>

          <Field label="Signal">
            <Select value={filters.signal} onChange={v => onFiltersChange({ ...filters, signal: v })}>
              <option value="">All signals</option>
              <option value="YC">YC</option>
              <option value="Ex-FAANG">Ex-FAANG</option>
              <option value="Repeat Founder">Repeat Founder</option>
              <option value="Solo Founder">Solo Founder</option>
              <option value="Early Traction">Early Traction</option>
            </Select>
          </Field>

          <Field label="Sort">
            <Select value={filters.sort} onChange={v => onFiltersChange({ ...filters, sort: v })}>
              <option value="score">Score</option>
              <option value="votes">Votes</option>
            </Select>
          </Field>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] text-[#404040] mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#1A1A1A] border border-white/[0.06] text-[#737373] text-[11px] rounded px-2 py-1.5 focus:outline-none focus:border-blue-600/50 focus:text-[#E2E2E2] transition-colors"
    >
      {children}
    </select>
  )
}
