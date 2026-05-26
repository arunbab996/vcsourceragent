// ── Layout ────────────────────────────────────────────────────────────────────
const W = 560, H = 560
const CX = 280, CY = 280   // centre of SVG

const R_INNER = 118        // decorative inner ring
const R_OUTER = 200        // source-orbit ring
const BADGE_R = 24         // source circle radius
const CTR_R   = 64         // centre button radius

// 4 sources placed at 45° offsets (corner positions)
const SOURCES = [
  { abbr: 'PH', label: 'Product Hunt', color: '#DA552F', angle: -45  },  // top-right
  { abbr: 'GH', label: 'GitHub',       color: '#888888', angle:  45  },  // bottom-right
  { abbr: 'YC', label: 'YC',           color: '#FF6600', angle: 135  },  // bottom-left
  { abbr: 'HN', label: 'Show HN',      color: '#FF9500', angle: 225  },  // top-left
]

const toRad = d => d * Math.PI / 180

function srcPos(angle) {
  return {
    x: CX + R_OUTER * Math.cos(toRad(angle)),
    y: CY + R_OUTER * Math.sin(toRad(angle)),
  }
}

// Label anchor: right half → "start", left half → "end"
function labelProps(angle, dist = 36) {
  const rad = toRad(angle)
  return {
    lx: CX + (R_OUTER + dist) * Math.cos(rad),
    ly: CY + (R_OUTER + dist) * Math.sin(rad),
    anchor: Math.cos(rad) >= 0 ? 'start' : 'end',
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PipelineHero({ isRunning, onRun, disabled, agentState }) {
  const statusMsg = (() => {
    if (!isRunning || !agentState?.message) return ''
    const m = agentState.message
    return m.length > 28 ? m.slice(0, 25) + '…' : m
  })()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 11rem)',
        padding: '20px',
      }}
    >
      {/* Eyebrow */}
      <p style={{ color: '#333', fontSize: 10.5, letterSpacing: '0.12em', marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' }}>
        AI-Powered Deal Sourcing
      </p>

      {/* SVG */}
      <div style={{ width: '100%', maxWidth: 480 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', overflow: 'visible' }}
        >
          <defs>
            {/* Centre glow gradient */}
            <radialGradient id="phGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#1060E8" stopOpacity={isRunning ? 0.28 : 0.09} />
              <stop offset="100%" stopColor="#1060E8" stopOpacity="0" />
              {/* animate opacity change */}
            </radialGradient>

            {/* Idle "breath" filter */}
            <filter id="phBlur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="8" />
            </filter>

            <style>{`
              /* Connector lines */
              .ph-line {
                fill: none;
                stroke: #181818;
                stroke-width: 1;
                stroke-dasharray: 6 5;
                transition: stroke .45s;
              }
              .ph-line.lit {
                stroke: #1555D4;
                animation: phFlow .75s linear infinite;
              }
              @keyframes phFlow {
                to { stroke-dashoffset: -11; }
              }

              /* Decorative rings */
              .ph-ring {
                fill: none;
                stroke: #161616;
                stroke-width: 1;
                transition: stroke .45s;
              }
              .ph-ring.lit {
                stroke: #1A1A1A;
              }

              /* Idle centre ping */
              .ph-ping {
                fill: none;
                stroke: #1060E8;
                stroke-width: 1;
                animation: phPing 2.4s ease-out infinite;
                transform-box: fill-box;
                transform-origin: center;
              }
              @keyframes phPing {
                0%   { transform: scale(1);    opacity: .35; }
                100% { transform: scale(1.55); opacity: 0;   }
              }

              /* Centre btn hover */
              .ph-btn {
                cursor: pointer;
                transition: fill .35s;
              }
              .ph-btn:hover rect.ph-btn-fill {
                fill: #163A9C;
              }
            `}</style>
          </defs>

          {/* ── GLOW BLOB at centre ──────────────────────────────── */}
          <circle
            cx={CX} cy={CY} r={110}
            fill="url(#phGlow)"
            style={{ transition: 'opacity .6s', pointerEvents: 'none' }}
          />

          {/* ── IDLE PING (only when not running) ───────────────── */}
          {!isRunning && !disabled && (
            <circle
              cx={CX} cy={CY} r={CTR_R}
              className="ph-ping"
            />
          )}

          {/* ── DECORATIVE RINGS ────────────────────────────────── */}
          <circle cx={CX} cy={CY} r={R_INNER} className={`ph-ring${isRunning ? ' lit' : ''}`} />
          <circle cx={CX} cy={CY} r={R_OUTER} className={`ph-ring${isRunning ? ' lit' : ''}`} />

          {/* ── CONNECTOR LINES (source → centre) ───────────────── */}
          {SOURCES.map((s, i) => {
            const p = srcPos(s.angle)
            return (
              <line
                key={s.id + '-line'}
                x1={p.x} y1={p.y}
                x2={CX}  y2={CY}
                className={`ph-line${isRunning ? ' lit' : ''}`}
                style={isRunning ? { animationDelay: `${i * 0.18}s` } : undefined}
              />
            )
          })}

          {/* ── SOURCE BADGES ────────────────────────────────────── */}
          {SOURCES.map((s) => {
            const p = srcPos(s.angle)
            const { lx, ly, anchor } = labelProps(s.angle)
            return (
              <g key={s.abbr}>
                {/* Halo when running */}
                {isRunning && (
                  <circle
                    cx={p.x} cy={p.y} r={BADGE_R + 6}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="1"
                    opacity="0.2"
                  />
                )}
                {/* Badge circle */}
                <circle
                  cx={p.x} cy={p.y} r={BADGE_R}
                  fill="#0F0F0F"
                  stroke={isRunning ? s.color : '#222'}
                  strokeWidth="1.5"
                  style={{ transition: 'stroke .45s' }}
                />
                {/* Abbreviation */}
                <text
                  x={p.x} y={p.y + 4}
                  textAnchor="middle"
                  fontSize="9" fontWeight="700"
                  fontFamily="'SF Mono','Fira Code','Consolas',monospace"
                  fill={isRunning ? s.color : '#383838'}
                  style={{ transition: 'fill .45s', userSelect: 'none' }}
                >
                  {s.abbr}
                </text>
                {/* Label outside ring */}
                <text
                  x={lx} y={ly + 4}
                  textAnchor={anchor}
                  fontSize="10"
                  fontFamily="system-ui,-apple-system,sans-serif"
                  fill={isRunning ? '#555' : '#2A2A2A'}
                  style={{ transition: 'fill .45s', userSelect: 'none' }}
                >
                  {s.label}
                </text>
              </g>
            )
          })}

          {/* ── CENTRE BUTTON ────────────────────────────────────── */}
          {/* Outer glow ring when running */}
          {isRunning && (
            <circle
              cx={CX} cy={CY} r={CTR_R + 8}
              fill="none"
              stroke="#1060E8"
              strokeWidth="1"
              opacity="0.2"
            />
          )}

          {/* Button body */}
          <circle
            cx={CX} cy={CY} r={CTR_R}
            fill={disabled ? '#141414' : isRunning ? '#0B2E7A' : '#111111'}
            stroke={disabled ? '#1E1E1E' : isRunning ? '#1060E8' : '#262626'}
            strokeWidth={isRunning ? 1.5 : 1}
            style={{
              transition: 'fill .45s, stroke .45s, stroke-width .45s',
              cursor: (!disabled && !isRunning) ? 'pointer' : 'default',
            }}
            onClick={(!disabled && !isRunning) ? onRun : undefined}
          />

          {/* DiscoveryScout logo mark: white square + slash */}
          <rect
            x={CX - 18} y={CY - 34}
            width={36} height={36}
            rx={7}
            fill={disabled ? '#1E1E1E' : '#FFFFFF'}
            style={{ pointerEvents: 'none', transition: 'fill .45s' }}
          />
          <path
            d={`M ${CX - 8} ${CY - 2} L ${CX + 8} ${CY - 28}`}
            stroke={disabled ? '#333' : '#0A0A0A'}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ pointerEvents: 'none', transition: 'stroke .45s' }}
          />

          {/* Button label */}
          <text
            x={CX}
            y={CY + (statusMsg ? 18 : 22)}
            textAnchor="middle"
            fontSize="11.5" fontWeight="600"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={disabled ? '#333' : isRunning ? '#5580CC' : '#666'}
            style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .45s' }}
          >
            {isRunning ? 'Running…' : disabled ? 'No API key' : 'Run Pipeline'}
          </text>

          {/* Status ticker under label */}
          {statusMsg && (
            <text
              x={CX} y={CY + 33}
              textAnchor="middle"
              fontSize="7.5"
              fontFamily="system-ui,-apple-system,sans-serif"
              fill="#2C4E8A"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {statusMsg}
            </text>
          )}

          {/* Invisible click target (sits on top) */}
          {!disabled && !isRunning && (
            <circle
              cx={CX} cy={CY} r={CTR_R}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={onRun}
            />
          )}
        </svg>
      </div>

      {/* Bottom hint */}
      {!isRunning && (
        <p style={{ color: '#272727', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
          {disabled
            ? 'Add VITE_OPENAI_API_KEY in Vercel env vars to get started'
            : 'Click the centre to scan sources and surface investment signals'
          }
        </p>
      )}
    </div>
  )
}
