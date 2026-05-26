// ── SVG layout ────────────────────────────────────────────────────────────────
const W = 760, H = 500

// DiscoveryOS logo mark
const LOGO_CX = 380, LOGO_CY = 194, LOGO_SZ = 44

// Run Pipeline button
const BTN_CX = 380, BTN_CY = 256
const BTN_W  = 180, BTN_H  = 46
const BTN_LX = BTN_CX - BTN_W / 2   // 290
const BTN_TY = BTN_CY - BTN_H / 2   // 233
const BTN_BE = BTN_TY + BTN_H        // 279
const BTN_RE = BTN_LX + BTN_W        // 470

// Source boxes
const BOX_W = 126, BOX_H = 48
const ICON   = 30   // icon size

// Sources — 3 across the top, 3 across the bottom
const SOURCES = [
  // ── top row ─────────────────────────────────────────────────────────────────
  {
    id: 'producthunt', label: 'Product Hunt', color: '#DA552F',
    cx: 128, cy: 72,
    logo: (x, y) => (
      <svg x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#DA552F"/>
        <path d="M23.5 15.5h-8v9h3v-3h5a3 3 0 0 0 0-6zm0 4h-5v-1.5h5a.75.75 0 0 1 0 1.5z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'github', label: 'GitHub', color: '#AAAAAA',
    cx: 380, cy: 58,
    logo: (x, y) => (
      <svg x={x} y={y} width={ICON} height={ICON} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#24292E"/>
        <path fill="white" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    ),
  },
  {
    id: 'yc', label: 'Y Combinator', color: '#FF6600',
    cx: 632, cy: 72,
    logo: (x, y) => (
      <svg x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#FF6600"/>
        <path d="M11.5 10.5l8.5 14 8.5-14h-4.5L20 18l-4-7.5h-4zm6.5 16v5h4v-5h-4z" fill="white"/>
      </svg>
    ),
  },
  // ── bottom row ──────────────────────────────────────────────────────────────
  {
    id: 'showhn', label: 'Show HN', color: '#FF6600',
    cx: 128, cy: 428,
    logo: (x, y) => (
      <svg x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#1C1C1C"/>
        <rect width="40" height="40" rx="6" stroke="#FF6600" strokeWidth="3"/>
        <path d="M10 12v16M10 20h10M20 12v16M25 12v16l5-8-5-8z"
          stroke="#FF6600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'hnhiring', label: 'HN Hiring', color: '#FF6600',
    cx: 380, cy: 444, soon: true,
    logo: (x, y) => (
      <svg x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#1A1A1A"/>
        <rect width="40" height="40" rx="6" stroke="#444" strokeWidth="2"/>
        <rect x="9" y="17" width="22" height="15" rx="2" fill="none" stroke="#555" strokeWidth="2.2"/>
        <path d="M15 17v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" stroke="#555" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'edgar', label: 'SEC EDGAR', color: '#4A90D9',
    cx: 632, cy: 428, soon: true,
    logo: (x, y) => (
      <svg x={x} y={y} width={ICON} height={ICON} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="6" fill="#0D1B2A"/>
        <rect width="40" height="40" rx="6" stroke="#2A4A6A" strokeWidth="2"/>
        <path d="M20 9L29 13L29 21C29 26 24.5 30 20 32C15.5 30 11 26 11 21L11 13Z"
          fill="none" stroke="#4A90D9" strokeWidth="2"/>
        <text x="20" y="26" textAnchor="middle" fontSize="11" fontWeight="bold"
          fill="#4A90D9" fontFamily="serif">$</text>
      </svg>
    ),
  },
]

// Build a smooth bezier from source box edge to button edge
function buildPath(src) {
  const isTop  = src.cy < BTN_CY
  const isLeft  = src.cx < BTN_CX - 30
  const isRight = src.cx > BTN_CX + 30

  const sx = src.cx
  const sy = isTop ? src.cy + BOX_H / 2 : src.cy - BOX_H / 2

  const bx = isLeft  ? BTN_LX + 28 :
             isRight ? BTN_RE  - 28 : BTN_CX
  const by = isTop   ? BTN_TY      : BTN_BE

  const my = (sy + by) / 2
  return `M ${sx} ${sy} C ${sx} ${my}, ${bx} ${my}, ${bx} ${by}`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PipelineHero({ isRunning, onRun, disabled, agentState }) {
  const statusMsg = (() => {
    if (!isRunning || !agentState?.message) return ''
    const m = agentState.message
    return m.length > 30 ? m.slice(0, 27) + '…' : m
  })()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 11rem)',
      padding: '20px 24px',
    }}>
      {/* Tagline */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{
          color: '#E8E8E8', fontSize: 22, fontWeight: 700, margin: 0,
          letterSpacing: '-0.03em',
          fontFamily: "system-ui,-apple-system,sans-serif",
        }}>
          Surface early-stage deals
        </p>
        <p style={{ color: '#4A4A4A', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          AI-powered sourcing from Product Hunt, GitHub, Y Combinator & more
        </p>
      </div>

      {/* Hub diagram */}
      <div style={{ width: '100%', maxWidth: 760 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
          <defs>
            <style>{`
              .ph-conn {
                fill: none;
                stroke: #2A2A2A;
                stroke-width: 1.5;
                stroke-dasharray: 7 6;
                transition: stroke .4s;
              }
              .ph-conn.lit {
                stroke: #1E5FD8;
                animation: phIn .7s linear infinite;
              }
              @keyframes phIn { to { stroke-dashoffset: -13; } }
            `}</style>
          </defs>

          {/* ── CONNECTOR PATHS ──────────────────────────────────────────── */}
          {SOURCES.map((s, i) => (
            <path
              key={s.id + '-p'}
              d={buildPath(s)}
              className={`ph-conn${isRunning && !s.soon ? ' lit' : ''}`}
              style={isRunning && !s.soon ? { animationDelay: `${i * 0.13}s` } : undefined}
            />
          ))}

          {/* ── DISCOVERYSCOUT LOGO MARK ─────────────────────────────────── */}
          <g
            style={{ cursor: (!disabled && !isRunning) ? 'pointer' : 'default' }}
            onClick={(!disabled && !isRunning) ? onRun : undefined}
          >
            {/* White square */}
            <rect
              x={LOGO_CX - LOGO_SZ / 2} y={LOGO_CY - LOGO_SZ / 2}
              width={LOGO_SZ} height={LOGO_SZ} rx={9}
              fill={disabled ? '#2A2A2A' : '#FFFFFF'}
              style={{ transition: 'fill .4s' }}
            />
            {/* Diagonal slash  (matches discoveryos.xyz mark) */}
            <path
              d={`M ${LOGO_CX - 8} ${LOGO_CY + 10} L ${LOGO_CX + 8} ${LOGO_CY - 14}`}
              stroke={disabled ? '#444' : '#0A0A0A'}
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ transition: 'stroke .4s' }}
            />
          </g>

          {/* ── RUN PIPELINE BUTTON ──────────────────────────────────────── */}
          {/* Glow halo when running */}
          {isRunning && (
            <rect
              x={BTN_LX - 6} y={BTN_TY - 6}
              width={BTN_W + 12} height={BTN_H + 12}
              rx={13} fill="none"
              stroke="#1060E8" strokeWidth="1" opacity="0.25"
            />
          )}
          <rect
            x={BTN_LX} y={BTN_TY}
            width={BTN_W} height={BTN_H} rx={8}
            fill={disabled ? '#1A1A1A' : isRunning ? '#0B2E7A' : '#1060E8'}
            style={{
              transition: 'fill .4s',
              cursor: (!disabled && !isRunning) ? 'pointer' : 'default',
            }}
            onClick={(!disabled && !isRunning) ? onRun : undefined}
          />
          <text
            x={BTN_CX} y={BTN_CY + (statusMsg ? -5 : 5)}
            textAnchor="middle" fontSize="13" fontWeight="600"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={disabled ? '#555' : '#FFFFFF'}
            style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .4s' }}
          >
            {isRunning ? 'Running…' : disabled ? 'No API key' : 'Run Pipeline'}
          </text>
          {statusMsg && (
            <text
              x={BTN_CX} y={BTN_CY + 11}
              textAnchor="middle" fontSize="8"
              fontFamily="system-ui,-apple-system,sans-serif"
              fill="#5080CC"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {statusMsg}
            </text>
          )}
          {/* Invisible click overlay */}
          {!disabled && !isRunning && (
            <rect
              x={BTN_LX} y={BTN_TY} width={BTN_W} height={BTN_H} rx={8}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={onRun}
            />
          )}

          {/* ── SOURCE BOXES ─────────────────────────────────────────────── */}
          {SOURCES.map((s) => {
            const bx   = s.cx - BOX_W / 2
            const by   = s.cy - BOX_H / 2
            const dim  = !!s.soon
            const lit  = isRunning && !dim
            // Icon position (left-aligned inside box)
            const ix   = bx + 9
            const iy   = s.cy - ICON / 2
            // Label position (right of icon)
            const lx   = ix + ICON + 8
            const ly   = s.cy + (dim ? -2 : 4)

            return (
              <g key={s.id}>
                {/* Box */}
                <rect
                  x={bx} y={by} width={BOX_W} height={BOX_H} rx={8}
                  fill="#191919"
                  stroke={lit ? s.color : dim ? '#1E1E1E' : '#303030'}
                  strokeWidth={lit ? 1.5 : 1}
                  strokeDasharray={dim ? '5 4' : undefined}
                  style={{ transition: 'stroke .4s, stroke-width .4s' }}
                />

                {/* Logo icon */}
                <g opacity={dim ? 0.35 : 1} style={{ transition: 'opacity .4s' }}>
                  {s.logo(ix, iy)}
                </g>

                {/* Source name */}
                <text
                  x={lx} y={ly}
                  fontSize="10.5" fontFamily="system-ui,-apple-system,sans-serif"
                  fill={lit ? '#D0D0D0' : dim ? '#383838' : '#888888'}
                  style={{ userSelect: 'none', transition: 'fill .4s' }}
                >
                  {s.label}
                </text>

                {/* "coming soon" sub-label */}
                {dim && (
                  <text
                    x={lx} y={s.cy + 9}
                    fontSize="8.5" fontFamily="system-ui,-apple-system,sans-serif"
                    fill="#2E2E2E"
                    style={{ userSelect: 'none' }}
                  >
                    coming soon
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Hint */}
      {!isRunning && (
        <p style={{ color: '#303030', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
          {disabled
            ? 'Add VITE_OPENAI_API_KEY in Vercel env vars to get started'
            : 'Click to begin sourcing'
          }
        </p>
      )}
    </div>
  )
}
