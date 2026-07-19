interface IconProps {
  size?: number
  className?: string
}

const S = ({ size = 24, className, children, viewBox = '0 0 24 24' }: IconProps & { children: React.ReactNode; viewBox?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
)

export const IconSun = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
    <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" />
  </S>
)

export const IconRoute = (p: IconProps) => (
  <S {...p}>
    <circle cx="6" cy="19" r="2.6" />
    <circle cx="18" cy="5" r="2.6" />
    <path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" strokeDasharray="0.1 4.2" />
  </S>
)

export const IconCards = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="6.5" width="12" height="14" rx="3" transform="rotate(-8 9 13.5)" />
    <rect x="9.5" y="4" width="12" height="14" rx="3" transform="rotate(6 15.5 11)" />
  </S>
)

export const IconPerson = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20.2c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4" />
  </S>
)

export const IconClose = (p: IconProps) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
)

export const IconSpeaker = (p: IconProps) => (
  <S {...p}>
    <path d="M4 9.5v5h3.5L12 18.6V5.4L7.5 9.5H4z" fill="currentColor" stroke="currentColor" strokeWidth={1.6} />
    <path d="M15.5 9a4.4 4.4 0 0 1 0 6M18.2 6.6a8 8 0 0 1 0 10.8" />
  </S>
)

export const IconCheck = (p: IconProps) => (
  <S {...p}>
    <path d="M4.5 12.8l5 5L19.5 6.5" />
  </S>
)

export const IconLock = (p: IconProps) => (
  <S {...p}>
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="3" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </S>
)

export const IconChat = (p: IconProps) => (
  <S {...p}>
    <path d="M12 4c-4.7 0-8.5 3-8.5 6.8 0 2.2 1.2 4.1 3.2 5.3-.1 1-.5 2.3-1.6 3.4 1.9-.2 3.4-.9 4.4-1.6.8.2 1.6.3 2.5.3 4.7 0 8.5-3 8.5-6.9S16.7 4 12 4z" />
  </S>
)

export const IconFlame = (p: IconProps) => (
  <S {...p}>
    <path
      d="M12 3c.5 3.2-1.8 4.8-3.1 6.4C7.6 11 7 12.5 7 14a5 5 0 0 0 10 0c0-1.2-.4-2.4-1-3.4-1.2.8-1.9.7-2.6 0C15 7.5 13.8 4.6 12 3z"
      fill="currentColor"
      stroke="none"
    />
  </S>
)

export const IconShard = (p: IconProps) => (
  <S {...p}>
    <path d="M12 2.8L20.5 9l-3.2 11H6.7L3.5 9 12 2.8z" fill="currentColor" stroke="none" opacity={0.92} />
  </S>
)

export const IconBack = (p: IconProps) => (
  <S {...p}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </S>
)

export const IconSettings = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
  </S>
)

export const IconSparkle = (p: IconProps) => (
  <S {...p}>
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.6L12 3z" fill="currentColor" stroke="none" />
    <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.9-.8 2.1-.8-2.1-2.2-.9 2.2-.8.8-2.2z" fill="currentColor" stroke="none" opacity={0.7} />
  </S>
)
