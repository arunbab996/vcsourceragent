// ── SVG layout ────────────────────────────────────────────────────────────────
const W = 820, H = 520

// Centre elements
const LOGO_CX = 410, LOGO_CY = 196, LOGO_SZ = 46
const BTN_CX  = 410, BTN_CY  = 264
const BTN_W   = 184, BTN_H   = 48
const BTN_LX  = BTN_CX - BTN_W / 2   // 318
const BTN_TY  = BTN_CY - BTN_H / 2   // 240
const BTN_BE  = BTN_TY + BTN_H        // 288
const BTN_RE  = BTN_LX + BTN_W        // 502

const BOX_W = 122, BOX_H = 46
const ICON  = 28

// ── Source definitions ────────────────────────────────────────────────────────
// exitSide  : which edge the connector leaves the source box
// entryX/Y  : explicit entry point on the Run Pipeline button perimeter
const SOURCES = [
  // ── top row ────────────────────────────────────────────────────────────────
  {
    id: 'producthunt', label: 'Product Hunt', color: '#DA552F',
    cx: 92, cy: 72, exitSide: 'bottom', entryX: 334, entryY: BTN_TY,
    logo: (x, y) => (
      <svg key="ph" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#DA552F"/>
        <path d="M23.5 15.5h-8v9h3v-3h5a3 3 0 0 0 0-6zm0 4h-5v-1.5h5a.75.75 0 0 1 0 1.5z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'github', label: 'GitHub', color: '#CCCCCC',
    cx: 272, cy: 60, exitSide: 'bottom', entryX: 358, entryY: BTN_TY,
    logo: (x, y) => (
      <svg key="gh" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#24292E"/>
        <path fill="white" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    ),
  },
  {
    id: 'crunchbase', label: 'Crunchbase', color: '#0288D1',
    cx: 548, cy: 60, exitSide: 'bottom', entryX: 462, entryY: BTN_TY,
    logo: (x, y) => (
      <svg key="cb" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#0288D1"/>
        {/* Crunchbase C-mark */}
        <path d="M28 12 C 28 12 18 8 11 16 C 5 22 9 34 20 34 C 25 34 29 31 29 31"
          fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="29" cy="12" r="3" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'yc', label: 'Y Combinator', color: '#FF6600',
    cx: 728, cy: 72, exitSide: 'bottom', entryX: 486, entryY: BTN_TY,
    logo: (x, y) => (
      <svg key="yc" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#FF6600"/>
        <path d="M11.5 10.5l8.5 14 8.5-14h-4.5L20 18l-4-7.5h-4zm6.5 16v5h4v-5h-4z" fill="white"/>
      </svg>
    ),
  },
  // ── left / right ───────────────────────────────────────────────────────────
  {
    id: 'linkedin', label: 'LinkedIn', color: '#0A66C2',
    cx: 66, cy: 264, exitSide: 'right', entryX: BTN_LX, entryY: BTN_CY,
    logo: (x, y) => (
      <svg key="li" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#0A66C2"/>
        {/* Profile dot */}
        <circle cx="13" cy="13" r="3.5" fill="white"/>
        {/* Vertical bar */}
        <rect x="10.5" y="19" width="5" height="13" rx="1" fill="white"/>
        {/* L-shape for "n" part */}
        <rect x="18" y="16" width="5" height="16" rx="1" fill="white"/>
        <path d="M23 22 C23 19 25 17 28 17 C31 17 32 19 32 22 L32 32 L27.5 32 L27.5 23 C27.5 21.5 26.5 20.5 25 20.5 C23.5 20.5 23 21.5 23 23 Z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'twitter', label: 'Twitter / X', color: '#E7E7E7',
    cx: 754, cy: 264, exitSide: 'left', entryX: BTN_RE, entryY: BTN_CY,
    logo: (x, y) => (
      <svg key="tw" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#000000"/>
        <g transform="translate(5 5) scale(1.25)">
          <path fill="white" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.847L2 2.25h6.063l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </g>
      </svg>
    ),
  },
  // ── bottom row ─────────────────────────────────────────────────────────────
  {
    id: 'showhn', label: 'Show HN', color: '#FF6600',
    cx: 162, cy: 452, exitSide: 'top', entryX: 337, entryY: BTN_BE,
    logo: (x, y) => (
      <svg key="hn" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#1C1C1C"/>
        <rect width="40" height="40" rx="6" stroke="#FF6600" strokeWidth="3"/>
        <path d="M10 12v16M10 20h10M20 12v16M25 12v16l5-8-5-8z"
          stroke="#FF6600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'hnhiring', label: 'HN Hiring', color: '#FF8C00',
    cx: 410, cy: 468, exitSide: 'top', entryX: BTN_CX, entryY: BTN_BE,
    logo: (x, y) => (
      <svg key="hnh" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#1A1A1A"/>
        <rect width="40" height="40" rx="6" stroke="#FF6600" strokeWidth="2.5"/>
        <rect x="9" y="17" width="22" height="15" rx="2" fill="none" stroke="#FF6600" strokeWidth="2.2"/>
        <path d="M15 17v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" stroke="#FF6600" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="9" y1="24" x2="31" y2="24" stroke="#FF6600" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'edgar', label: 'SEC EDGAR', color: '#4A90D9',
    cx: 658, cy: 452, exitSide: 'top', entryX: 483, entryY: BTN_BE,
    logo: (x, y) => (
      <svg key="ed" x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#0D1B2A"/>
        <rect width="40" height="40" rx="6" stroke="#4A90D9" strokeWidth="2"/>
        <path d="M20 8L30 13L30 22C30 27 25 31 20 33C15 31 10 27 10 22L10 13Z"
          fill="none" stroke="#4A90D9" strokeWidth="2"/>
        <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="bold"
          fill="#4A90D9" fontFamily="Georgia,serif">$</text>
      </svg>
    ),
  },
]

// Build bezier path from source box edge → button entry point
function buildPath(src) {
  const sx = src.exitSide === 'right'  ? src.cx + BOX_W / 2
           : src.exitSide === 'left'   ? src.cx - BOX_W / 2
           : src.cx   // top or bottom exit
  const sy = src.exitSide === 'bottom' ? src.cy + BOX_H / 2
           : src.exitSide === 'top'    ? src.cy - BOX_H / 2
           : src.cy   // left or right exit

  const bx = src.entryX
  const by = src.entryY

  if (src.exitSide === 'right' || src.exitSide === 'left') {
    const mx = (sx + bx) / 2
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${by}, ${bx} ${by}`
  }
  const my = (sy + by) / 2
  return `M ${sx} ${sy} C ${sx} ${my}, ${bx} ${my}, ${bx} ${by}`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PipelineHero({ isRunning, onRun, disabled, agentState }) {
  const statusMsg = (() => {
    if (!isRunning || !agentState?.message) return ''
    const m = agentState.message
    return m.length > 32 ? m.slice(0, 29) + '…' : m
  })()

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      padding: '20px 24px',
    }}>

      {/* ── Wordmark (top-left) ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 20, left: 24,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width={18} height={18} viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#FFFFFF"/>
          <path d="M11 24L21 8" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#DDDDDD', fontSize: 13, fontWeight: 600, fontFamily: 'system-ui,sans-serif' }}>discoveryos</span>
        <span style={{ color: '#444', fontSize: 13 }}>/</span>
        <span style={{ color: '#555', fontSize: 13, fontFamily: 'system-ui,sans-serif' }}>scout</span>
      </div>

      {/* ── Tagline ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{
          color: '#EDEDED', fontSize: 22, fontWeight: 700, margin: 0,
          letterSpacing: '-0.03em', fontFamily: 'system-ui,-apple-system,sans-serif',
        }}>
          Surface early-stage deals
        </p>
        <p style={{ color: '#3E3E3E', fontSize: 12, marginTop: 7, marginBottom: 0 }}>
          AI-powered sourcing from Product Hunt, GitHub, Y Combinator & more
        </p>
      </div>

      {/* ── Hub diagram ──────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: W }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
          <defs>
            <style>{`
              .ph-c {
                fill: none; stroke: #2E2E2E;
                stroke-width: 1.5; stroke-dasharray: 7 6;
                transition: stroke .4s;
              }
              .ph-c.lit {
                stroke: #1E5FD8;
                animation: phIn .72s linear infinite;
              }
              @keyframes phIn { to { stroke-dashoffset: -13; } }
            `}</style>
          </defs>

          {/* ── CONNECTORS ──────────────────────────────────────────────── */}
          {SOURCES.map((s, i) => (
            <path
              key={s.id + '-c'}
              d={buildPath(s)}
              className={`ph-c${isRunning ? ' lit' : ''}`}
              style={isRunning ? { animationDelay: `${i * 0.1}s` } : undefined}
            />
          ))}

          {/* ── DISCOVERYSCOUT LOGO MARK ────────────────────────────────── */}
          <g
            style={{ cursor: (!disabled && !isRunning) ? 'pointer' : 'default' }}
            onClick={(!disabled && !isRunning) ? onRun : undefined}
          >
            <rect
              x={LOGO_CX - LOGO_SZ / 2} y={LOGO_CY - LOGO_SZ / 2}
              width={LOGO_SZ} height={LOGO_SZ} rx={10}
              fill={disabled ? '#252525' : isRunning ? '#E8E8E8' : '#FFFFFF'}
              style={{ transition: 'fill .4s' }}
            />
            <path
              d={`M ${LOGO_CX - 9} ${LOGO_CY + 11} L ${LOGO_CX + 9} ${LOGO_CY - 15}`}
              stroke={disabled ? '#444' : '#0A0A0A'}
              strokeWidth="3.5" strokeLinecap="round"
              style={{ transition: 'stroke .4s', pointerEvents: 'none' }}
            />
          </g>

          {/* ── RUN PIPELINE BUTTON ─────────────────────────────────────── */}
          {isRunning && (
            <rect
              x={BTN_LX - 6} y={BTN_TY - 6}
              width={BTN_W + 12} height={BTN_H + 12}
              rx={13} fill="none"
              stroke="#1060E8" strokeWidth="1" opacity="0.22"
            />
          )}
          <rect
            x={BTN_LX} y={BTN_TY}
            width={BTN_W} height={BTN_H} rx={9}
            fill={disabled ? '#191919' : isRunning ? '#0A2B74' : '#1060E8'}
            style={{ transition: 'fill .4s', cursor: (!disabled && !isRunning) ? 'pointer' : 'default' }}
            onClick={(!disabled && !isRunning) ? onRun : undefined}
          />
          <text
            x={BTN_CX} y={BTN_CY + (statusMsg ? -5 : 5)}
            textAnchor="middle" fontSize="13" fontWeight="600"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={disabled ? '#444' : '#FFFFFF'}
            style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .4s' }}
          >
            {isRunning ? 'Running…' : disabled ? 'No API key' : 'Run Pipeline'}
          </text>
          {statusMsg && (
            <text
              x={BTN_CX} y={BTN_CY + 11}
              textAnchor="middle" fontSize="8"
              fontFamily="system-ui,-apple-system,sans-serif"
              fill="#4A7AD0"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {statusMsg}
            </text>
          )}
          {!disabled && !isRunning && (
            <rect
              x={BTN_LX} y={BTN_TY} width={BTN_W} height={BTN_H} rx={9}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={onRun}
            />
          )}

          {/* ── SOURCE BOXES ────────────────────────────────────────────── */}
          {SOURCES.map((s) => {
            const bx  = s.cx - BOX_W / 2
            const by  = s.cy - BOX_H / 2
            const lit = isRunning
            const ix  = bx + 8
            const iy  = s.cy - ICON / 2
            const lx  = ix + ICON + 8
            const ly  = s.cy + 4

            return (
              <g key={s.id}>
                <rect
                  x={bx} y={by} width={BOX_W} height={BOX_H} rx={8}
                  fill="#1A1A1A"
                  stroke={lit ? s.color : '#303030'}
                  strokeWidth={lit ? 1.5 : 1}
                  style={{ transition: 'stroke .4s, stroke-width .4s' }}
                />
                <g opacity={lit ? 1 : 0.9}>
                  {s.logo(ix, iy)}
                </g>
                <text
                  x={lx} y={ly}
                  fontSize="10.5" fontFamily="system-ui,-apple-system,sans-serif"
                  fill={lit ? '#D8D8D8' : '#888888'}
                  style={{ userSelect: 'none', transition: 'fill .4s' }}
                >
                  {s.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── Hint ─────────────────────────────────────────────────────────── */}
      {!isRunning && (
        <p style={{ color: '#2C2C2C', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
          {disabled
            ? 'Add VITE_OPENAI_API_KEY in Vercel env vars to get started'
            : 'Click to begin sourcing'
          }
        </p>
      )}
    </div>
  )
}
