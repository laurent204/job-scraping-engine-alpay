import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ALL_LESSONS } from './data/content'
import { initialEntry, reviewFailure, reviewSuccess, type SrsEntry } from './lib/srs'
import { setSoundEnabled } from './lib/sfx'

/** Tiles added to the mosaic per completed lesson (20 lessons × 16 = 320 faces) */
export const SHARDS_PER_LESSON = 16
export const TOTAL_SHARDS = ALL_LESSONS.length * SHARDS_PER_LESSON

export type Tab = 'ruta' | 'repas' | 'perfil'
export type Overlay = null | { kind: 'lesson'; lessonId: string } | { kind: 'review' }

function dayString(t: number) {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface State {
  // persisted
  onboarded: boolean
  goalMin: 5 | 10 | 15
  sound: boolean
  xp: number
  todayXp: { day: string; xp: number }
  streak: { count: number; lastDay: string }
  lessonsDone: Record<string, { best: number; times: number }>
  srs: Record<string, SrsEntry>
  // ephemeral navigation
  tab: Tab
  overlay: Overlay

  completeOnboarding: (goal: 5 | 10 | 15) => void
  setSound: (on: boolean) => void
  setTab: (t: Tab) => void
  openLesson: (lessonId: string) => void
  openReview: () => void
  closeOverlay: () => void
  completeLesson: (lessonId: string, accuracy: number, wordIds: string[]) => { xpGained: number; shardsGained: number }
  reviewResult: (wordId: string, ok: boolean) => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      onboarded: false,
      goalMin: 10,
      sound: true,
      xp: 0,
      todayXp: { day: dayString(Date.now()), xp: 0 },
      streak: { count: 0, lastDay: '' },
      lessonsDone: {},
      srs: {},
      tab: 'ruta',
      overlay: null,

      completeOnboarding: (goal) => set({ onboarded: true, goalMin: goal }),
      setSound: (on) => {
        setSoundEnabled(on)
        set({ sound: on })
      },
      setTab: (t) => set({ tab: t }),
      openLesson: (lessonId) => set({ overlay: { kind: 'lesson', lessonId } }),
      openReview: () => set({ overlay: { kind: 'review' } }),
      closeOverlay: () => set({ overlay: null }),

      completeLesson: (lessonId, accuracy, wordIds) => {
        const s = get()
        const now = Date.now()
        const today = dayString(now)
        const already = s.lessonsDone[lessonId]
        const first = !already

        const xpGained = first ? 20 + Math.round(accuracy * 10) : 10 + Math.round(accuracy * 5)
        const shardsGained = first ? SHARDS_PER_LESSON : 0

        // streak
        const yesterday = dayString(now - 86400000)
        let streak = s.streak
        if (streak.lastDay !== today) {
          streak = { count: streak.lastDay === yesterday ? streak.count + 1 : 1, lastDay: today }
        }

        // srs: new words enter the review deck
        const srs = { ...s.srs }
        for (const id of wordIds) {
          if (!srs[id]) srs[id] = initialEntry(now)
        }

        const todayXp = s.todayXp.day === today ? { day: today, xp: s.todayXp.xp + xpGained } : { day: today, xp: xpGained }

        set({
          xp: s.xp + xpGained,
          todayXp,
          streak,
          srs,
          lessonsDone: {
            ...s.lessonsDone,
            [lessonId]: { best: Math.max(already?.best ?? 0, accuracy), times: (already?.times ?? 0) + 1 },
          },
        })
        return { xpGained, shardsGained }
      },

      reviewResult: (wordId, ok) => {
        const s = get()
        const now = Date.now()
        const entry = s.srs[wordId] ?? initialEntry(now)
        set({
          srs: { ...s.srs, [wordId]: ok ? reviewSuccess(entry, now) : reviewFailure(entry, now) },
          xp: s.xp + (ok ? 2 : 0),
          todayXp:
            s.todayXp.day === dayString(now)
              ? { day: s.todayXp.day, xp: s.todayXp.xp + (ok ? 2 : 0) }
              : { day: dayString(now), xp: ok ? 2 : 0 },
        })
      },
    }),
    {
      name: 'vinga-v1',
      partialize: (s) => ({
        onboarded: s.onboarded,
        goalMin: s.goalMin,
        sound: s.sound,
        xp: s.xp,
        todayXp: s.todayXp,
        streak: s.streak,
        lessonsDone: s.lessonsDone,
        srs: s.srs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) setSoundEnabled(state.sound)
      },
    },
  ),
)

/** Number of mosaic tiles earned so far */
export function useShards(): number {
  return useStore((s) => Object.keys(s.lessonsDone).length * SHARDS_PER_LESSON)
}

/** Index of the first lesson not yet completed (-1 when everything is done) */
export function nextLessonIndex(lessonsDone: Record<string, unknown>): number {
  return ALL_LESSONS.findIndex((e) => !lessonsDone[e.lesson.id])
}

/** A lesson is unlocked when it's the first one or the previous one is done */
export function isUnlocked(index: number, lessonsDone: Record<string, unknown>): boolean {
  if (index === 0) return true
  const prev = ALL_LESSONS[index - 1]
  return !!lessonsDone[prev.lesson.id]
}

export const dailyGoalXp = (goalMin: number) => goalMin * 10
