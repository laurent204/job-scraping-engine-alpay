import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Dialogue } from '../../data/types'
import { speak } from '../../lib/tts'
import { sfx } from '../../lib/sfx'
import { IconSpeaker } from '../../components/Icons'

interface Bubble {
  who: 'npc' | 'you'
  ca: string
  fr: string
}

const spring = { type: 'spring', stiffness: 360, damping: 30 } as const

/**
 * Simulated conversation — the "goal" experience of the app.
 * The NPC talks (with audio), you answer by picking real replies.
 */
export function DialoguePlayer({
  dialogue,
  onProgress,
  onMistake,
  onComplete,
}: {
  dialogue: Dialogue
  onProgress: (done: number, total: number) => void
  onMistake: () => void
  onComplete: () => void
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [turnIndex, setTurnIndex] = useState(0)
  const [typing, setTyping] = useState(false)
  const [wrongId, setWrongId] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)

  const turns = dialogue.turns
  const turn = turns[turnIndex]

  // advance NPC turns automatically
  useEffect(() => {
    onProgress(turnIndex, turns.length)
    if (!turn) {
      if (!doneRef.current) {
        doneRef.current = true
        setTimeout(onComplete, 900)
      }
      return
    }
    if (turn.kind === 'npc') {
      setTyping(true)
      const t1 = setTimeout(() => {
        setTyping(false)
        setBubbles((b) => [...b, { who: 'npc', ca: turn.ca, fr: turn.fr }])
        speak(turn.ca)
        setTimeout(() => setTurnIndex((i) => i + 1), 750)
      }, 950)
      return () => clearTimeout(t1)
    }
  }, [turnIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // keep scrolled to the latest bubble
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [bubbles, typing, turn])

  const choose = (i: number) => {
    if (turn?.kind !== 'you') return
    const choice = turn.choices[i]
    if (choice.ok) {
      sfx.correct()
      setBubbles((b) => [...b, { who: 'you', ca: choice.ca, fr: choice.fr }])
      speak(choice.ca)
      setWrongId(null)
      setRevealed(false)
      setTurnIndex((idx) => idx + 1)
    } else {
      sfx.wrong()
      onMistake()
      setWrongId(i)
      setRevealed(true)
      setTimeout(() => setWrongId(null), 600)
    }
  }

  return (
    <div className="dlg">
      <div className="dlg-scene">
        <span className="dlg-avatar">{dialogue.npcEmoji}</span>
        <div>
          <strong>{dialogue.npcName}</strong>
          <p>{dialogue.scene}</p>
        </div>
      </div>
      <div className="dlg-scroll scroll" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {bubbles.map((b, i) => (
            <motion.div
              key={i}
              className={`bubble bubble--${b.who}`}
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={spring}
              onClick={() => speak(b.ca)}
            >
              {b.who === 'npc' && <span className="bubble-avatar">{dialogue.npcEmoji}</span>}
              <div className="bubble-card">
                <span className="bubble-ca">
                  {b.ca}
                  {b.who === 'npc' && <IconSpeaker size={14} className="bubble-speaker" />}
                </span>
                <span className="bubble-fr">{b.fr}</span>
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              key="typing"
              className="bubble bubble--npc"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="bubble-avatar">{dialogue.npcEmoji}</span>
              <div className="bubble-card bubble-typing">
                <span />
                <span />
                <span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="dlg-choices">
        <AnimatePresence mode="wait">
          {turn?.kind === 'you' && !typing && (
            <motion.div
              key={turnIndex}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={spring}
            >
              <span className="t-label dlg-your-turn">À toi de répondre</span>
              {turn.choices.map((choice, i) => (
                <button
                  key={i}
                  className={`chip dlg-chip ${wrongId === i ? 'is-wrong' : ''} ${
                    revealed && choice.ok ? 'is-hinted' : ''
                  }`}
                  onClick={() => choose(i)}
                >
                  <span className="chip-main">{choice.ca}</span>
                  <span className="chip-phon">{choice.fr}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
