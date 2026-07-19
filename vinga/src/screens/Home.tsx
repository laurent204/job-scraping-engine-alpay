import { motion } from 'framer-motion'
import { MODULES, ALL_LESSONS } from '../data/content'
import type { Lesson, Module } from '../data/types'
import { useStore, SHARDS_PER_LESSON, dailyGoalXp, isUnlocked } from '../store'
import { Mosaic3D } from '../components/Mosaic3D'
import { artworkFor, ARTWORKS } from '../components/artworks'
import { Emblem } from '../components/Emblem'
import { IconChat, IconCheck, IconFlame, IconLock, IconShard } from '../components/Icons'
import { sfx } from '../lib/sfx'

function greeting(): { ca: string; fr: string } {
  const h = new Date().getHours()
  if (h < 12) return { ca: 'Bon dia!', fr: 'Prêt pour ta dose de catalan ?' }
  if (h < 19) return { ca: 'Bona tarda!', fr: 'Prêt pour ta dose de catalan ?' }
  return { ca: 'Bona nit!', fr: 'Une petite leçon avant de dormir ?' }
}

/** Winding path offsets, one per node row */
const OFFSETS = [0, -72, -34, 48, 72, 20, -60, 0]
const ROW_H = 96

function offsetFor(globalIndex: number): number {
  return OFFSETS[globalIndex % OFFSETS.length]
}

function PathSvg({ count, startIndex }: { count: number; startIndex: number }) {
  const points = Array.from({ length: count }, (_, i) => ({
    x: offsetFor(startIndex + i),
    y: i * ROW_H + ROW_H / 2,
  }))
  const d = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const my = (prev.y + p.y) / 2
      return `C ${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`
    })
    .join(' ')
  return (
    <svg
      className="ruta-path"
      viewBox={`-160 0 320 ${count * ROW_H}`}
      style={{ height: count * ROW_H }}
      preserveAspectRatio="xMidYMin meet"
    >
      <path
        d={d}
        fill="none"
        stroke="rgba(94, 48, 18, 0.18)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray="0.5 15"
      />
    </svg>
  )
}

function LessonNode({
  entry,
  globalIndex,
  state,
  color,
  isCurrent,
}: {
  entry: { module: Module; lesson: Lesson }
  globalIndex: number
  state: 'done' | 'open' | 'locked'
  color: string
  isCurrent: boolean
}) {
  const openLesson = useStore((s) => s.openLesson)
  const { lesson } = entry
  const numInModule = entry.module.lessons.filter((l) => l.kind === 'words').indexOf(lesson) + 1

  return (
    <div className="ruta-row" style={{ height: ROW_H }}>
      <motion.button
        className={`node node--${state} ${lesson.kind === 'dialogue' ? 'node--dialogue' : ''}`}
        style={
          {
            translateX: offsetFor(globalIndex),
            '--node-color': `var(--${color})`,
            '--node-fosc': `var(--${color}-fosc)`,
          } as React.CSSProperties
        }
        whileTap={state !== 'locked' ? { scale: 0.9 } : undefined}
        onClick={() => {
          if (state === 'locked') {
            sfx.wrong()
            return
          }
          sfx.tap()
          openLesson(lesson.id)
        }}
        aria-label={lesson.title}
      >
        {isCurrent && (
          <motion.span
            className="node-hint"
            style={{ x: '-50%' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{ y: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
          >
            Comença aquí !
          </motion.span>
        )}
        <span className="node-face">
          {isCurrent && <span className="node-pulse" />}
          {state === 'done' ? (
            <IconCheck size={26} />
          ) : state === 'locked' ? (
            <IconLock size={22} />
          ) : lesson.kind === 'dialogue' ? (
            <IconChat size={26} />
          ) : (
            <span className="node-num">{numInModule}</span>
          )}
        </span>
        <span className="node-title">{lesson.kind === 'dialogue' ? `Conversa · ${lesson.title}` : lesson.title}</span>
      </motion.button>
    </div>
  )
}

export function Home() {
  const lessonsDone = useStore((s) => s.lessonsDone)
  const streak = useStore((s) => s.streak)
  const todayXp = useStore((s) => s.todayXp)
  const goalMin = useStore((s) => s.goalMin)
  const shards = Object.keys(lessonsDone).length * SHARDS_PER_LESSON

  const g = greeting()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const streakLive = streak.lastDay === todayStr ? streak.count : streak.count > 0 ? streak.count : 0
  const goal = dailyGoalXp(goalMin)
  const goalPct = Math.min(1, (todayXp.day === todayStr ? todayXp.xp : 0) / goal)

  const currentIndex = ALL_LESSONS.findIndex((e) => !lessonsDone[e.lesson.id])
  const artwork = artworkFor(shards)
  let globalIndex = 0

  return (
    <div className="scroll home">
      <header className="home-header">
        <div>
          <motion.h1
            className="t-display home-greet"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {g.ca}
          </motion.h1>
          <p className="home-sub">{g.fr}</p>
        </div>
        <div className={`streak-chip ${streakLive > 0 ? 'is-hot' : ''}`}>
          <IconFlame size={18} />
          <span>{streakLive}</span>
        </div>
      </header>

      <motion.section
        className="hero"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.05 }}
      >
        <Mosaic3D shards={shards} height={225} />
        <div className="hero-caption">
          <div className="hero-stat">
            <IconShard size={15} />
            <span>
              <strong>{artwork.placed}</strong>/{artwork.faces} tessel·les
            </span>
          </div>
          <div className="hero-goal">
            <svg width="34" height="34" viewBox="0 0 34 34">
              <circle cx="17" cy="17" r="13.5" fill="none" stroke="var(--crema-3)" strokeWidth="5" />
              <motion.circle
                cx="17"
                cy="17"
                r="13.5"
                fill="none"
                stroke="var(--sol)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 13.5}`}
                animate={{ strokeDashoffset: 2 * Math.PI * 13.5 * (1 - goalPct) }}
                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                transform="rotate(-90 17 17)"
              />
            </svg>
            <span className="hero-goal-txt">
              {todayXp.day === todayStr ? todayXp.xp : 0}
              <em>/{goal} XP</em>
            </span>
          </div>
        </div>
        <p className="hero-hook">
          Œuvre {artwork.index + 1}/{ARTWORKS.length} : « {artwork.name} » — chaque leçon pose ses tesselles.
        </p>
      </motion.section>

      <div className="ruta">
        {MODULES.map((module, mi) => {
          const doneCount = module.lessons.filter((l) => lessonsDone[l.id]).length
          const startIndex = globalIndex
          const nodes = module.lessons.map((lesson) => {
            const gi = globalIndex++
            const state: 'done' | 'open' | 'locked' = lessonsDone[lesson.id]
              ? 'done'
              : isUnlocked(gi, lessonsDone)
                ? 'open'
                : 'locked'
            return (
              <LessonNode
                key={lesson.id}
                entry={{ module, lesson }}
                globalIndex={gi}
                state={state}
                color={module.color}
                isCurrent={gi === currentIndex}
              />
            )
          })
          return (
            <section key={module.id} className="modul">
              <motion.div
                className="modul-card"
                style={{ '--mc': `var(--${module.color})`, '--mc-clar': `var(--${module.color}-clar)` } as React.CSSProperties}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <div className="modul-emblem">
                  <Emblem kind={module.emblem} size={40} />
                </div>
                <div className="modul-txt">
                  <span className="t-label">
                    Module {mi + 1} · {doneCount}/{module.lessons.length}
                  </span>
                  <h2 className="t-display modul-title">{module.titleCa}</h2>
                  <p className="modul-desc">
                    {module.title} — {module.description}
                  </p>
                </div>
              </motion.div>
              <div className="ruta-nodes">
                <PathSvg count={module.lessons.length} startIndex={startIndex} />
                {nodes}
              </div>
            </section>
          )
        })}
        <div className="ruta-end">
          <span className="t-display">I ara què?</span>
          <p>L’aventure continue — d’autres quartiers arriveront, poc a poc.</p>
        </div>
      </div>
    </div>
  )
}
