import { useState, useCallback } from 'react'
import { fetchRecentLaunches } from './lib/productHunt'
import { runAgentPipeline } from './lib/agent'
import DealCard from './components/DealCard'
import AgentStatusBar from './components/AgentStatusBar'
import FilterBar from './components/FilterBar'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PH_KEY = import.meta.env.VITE_PH_API_KEY

const DEFAULT_FILTERS = {
  minScore: 1,
  vertical: '',
  stage: '',
  signal: '',
  sort: 'score',
}

function normalise(s) {
  return (s || '').toLowerCase().trim()
}

function applyFilters(deals, filters) {
  return deals
    .filter(d => {
      if (d.scoring.score < filters.minScore) return false
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

  const handleRun = useCallback(async () => {
    if (isRunning) return

    if (!OPENAI_KEY || !PH_KEY) {
      setError(
        'Missing env vars. Make sure VITE_OPENAI_API_KEY and VITE_PH_API_KEY are set in Vercel → Project Settings → Environment Variables, then redeploy.'
      )
      return
    }

    setIsRunning(true)
    setDeals([])
    setError(null)
    setProgress(null)

    try {
      setAgentState({ status: 'discover', message: 'Fetching recent Product Hunt launches...', dealsFound: 0, dealsProcessed: 0 })

      const launches = await fetchRecentLaunches(PH_KEY, 48, 30)

      setAgentState(s => ({ ...s, message: `Found ${launches.length} launches. Filtering...`, dealsFound: launches.length }))
      setAgentState(s => ({ ...s, status: 'filter' }))

      let processed = 0
      const onProgress = ({ step, message, current, total }) => {
        setAgentState(s => ({ ...s, status: step, message }))
        if (current && total) setProgress({ current, total })
      }

      const onDealReady = (deal) => {
        processed++
        setDeals(prev => [...prev, deal])
        setAgentState(s => ({ ...s, dealsProcessed: processed }))
      }

      await runAgentPipeline(OPENAI_KEY, launches, onProgress, onDealReady)

      setAgentState(s => ({
        ...s,
        status: 'done',
        message: `Pipeline complete. ${processed} deals sourced.`,
        dealsProcessed: processed,
      }))
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      setAgentState(s => ({ ...s, status: 'error', message: err.message }))
    } finally {
      setIsRunning(false)
    }
  }, [isRunning])

  const filteredDeals = applyFilters(deals, filters)

  const keysConfigured = OPENAI_KEY && PH_KEY

  return (
    <div className="min-h-screen bg-[#0a0a0f]">

      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#0a0a0f]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-xs font-bold">
              VC
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Deal Sourcer</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Product Hunt × GPT-4o</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
        {/* Status bar */}
        <AgentStatusBar agentState={agentState} progress={progress} />

        {/* Error */}
        {error && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-300">
            <strong className="font-medium">Error:</strong> {error}
          </div>
        )}

        {/* Empty state */}
        {deals.length === 0 && !isRunning && agentState.status === 'idle' && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔭</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No deals yet</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {keysConfigured
                ? <>Click <strong className="text-slate-400">Run Agent</strong> to discover and score today's top Product Hunt launches using GPT-4o.</>
                : 'Add VITE_OPENAI_API_KEY and VITE_PH_API_KEY to your environment variables, then redeploy.'}
            </p>
          </div>
        )}

        {/* Loading placeholder cards */}
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

        {/* Deal feed */}
        {deals.length > 0 && (
          <>
            {/* Filter bar */}
            <div className="bg-[#111118] border border-slate-800/60 rounded-xl px-4 py-3">
              <FilterBar filters={filters} onFiltersChange={setFilters} deals={deals} />
            </div>

            {/* Count */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing <span className="text-slate-300 font-medium">{filteredDeals.length}</span> of{' '}
                <span className="text-slate-300 font-medium">{deals.length}</span> deals
                {isRunning && <span className="ml-2 text-blue-400 animate-pulse">• Processing…</span>}
              </p>
            </div>

            <div className="grid gap-4">
              {filteredDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
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
