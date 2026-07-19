import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Word } from '../../data/types'
import type { Exercise } from '../../data/exercises'
import { sentenceChips } from '../../data/exercises'
import { speak, ttsAvailable } from '../../lib/tts'
import { sfx } from '../../lib/sfx'
import { listenOnce, matchesTarget, speechRecognitionAvailable } from '../../lib/speech'
import { IconMic, IconSpeaker } from '../../components/Icons'

export type Phase = 'idle' | 'ok' | 'ko'

interface ViewProps {
  phase: Phase
  report: (ok: boolean, correct: string) => void
  next: () => void
}

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const

/* ---------------------------------------------------------------- */
/* Discover — meet a new word (arch card)                            */
/* ---------------------------------------------------------------- */

export function DiscoverView({ word, next }: { word: Word } & Pick<ViewProps, 'next'>) {
  const [flipped, setFlipped] = useState(false)
  const tts = ttsAvailable()

  useEffect(() => {
    const t = setTimeout(() => speak(word.ca), 450)
    return () => clearTimeout(t)
  }, [word])

  return (
    <div className="ex">
      <span className="t-label ex-kind">Nouveau mot</span>
      <motion.div
        className="arch-card"
        initial={{ opacity: 0, y: 30, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={spring}
        onClick={() => {
          setFlipped(!flipped)
          sfx.flip()
          speak(word.ca)
        }}
      >
        <div className="arch-window">
          <span className="arch-emoji">{word.emoji}</span>
        </div>
        <div className="arch-body">
          <h2 className="t-display arch-ca">{word.ca}</h2>
          <button
            className="phon-chip"
            onClick={(e) => {
              e.stopPropagation()
              speak(word.ca)
              sfx.tap()
            }}
          >
            {tts && <IconSpeaker size={15} />}
            <span>{word.phon}</span>
          </button>
          <p className="arch-fr">{word.fr}</p>
          {word.note && <p className="arch-note">{word.note}</p>}
        </div>
      </motion.div>
      {word.ex && (
        <motion.div
          className="ex-sentence"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.12 }}
          onClick={() => speak(word.ex!.ca)}
        >
          <span className="ex-sentence-ca">« {word.ex.ca} »</span>
          <span className="ex-sentence-fr">{word.ex.fr}</span>
        </motion.div>
      )}
      <div className="ex-footer">
        <button
          className="btn btn-primary"
          onClick={() => {
            sfx.tap()
            next()
          }}
        >
          Compris !
        </button>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* QCM — pick the translation                                        */
/* ---------------------------------------------------------------- */

export function QcmView({
  exercise,
  phase,
  report,
}: { exercise: Extract<Exercise, { kind: 'qcm' }> } & Omit<ViewProps, 'next'>) {
  const [selected, setSelected] = useState<Word | null>(null)
  const { prompt, options, direction } = exercise
  const frToCa = direction === 'fr-ca'

  useEffect(() => {
    setSelected(null)
  }, [exercise])

  useEffect(() => {
    if (!frToCa) {
      const t = setTimeout(() => speak(prompt.ca), 350)
      return () => clearTimeout(t)
    }
  }, [exercise, frToCa, prompt])

  return (
    <div className="ex">
      <span className="t-label ex-kind">{frToCa ? 'Comment dit-on… ?' : 'Que veut dire… ?'}</span>
      <motion.div className="ex-prompt" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        {frToCa ? (
          <h2 className="t-display ex-prompt-word">{prompt.fr}</h2>
        ) : (
          <>
            <h2 className="t-display ex-prompt-word ex-prompt-ca" onClick={() => speak(prompt.ca)}>
              {prompt.ca}
            </h2>
            <button className="phon-chip" onClick={() => speak(prompt.ca)}>
              {ttsAvailable() && <IconSpeaker size={15} />}
              <span>{prompt.phon}</span>
            </button>
          </>
        )}
      </motion.div>
      <div className="ex-options">
        {options.map((option, i) => {
          const isAnswer = option.id === prompt.id
          const isSel = selected?.id === option.id
          const cls =
            phase !== 'idle' && isAnswer
              ? 'is-correct'
              : phase === 'ko' && isSel
                ? 'is-wrong'
                : isSel
                  ? 'is-selected'
                  : ''
          return (
            <motion.button
              key={option.id}
              className={`chip ${cls}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.06 + i * 0.05 }}
              disabled={phase !== 'idle'}
              onClick={() => {
                sfx.tap()
                setSelected(option)
                if (frToCa) speak(option.ca)
              }}
            >
              <span className="chip-main">{frToCa ? option.ca : option.fr}</span>
              {frToCa && <span className="chip-phon">{option.phon}</span>}
            </motion.button>
          )
        })}
      </div>
      {phase === 'idle' && (
        <div className="ex-footer">
          <button
            className="btn btn-primary"
            disabled={!selected}
            onClick={() => {
              const ok = selected!.id === prompt.id
              if (ok && !frToCa) speak(prompt.ca)
              report(ok, frToCa ? `${prompt.ca}` : `${prompt.fr}`)
            }}
          >
            Vérifier
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Listen — what did you hear?                                       */
/* ---------------------------------------------------------------- */

export function ListenView({
  exercise,
  phase,
  report,
}: { exercise: Extract<Exercise, { kind: 'listen' }> } & Omit<ViewProps, 'next'>) {
  const [selected, setSelected] = useState<Word | null>(null)
  const { prompt, options } = exercise

  useEffect(() => {
    setSelected(null)
    const t = setTimeout(() => speak(prompt.ca), 500)
    return () => clearTimeout(t)
  }, [exercise, prompt])

  return (
    <div className="ex">
      <span className="t-label ex-kind">Qu’entends-tu ?</span>
      <motion.button
        className="listen-big"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        whileTap={{ scale: 0.93 }}
        onClick={() => {
          speak(prompt.ca)
          sfx.tap()
        }}
      >
        <IconSpeaker size={44} />
        <span className="listen-hint">Réécouter</span>
      </motion.button>
      <div className="ex-options">
        {options.map((option, i) => {
          const isAnswer = option.id === prompt.id
          const isSel = selected?.id === option.id
          const cls =
            phase !== 'idle' && isAnswer
              ? 'is-correct'
              : phase === 'ko' && isSel
                ? 'is-wrong'
                : isSel
                  ? 'is-selected'
                  : ''
          return (
            <motion.button
              key={option.id}
              className={`chip ${cls}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.05 + i * 0.05 }}
              disabled={phase !== 'idle'}
              onClick={() => {
                sfx.tap()
                setSelected(option)
              }}
            >
              <span className="chip-main">{option.ca}</span>
            </motion.button>
          )
        })}
      </div>
      {phase === 'idle' && (
        <div className="ex-footer">
          <button
            className="btn btn-primary"
            disabled={!selected}
            onClick={() => report(selected!.id === prompt.id, `${prompt.ca} — ${prompt.fr}`)}
          >
            Vérifier
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Pairs — match Catalan ↔ French                                    */
/* ---------------------------------------------------------------- */

export function PairsView({
  exercise,
  report,
}: { exercise: Extract<Exercise, { kind: 'pairs' }> } & Pick<ViewProps, 'report'>) {
  const { words } = exercise
  const right = useMemo(() => [...words].sort((a, b) => a.fr.localeCompare(b.fr)), [words])
  const [selCa, setSelCa] = useState<string | null>(null)
  const [selFr, setSelFr] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null)
  const [hadMistake, setHadMistake] = useState(false)

  useEffect(() => {
    setSelCa(null)
    setSelFr(null)
    setMatched(new Set())
    setHadMistake(false)
  }, [exercise])

  useEffect(() => {
    if (!selCa || !selFr) return
    if (selCa === selFr) {
      const m = new Set(matched)
      m.add(selCa)
      sfx.correct()
      setMatched(m)
      setSelCa(null)
      setSelFr(null)
      if (m.size === words.length) {
        setTimeout(() => report(!hadMistake, ''), 550)
      }
    } else {
      sfx.wrong()
      setHadMistake(true)
      setWrongPair([selCa, selFr])
      setTimeout(() => {
        setWrongPair(null)
        setSelCa(null)
        setSelFr(null)
      }, 500)
    }
  }, [selCa, selFr]) // eslint-disable-line react-hooks/exhaustive-deps

  const chipCls = (id: string, side: 'ca' | 'fr') => {
    if (matched.has(id)) return 'is-correct is-matched'
    if (wrongPair && ((side === 'ca' && wrongPair[0] === id) || (side === 'fr' && wrongPair[1] === id))) return 'is-wrong'
    if ((side === 'ca' && selCa === id) || (side === 'fr' && selFr === id)) return 'is-selected'
    return ''
  }

  return (
    <div className="ex">
      <span className="t-label ex-kind">Associe les paires</span>
      <div className="pairs">
        <div className="pairs-col">
          {words.map((word, i) => (
            <motion.button
              key={word.id}
              className={`chip chip--pair ${chipCls(word.id, 'ca')}`}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: i * 0.05 }}
              disabled={matched.has(word.id)}
              onClick={() => {
                sfx.tap()
                speak(word.ca)
                setSelCa(word.id)
              }}
            >
              {word.ca}
            </motion.button>
          ))}
        </div>
        <div className="pairs-col">
          {right.map((word, i) => (
            <motion.button
              key={word.id}
              className={`chip chip--pair ${chipCls(word.id, 'fr')}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: i * 0.05 }}
              disabled={matched.has(word.id)}
              onClick={() => {
                sfx.tap()
                setSelFr(word.id)
              }}
            >
              {word.fr}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Echo — say it out loud (speech recognition when available)        */
/* ---------------------------------------------------------------- */

export function EchoView({
  word,
  phase,
  report,
  next,
}: { word: Word } & ViewProps) {
  const canListen = speechRecognitionAvailable()
  const [state, setState] = useState<'idle' | 'listening' | 'retry'>('idle')
  const [heard, setHeard] = useState('')
  const cancelRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    setState('idle')
    setHeard('')
    const t = setTimeout(() => speak(word.ca), 450)
    return () => clearTimeout(t)
  }, [word])

  useEffect(() => () => cancelRef.current?.(), [])

  const startListening = async () => {
    sfx.tap()
    setState('listening')
    setHeard('')
    const { result, cancel } = listenOnce('ca-ES')
    cancelRef.current = cancel
    const transcript = await result
    cancelRef.current = null
    if (transcript && matchesTarget(transcript, word.ca)) {
      setHeard(transcript)
      report(true, word.ca)
    } else if (state !== 'retry' && transcript) {
      setHeard(transcript)
      setState('retry')
      sfx.wrong()
    } else if (transcript) {
      setHeard(transcript)
      report(false, word.ca)
    } else {
      // silence / mic error: no penalty, back to idle
      setState('idle')
    }
  }

  return (
    <div className="ex echo">
      <span className="t-label ex-kind">Repeteix — répète à voix haute</span>
      <motion.div
        className="echo-card"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        onClick={() => speak(word.ca)}
      >
        <span className="echo-emoji">{word.emoji}</span>
        <h2 className="t-display echo-ca">{word.ca}</h2>
        <button
          className="phon-chip"
          onClick={(e) => {
            e.stopPropagation()
            speak(word.ca)
            sfx.tap()
          }}
        >
          {ttsAvailable() && <IconSpeaker size={15} />}
          <span>{word.phon}</span>
        </button>
        <p className="arch-fr">{word.fr}</p>
      </motion.div>

      {canListen ? (
        <>
          <motion.button
            className={`echo-mic ${state === 'listening' ? 'is-listening' : ''}`}
            whileTap={{ scale: 0.92 }}
            disabled={phase !== 'idle' || state === 'listening'}
            onClick={startListening}
          >
            <IconMic size={34} />
            <span>{state === 'listening' ? 'T’escolto…' : state === 'retry' ? 'Encore une fois !' : 'Appuie et parle'}</span>
          </motion.button>
          {heard && state === 'retry' && (
            <p className="echo-heard">
              J’ai entendu « {heard} » — réécoute et réessaie, poc a poc.
            </p>
          )}
        </>
      ) : (
        <p className="echo-selfhint">
          Écoute le mot, puis dis-le à voix haute — la syllabe en capitales porte l’accent.
        </p>
      )}

      {phase === 'idle' && (
        <div className="ex-footer">
          <button
            className="btn btn-ghost echo-skip"
            onClick={() => {
              sfx.tap()
              next()
            }}
          >
            {canListen ? 'Je l’ai dit ✓' : 'Fet ! Je l’ai dit'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Build — reorder the sentence                                      */
/* ---------------------------------------------------------------- */

export function BuildView({
  exercise,
  phase,
  report,
}: { exercise: Extract<Exercise, { kind: 'build' }> } & Omit<ViewProps, 'next'>) {
  const { sentence } = exercise
  const target = useMemo(() => sentenceChips(sentence.ca), [sentence])
  const pool = useMemo(() => {
    const arr = target.map((wordText, i) => ({ id: i, text: wordText }))
    // deterministic-ish shuffle that never yields the solved order
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + target.length * 3) % (i + 1)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    if (arr.every((c, i) => c.id === i) && arr.length > 1) [arr[0], arr[1]] = [arr[1], arr[0]]
    return arr
  }, [target])
  const [placed, setPlaced] = useState<{ id: number; text: string }[]>([])

  useEffect(() => setPlaced([]), [exercise])

  const remaining = pool.filter((c) => !placed.some((p) => p.id === c.id))

  return (
    <div className="ex">
      <span className="t-label ex-kind">Construis la phrase</span>
      <motion.div className="ex-prompt" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <h2 className="build-fr">« {sentence.fr} »</h2>
      </motion.div>
      <div className={`build-line ${phase === 'ko' ? 'is-wrong-line' : ''} ${phase === 'ok' ? 'is-ok-line' : ''}`}>
        <AnimatePresence>
          {placed.map((c) => (
            <motion.button
              key={c.id}
              layout
              layoutId={`chip-${c.id}`}
              className="word-chip word-chip--placed"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={spring}
              disabled={phase !== 'idle'}
              onClick={() => {
                sfx.tap()
                setPlaced(placed.filter((p) => p.id !== c.id))
              }}
            >
              {c.text}
            </motion.button>
          ))}
        </AnimatePresence>
        {placed.length === 0 && <span className="build-placeholder">Touche les mots dans l’ordre…</span>}
      </div>
      <div className="build-pool">
        {pool.map((c) => {
          const used = placed.some((p) => p.id === c.id)
          return (
            <motion.button
              key={c.id}
              layout
              className={`word-chip ${used ? 'is-used' : ''}`}
              transition={spring}
              disabled={used || phase !== 'idle'}
              onClick={() => {
                sfx.tap()
                setPlaced([...placed, c])
              }}
            >
              {c.text}
            </motion.button>
          )
        })}
      </div>
      {phase === 'idle' && (
        <div className="ex-footer">
          <button
            className="btn btn-primary"
            disabled={placed.length !== target.length}
            onClick={() => {
              const ok = placed.every((c, i) => c.text === target[i])
              if (ok) speak(sentence.ca)
              report(ok, sentence.ca)
            }}
          >
            Vérifier
          </button>
        </div>
      )}
    </div>
  )
}
