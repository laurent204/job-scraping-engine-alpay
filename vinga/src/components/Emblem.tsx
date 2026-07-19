import type { Module } from '../data/types'

/**
 * Hand-drawn "rajola" (ceramic tile) emblem for each module —
 * a nod to Catalan modernist tiles.
 */
export function Emblem({ kind, size = 44 }: { kind: Module['emblem']; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none' as const,
    'aria-hidden': true,
  }
  switch (kind) {
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="9.5" fill="currentColor" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            const x1 = 24 + Math.cos(a) * 13.5
            const y1 = 24 + Math.sin(a) * 13.5
            const x2 = 24 + Math.cos(a) * (i % 2 ? 17 : 20)
            const y2 = 24 + Math.sin(a) * (i % 2 ? 17 : 20)
            return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          })}
        </svg>
      )
    case 'numbers':
      return (
        <svg {...common}>
          <text
            x="24"
            y="31"
            textAnchor="middle"
            fontFamily="Fraunces Variable, Georgia, serif"
            fontSize="24"
            fontWeight="700"
            fill="currentColor"
          >
            123
          </text>
          <path d="M10 38h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 6" />
        </svg>
      )
    case 'food':
      return (
        <svg {...common}>
          <circle cx="27" cy="24" r="12.5" stroke="currentColor" strokeWidth="3" />
          <circle cx="27" cy="24" r="5.5" fill="currentColor" />
          <path d="M9 10v9M12.5 10v9M9 14.5h3.5M10.8 19v19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'market':
      return (
        <svg {...common}>
          <path d="M8 20h32v16a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V20z" stroke="currentColor" strokeWidth="3" />
          <path
            d="M6 13l3-5h30l3 5v3a4.2 4.2 0 0 1-8.4 0A4.3 4.3 0 0 1 24 16a4.3 4.3 0 0 1-9.6 0A4.2 4.2 0 0 1 6 16v-3z"
            fill="currentColor"
          />
          <path d="M19 27h10v12H19z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="3" />
          <path d="M24 12l3.6 8.4L24 36l-3.6-15.6L24 12z" fill="currentColor" />
          <circle cx="24" cy="24" r="2.6" fill="var(--crema-2, #fff)" />
        </svg>
      )
  }
}
