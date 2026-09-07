/**
 * Minimal spaced-repetition scheduler ("Repàs").
 * Words enter the deck when learned; misses reset them,
 * successes stretch the interval (10 min → 1 d → ×2.5).
 */

export interface SrsEntry {
  due: number // epoch ms
  ivl: number // current interval in ms
  seen: number
  lapses: number
}

const TEN_MIN = 10 * 60 * 1000
const ONE_DAY = 24 * 60 * 60 * 1000

export function initialEntry(now: number): SrsEntry {
  return { due: now + ONE_DAY, ivl: ONE_DAY, seen: 1, lapses: 0 }
}

export function reviewSuccess(e: SrsEntry, now: number): SrsEntry {
  const ivl = Math.max(e.ivl * 2.5, ONE_DAY)
  return { due: now + ivl, ivl, seen: e.seen + 1, lapses: e.lapses }
}

export function reviewFailure(e: SrsEntry, now: number): SrsEntry {
  return { due: now + TEN_MIN, ivl: TEN_MIN, seen: e.seen + 1, lapses: e.lapses + 1 }
}

export function dueWords(srs: Record<string, SrsEntry>, now: number): string[] {
  return Object.entries(srs)
    .filter(([, e]) => e.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id)
}
