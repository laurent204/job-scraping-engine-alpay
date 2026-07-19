/**
 * Pronunciation check via the Web Speech API (SpeechRecognition).
 * Available mostly in Chrome/Edge/Safari; the exercise falls back to
 * self-paced repetition when the API is missing.
 */

interface RecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function recognitionCtor(): (new () => RecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => RecognitionLike) | null
}

export function speechRecognitionAvailable(): boolean {
  return typeof window !== 'undefined' && recognitionCtor() != null
}

/** Strip accents/punctuation so "Gracies" matches "Gràcies!" */
export function normalizeCa(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Lenient match: every word of the target appears in the transcript */
export function matchesTarget(transcript: string, target: string): boolean {
  const t = normalizeCa(transcript)
  const words = normalizeCa(target).split(' ').filter(Boolean)
  if (words.length === 0) return false
  const hit = words.filter((word) => t.includes(word)).length
  return hit / words.length >= 0.7
}

/**
 * Listens once and resolves with the transcript ('' on error/silence).
 * Returns a cancel function alongside the promise.
 */
export function listenOnce(lang = 'ca-ES'): { result: Promise<string>; cancel: () => void } {
  const Ctor = recognitionCtor()
  if (!Ctor) return { result: Promise.resolve(''), cancel: () => {} }
  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 3
  let settled = false
  let resolveFn: (s: string) => void
  const result = new Promise<string>((resolve) => {
    resolveFn = resolve
  })
  const settle = (value: string) => {
    if (!settled) {
      settled = true
      resolveFn(value)
    }
  }
  rec.onresult = (e) => {
    const alts = e.results[0]
    const best = Array.from({ length: alts.length }, (_, i) => alts[i].transcript).join(' ')
    settle(best)
  }
  rec.onerror = () => settle('')
  rec.onend = () => settle('')
  try {
    rec.start()
  } catch {
    settle('')
  }
  return {
    result,
    cancel: () => {
      try {
        rec.abort()
      } catch {
        /* already stopped */
      }
      settle('')
    },
  }
}
