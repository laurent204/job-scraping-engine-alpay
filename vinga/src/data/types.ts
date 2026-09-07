export interface Word {
  id: string
  /** Catalan */
  ca: string
  /** French */
  fr: string
  /** French-friendly pronunciation hint, stressed syllable in caps */
  phon: string
  emoji: string
  /** Optional cultural / grammar note shown on the discovery card */
  note?: string
  /** Example sentence */
  ex?: { ca: string; fr: string }
}

export interface DialogueChoice {
  ca: string
  fr: string
  ok: boolean
}

export type DialogueTurn =
  | { kind: 'npc'; ca: string; fr: string }
  | { kind: 'you'; choices: DialogueChoice[] }

export interface Dialogue {
  /** Who you are talking to */
  npcName: string
  npcEmoji: string
  scene: string
  turns: DialogueTurn[]
}

export interface Lesson {
  id: string
  /** French title */
  title: string
  /** Catalan subtitle */
  titleCa: string
  kind: 'words' | 'dialogue'
  words?: Word[]
  dialogue?: Dialogue
}

export interface Module {
  id: string
  title: string
  titleCa: string
  /** design token color key: terra | sol | mar | oliva | rosa */
  color: 'terra' | 'sol' | 'mar' | 'oliva' | 'rosa'
  emblem: 'sun' | 'numbers' | 'food' | 'market' | 'compass' | 'weather' | 'family' | 'beach'
  description: string
  lessons: Lesson[]
  /** "Ho sabies?" cultural tidbit shown on completion screens */
  tidbits: string[]
}
