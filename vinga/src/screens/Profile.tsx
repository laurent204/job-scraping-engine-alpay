import { motion } from 'framer-motion'
import { useStore, TOTAL_SHARDS, SHARDS_PER_LESSON, dailyGoalXp } from '../store'
import { ALL_LESSONS, TOTAL_WORDS } from '../data/content'
import { Mosaic3D } from '../components/Mosaic3D'
import { artworkFor } from '../components/artworks'
import { IconFlame, IconShard, IconSparkle } from '../components/Icons'
import { sfx } from '../lib/sfx'

const spring = { type: 'spring', stiffness: 300, damping: 28 } as const

const MILESTONES = [
  { at: 1, emoji: '🧩', title: 'Primera tessel·la', desc: 'Première leçon terminée' },
  { at: 4, emoji: '💬', title: 'Primera conversa', desc: 'Un module entier, dialogue inclus' },
  { at: 8, emoji: '🔢', title: 'Comptable català', desc: 'Deux modules complétés' },
  { at: 12, emoji: '🥘', title: 'Client habitual', desc: 'Trois modules complétés' },
  { at: 16, emoji: '🧺', title: 'Rei del mercat', desc: 'Quatre modules complétés' },
  { at: 20, emoji: '☀️', title: 'El sol complet', desc: 'La première œuvre est achevée !' },
  { at: 24, emoji: '🌦️', title: 'Home del temps', desc: 'La météo, les jours et l’heure' },
  { at: 28, emoji: '🏡', title: 'De la família', desc: 'Sept modules complétés' },
  { at: 32, emoji: '🏆', title: 'Obra completa', desc: 'Les deux œuvres, toute la ruta !' },
]

export function Profile() {
  const { xp, streak, lessonsDone, srs, goalMin, sound, setSound } = useStore()
  const doneCount = Object.keys(lessonsDone).length
  const shards = doneCount * SHARDS_PER_LESSON
  const artwork = artworkFor(shards)
  const wordsLearned = Object.keys(srs).length
  const accuracies = Object.values(lessonsDone).map((l) => l.best)
  const avgAccuracy = accuracies.length ? Math.round((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 100) : 0

  return (
    <div className="scroll profile">
      <header className="review-header">
        <h1 className="t-display">El teu mosaic</h1>
        <p className="home-sub">
          {shards === 0
            ? 'Chaque leçon posera ses tesselles ici.'
            : shards >= TOTAL_SHARDS
              ? 'Les deux œuvres sont achevées. Gaudí serait fier.'
              : `Œuvre ${artwork.index + 1} : « ${artwork.name} » — ${Math.round((artwork.placed / artwork.faces) * 100)}% reconstruite.`}
        </p>
      </header>

      <motion.div className="profile-mosaic" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
        <Mosaic3D shards={shards} height={250} />
      </motion.div>

      <div className="profile-stats">
        {[
          { icon: <IconFlame size={20} />, big: streak.count, label: 'jours de suite', cls: 'terra' },
          { icon: <IconSparkle size={20} />, big: xp, label: 'XP au total', cls: 'sol' },
          { icon: <IconShard size={20} />, big: `${wordsLearned}/${TOTAL_WORDS}`, label: 'mots rencontrés', cls: 'mar' },
          { icon: null, big: `${avgAccuracy}%`, label: 'précision moyenne', cls: 'oliva' },
        ].map((s, i) => (
          <motion.div
            key={i}
            className={`pstat pstat--${s.cls}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.08 + i * 0.06 }}
          >
            <span className="pstat-big">
              {s.icon} {s.big}
            </span>
            <span className="pstat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <section className="fites">
        <span className="t-label">Fites — jalons</span>
        {MILESTONES.map((m, i) => {
          const unlocked = doneCount >= m.at
          return (
            <motion.div
              key={i}
              className={`fita ${unlocked ? 'is-unlocked' : ''}`}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...spring, delay: i * 0.04 }}
            >
              <span className="fita-emoji">{unlocked ? m.emoji : '🔒'}</span>
              <div>
                <strong className="t-display">{m.title}</strong>
                <span>{m.desc}</span>
              </div>
              <span className="fita-count">
                {Math.min(doneCount, m.at)}/{m.at}
              </span>
            </motion.div>
          )
        })}
      </section>

      <section className="settings">
        <span className="t-label">Réglages</span>
        <div className="setting-row">
          <div>
            <strong>Sons</strong>
            <span>Effets sonores des exercices</span>
          </div>
          <button
            className={`toggle ${sound ? 'is-on' : ''}`}
            onClick={() => {
              setSound(!sound)
              sfx.tap()
            }}
            aria-label="Activer ou couper les sons"
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <strong>Objectif quotidien</strong>
            <span>
              {goalMin} min · {dailyGoalXp(goalMin)} XP par jour
            </span>
          </div>
          <div className="goal-mini">
            {([5, 10, 15] as const).map((g) => (
              <button
                key={g}
                className={`goal-mini-btn ${goalMin === g ? 'is-active' : ''}`}
                onClick={() => {
                  sfx.tap()
                  useStore.setState({ goalMin: g })
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <p className="profile-footnote">
          Vinga! v0.1 — {ALL_LESSONS.length} leçons · {TOTAL_WORDS} mots · fet amb amor a Barcelona 🧡
        </p>
      </section>
    </div>
  )
}
