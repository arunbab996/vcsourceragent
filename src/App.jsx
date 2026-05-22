import { useState, useCallback } from 'react'
import { fetchRecentLaunches } from './lib/productHunt'
import { fetchRecentGithubRepos } from './lib/github'
import { runAgentPipeline } from './lib/agent'
import { saveDeal, isSupabaseEnabled } from './lib/supabase'
import DealCard from './components/DealCard'
import AgentStatusBar from './components/AgentStatusBar'
import FilterBar from './components/FilterBar'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PH_KEY = import.meta.env.VITE_PH_API_KEY
const GH_KEY = import.meta.env.VITE_GITHUB_TOKEN

const DEFAULT_FILTERS = {
  minScore: 1,
  vertical: '',
  stage: '',
  signal: '',
  source: '',
  sort: 'score',
}

const SOURCES = [
  { id: 'producthunt', label: 'Product Hunt', icon: '🔶', requires: !!PH_KEY },
  { id: 'github', label: 'GitHub', icon: '🐙', requires: !!GH_KEY },
]

function normalise(s) {
  return (s || '').toLowerCase().trim()
}

function applyFilters(deals, filters) {
  return deals
    .filter(d => {
      if (d.scoring.score < filters.minScore) return false
      if (filters.source && d.source !== filters.source) return false
      if (filters.vertical && normalise(d.enrichment?.vertical) !== normalise(filters.vertical)) return false
      if (filters.stage && normalise(d.enrichment?.stage) !== normalise(filters.stage)) return false
      if (filters.signal && !(d.enrichment?.notableSignals || []).some(s => normalise(s) === normalise(filters.signal))) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'votes') return b.launch.votes - a.launch.votes
      return b.scoring.score - a.scoring.score
    })
}

export default function App() {
  const [selectedSources, setSelectedSources] = useState(
    SOURCES.filter(s => s.requires).map(s => s.id)
  )
  const [deals, setDeals] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [agentState, setAgentState] = useState({
    status: 'idle',
    message: '',
    dealsFound: 0,
    dealsProcessed: 0,
  })
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const toggleSource = (id) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleRun = useCallback(async () => {
    if (isRunning) return
    if (!OPENAI_KEY) {
      setError('Missing VITE_OPENAI_API_KEY — add it in Vercel and redeploy.')
      return
    }
    if (selectedSources.length === 0) {
      setError('Select at least one source to run.')
      return
    }

    setIsRunning(true)
    setDeals([])
    setError(null)
    setProgress(null)
    setSavedCount(0)

    let totalProcessed = 0

    const onProgress = ({ step, message, current, total }) => {
      setAgentState(s => ({ ...s, status: step, message }))
      if (current && total) setProgress({ current, total })
    }

    const makeOnDealReady = (source) => async (deal) => {
      totalProcessed++
      const dealWithSource = { ...deal, source }
      setDeals(prev => [...prev, dealWithSource])
      setAgentState(s => ({ ...s, dealsProcessed: totalProcessed }))

      if (isSupabaseEnabled()) {
        const { error: saveErr } = await saveDeal(dealWithSource, source)
        if (!saveErr) setSavedCount(n => n + 1)
      }
    }

    try {
      // ── Product Hunt ──────────────────────────────────────────────────────────
      if (selectedSources.includes('producthunt')) {
        if (!PH_KEY) {
          setError('VITE_PH_API_KEY is missing. Add it in Vercel.')
        } else {
          setAgentState({ status: 'discover', message: 'Fetching Product Hunt launches...', dealsFound: 0, dealsProcessed: 0 })
          const launches = await fetchRecentLaunches(PH_KEY, 48, 30)
          setAgentState(s => ({ ...s, message: `PH: ${launches.length} launches found. Filtering...`, dealsFound: launches.length }))
          await runAgentPipeline(OPENAI_KEY, launches, onProgress, makeOnDealReady('producthunt'))
        }
      }

      // ── GitHub ────────────────────────────────────────────────────────────────
      if (selectedSources.includes('github')) {
        if (!GH_KEY) {
          setError('VITE_GITHUB_TOKEN is missing. Add it in Vercel.')
        } else {
          setAgentState(s => ({ ...s, status: 'discover', message: 'Fetching GitHub trending repos...' }))
          const repos = await fetchRecentGithubRepos(GH_KEY, 48, 30)
          setAgentState(s => ({ ...s, message: `GitHub: ${repos.length} repos found. Filtering...` }))
          await runAgentPipeline(OPENAI_KEY, repos, onProgress, makeOnDealReady('github'))
        }
      }

      setAgentState(s => ({
        ...s,
        status: 'done',
        message: `Pipeline complete. ${totalProcessed} deals sourced.${isSupabaseEnabled() ? ` ${savedCount} saved to DB.` : ''}`,
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
  const keysConfigured = !!OPENAI_KEY

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#0a0a0f]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xs font-bold">
              VC
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Deal Sourcer</h1>
              <p className="text-xs text-slate-500 hidden sm:block">GPT-4o × Multi-source</p>
            </div>
          </div>

          {/* Source toggles */}
          <div className="flex items-center gap-2">
            {SOURCES.map(src => (
              <button
                key={src.id}
                onClick={() => !isRunning && toggleSource(src.id)}
                disabled={!src.requires}
                title={!src.requires ? `Add VITE_${src.id === 'github' ? 'GITHUB_TOKEN' : 'PH_API_KEY'} in Vercel` : ''}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  !src.requires
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : selectedSources.includes(src.id)
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{src.icon}</span>
                <span>{src.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isSupabaseEnabled() && savedCount > 0 && (
              <span className="text-xs text-emerald-400 hidden sm:block">
                {savedCount} saved to DB
              </span>
            )}
            <button
              onClick={handleRun}
              disabled={isRunning || !keysConfigured}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-blue-900/30'
              }`}
            >
              {isRunning ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <span>▶</span>
                  Run Agent
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <AgentStatusBar agentState={agentState} progress={progress} />

        {error && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-300">
            <strong className="font-medium">Error:</strong> {error}
          </div>
        )}

        {deals.length === 0 && !isRunning && agentState.status === 'idle' && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔭</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No deals yet</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {keysConfigured
                ? <>Select your sources above, then click <strong className="text-slate-400">Run Agent</strong>.</>
                : 'Add VITE_OPENAI_API_KEY and source keys to Vercel environment variables, then redeploy.'}
            </p>
          </div>
        )}

        {isRunning && deals.length === 0 && (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#111118] border border-slate-800/60 rounded-xl p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-48" />
                    <div className="h-3 bg-slate-800/60 rounded w-72" />
                    <div className="h-3 bg-slate-800/40 rounded w-32 mt-4" />
                  </div>
                  <div className="w-16 h-7 rounded-full bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {deals.length > 0 && (
          <>
            <div className="bg-[#111118] border border-slate-800/60 rounded-xl px-4 py-3">
              <FilterBar filters={filters} onFiltersChange={setFilters} deals={deals} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="text-slate-300 font-medium">{filteredDeals.length}</span> of{' '}
                <span className="text-slate-300 font-medium">{deals.length}</span> deals
                {isRunning && <span className="ml-2 text-blue-400 animate-pulse">• Processing…</span>}
              </p>
            </div>

            <div className="grid gap-4">
              {filteredDeals.map(deal => (
                <DealCard key={`${deal.source}_${deal.id}`} deal={deal} />
              ))}
            </div>

            {filteredDeals.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                No deals match the current filters.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
