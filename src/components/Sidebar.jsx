export default function Sidebar({ sources, selectedSources, onToggleSource, filters, onFiltersChange, deals, isRunning }) {
  const verticals = [...new Set(deals.map(d => d.enrichment?.vertical).filter(Boolean))].sort()

  const filtersActive = filters.minScore > 1 || filters.vertical || filters.stage || filters.signal || filters.source

  return (
    <div className="space-y-6">
      {/* Sources */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources</p>
        <div className="space-y-1">
          {sources.map(src => {
            const active = selectedSources.includes(src.id)
            return (
              <button
                key={src.id}
                onClick={() => !isRunning && onToggleSource(src.id)}
                disabled={!src.requires}
                title={!src.requires ? `Add ${src.envKey} to Vercel env vars` : ''}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  !src.requires
                    ? 'text-slate-600 cursor-not-allowed'
                    : active
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-base leading-none">{src.icon}</span>
                <span>{src.label}</span>
                {!src.requires && <span className="ml-auto text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">no key</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-slate-800/60" />

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filters</p>
          {filtersActive && (
            <button
              onClick={() => onFiltersChange({ minScore: 1, vertical: '', stage: '', signal: '', source: '', sort: 'score' })}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-3">
          <FilterGroup label="Min Score">
            <div className="flex gap-1 flex-wrap">
              {[1, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  onClick={() => onFiltersChange({ ...filters, minScore: n })}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    filters.minScore === n
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {n === 1 ? 'All' : `${n}+`}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Source">
            <Select value={filters.source} onChange={v => onFiltersChange({ ...filters, source: v })}>
              <option value="">All</option>
              <option value="producthunt">🔶 Product Hunt</option>
              <option value="github">🐙 GitHub</option>
              <option value="yc">🏆 YC</option>
            </Select>
          </FilterGroup>

          <FilterGroup label="Stage">
            <Select value={filters.stage} onChange={v => onFiltersChange({ ...filters, stage: v })}>
              <option value="">All</option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Unknown">Unknown</option>
            </Select>
          </FilterGroup>

          <FilterGroup label="Vertical">
            <Select value={filters.vertical} onChange={v => onFiltersChange({ ...filters, vertical: v })}>
              <option value="">All</option>
              {verticals.map(v => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FilterGroup>

          <FilterGroup label="Signal">
            <Select value={filters.signal} onChange={v => onFiltersChange({ ...filters, signal: v })}>
              <option value="">All</option>
              <option value="YC">YC</option>
              <option value="Ex-FAANG">Ex-FAANG</option>
              <option value="Repeat Founder">Repeat Founder</option>
              <option value="Solo Founder">Solo Founder</option>
              <option value="Early Traction">Early Traction</option>
            </Select>
          </FilterGroup>

          <FilterGroup label="Sort by">
            <Select value={filters.sort} onChange={v => onFiltersChange({ ...filters, sort: v })}>
              <option value="score">Score ↓</option>
              <option value="votes">Votes ↓</option>
            </Select>
          </FilterGroup>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-800/80 border border-slate-700/40 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
    >
      {children}
    </select>
  )
}
