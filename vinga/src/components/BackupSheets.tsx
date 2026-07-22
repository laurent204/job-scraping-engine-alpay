import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { exportCode, exportJson, restore } from '../lib/saveCode'
import { sfx } from '../lib/sfx'

const spring = { type: 'spring', stiffness: 380, damping: 34 } as const

/**
 * "La motxilla" — progression backup UI (profile settings row + sheets).
 * Export: copyable save code + .json file (via the artifact `downloads`
 * capability when present, a plain download link otherwise).
 * Restore: paste a code / pick the file.
 */
export function BackupSetting() {
  const [sheet, setSheet] = useState<null | 'export' | 'restore'>(null)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [restoreText, setRestoreText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const code = sheet === 'export' ? exportCode() : ''

  const close = () => {
    setSheet(null)
    setCopied(false)
    setMessage(null)
    setRestoreText('')
  }

  const copy = async () => {
    sfx.tap()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setMessage('Copie automatique impossible — sélectionne le code et copie-le à la main.')
    }
  }

  const downloadFile = async () => {
    sfx.tap()
    const json = exportJson()
    if (window.claude?.downloads) {
      try {
        await window.claude.downloads.save({ filename: 'vinga-progression.json', data: json })
        setMessage('Fichier enregistré !')
      } catch {
        setMessage('Enregistrement annulé ou indisponible — utilise le code ci-dessus.')
      }
      return
    }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'vinga-progression.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const doRestore = (text: string) => {
    const error = restore(text)
    if (error) {
      sfx.wrong()
      setMessage(error)
    } else {
      sfx.complete()
      setMessage(null)
      close()
    }
  }

  return (
    <>
      <div className="setting-row">
        <div>
          <strong>Progression</strong>
          <span>Sauvegarder ou reprendre sur un autre appareil</span>
        </div>
        <div className="goal-mini">
          <button
            className="backup-btn"
            onClick={() => {
              sfx.tap()
              setSheet('export')
            }}
          >
            Exporter
          </button>
          <button
            className="backup-btn"
            onClick={() => {
              sfx.tap()
              setSheet('restore')
            }}
          >
            Restaurer
          </button>
        </div>
      </div>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div
              className="sheet-veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="sheet sheet--backup"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              exit={{ y: '110%' }}
              transition={spring}
            >
              {sheet === 'export' ? (
                <>
                  <span className="sheet-emoji">🎒</span>
                  <h3 className="t-display">La teva motxilla</h3>
                  <p>Ton code de sauvegarde — colle-le dans « Restaurer » sur n’importe quel appareil.</p>
                  <textarea className="backup-code" readOnly value={code} onFocus={(e) => e.currentTarget.select()} />
                  <button className="btn btn-primary" onClick={copy}>
                    {copied ? 'Copié !' : 'Copier le code'}
                  </button>
                  <button className="btn btn-ghost" onClick={downloadFile}>
                    Télécharger le fichier (.json)
                  </button>
                </>
              ) : (
                <>
                  <span className="sheet-emoji">🧳</span>
                  <h3 className="t-display">Reprendre ma progression</h3>
                  <p>Colle ton code « VINGA1.… » (ou le contenu du fichier .json).</p>
                  <textarea
                    className="backup-code"
                    placeholder="VINGA1.…"
                    value={restoreText}
                    onChange={(e) => setRestoreText(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => doRestore(restoreText)}>
                    Restaurer
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      sfx.tap()
                      fileRef.current?.click()
                    }}
                  >
                    Choisir le fichier .json
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const reader = new FileReader()
                      reader.onload = () => doRestore(String(reader.result ?? ''))
                      reader.readAsText(f)
                      e.target.value = ''
                    }}
                  />
                </>
              )}
              {message && <p className="backup-message">{message}</p>}
              <button className="btn btn-ghost backup-close" onClick={close}>
                Fermer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
