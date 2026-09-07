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
    case 'weather':
      return (
        <svg {...common}>
          <circle cx="18" cy="17" r="7.5" fill="currentColor" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return (
              <path
                key={i}
                d={`M${18 + Math.cos(a) * 10.5} ${17 + Math.sin(a) * 10.5}L${18 + Math.cos(a) * 13.5} ${17 + Math.sin(a) * 13.5}`}
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            )
          })}
          <path
            d="M20 34a6 6 0 0 1 6-5.6 7 7 0 0 1 13.4 2A5 5 0 0 1 38 40H25a5.5 5.5 0 0 1-5-6z"
            fill="currentColor"
            opacity="0.55"
          />
        </svg>
      )
    case 'family':
      return (
        <svg {...common}>
          <circle cx="17" cy="15" r="5.5" stroke="currentColor" strokeWidth="3" />
          <circle cx="32" cy="17" r="4.5" stroke="currentColor" strokeWidth="3" />
          <path
            d="M6.5 39c1.4-6 5.5-9 10.5-9s9.1 3 10.5 9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M28.5 34c1.2-3.6 3.9-5.4 7-5.4 2.8 0 5.2 1.4 6.5 4.4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M37 10.5l1 2.3 2.3 1-2.3 1-1 2.2-1-2.2-2.3-1 2.3-1 1-2.3z" fill="currentColor" />
        </svg>
      )
    case 'beach':
      return (
        <svg {...common}>
          <path d="M24 10c-7 0-12 5-13 11 4-2.6 8.6-4 13-4s9 1.4 13 4c-1-6-6-11-13-11z" fill="currentColor" />
          <path d="M24 11v22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M8 38c3-2.5 6-2.5 9 0s6 2.5 9 0 6-2.5 9 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      )
  }
}
