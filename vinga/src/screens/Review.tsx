import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { wordById } from '../data/content'
import { dueWords } from '../lib/srs'
import { speak, ttsAvailable } from '../lib/tts'
import { sfx } from '../lib/sfx'
import { IconCards, IconClose, IconSpeaker } from '../components/Icons'
import type { Word } from '../data/types'

const spring = { type: 'spring', stiffness: 360, damping: 30 } as const

/* ------------------------- tab screen ------------------------- */

export function ReviewTab() {
  const srs = useStore((s) => s.srs)
  const openReview = useStore((s) => s.openReview)
  const due = dueWords(srs, Date.now())
  const learned = Object.keys(srs).length

  return (
    <div className="scroll review">
      <header className="review-header">
        <h1 className="t-display">Repàs</h1>
        <p className="home-sub">La mémoire aime qu’on la taquine.</p>
      </header>

      {learned === 0 ? (
        <div className="review-empty">
          <span className="review-empty-emoji">🌱</span>
          <h2 className="t-display">Rien à réviser… encore</h2>
          <p>Termine ta première leçon et tes mots viendront vivre ici.</p>
        </div>
      ) : due.length === 0 ? (
        <div className="review-empty">
          <span className="review-empty-emoji">😴</span>
          <h2 className="t-display">Tot al dia!</h2>
          <p>
            Tes {learned} mots sont bien au chaud. Reviens plus tard — la répétition espacée fait le reste.
          </p>
        </div>
      ) : (
        <motion.div className="review-due" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <div className="review-due-count">
            <IconCards size={30} />
            <div>
              <strong>{due.length} mot{due.length > 1 ? 's' : ''}</strong>
              <span>à réviser maintenant</span>
            </div>
          </div>
          <button
            className="btn btn-sol"
            onClick={() => {
              sfx.tap()
              openReview()
            }}
          >
            Comença el repàs
          </button>
        </motion.div>
      )}

      {learned > 0 && (
        <div className="review-deck">
          <span className="t-label">Ton coffre à mots · {learned}</span>
          <div className="review-words">
            {Object.keys(srs)
              .slice()
              .reverse()
              .slice(0, 24)
              .map((id) => {
                const word = wordById.get(id)
                if (!word) return null
                return (
                  <button key={id} className="review-word" onClick={() => speak(word.ca)}>
                    <span>{word.emoji}</span> {word.ca}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ----------------------- review session ----------------------- */

interface Question {
  word: Word
  direction: 'fr-ca' | 'ca-fr'
  options: Word[]
}

export function ReviewSession() {
  const srs = useStore((s) => s.srs)
  const reviewResult = useStore((s) => s.reviewResult)
  const closeOverlay = useStore((s) => s.closeOverlay)

  const questions = useMemo<Question[]>(() => {
    const due = dueWords(srs, Date.now()).slice(0, 10)
    const all = [...wordById.values()]
    return due
      .map((id) => wordById.get(id))
      .filter((w): w is Word => !!w)
      .map((word, i) => {
        const distractors = all
          .filter((x) => x.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        return {
          word,
          direction: i % 2 === 0 ? 'fr-ca' : 'ca-fr',
          options: [word, ...distractors].sort(() => Math.random() - 0.5),
        }
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const q = questions[idx]
  const finished = idx >= questions.length

  if (questions.length === 0 || finished) {
    return (
      <div className="lesson complete">
        <div className="complete-inner">
          <motion.span className="complete-emoji" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
            🧠
          </motion.span>
          <h1 className="t-display complete-title">Repàs fet!</h1>
          <p className="complete-sub">
            {questions.length === 0 ? 'Tout est déjà à jour.' : `${score}/${questions.length} — ta mosaïque de mots tient bon.`}
          </p>
        </div>
        <div className="lesson-footer">
          <button className="btn btn-primary" onClick={closeOverlay}>
            Continuer
          </button>
        </div>
      </div>
    )
  }

  const frToCa = q.direction === 'fr-ca'
  const answered = picked != null

  return (
    <div className="lesson">
      <header className="lesson-top">
        <button className="lesson-close" onClick={closeOverlay} aria-label="Fermer">
          <IconClose size={22} />
        </button>
        <div className="lesson-progress">
          <motion.div
            className="lesson-progress-fill"
            animate={{ width: `${Math.max(4, (idx / questions.length) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 170, damping: 26 }}
          />
        </div>
      </header>
      <div className="lesson-body scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="lesson-exercise"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={spring}
          >
            <div className="ex">
              <span className="t-label ex-kind">{frToCa ? 'Comment dit-on… ?' : 'Que veut dire… ?'}</span>
              <div className="ex-prompt">
                {frToCa ? (
                  <h2 className="t-display ex-prompt-word">{q.word.fr}</h2>
                ) : (
                  <>
                    <h2 className="t-display ex-prompt-word ex-prompt-ca" onClick={() => speak(q.word.ca)}>
                      {q.word.ca}
                    </h2>
                    <button className="phon-chip" onClick={() => speak(q.word.ca)}>
                      {ttsAvailable() && <IconSpeaker size={15} />}
                      <span>{q.word.phon}</span>
                    </button>
                  </>
                )}
              </div>
              <div className="ex-options">
                {q.options.map((option) => {
                  const isAnswer = option.id === q.word.id
                  const cls = answered && isAnswer ? 'is-correct' : answered && picked === option.id ? 'is-wrong' : ''
                  return (
                    <button
                      key={option.id}
                      className={`chip ${cls}`}
                      disabled={answered}
                      onClick={() => {
                        const ok = option.id === q.word.id
                        setPicked(option.id)
                        reviewResult(q.word.id, ok)
                        if (ok) {
                          sfx.correct()
                          setScore((s) => s + 1)
                        } else sfx.wrong()
                        speak(q.word.ca)
                        setTimeout(() => {
                          setPicked(null)
                          setIdx((i) => i + 1)
                        }, 1100)
                      }}
                    >
                      <span className="chip-main">{frToCa ? option.ca : option.fr}</span>
                      {frToCa && <span className="chip-phon">{option.phon}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
