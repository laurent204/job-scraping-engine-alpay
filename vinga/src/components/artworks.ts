/**
 * The artworks you rebuild by learning, in order.
 * Face counts must sum to TOTAL_SHARDS (lessons × 16):
 * 20 lessons → el sol (320) · 12 lessons → el banc (192).
 */

export type ArtworkKind = 'sol' | 'banc'

export interface ArtworkDef {
  kind: ArtworkKind
  name: string
  nameFr: string
  faces: number
}

export const ARTWORKS: ArtworkDef[] = [
  { kind: 'sol', name: 'El sol', nameFr: 'Le soleil', faces: 320 },
  { kind: 'banc', name: 'El banc serpentejant', nameFr: 'Le banc de Park Güell', faces: 192 },
]

export interface ArtworkProgress extends ArtworkDef {
  index: number
  placed: number
}

/** Which artwork the given global shard count is currently filling */
export function artworkFor(shards: number): ArtworkProgress {
  let rest = Math.max(0, shards)
  for (let i = 0; i < ARTWORKS.length; i++) {
    const a = ARTWORKS[i]
    if (rest < a.faces || i === ARTWORKS.length - 1) {
      return { ...a, index: i, placed: Math.min(rest, a.faces) }
    }
    rest -= a.faces
  }
  const last = ARTWORKS[ARTWORKS.length - 1]
  return { ...last, index: ARTWORKS.length - 1, placed: last.faces }
}
