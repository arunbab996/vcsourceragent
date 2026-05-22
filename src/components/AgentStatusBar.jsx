const STEPS = ['discover', 'filter', 'research', 'enrich', 'score']
const STEP_LABEL = { discover: 'Discover', filter: 'Filter', research: 'Research', enrich: 'Enrich', score: 'Score' }

export default function AgentStatusBar({ agentState, progress }) {
  const { status, message, dealsFound, dealsProcessed } = agentState
  const idle = status === 'idle'
  const done = status === 'done'
  const errored = status === 'error'
  const currentIdx = STEPS.indexOf(status)

  if (idle) return null

  return (
    <div className="border border-white/[0.06] rounded-md bg-[#141414] px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!done && !errored && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
          )}
          {done && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
          {errored && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
          <span className="text-[12px] text-[#737373] truncate">{message}</span>
        </div>
        {dealsFound > 0 && (
          <span className="text-[11px] text-[#555] tabular flex-shrink-0 ml-4">
            {dealsProcessed}/{dealsFound}
          </span>
        )}
      </div>

      {/* Step track */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isPast   = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                isPast || done ? 'bg-violet-600' : isCurrent ? 'bg-violet-800' : 'bg-[#222]'
              }`} />
              {i === STEPS.length - 1 && null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-1.5">
        {STEPS.map((step, i) => {
          const isPast    = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <span key={step} className={`text-[10px] ${
              isPast || done ? 'text-violet-400' : isCurrent ? 'text-[#737373]' : 'text-[#333]'
            }`}>
              {STEP_LABEL[step]}
            </span>
          )
        })}
      </div>

      {progress && progress.total > 0 && (
        <div className="mt-2 h-px bg-[#1C1C1C] rounded overflow-hidden">
          <div
            className="h-full bg-violet-600/60 rounded transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
