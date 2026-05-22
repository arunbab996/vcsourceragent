export default function FilterBar({ filters, onFiltersChange, deals }) {
  const verticals = [...new Set(deals.map(d => d.enrichment?.vertical).filter(Boolean))].sort()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Score threshold */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 whitespace-nowrap">Min Score</label>
        <select
          value={filters.minScore}
          onChange={e => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
          className="bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {[1, 3, 5, 6, 7, 8].map(n => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </div>

      {/* Vertical filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Vertical</label>
        <select
          value={filters.vertical}
          onChange={e => onFiltersChange({ ...filters, vertical: e.target.value })}
          className="bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          {verticals.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Stage filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Stage</label>
        <select
          value={filters.stage}
          onChange={e => onFiltersChange({ ...filters, stage: e.target.value })}
          className="bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="Pre-seed">Pre-seed</option>
          <option value="Seed">Seed</option>
          <option value="Series A">Series A</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      {/* Signal filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Signal</label>
        <select
          value={filters.signal}
          onChange={e => onFiltersChange({ ...filters, signal: e.target.value })}
          className="bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="YC">YC</option>
          <option value="Ex-FAANG">Ex-FAANG</option>
          <option value="Repeat Founder">Repeat Founder</option>
          <option value="Solo Founder">Solo Founder</option>
          <option value="Early Traction">Early Traction</option>
        </select>
      </div>

      {/* Source filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Source</label>
        <select
          value={filters.source}
          onChange={e => onFiltersChange({ ...filters, source: e.target.value })}
          className="bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="producthunt">🔶 Product Hunt</option>
          <option value="github">🐙 GitHub</option>
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 ml-auto">
        <label className="text-xs text-slate-500">Sort</label>
        <select
          value={filters.sort}
          onChange={e => onFiltersChange({ ...filters, sort: e.target.value })}
          className="bg-slate-800 border border-slate-700/60 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="score">Score ↓</option>
          <option value="votes">Votes ↓</option>
        </select>
      </div>
    </div>
  )
}
