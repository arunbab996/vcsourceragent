const PALETTE = [
  { match: ['ai devtools', 'ai dev'],           bg: '#0B1929', color: '#60A5FA', border: '#1E3A5F' },
  { match: ['ai'],                               bg: '#0B1929', color: '#60A5FA', border: '#1E3A5F' },
  { match: ['b2b saas', 'saas'],                 bg: '#0E0B22', color: '#818CF8', border: '#1A1540' },
  { match: ['devtools', 'dev tools', 'developer tools'], bg: '#061A12', color: '#34D399', border: '#0D3321' },
  { match: ['fintech', 'finance', 'payments'],   bg: '#061A0E', color: '#4ADE80', border: '#0D2E1A' },
  { match: ['healthtech', 'health', 'medtech'],  bg: '#061818', color: '#22D3EE', border: '#0D2E2E' },
  { match: ['consumer'],                         bg: '#1C0E00', color: '#FB923C', border: '#2E1800' },
  { match: ['infrastructure', 'infra'],          bg: '#0F1117', color: '#94A3B8', border: '#1A1F2E' },
  { match: ['marketplace'],                      bg: '#1A1200', color: '#FBBF24', border: '#2E2000' },
  { match: ['productivity'],                     bg: '#120820', color: '#C084FC', border: '#1E0F30' },
  { match: ['edtech', 'education'],              bg: '#1A0D00', color: '#F97316', border: '#2E1800' },
  { match: ['web3', 'crypto', 'blockchain'],     bg: '#09091F', color: '#A5B4FC', border: '#14143A' },
  { match: ['climate', 'sustainability'],        bg: '#061A0A', color: '#86EFAC', border: '#0D2E18' },
  { match: ['security', 'cyber'],                bg: '#1A0808', color: '#F87171', border: '#2E1414' },
]

const DEFAULT = { bg: '#1A1A1A', color: '#6B7280', border: '#242424' }

function getStyle(vertical) {
  if (!vertical) return DEFAULT
  const lower = vertical.toLowerCase()
  for (const entry of PALETTE) {
    if (entry.match.some(m => lower.includes(m))) return entry
  }
  return DEFAULT
}

export default function VerticalBadge({ vertical }) {
  if (!vertical) return null
  const { bg, color, border } = getStyle(vertical)
  return (
    <span
      style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
      className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-medium whitespace-nowrap"
    >
      {vertical}
    </span>
  )
}
