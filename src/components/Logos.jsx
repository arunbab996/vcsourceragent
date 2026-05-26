export function ProductHuntLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#DA552F" />
      <path d="M23.5 15.5h-8v9h3v-3h5a3 3 0 0 0 0-6zm0 4h-5v-1.5h5a.75.75 0 0 1 0 1.5z" fill="white" />
    </svg>
  )
}

export function GitHubLogo({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function YCLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="5" fill="#FF6600" />
      <path d="M11.5 10.5l8.5 14 8.5-14h-4.5L20 18l-4-7.5h-4zm6.5 16v5h4v-5h-4z" fill="white" />
    </svg>
  )
}

export function ShowHNLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="5" fill="#1A1A1A" />
      <rect width="40" height="40" rx="5" stroke="#FF6600" strokeWidth="2" />
      <path d="M10 12v16M10 20h10M20 12v16M25 12v16l5-8-5-8z" stroke="#FF6600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HNHiringLogo({ size = 16 }) {
  // HN orange square + briefcase silhouette
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="5" fill="#1A1A1A" />
      <rect width="40" height="40" rx="5" stroke="#FF6600" strokeWidth="2" />
      {/* Briefcase */}
      <rect x="9" y="17" width="22" height="15" rx="2" fill="none" stroke="#FF6600" strokeWidth="2.2" />
      <path d="M15 17v-3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" stroke="#FF6600" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 24h22" stroke="#FF6600" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function EdgarLogo({ size = 16 }) {
  // SEC shield + document icon
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="5" fill="#0D1B2A" />
      {/* Shield */}
      <path d="M20 7 L31 12 L31 21 C31 27 25.5 32 20 34 C14.5 32 9 27 9 21 L9 12 Z"
        fill="none" stroke="#4A90D9" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Dollar sign */}
      <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#4A90D9" fontFamily="serif">$</text>
    </svg>
  )
}

export function DiscoveryScoutLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#1060E8" />
      <circle cx="14" cy="14" r="6" stroke="white" strokeWidth="2.5" />
      <path d="M19 19l5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
