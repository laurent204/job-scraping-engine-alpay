import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { Mosaic3D } from '../components/Mosaic3D'
import { sfx } from '../lib/sfx'

const spring = { type: 'spring', stiffness: 320, damping: 30 } as const

const GOALS: { min: 5 | 10 | 15; ca: string; label: string; desc: string; emoji: string }[] = [
  { min: 5, ca: 'Tranquil', label: 'Tranquille', desc: '5 min par jour', emoji: '🌿' },
  { min: 10, ca: 'Seriós', label: 'Sérieux', desc: '10 min par jour', emoji: '☀️' },
  { min: 15, ca: 'A fons!', label: 'À fond', desc: '15 min par jour', emoji: '🔥' },
]

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<5 | 10 | 15>(10)
  const completeOnboarding = useStore((s) => s.completeOnboarding)

  return (
    <div className="onb">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="s0"
            className="onb-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="onb-hero3d">
              <Mosaic3D shards={214} height={280} />
            </div>
            <motion.h1 className="t-display onb-title" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}>
              Hola! <br />
              Apprends le <em>català</em>, poc a poc.
            </motion.h1>
            <motion.p className="onb-sub" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.28 }}>
              De vraies conversations — au restaurant, au marché, dans la rue. Chaque leçon ajoute des tesselles à ta
              mosaïque, comme un petit Gaudí.
            </motion.p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s1"
            className="onb-slide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={spring}
          >
            <div className="onb-cards">
              {[
                { emoji: '🥂', ca: 'Una taula per a dos', fr: 'Une table pour deux' },
                { emoji: '🍊', ca: 'Quant costa?', fr: 'Combien ça coûte ?' },
                { emoji: '🧭', ca: 'On és la platja?', fr: 'Où est la plage ?' },
              ].map((c, i) => (
                <motion.div
                  key={i}
                  className="onb-minicard"
                  initial={{ opacity: 0, y: 40, rotate: 0 }}
                  animate={{ opacity: 1, y: 0, rotate: i === 0 ? -4 : i === 1 ? 2.5 : -1.5 }}
                  transition={{ ...spring, delay: 0.1 + i * 0.12 }}
                >
                  <span className="onb-minicard-emoji">{c.emoji}</span>
                  <strong className="t-display">{c.ca}</strong>
                  <span>{c.fr}</span>
                </motion.div>
              ))}
            </div>
            <h1 className="t-display onb-title">Parle dès le premier jour.</h1>
            <p className="onb-sub">
              Pas de grammaire aride : des phrases utiles, de l’audio, de la phonétique pensée pour les francophones —
              et des dialogues pour t’entraîner sans stress.
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            className="onb-slide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <h1 className="t-display onb-title">Ton rythme ?</h1>
            <p className="onb-sub">Un objectif quotidien, modifiable à tout moment.</p>
            <div className="onb-goals">
              {GOALS.map((g, i) => (
                <motion.button
                  key={g.min}
                  className={`goal-card ${goal === g.min ? 'is-active' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.12 + i * 0.08 }}
                  onClick={() => {
                    sfx.tap()
                    setGoal(g.min)
                  }}
                >
                  <span className="goal-emoji">{g.emoji}</span>
                  <div>
                    <strong className="t-display">{g.ca}</strong>
                    <span>
                      {g.label} · {g.desc}
                    </span>
                  </div>
                  <span className="goal-radio" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="onb-footer">
        <div className="onb-dots">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`onb-dot ${i === step ? 'is-active' : ''}`} />
          ))}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            sfx.tap()
            if (step < 2) setStep(step + 1)
            else completeOnboarding(goal)
          }}
        >
          {step < 2 ? 'Continuer' : 'Vinga, comencem!'}
        </button>
        {step < 2 && (
          <button className="onb-skip" onClick={() => setStep(2)}>
            Passer
          </button>
        )}
      </div>
    </div>
  )
}
