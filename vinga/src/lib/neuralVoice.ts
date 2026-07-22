/**
 * "La veu de l'Ona" — neural Catalan voice, fully digital.
 *
 * Runs Piper TTS (VITS) in the browser via WebAssembly, using the
 * ca_ES-upc_ona voice trained on the FestCat corpus (UPC Barcelona).
 * The model (~25 MB) is fetched once on the user's device, cached in
 * OPFS, and synthesis then works offline. Generated clips are memoised
 * as object URLs so repeated taps are instant.
 *
 * The heavy module is imported lazily so it never weighs on startup.
 */

export const VOICE_ID = 'ca_ES-upc_ona-x_low'
export type NeuralStatus = 'unknown' | 'unsupported' | 'absent' | 'downloading' | 'ready' | 'error'

type PiperModule = typeof import('@mintplex-labs/piper-tts-web')

let status: NeuralStatus = 'unknown'
let mod: PiperModule | null = null
let session: InstanceType<PiperModule['TtsSession']> | null = null
let synthChain: Promise<void> = Promise.resolve()

const listeners = new Set<(s: NeuralStatus) => void>()
const clips = new Map<string, string>() // text -> object URL
const MAX_CLIPS = 400

function setStatus(s: NeuralStatus) {
  status = s
  for (const l of listeners) l(s)
}

export function neuralStatus(): NeuralStatus {
  return status
}

export function onNeuralChange(cb: (s: NeuralStatus) => void): () => void {
  listeners.add(cb)
  cb(status)
  return () => listeners.delete(cb)
}

async function lib(): Promise<PiperModule> {
  if (!mod) mod = await import('@mintplex-labs/piper-tts-web')
  return mod
}

/** Detect a previously downloaded voice (no network needed). */
export async function initNeural(): Promise<void> {
  if (status !== 'unknown') return
  if (!__NEURAL_VOICE__) {
    setStatus('unsupported')
    return
  }
  try {
    const piper = await lib()
    const ids = await piper.stored()
    setStatus(ids.includes(VOICE_ID) ? 'ready' : 'absent')
  } catch {
    setStatus('absent')
  }
}

/** Fetch the voice model (~25 MB, once). Resolves true on success. */
export async function downloadNeural(onProgress?: (pct: number) => void): Promise<boolean> {
  if (status === 'ready') return true
  if (status === 'unsupported') return false
  setStatus('downloading')
  try {
    const piper = await lib()
    await piper.download(VOICE_ID, (p) => {
      if (p.total > 0) onProgress?.(Math.min(1, p.loaded / p.total))
    })
    // warm the session so the first word is instant
    await ensureSession()
    setStatus('ready')
    return true
  } catch {
    setStatus('error')
    return false
  }
}

async function ensureSession() {
  if (session) return session
  const piper = await lib()
  session = await piper.TtsSession.create({ voiceId: VOICE_ID })
  return session
}

function remember(text: string, url: string) {
  if (clips.size >= MAX_CLIPS) {
    const oldest = clips.keys().next().value
    if (oldest != null) {
      const old = clips.get(oldest)
      if (old) URL.revokeObjectURL(old)
      clips.delete(oldest)
    }
  }
  clips.set(text, url)
}

/**
 * Synthesize `text` and return a playable object URL, or null when the
 * neural voice isn't ready. Calls are serialized: the wasm session
 * handles one utterance at a time.
 */
export async function neuralSpeakUrl(text: string): Promise<string | null> {
  if (status !== 'ready') return null
  const hit = clips.get(text)
  if (hit) return hit
  let url: string | null = null
  const run = synthChain.then(async () => {
    if (clips.has(text)) {
      url = clips.get(text)!
      return
    }
    const s = await ensureSession()
    const wav = await s.predict(text)
    url = URL.createObjectURL(wav)
    remember(text, url)
  })
  synthChain = run.catch(() => {})
  try {
    await run
  } catch {
    return null
  }
  return url
}

/** Pre-generate clips for an upcoming lesson, gently, in the background. */
export function prefetchNeural(texts: string[]) {
  if (status !== 'ready') return
  void (async () => {
    for (const text of texts) {
      if (status !== 'ready') return
      if (!clips.has(text)) {
        await neuralSpeakUrl(text).catch(() => {})
        await new Promise((r) => setTimeout(r, 120))
      }
    }
  })()
}
