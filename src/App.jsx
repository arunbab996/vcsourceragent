import { useState, useCallback } from 'react'
import { fetchRecentLaunches } from './lib/productHunt'
import { fetchRecentGithubRepos } from './lib/github'
import { fetchRecentYCCompanies } from './lib/yc'
import { fetchShowHNPosts } from './lib/showhn'
import { fetchHNHiringPosts } from './lib/hnhiring'
import { fetchRecentFormD } from './lib/edgar'
import { runAgentPipeline } from './lib/agent'
import { saveDeal, isSupabaseEnabled } from './lib/supabase'
import { DiscoveryScoutLogo } from './components/Logos'
import DealCard from './components/DealCard'
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
  { id: 'hnhiring',    label: 'HN Hiring',     envKey: null,                requires: true },
  { id: 'edgar',       label: 'SEC EDGAR',     envKey: null,                requires: true },
]

const DEFAULT_FILTERS = { minScore: 1, vertical: '', stage: '', signal: '', source: '', sort: 'score' }

const norm = s => (s || '').toLowerCase().trim()

function applyFilters(deals, filters) {
  return deals
    .filter(d => {
      if (d.scoring.score < filters.minScore) return false
      if (filters.source   && d.source !== filters.source) return false
      if (filters.vertical && norm(d.enrichment?.vertical) !== norm(filters.vertical)) return false
      if (filters.stage    && norm(d.enrichment?.stage)    !== norm(filters.stage))    return false
      if (filters.signal   && !(d.enrichment?.notableSignals || []).some(s => norm(s) === norm(filters.signal))) return false
      return true
    })
    .sort((a, b) => filters.sort === 'votes'
      ? b.launch.votes - a.launch.votes
      : b.scoring.score - a.scoring.score
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
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col">

      {/* Header */}
      <header className="h-11 border-b border-white/[0.06] bg-[#0F0F0F] sticky top-0 z-40 flex-shrink-0">
        <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between gap-4">

          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <DiscoveryScoutLogo size={22} />
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-semibold text-white tracking-tight">discovery</span>
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

          {/* Empty */}
          {!deals.length && !isRunning && agentState.status === 'idle' && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-2">
              <span className="text-[13px] text-[#666]">No deals yet</span>
              <span className="text-[12px] text-[#555] max-w-xs">
                {OPENAI_KEY ? 'Select sources in the sidebar and run the pipeline.' : 'Add API keys to Vercel env vars and redeploy.'}
              </span>
            </div>
          )}

          {/* Skeleton */}
          {isRunning && !deals.length && (
            <div className="border border-white/[0.05] rounded-md overflow-hidden">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 animate-pulse">
                  <div className="w-6 h-4 bg-[#1C1C1C] rounded flex-shrink-0 mt-0.5" />
                  <div className="w-8 h-8 bg-[#1C1C1C] rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-3 bg-[#1C1C1C] rounded w-32" />
                      <div className="h-3 bg-[#181818] rounded w-16" />
                    </div>
                    <div className="h-2.5 bg-[#181818] rounded w-56" />
                    <div className="h-2 bg-[#161616] rounded w-40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deal list */}
          {deals.length > 0 && (
            <>
              <StatsBar deals={deals} isRunning={isRunning} />

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#666]">
                  {filtered.length} of {deals.length} deals
                  {isRunning && <span className="text-blue-700 ml-2">· sourcing</span>}
                </span>
              </div>

              <div className="border border-white/[0.05] rounded-md overflow-hidden">
                {filtered.length === 0
                  ? <p className="text-[12px] text-[#555] text-center py-16">No deals match the current filters.</p>
                  : filtered.map(deal => (
                      <DealCard key={`${deal.source}_${deal.id}`} deal={deal} />
                    ))
                }
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
