// ── Layout constants ──────────────────────────────────────────────────────────
const W = 760, H = 440
const BTN_CX = 380, BTN_CY = 220
const BTN_W  = 176, BTN_H = 46
const BTN_LX = BTN_CX - BTN_W / 2   // 292
const BTN_TY = BTN_CY - BTN_H / 2   // 197
const BTN_BE = BTN_TY + BTN_H        // 243  (bottom edge)
const BTN_RE = BTN_LX + BTN_W        // 468  (right edge)
const BOX_W  = 118, BOX_H = 44

// 6 sources: 3 across the top, 3 across the bottom
const SOURCES = [
  { id: 'producthunt', label: 'Product Hunt', abbr: 'PH', color: '#DA552F', cx: 126, cy: 72  },
  { id: 'github',      label: 'GitHub',       abbr: 'GH', color: '#888888', cx: 380, cy: 56  },
  { id: 'yc',          label: 'YC',           abbr: 'YC', color: '#FF6600', cx: 634, cy: 72  },
  { id: 'showhn',   label: 'Show HN',   abbr: 'HN', color: '#FF9500', cx: 126, cy: 368              },
  { id: 'hnhiring', label: 'HN Hiring', abbr: 'HI', color: '#FF6600', cx: 380, cy: 384, soon: true  },
  { id: 'edgar',    label: 'SEC EDGAR', abbr: 'SE', color: '#4A90D9', cx: 634, cy: 368, soon: true  },
]

// Build a smooth bezier path from a source box edge to the button edge
function buildPath(src) {
  const isTop  = src.cy < BTN_CY
  const isLeft  = src.cx < BTN_CX - 30
  const isRight = src.cx > BTN_CX + 30

  // Exit point: bottom-center of source box (top sources) or top-center (bottom)
  const sx = src.cx
  const sy = isTop ? src.cy + BOX_H / 2 : src.cy - BOX_H / 2

  // Entry point on button perimeter
  const bx = isLeft  ? BTN_LX + 26 :
             isRight ? BTN_RE  - 26 : BTN_CX
  const by = isTop   ? BTN_TY      : BTN_BE

  // Cubic bezier: control points at midway Y, pulling curve inward
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 11rem)',
        padding: '20px 24px',
      }}
    >
      {/* Tagline */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ color: '#C8C8C8', fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Surface early-stage deals
        </p>
        <p style={{ color: '#333', fontSize: 12, marginTop: 7, marginBottom: 0 }}>
          AI-powered sourcing from Product Hunt, GitHub, YC & more
        </p>
      </div>

      {/* Hub diagram */}
      <div style={{ width: '100%', maxWidth: 760 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', overflow: 'visible' }}
        >
          <defs>
            <style>{`
              .ph-conn {
                fill: none;
                stroke: #1D1D1D;
                stroke-width: 1.5;
                stroke-dasharray: 7 6;
                transition: stroke .4s;
              }
              .ph-conn.lit {
                stroke: #1555D4;
                animation: phIn .72s linear infinite;
              }
              @keyframes phIn {
                to { stroke-dashoffset: -13; }
              }
              .ph-box {
                transition: stroke .4s, stroke-width .4s;
              }
              .ph-dot {
                transition: stroke .4s, fill .4s;
              }
            `}</style>
          </defs>

          {/* ── CONNECTOR PATHS (drawn first, boxes sit on top) ──────── */}
          {SOURCES.map((s, i) => (
            <path
              key={s.id + '-c'}
              d={buildPath(s)}
              className={`ph-conn${isRunning && !s.soon ? ' lit' : ''}`}
              style={isRunning && !s.soon ? { animationDelay: `${i * 0.14}s` } : undefined}
            />
          ))}

          {/* ── RUN PIPELINE BUTTON ──────────────────────────────────── */}
          {/* Glow halo when running */}
          {isRunning && (
            <rect
              x={BTN_LX - 7} y={BTN_TY - 7}
              width={BTN_W + 14} height={BTN_H + 14}
              rx={13} fill="none"
              stroke="#1060E8" strokeWidth="1" opacity="0.18"
            />
          )}

          {/* Button body */}
          <rect
            x={BTN_LX} y={BTN_TY}
            width={BTN_W} height={BTN_H} rx={8}
            fill={disabled ? '#131313' : isRunning ? '#0A2B74' : '#1060E8'}
            style={{
              transition: 'fill .4s',
              cursor: (!disabled && !isRunning) ? 'pointer' : 'default',
            }}
            onClick={(!disabled && !isRunning) ? onRun : undefined}
          />

          {/* Button text */}
          <text
            x={BTN_CX}
            y={BTN_CY + (statusMsg ? -5 : 5)}
            textAnchor="middle"
            fontSize="13" fontWeight="600"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={disabled ? '#333' : '#FFFFFF'}
            style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .4s' }}
          >
            {isRunning ? 'Running…' : disabled ? 'No API key' : 'Run Pipeline'}
          </text>

          {/* Live status under button label */}
          {statusMsg && (
            <text
              x={BTN_CX} y={BTN_CY + 11}
              textAnchor="middle" fontSize="8"
              fontFamily="system-ui,-apple-system,sans-serif"
              fill="#3A68B8"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {statusMsg}
            </text>
          )}

          {/* Invisible click overlay on top */}
          {!disabled && !isRunning && (
            <rect
              x={BTN_LX} y={BTN_TY}
              width={BTN_W} height={BTN_H} rx={8}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={onRun}
            />
          )}

          {/* ── SOURCE BOXES ─────────────────────────────────────────── */}
          {SOURCES.map((s) => {
            const bx  = s.cx - BOX_W / 2
            const by  = s.cy - BOX_H / 2
            const dim = !!s.soon
            const lit = isRunning && !dim

            return (
              <g key={s.id}>
                {/* Box outline */}
                <rect
                  x={bx} y={by}
                  width={BOX_W} height={BOX_H} rx={7}
                  fill="#0C0C0C"
                  stroke={lit ? s.color : dim ? '#131313' : '#1E1E1E'}
                  strokeWidth={lit ? 1.5 : 1}
                  strokeDasharray={dim ? '5 4' : undefined}
                  className="ph-box"
                />

                {/* Icon circle */}
                <circle
                  cx={bx + 19} cy={s.cy} r={12}
                  fill={lit ? s.color + '18' : '#0F0F0F'}
                  stroke={lit ? s.color : dim ? '#1A1A1A' : '#272727'}
                  strokeWidth="1"
                  className="ph-dot"
                />
                <text
                  x={bx + 19} y={s.cy + 4}
                  textAnchor="middle"
                  fontSize="7.5" fontWeight="700"
                  fontFamily="'SF Mono','Fira Code','Consolas',monospace"
                  fill={lit ? s.color : dim ? '#252525' : '#404040'}
                  style={{ userSelect: 'none', transition: 'fill .4s' }}
                >
                  {s.abbr}
                </text>

                {/* Source name */}
                <text
                  x={bx + 36} y={s.cy + (dim ? -2 : 4)}
                  fontSize="10.5"
                  fontFamily="system-ui,-apple-system,sans-serif"
                  fill={lit ? '#C8C8C8' : dim ? '#242424' : '#545454'}
                  style={{ userSelect: 'none', transition: 'fill .4s' }}
                >
                  {s.label}
                </text>

                {/* "soon" label for coming-soon sources */}
                {dim && (
                  <text
                    x={bx + 36} y={s.cy + 10}
                    fontSize="8"
                    fontFamily="system-ui,-apple-system,sans-serif"
                    fill="#202020"
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
        <p style={{ color: '#242424', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
          {disabled
            ? 'Add VITE_OPENAI_API_KEY in Vercel env vars to get started'
            : 'Click Run Pipeline to begin sourcing'
          }
        </p>
      )}
    </div>
  )
}
