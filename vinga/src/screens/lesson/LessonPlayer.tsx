import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { lessonById } from '../../data/content'
import { buildExercises, type Exercise } from '../../data/exercises'
import { useStore } from '../../store'
import { ttsAvailable } from '../../lib/tts'
import { prefetchNeural } from '../../lib/neuralVoice'
import { sfx } from '../../lib/sfx'
import { IconClose, IconShard, IconSparkle } from '../../components/Icons'
import { ShardBurst } from '../../components/ShardBurst'
import { BuildView, DiscoverView, EchoView, ListenView, PairsView, QcmView, type Phase } from './exviews'
import { DialoguePlayer } from './DialoguePlayer'

const PRAISE = ['Molt bé!', 'Perfecte!', 'Genial!', 'Fantàstic!', 'Vinga, sí!', 'Bravo!']
const OOPS = ['Ups!', 'Gairebé!', 'Quasi!', 'No passa res!']

const spring = { type: 'spring', stiffness: 380, damping: 32 } as const

function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / 900))
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, delay])
  return <>{v}</>
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const entry = lessonById.get(lessonId)
  const closeOverlay = useStore((s) => s.closeOverlay)
  const completeLesson = useStore((s) => s.completeLesson)

  const isDialogue = entry?.lesson.kind === 'dialogue'
  const [queue, setQueue] = useState<Exercise[]>(() =>
    entry && !isDialogue ? buildExercises(entry.lesson, ttsAvailable()) : [],
  )
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [feedback, setFeedback] = useState<{ title: string; correct: string }>({ title: '', correct: '' })
  const [dlgProgress, setDlgProgress] = useState(0)
  const [showQuit, setShowQuit] = useState(false)
  const [result, setResult] = useState<null | { xp: number; shards: number; accuracy: number }>(null)

  const mistakes = useRef(0)
  const answered = useRef(0)
  const retried = useRef(new Set<number>())
  const finished = useRef(false)

  const exercise = queue[idx]
  const progress = isDialogue ? dlgProgress : queue.length === 0 ? 0 : idx / queue.length

  // warm the digital voice for everything this lesson will say
  useEffect(() => {
    if (!entry) return
    const texts: string[] = []
    for (const word of entry.lesson.words ?? []) {
      texts.push(word.ca)
      if (word.ex) texts.push(word.ex.ca)
    }
    for (const turn of entry.lesson.dialogue?.turns ?? []) {
      if (turn.kind === 'npc') texts.push(turn.ca)
      else texts.push(...turn.choices.filter((c) => c.ok).map((c) => c.ca))
    }
    prefetchNeural(texts)
  }, [entry])

  const finish = () => {
    if (finished.current || !entry) return
    finished.current = true
    const accuracy = answered.current === 0 ? 1 : Math.max(0, 1 - mistakes.current / answered.current)
    const wordIds = (entry.lesson.words ?? []).map((w) => w.id)
    const { xpGained, shardsGained } = completeLesson(entry.lesson.id, accuracy, wordIds)
    sfx.complete()
    setResult({ xp: xpGained, shards: shardsGained, accuracy })
  }

  const report = (ok: boolean, correct: string) => {
    answered.current += 1
    if (ok) {
      sfx.correct()
      setFeedback({ title: PRAISE[Math.floor(Math.random() * PRAISE.length)], correct })
      setPhase('ok')
    } else {
      sfx.wrong()
      mistakes.current += 1
      setFeedback({ title: OOPS[Math.floor(Math.random() * OOPS.length)], correct })
      setPhase('ko')
      // recycle the exercise once at the end of the queue
      if (!retried.current.has(idx) && exercise && exercise.kind !== 'pairs' && exercise.kind !== 'echo') {
        retried.current.add(idx)
        setQueue((q) => [...q, exercise])
      }
    }
  }

  const next = () => {
    setPhase('idle')
    if (idx + 1 >= queue.length) finish()
    else setIdx(idx + 1)
  }

  const tidbit = useMemo(() => {
    const tidbits = entry?.module.tidbits ?? []
    return tidbits[Math.floor(Math.random() * tidbits.length)]
  }, [entry])

  if (!entry) return null
  const color = entry.module.color

  /* ---------- completion screen ---------- */
  if (result) {
    return (
      <motion.div className="lesson complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ShardBurst trigger={1} origin={0.3} />
        <div className="complete-inner">
          <motion.span
            className="complete-emoji"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
          >
            {result.accuracy >= 0.9 ? '🏆' : result.accuracy >= 0.6 ? '☀️' : '💪'}
          </motion.span>
          <motion.h1
            className="t-display complete-title"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.25 }}
          >
            {result.accuracy >= 0.9 ? 'Impecable!' : 'Molt bé!'}
          </motion.h1>
          <motion.p
            className="complete-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            « {entry.lesson.titleCa} » — {entry.lesson.title}, c’est fait.
          </motion.p>
          <motion.div
            className="complete-stats"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.5 }}
          >
            <div className="stat-tile stat-tile--sol">
              <span className="stat-big">
                +<CountUp to={result.xp} delay={600} />
              </span>
              <span className="stat-label">XP</span>
            </div>
            <div className="stat-tile stat-tile--terra">
              <span className="stat-big">
                <CountUp to={Math.round(result.accuracy * 100)} delay={600} />%
              </span>
              <span className="stat-label">précision</span>
            </div>
            <div className="stat-tile stat-tile--mar">
              <span className="stat-big">
                +<CountUp to={result.shards} delay={600} />
              </span>
              <span className="stat-label">
                <IconShard size={12} /> tessel·les
              </span>
            </div>
          </motion.div>
          {tidbit && (
            <motion.div
              className="tidbit"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.75 }}
            >
              <span className="tidbit-head">
                <IconSparkle size={16} /> Ho sabies?
              </span>
              <p>{tidbit}</p>
            </motion.div>
          )}
        </div>
        <div className="lesson-footer">
          <button
            className="btn btn-primary"
            onClick={() => {
              sfx.tap()
              closeOverlay()
            }}
          >
            Continuer
          </button>
        </div>
      </motion.div>
    )
  }

  /* ---------- live lesson ---------- */
  return (
    <div className="lesson" style={{ '--accent': `var(--${color})` } as React.CSSProperties}>
      <header className="lesson-top">
        <button
          className="lesson-close"
          onClick={() => {
            sfx.tap()
            setShowQuit(true)
          }}
          aria-label="Quitter"
        >
          <IconClose size={22} />
        </button>
        <div className="lesson-progress">
          <motion.div
            className="lesson-progress-fill"
            animate={{ width: `${Math.max(4, progress * 100)}%` }}
            transition={{ type: 'spring', stiffness: 170, damping: 26 }}
          />
        </div>
      </header>

      {isDialogue ? (
        <DialoguePlayer
          dialogue={entry.lesson.dialogue!}
          onProgress={(done, total) => setDlgProgress(done / total)}
          onMistake={() => {
            mistakes.current += 1
            answered.current += 1
          }}
          onComplete={() => {
            answered.current = Math.max(answered.current, 1)
            finish()
          }}
        />
      ) : (
        <div className="lesson-body scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              className="lesson-exercise"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {exercise?.kind === 'discover' && <DiscoverView word={exercise.word} next={next} />}
              {exercise?.kind === 'qcm' && <QcmView exercise={exercise} phase={phase} report={report} />}
              {exercise?.kind === 'listen' && <ListenView exercise={exercise} phase={phase} report={report} />}
              {exercise?.kind === 'pairs' && <PairsView exercise={exercise} report={report} />}
              {exercise?.kind === 'echo' && <EchoView word={exercise.word} phase={phase} report={report} next={next} />}
              {exercise?.kind === 'build' && <BuildView exercise={exercise} phase={phase} report={report} />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* feedback banner */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            className={`feedback feedback--${phase}`}
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            exit={{ y: '105%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            <div className="feedback-txt">
              <strong className="t-display">{feedback.title}</strong>
              {feedback.correct && (
                <span>
                  {phase === 'ko' ? 'La bonne réponse : ' : ''}
                  <em>{feedback.correct}</em>
                </span>
              )}
            </div>
            <button className={`btn ${phase === 'ok' ? 'btn-ok' : 'btn-primary'}`} onClick={next}>
              Continuer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* quit sheet */}
      <AnimatePresence>
        {showQuit && (
          <>
            <motion.div
              className="sheet-veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuit(false)}
            />
            <motion.div
              className="sheet"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              exit={{ y: '110%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              <span className="sheet-emoji">🥺</span>
              <h3 className="t-display">Déjà ?</h3>
              <p>Si tu pars maintenant, la progression de cette leçon sera perdue.</p>
              <button className="btn btn-primary" onClick={() => setShowQuit(false)}>
                Je continue
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowQuit(false)
                  closeOverlay()
                }}
              >
                Quitter la leçon
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
