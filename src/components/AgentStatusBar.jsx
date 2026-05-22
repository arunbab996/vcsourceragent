const STEP_LABELS = {
  idle: 'Ready',
  discover: 'Fetching launches',
  filter: 'Filtering startups',
  research: 'Researching founders',
  enrich: 'Enriching deal cards',
  score: 'Scoring deals',
  done: 'Complete',
  error: 'Error',
}

const STEP_ICONS = {
  idle: '○',
  discover: '⟳',
  filter: '⟳',
  research: '⟳',
  enrich: '⟳',
  score: '⟳',
  done: '✓',
  error: '✕',
}

function StepIndicator({ label, status }) {
  const colors = {
    done: 'text-emerald-400',
    active: 'text-blue-400',
    pending: 'text-slate-600',
  }
  return (
    <div className={`flex items-center gap-1.5 text-xs ${colors[status]}`}>
      <span className={status === 'active' ? 'animate-spin inline-block' : ''}>{status === 'active' ? '⟳' : status === 'done' ? '✓' : '○'}</span>
      <span>{label}</span>
    </div>
  )
}

const PIPELINE_STEPS = ['discover', 'filter', 'research', 'enrich', 'score']

export default function AgentStatusBar({ agentState, progress }) {
  const { status, message, dealsFound, dealsProcessed } = agentState

  const currentStepIndex = PIPELINE_STEPS.indexOf(status)

  return (
    <div className="bg-[#111118] border border-slate-800/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'done' ? 'bg-emerald-400' :
            status === 'error' ? 'bg-red-400' :
            status === 'idle' ? 'bg-slate-600' :
            'bg-blue-400 animate-pulse'
          }`} />
          <span className="text-sm font-medium text-slate-300">
            {STEP_LABELS[status] || status}
          </span>
        </div>
        {dealsFound > 0 && (
          <span className="text-xs text-slate-500">
            {dealsProcessed} / {dealsFound} deals ready
          </span>
        )}
      </div>

      {/* Pipeline step dots */}
      <div className="flex items-center gap-2 mb-3">
        {PIPELINE_STEPS.map((step, i) => {
          const stepStatus =
            i < currentStepIndex ? 'done' :
            i === currentStepIndex ? 'active' :
            'pending'
          return (
            <StepIndicator
              key={step}
              label={STEP_LABELS[step]}
              status={stepStatus}
            />
          )
        })}
      </div>

      {/* Progress message */}
      {message && (
        <p className="text-xs text-slate-500 truncate">{message}</p>
      )}

      {/* Progress bar */}
      {progress && progress.total > 0 && (
        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
