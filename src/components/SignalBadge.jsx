const SIGNAL_STYLES = {
  'YC': 'bg-orange-500/20 text-orange-300 ring-orange-500/30',
  'Ex-FAANG': 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  'Repeat Founder': 'bg-violet-500/20 text-violet-300 ring-violet-500/30',
  'Solo Founder': 'bg-slate-500/20 text-slate-300 ring-slate-500/30',
  'Academic': 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30',
  'Operator': 'bg-teal-500/20 text-teal-300 ring-teal-500/30',
  'Early Traction': 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
  'Low Info': 'bg-red-500/20 text-red-300 ring-red-500/30',
}

export default function SignalBadge({ signal }) {
  const style = SIGNAL_STYLES[signal] || 'bg-slate-700/50 text-slate-300 ring-slate-600/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ${style}`}>
      {signal}
    </span>
  )
}
