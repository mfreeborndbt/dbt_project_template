export function WarehouseIcon({ type }) {
  if (type === 'Snowflake') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#29b5e8" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
    </svg>
  )
  if (type === 'Databricks') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3621" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
      <line x1="12" y1="22" x2="12" y2="15.5"/><line x1="22" y1="8.5" x2="12" y2="15.5"/><line x1="2" y1="8.5" x2="12" y2="15.5"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )
}

export function CloudIcon({ type }) {
  const color = type === 'AWS' ? '#ff9900' : type === 'Azure' ? '#0078d4' : '#4285f4'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  )
}

export function DagsterLogo({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="4" fill="#4f46e5"/>
    </svg>
  )
}

export function DbtLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="15" y="15" width="70" height="70" rx="12" fill="#ff694a" transform="rotate(45 50 50)"/>
      <text x="50" y="62" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white" fontFamily="sans-serif">d</text>
    </svg>
  )
}
