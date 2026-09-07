/**
 * Tiny synthesized UI sounds (Web Audio, no assets) + haptics.
 * Everything respects the user's sound setting.
 */

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, ac.currentTime + at)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(ac.currentTime + at)
  osc.stop(ac.currentTime + at + dur + 0.05)
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}

export const sfx = {
  tap() {
    if (!enabled) return
    tone(660, 0, 0.06, 'sine', 0.05)
  },
  correct() {
    if (enabled) {
      tone(523.25, 0, 0.12)
      tone(783.99, 0.09, 0.18)
    }
    vibrate(12)
  },
  wrong() {
    if (enabled) tone(165, 0, 0.22, 'triangle', 0.1)
    vibrate([8, 40, 8])
  },
  flip() {
    if (!enabled) return
    tone(440, 0, 0.05, 'sine', 0.04)
    tone(520, 0.04, 0.06, 'sine', 0.04)
  },
  complete() {
    if (enabled) {
      tone(523.25, 0, 0.14)
      tone(659.25, 0.1, 0.14)
      tone(783.99, 0.2, 0.14)
      tone(1046.5, 0.3, 0.32)
    }
    vibrate([14, 60, 14, 60, 22])
  },
}
