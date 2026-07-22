/**
 * Portable progression backup ("la motxilla").
 * Two interchangeable formats:
 *  - a compact copy-pastable code:  VINGA1.<base64(json)>
 *  - a readable .json file
 * Restoring accepts either. Useful to move devices, and essential in
 * environments where local storage is ephemeral (shared demo pages).
 */

import { useStore } from '../store'

const PREFIX = 'VINGA1.'
const FIELDS = ['onboarded', 'goalMin', 'sound', 'neuralDeclined', 'xp', 'todayXp', 'streak', 'lessonsDone', 'srs'] as const

type Snapshot = Record<string, unknown>

function snapshot(): Snapshot {
  const s = useStore.getState() as unknown as Snapshot
  const out: Snapshot = { app: 'vinga', v: 1, at: new Date().toISOString() }
  for (const f of FIELDS) out[f] = s[f]
  return out
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function fromBase64(b64: string): string {
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function exportCode(): string {
  return PREFIX + toBase64(JSON.stringify(snapshot()))
}

export function exportJson(): string {
  return JSON.stringify(snapshot(), null, 2)
}

/**
 * Restore from a save code or a .json file's text.
 * Returns a French error message, or null on success.
 */
export function restore(input: string): string | null {
  const text = input.trim()
  if (!text) return 'Colle d’abord un code ou le contenu d’un fichier.'
  let json: string
  if (text.startsWith(PREFIX)) {
    try {
      json = fromBase64(text.slice(PREFIX.length).replace(/\s+/g, ''))
    } catch {
      return 'Ce code est incomplet ou abîmé — recopie-le en entier.'
    }
  } else if (text.startsWith('{')) {
    json = text
  } else {
    return 'Format inconnu — attendu : un code « VINGA1.… » ou un fichier .json exporté.'
  }

  let data: Snapshot
  try {
    data = JSON.parse(json) as Snapshot
  } catch {
    return 'Impossible de lire cette sauvegarde.'
  }
  if (data.app !== 'vinga' || typeof data.lessonsDone !== 'object' || data.lessonsDone === null) {
    return 'Ce fichier ne ressemble pas à une sauvegarde Vinga!.'
  }

  const patch: Snapshot = {}
  for (const f of FIELDS) {
    if (f in data) patch[f] = data[f]
  }
  useStore.setState(patch as never)
  return null
}
