import type { Lesson, Word } from './types'
import { MODULES } from './content'

export type Exercise =
  | { kind: 'discover'; word: Word }
  | { kind: 'qcm'; prompt: Word; options: Word[]; direction: 'fr-ca' | 'ca-fr' }
  | { kind: 'listen'; prompt: Word; options: Word[] }
  | { kind: 'pairs'; words: Word[] }
  | { kind: 'build'; word: Word; sentence: { ca: string; fr: string } }
  | { kind: 'echo'; word: Word }

/** Deterministic PRNG so a lesson always has the same shape */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pool of plausible distractors: same lesson first, then same module */
function distractorPool(word: Word, lesson: Lesson): Word[] {
  const module = MODULES.find((m) => m.lessons.some((l) => l.id === lesson.id))
  const sameLesson = (lesson.words ?? []).filter((x) => x.id !== word.id)
  const sameModule =
    module?.lessons.flatMap((l) => l.words ?? []).filter((x) => x.id !== word.id && !sameLesson.includes(x)) ?? []
  return [...sameLesson, ...sameModule]
}

function pickDistractors(word: Word, lesson: Lesson, n: number, rnd: () => number): Word[] {
  const pool = distractorPool(word, lesson)
  return shuffle(pool, rnd).slice(0, n)
}

/**
 * Builds the exercise sequence for a vocabulary lesson.
 * Rhythm: discover two words, practice them, repeat — then mixed recall.
 */
export function buildExercises(lesson: Lesson, ttsAvailable: boolean): Exercise[] {
  const words = lesson.words ?? []
  const rnd = mulberry32(hashCode(lesson.id))
  const out: Exercise[] = []

  for (let i = 0; i < words.length; i += 2) {
    const a = words[i]
    const b = words[i + 1]
    out.push({ kind: 'discover', word: a })
    if (b) out.push({ kind: 'discover', word: b })
    out.push({ kind: 'qcm', prompt: a, options: shuffle([a, ...pickDistractors(a, lesson, 3, rnd)], rnd), direction: 'fr-ca' })
    if (b) {
      const kind = ttsAvailable && rnd() > 0.5 ? 'listen' : 'qcm'
      if (kind === 'listen') {
        out.push({ kind: 'listen', prompt: b, options: shuffle([b, ...pickDistractors(b, lesson, 2, rnd)], rnd) })
      } else {
        out.push({ kind: 'qcm', prompt: b, options: shuffle([b, ...pickDistractors(b, lesson, 3, rnd)], rnd), direction: 'ca-fr' })
      }
    }
  }

  // Mixed recall: pairs + pronunciation + sentence building + reverse checks
  out.push({ kind: 'pairs', words: shuffle(words, rnd).slice(0, Math.min(5, words.length)) })
  out.push({ kind: 'echo', word: shuffle(words, rnd)[0] })

  const withEx = words.filter((x) => x.ex)
  if (withEx.length > 0) {
    const chosen = shuffle(withEx, rnd)[0]
    out.push({ kind: 'build', word: chosen, sentence: chosen.ex! })
  }

  const recall = shuffle(words, rnd).slice(0, 2)
  for (const word of recall) {
    out.push({
      kind: 'qcm',
      prompt: word,
      options: shuffle([word, ...pickDistractors(word, lesson, 3, rnd)], rnd),
      direction: rnd() > 0.5 ? 'fr-ca' : 'ca-fr',
    })
  }

  return out
}

/** Splits a Catalan sentence into buildable chips */
export function sentenceChips(ca: string): string[] {
  return ca
    .replace(/[.!?…]/g, '')
    .split(' ')
    .filter(Boolean)
}
