import { useState, useCallback } from 'react'
import { fetchRecentLaunches } from './lib/productHunt'
import { fetchRecentGithubRepos } from './lib/github'
import { fetchRecentYCCompanies } from './lib/yc'
import { runAgentPipeline } from './lib/agent'
import { saveDeal, isSupabaseEnabled } from './lib/supabase'
import DealCard from './components/DealCard'
import AgentStatusBar from './components/AgentStatusBar'
import Sidebar from './components/Sidebar'
import StatsBar from './components/StatsBar'

const OPENAI_KEY  = import.meta.env.VITE_OPENAI_API_KEY
const PH_KEY      = import.meta.env.VITE_PH_API_KEY
const GH_KEY      = import.meta.env.VITE_GITHUB_TOKEN

const SOURCES = [
  { id: 'producthunt', label: 'Product Hunt', icon: '🔶', envKey: 'VITE_PH_API_KEY',    requires: !!PH_KEY },
  { id: 'github',      label: 'GitHub',        icon: '🐙', envKey: 'VITE_GITHUB_TOKEN',  requires: !!GH_KEY },
  { id: 'yc',          label: 'YC',            icon: '🏆', envKey: null,                 requires: true },
]

const DEFAULT_FILTERS = {
  minScore: 1,
  vertical: '',
  stage: '',
  signal: '',
  source: '',
  sort: 'score',
}

function normalise(s) { return (s || '').toLowerCase().trim() }

function applyFilters(deals, filters) {
  return deals
    .filter(d => {
      if (d.scoring.score < filters.minScore) return false
      if (filters.source   && d.source !== filters.source) return false
      if (filters.vertical && normalise(d.enrichment?.vertical) !== normalise(filters.vertical)) return false
      if (filters.stage    && normalise(d.enrichment?.stage)    !== normalise(filters.stage))    return false
      if (filters.signal   && !(d.enrichment?.notableSignals || []).some(s => normalise(s) === normalise(filters.signal))) return false
      return true
    })
    .sort((a, b) =>
      filters.sort === 'votes'
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
  const [saveErrors, setSaveErrors] = useState([])

  const toggleSource = id => setSelectedSources(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  )

  const handleRun = useCallback(async () => {
    if (isRunning || !OPENAI_KEY) {
      if (!OPENAI_KEY) setError('Missing VITE_OPENAI_API_KEY — add it in Vercel and redeploy.')
      return
    }
    if (!selectedSources.length) { setError('Select at least one source.'); return }

    setIsRunning(true)
    setDeals([])
    setError(null)
    setProgress(null)
    setSavedCount(0)
    setSaveErrors([])

    let totalProcessed = 0

    const onProgress = ({ step, message, current, total }) => {
      setAgentState(s => ({ ...s, status: step, message }))
      if (current && total) setProgress({ current, total })
    }

    const makeOnDealReady = source => async deal => {
      totalProcessed++
      const enriched = { ...deal, source }
      setDeals(prev => [...prev, enriched])
      setAgentState(s => ({ ...s, dealsProcessed: totalProcessed }))

      if (isSupabaseEnabled()) {
        const { error: saveErr } = await saveDeal(enriched, source)
        if (saveErr) setSaveErrors(prev => [...prev, `${deal.enrichment?.companyName}: ${saveErr.message || saveErr}`])
        else setSavedCount(n => n + 1)
      }
    }

    try {
      if (selectedSources.includes('producthunt')) {
        if (!PH_KEY) { setError('VITE_PH_API_KEY missing.') }
        else {
          setAgentState({ status: 'discover', message: 'Fetching Product Hunt launches…', dealsFound: 0, dealsProcessed: 0 })
          const launches = await fetchRecentLaunches(PH_KEY, 48, 30)
          setAgentState(s => ({ ...s, message: `PH: ${launches.length} launches. Filtering…`, dealsFound: launches.length }))
          await runAgentPipeline(OPENAI_KEY, launches, onProgress, makeOnDealReady('producthunt'))
        }
      }

      if (selectedSources.includes('github')) {
        if (!GH_KEY) { setError('VITE_GITHUB_TOKEN missing.') }
        else {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching GitHub repos…' }))
          const repos = await fetchRecentGithubRepos(GH_KEY, 48, 30)
          setAgentState(s => ({ ...s, message: `GitHub: ${repos.length} repos. Filtering…` }))
          await runAgentPipeline(OPENAI_KEY, repos, onProgress, makeOnDealReady('github'))
        }
      }

      if (selectedSources.includes('yc')) {
        setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching YC recent batches…' }))
        const companies = await fetchRecentYCCompanies()
        setAgentState(s => ({ ...s, message: `YC: ${companies.length} companies. Filtering…` }))
        await runAgentPipeline(OPENAI_KEY, companies, onProgress, makeOnDealReady('yc'))
      }

      setAgentState(s => ({
        ...s,
        status: 'done',
        message: `Done — ${totalProcessed} deals sourced.${isSupabaseEnabled() ? ` ${savedCount} saved to DB.` : ''}`,
        dealsProcessed: totalProcessed,
      }))
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      setAgentState(s => ({ ...s, status: 'error', message: err.message }))
    } finally {
      setIsRunning(false)
    }
  }, [isRunning, selectedSources, savedCount])

  const filteredDeals = applyFilters(deals, filters)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800/60 bg-[#0a0a0f]/90 backdrop-blur sticky top-0 z-40 flex-shrink-0">
        <div className="h-full max-w-screen-2xl mx-auto px-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
              VC
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Deal Sourcer</span>
            <span className="hidden sm:block text-xs text-slate-600 ml-1">by GPT-4o</span>
          </div>

          <div className="flex items-center gap-3">
            {isSupabaseEnabled() && savedCount > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {savedCount} saved
              </span>
            )}
            {saveErrors.length > 0 && (
              <span className="text-xs text-red-400" title={saveErrors.join('\n')}>
                ⚠ {saveErrors.length} save errors
              </span>
            )}
            <button
              onClick={handleRun}
              disabled={isRunning || !OPENAI_KEY}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-900/30'
              }`}
            >
              {isRunning
                ? <><span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" /> Running…</>
                : <><span className="text-xs">▶</span> Run Agent</>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-slate-800/60 px-4 py-5 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin">
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
        <main className="flex-1 min-w-0 px-6 py-6 space-y-4">

          <AgentStatusBar agentState={agentState} progress={progress} />

          {error && (
            <div className="bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-300">
              <strong className="font-medium">Error:</strong> {error}
            </div>
          )}

          {/* Empty state */}
          {deals.length === 0 && !isRunning && agentState.status === 'idle' && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-2xl mb-4">🔭</div>
              <h2 className="text-lg font-semibold text-slate-300 mb-2">No deals yet</h2>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                {OPENAI_KEY
                  ? 'Select sources in the sidebar, then click Run Agent to begin.'
                  : 'Add VITE_OPENAI_API_KEY and source keys to Vercel env vars, then redeploy.'}
              </p>
            </div>
          )}

          {/* Skeleton */}
          {isRunning && deals.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#111118] border border-slate-800/60 rounded-xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-lg bg-slate-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 bg-slate-800 rounded w-40" />
                      <div className="h-3 bg-slate-800/60 rounded w-64" />
                      <div className="flex gap-2 mt-3">
                        <div className="h-5 bg-slate-800/50 rounded w-20" />
                        <div className="h-5 bg-slate-800/50 rounded w-16" />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deal feed */}
          {deals.length > 0 && (
            <>
              <StatsBar deals={deals} isRunning={isRunning} />

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  <span className="text-slate-300 font-medium">{filteredDeals.length}</span> of{' '}
                  <span className="text-slate-300 font-medium">{deals.length}</span> deals
                  {isRunning && <span className="ml-2 text-blue-400 animate-pulse">• Sourcing…</span>}
                </p>
              </div>

              <div className="space-y-3">
                {filteredDeals.map(deal => (
                  <DealCard key={`${deal.source}_${deal.id}`} deal={deal} />
                ))}
              </div>

              {filteredDeals.length === 0 && (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No deals match the current filters.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
