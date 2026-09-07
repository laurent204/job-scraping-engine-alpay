import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { downloadNeural, neuralStatus, onNeuralChange, type NeuralStatus } from '../lib/neuralVoice'
import { speak } from '../lib/tts'
import { sfx } from '../lib/sfx'
import { IconClose } from './Icons'

/**
 * Invites the learner to enable "la veu de l'Ona" — the neural Catalan
 * voice (~25 MB, downloaded once, then offline). Dismissible; also
 * reachable later from the profile settings.
 */
export function VoiceBanner() {
  const declined = useStore((s) => s.neuralDeclined)
  const setDeclined = useStore((s) => s.setNeuralDeclined)
  const [status, setStatus] = useState<NeuralStatus>(neuralStatus())
  const [pct, setPct] = useState(0)
  const [justReady, setJustReady] = useState(false)

  useEffect(() => onNeuralChange(setStatus), [])

  const start = async () => {
    sfx.tap()
    setPct(0)
    const ok = await downloadNeural(setPct)
    if (ok) {
      sfx.complete()
      setJustReady(true)
      speak('Hola! Soc l’Ona. Parlem català?')
      setTimeout(() => setJustReady(false), 5200)
    }
  }

  const visible = !declined && (status === 'absent' || status === 'downloading' || status === 'error' || justReady)
  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          className="voice-banner"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          {justReady ? (
            <div className="voice-banner-row">
              <span className="voice-banner-emoji">🎙️</span>
              <div className="voice-banner-txt">
                <strong className="t-display">Ona és aquí!</strong>
                <p>La voix catalane neuronale est active — écoute…</p>
              </div>
            </div>
          ) : status === 'downloading' ? (
            <div className="voice-banner-row">
              <span className="voice-banner-emoji">🎙️</span>
              <div className="voice-banner-txt">
                <strong className="t-display">Ona arriba…</strong>
                <p>Téléchargement de la voix — {Math.round(pct * 100)} %</p>
                <div className="voice-progress">
                  <motion.div
                    className="voice-progress-fill"
                    animate={{ width: `${Math.max(4, pct * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 24 }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <button className="voice-banner-close" onClick={() => setDeclined(true)} aria-label="Plus tard">
                <IconClose size={17} />
              </button>
              <div className="voice-banner-row">
                <span className="voice-banner-emoji">🎙️</span>
                <div className="voice-banner-txt">
                  <strong className="t-display">La veu de l’Ona</strong>
                  <p>
                    {status === 'error'
                      ? 'Téléchargement impossible — vérifie ta connexion et réessaie.'
                      : 'Une vraie voix catalane 100 % digitale (neuronale), ~25 Mo une seule fois, puis hors-ligne.'}
                  </p>
                </div>
              </div>
              <div className="voice-banner-actions">
                <button className="btn btn-sol voice-banner-btn" onClick={start}>
                  {status === 'error' ? 'Réessayer' : 'Activer la voix'}
                </button>
              </div>
            </>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
