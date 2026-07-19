/**
 * Text-to-speech for Catalan via the Web Speech API.
 * Picks a Catalan voice when available, falls back to Spanish
 * (close phonetics), and reports availability so the UI can
 * always show phonetic hints instead of broken audio buttons.
 */

let voice: SpeechSynthesisVoice | null = null
let resolved = false
const listeners = new Set<(ok: boolean) => void>()

function resolveVoice() {
  if (typeof speechSynthesis === 'undefined') {
    resolved = true
    notify()
    return
  }
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return
  voice =
    voices.find((v) => v.lang.toLowerCase().startsWith('ca') && v.localService) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('ca')) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('es') && v.localService) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('es')) ??
    null
  resolved = true
  notify()
}

function notify() {
  for (const l of listeners) l(voice != null)
}

if (typeof speechSynthesis !== 'undefined') {
  resolveVoice()
  speechSynthesis.onvoiceschanged = resolveVoice
  // Some browsers never fire voiceschanged; settle after a beat
  setTimeout(() => {
    if (!resolved) resolveVoice()
    resolved = true
    notify()
  }, 600)
}

export function ttsAvailable(): boolean {
  return voice != null
}

export function onTtsChange(cb: (ok: boolean) => void): () => void {
  listeners.add(cb)
  cb(ttsAvailable())
  return () => listeners.delete(cb)
}

export function speak(text: string, rate = 0.88) {
  if (!voice || typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = rate
  u.pitch = 1
  speechSynthesis.speak(u)
}
