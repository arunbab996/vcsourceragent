import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchRecentLaunches } from './lib/productHunt'
import { fetchRecentGithubRepos } from './lib/github'
import { fetchRecentYCCompanies } from './lib/yc'
import { fetchShowHNPosts } from './lib/showhn'
import { fetchHNHiringPosts } from './lib/hnhiring'
import { fetchRecentFormD } from './lib/edgar'
import { runAgentPipeline } from './lib/agent'
import { saveDeal, isSupabaseEnabled } from './lib/supabase'
import { DiscoveryScoutLogo } from './components/Logos'
import PipelineHero from './components/PipelineHero'
import DealCard from './components/DealCard'
import TableView from './components/TableView'
import AgentStatusBar from './components/AgentStatusBar'
import Sidebar from './components/Sidebar'
import StatsBar from './components/StatsBar'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PH_KEY     = import.meta.env.VITE_PH_API_KEY
const GH_KEY     = import.meta.env.VITE_GITHUB_TOKEN

const SOURCES = [
  { id: 'producthunt', label: 'Product Hunt', envKey: 'VITE_PH_API_KEY',   requires: !!PH_KEY },
  { id: 'github',      label: 'GitHub',        envKey: 'VITE_GITHUB_TOKEN', requires: !!GH_KEY },
  { id: 'yc',          label: 'YC',            envKey: null,                requires: true },
  { id: 'showhn',      label: 'Show HN',       envKey: null,                requires: true },
  { id: 'hnhiring',    label: 'HN Hiring',     envKey: null,                requires: false, comingSoon: true },
  { id: 'edgar',       label: 'SEC EDGAR',     envKey: null,                requires: false, comingSoon: true },
]

const DEFAULT_FILTERS = { vertical: '', stage: '', signal: '', source: '', sort: 'votes' }

const norm = s => (s || '').toLowerCase().trim()

function applyFilters(deals, filters) {
  return deals
    .filter(d => {
      if (filters.source   && d.source !== filters.source) return false
      if (filters.vertical && norm(d.enrichment?.vertical) !== norm(filters.vertical)) return false
      if (filters.stage    && norm(d.enrichment?.stage)    !== norm(filters.stage))    return false
      if (filters.signal   && !(d.enrichment?.notableSignals || []).some(s => norm(s) === norm(filters.signal))) return false
      return true
    })
    .sort((a, b) => filters.sort === 'date'
      ? new Date(b.launch.createdAt) - new Date(a.launch.createdAt)
      : b.launch.votes - a.launch.votes
    )
}

export default function App() {
  const [selectedSources, setSelectedSources] = useState(
    SOURCES.filter(s => s.requires).map(s => s.id)
  )
  const [deals, setDeals]           = useState([])
  const [filters, setFilters]       = useState(DEFAULT_FILTERS)
  const [agentState, setAgentState] = useState({ status: 'idle', message: '', dealsFound: 0, dealsProcessed: 0 })
  const [progress, setProgress]     = useState(null)
  const [error, setError]           = useState(null)
  const [isRunning, setIsRunning]   = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [viewMode, setViewMode]     = useState('card') // 'card' | 'table'

  // Hero crossfade: full-screen overlay on initial load, fades out when pipeline produces deals or finishes
  const [heroVisible, setHeroVisible] = useState(true)
  const [heroFading,  setHeroFading]  = useState(false)
  const heroTimerRef = useRef(null)

  useEffect(() => {
    const done = agentState.status === 'done' || agentState.status === 'error'
    if ((deals.length > 0 || done) && heroVisible && !heroFading) {
      setHeroFading(true)
      heroTimerRef.current = setTimeout(() => setHeroVisible(false), 600)
    }
    return () => clearTimeout(heroTimerRef.current)
  }, [deals.length, agentState.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSource = id =>
    setSelectedSources(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])

  const handleRun = useCallback(async () => {
    if (isRunning) return
    if (!OPENAI_KEY) { setError('VITE_OPENAI_API_KEY missing — add it in Vercel and redeploy.'); return }
    if (!selectedSources.length) { setError('Select at least one source.'); return }

    setIsRunning(true); setDeals([]); setError(null); setProgress(null); setSavedCount(0)
    let total = 0

    const onProgress = ({ step, message, current, total: t }) => {
      setAgentState(s => ({ ...s, status: step, message }))
      if (current && t) setProgress({ current, total: t })
    }

    const onDealReady = source => async deal => {
      total++
      const enriched = { ...deal, source }
      setDeals(p => [...p, enriched])
      setAgentState(s => ({ ...s, dealsProcessed: total }))
      if (isSupabaseEnabled()) {
        const { error: e } = await saveDeal(enriched, source)
        if (!e) setSavedCount(n => n + 1)
        else console.error('Supabase save error:', e)
      }
    }

    // Per-source wrapper — a single source failing won't kill the whole pipeline
    const sourceErrors = []
    const runSource = async (label, fn) => {
      try {
        await fn()
      } catch (err) {
        console.error(`[${label}] source error:`, err)
        sourceErrors.push(`${label}: ${err.message}`)
      }
    }

    try {
      if (selectedSources.includes('producthunt') && PH_KEY) {
        await runSource('Product Hunt', async () => {
          setAgentState({ status: 'discover', message: 'Fetching Product Hunt launches…', dealsFound: 0, dealsProcessed: 0 })
          const items = await fetchRecentLaunches(PH_KEY, 48, 30)
          setAgentState(s => ({ ...s, message: `${items.length} PH launches — filtering…` }))

          await runAgentPipeline(OPENAI_KEY, items, onProgress, onDealReady('producthunt'))
        })
      }

      if (selectedSources.includes('github') && GH_KEY) {
        await runSource('GitHub', async () => {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching GitHub repos…' }))
          const items = await fetchRecentGithubRepos(GH_KEY, 48, 30)
          setAgentState(s => ({ ...s, message: `${items.length} repos — filtering…` }))
          await runAgentPipeline(OPENAI_KEY, items, onProgress, onDealReady('github'))
        })
      }

      if (selectedSources.includes('yc')) {
        await runSource('YC', async () => {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching YC companies…' }))
          const items = await fetchRecentYCCompanies(6)
          setAgentState(s => ({ ...s, message: `${items.length} YC companies — filtering…` }))
          await runAgentPipeline(OPENAI_KEY, items, onProgress, onDealReady('yc'))
        })
      }

      if (selectedSources.includes('showhn')) {
        await runSource('Show HN', async () => {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching Show HN posts…' }))
          const items = await fetchShowHNPosts(3)
          setAgentState(s => ({ ...s, message: `${items.length} Show HN posts — filtering…` }))
          await runAgentPipeline(OPENAI_KEY, items, onProgress, onDealReady('showhn'))
        })
      }

      if (selectedSources.includes('hnhiring')) {
        await runSource('HN Hiring', async () => {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching HN "Who is Hiring" thread…' }))
          const items = await fetchHNHiringPosts(30)
          setAgentState(s => ({ ...s, message: `${items.length} hiring posts — filtering…` }))
          await runAgentPipeline(OPENAI_KEY, items, onProgress, onDealReady('hnhiring'))
        })
      }

      if (selectedSources.includes('edgar')) {
        await runSource('SEC EDGAR', async () => {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching SEC Form D filings…' }))
          const items = await fetchRecentFormD(7, 20)
          setAgentState(s => ({ ...s, message: `${items.length} Form D filings — filtering…` }))
          await runAgentPipeline(OPENAI_KEY, items, onProgress, onDealReady('edgar'))
        })
      }

      const errNote = sourceErrors.length ? ` · ${sourceErrors.length} source error(s) — check console` : ''
      setAgentState(s => ({
        ...s, status: 'done',
        message: `${total} deals sourced${isSupabaseEnabled() ? ` · ${savedCount} saved` : ''}${errNote}`,
        dealsProcessed: total,
      }))
      if (sourceErrors.length) setError(sourceErrors.join(' | '))
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      setAgentState(s => ({ ...s, status: 'error', message: err.message }))
    } finally {
      setIsRunning(false)
    }
  }, [isRunning, selectedSources, savedCount])

  const filtered = applyFilters(deals, filters)

  return (
    <div className="min-h-screen bg-[#0F0F0F] relative">

      {/* ── Full-screen hero overlay — sits above header + sidebar on first load ── */}
      {heroVisible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: '#0F0F0F',
          opacity: heroFading ? 0 : 1,
          transition: 'opacity .6s ease',
          pointerEvents: heroFading ? 'none' : 'auto',
        }}>
          <PipelineHero
            isRunning={isRunning}
            onRun={handleRun}
            disabled={!OPENAI_KEY}
            agentState={agentState}
          />
        </div>
      )}

      {/* ── Normal app layout — always rendered, becomes visible as hero fades ── */}
      <div className="flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-11 border-b border-white/[0.06] bg-[#0F0F0F] sticky top-0 z-40 flex-shrink-0">
          <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between gap-4">

            {/* Wordmark */}
            <div className="flex items-center gap-2.5">
              <DiscoveryScoutLogo size={22} />
              <div className="flex items-baseline gap-1">
                <span className="text-[13px] font-semibold text-white tracking-tight">discoveryos</span>
                <span className="text-[13px] text-[#555]">/</span>
                <span className="text-[13px] font-medium text-[#777]">scout</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSupabaseEnabled() && savedCount > 0 && (
                <span className="text-[11px] text-emerald-700">{savedCount} saved</span>
              )}
              <button
                onClick={handleRun}
                disabled={isRunning || !OPENAI_KEY}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all ${
                  isRunning
                    ? 'bg-[#1A1A1A] text-[#555] cursor-not-allowed border border-white/[0.04]'
                    : 'bg-[#1060E8] hover:bg-[#1555D4] text-white'
                }`}
              >
                {isRunning
                  ? <><span className="w-3 h-3 border border-[#444] border-t-[#777] rounded-full animate-spin" /> Running</>
                  : 'Run pipeline'
                }
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

          {/* Sidebar */}
          <aside className="w-52 flex-shrink-0 border-r border-white/[0.05] px-3 py-4 sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto scrollbar-thin">
            <Sidebar
              sources={SOURCES}
              selectedSources={selectedSources}
              onToggleSource={toggleSource}
              filters={filters}
              onFiltersChange={setFilters}
              deals={deals}
              isRunning={isRunning}
            />
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0 px-6 py-5">
            <AgentStatusBar agentState={agentState} progress={progress} />

            {error && (
              <div className="border border-red-900/30 bg-red-950/10 rounded px-3 py-2 text-[12px] text-[#B06060] mb-4">
                {error}
              </div>
            )}

            {/* Deal list — fades in once deals start arriving */}
            {deals.length > 0 && (
              <div className="fade-in-up">
                <StatsBar deals={deals} isRunning={isRunning} />

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#666]">
                    {filtered.length} of {deals.length} deals
                    {isRunning && <span className="text-blue-700 ml-2">· sourcing</span>}
                  </span>

                  {/* View toggle */}
                  <div className="flex items-center gap-0.5 bg-[#141414] border border-white/[0.06] rounded p-0.5">
                    <button
                      onClick={() => setViewMode('card')}
                      title="Card view"
                      className={`p-1 rounded transition-colors ${viewMode === 'card' ? 'bg-[#222] text-[#C8C8C8]' : 'text-[#555] hover:text-[#888]'}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="2" width="14" height="3.5" rx="1" fill="currentColor" opacity=".9"/>
                        <rect x="1" y="7" width="14" height="3.5" rx="1" fill="currentColor" opacity=".6"/>
                        <rect x="1" y="12" width="14" height="2.5" rx="1" fill="currentColor" opacity=".35"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      title="Table view"
                      className={`p-1 rounded transition-colors ${viewMode === 'table' ? 'bg-[#222] text-[#C8C8C8]' : 'text-[#555] hover:text-[#888]'}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="1" width="6.5" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
                        <rect x="8.5" y="1" width="6.5" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
                        <rect x="1" y="8.5" width="6.5" height="6.5" rx="1" fill="currentColor" opacity=".6"/>
                        <rect x="8.5" y="8.5" width="6.5" height="6.5" rx="1" fill="currentColor" opacity=".6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {filtered.length === 0
                  ? <p className="text-[12px] text-[#555] text-center py-16">No deals match the current filters.</p>
                  : viewMode === 'table'
                    ? <TableView deals={filtered} />
                    : (
                      <div className="border border-white/[0.05] rounded-md overflow-hidden">
                        {filtered.map(deal => (
                          <DealCard key={`${deal.source}_${deal.id}`} deal={deal} />
                        ))}
                      </div>
                    )
                }
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
