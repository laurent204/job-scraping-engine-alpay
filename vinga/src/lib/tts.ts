/**
 * Audio front door for everything the app says in Catalan.
 *
 * Tier 1 — neural digital voice (Piper "Ona", see neuralVoice.ts)
 * Tier 2 — the device's speechSynthesis (Catalan, else Spanish)
 * Tier 3 — always-visible phonetic hints in the UI
 */

import { neuralSpeakUrl, neuralStatus, initNeural, onNeuralChange } from './neuralVoice'

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
  for (const l of listeners) l(ttsAvailable())
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

// pick up a previously downloaded neural voice + surface changes,
// after first paint so startup stays instant
setTimeout(() => void initNeural(), 1200)
onNeuralChange(() => notify())

export function ttsAvailable(): boolean {
  return neuralStatus() === 'ready' || voice != null
}

export function onTtsChange(cb: (ok: boolean) => void): () => void {
  listeners.add(cb)
  cb(ttsAvailable())
  return () => listeners.delete(cb)
}

let audioEl: HTMLAudioElement | null = null
let playToken = 0

/**
 * Speak Catalan text. `rate` below ~0.85 is treated as the "slow replay"
 * (tortoise) mode on the neural voice.
 */
export function speak(text: string, rate = 0.88) {
  void speakAsync(text, rate)
}

async function speakAsync(text: string, rate: number) {
  const token = ++playToken
  if (neuralStatus() === 'ready') {
    const url = await neuralSpeakUrl(text).catch(() => null)
    if (token !== playToken) return // a newer utterance took over
    if (url) {
      try {
        if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
        if (!audioEl) audioEl = new Audio()
        audioEl.pause()
        audioEl.src = url
        audioEl.playbackRate = rate < 0.85 ? 0.72 : 1
        ;(audioEl as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true
        await audioEl.play()
        return
      } catch {
        /* fall through to system voice */
      }
    }
  }
  systemSpeak(text, rate)
}

function systemSpeak(text: string, rate: number) {
  if (!voice || typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = rate
  u.pitch = 1
  speechSynthesis.speak(u)
}
