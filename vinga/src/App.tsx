import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { ReviewTab, ReviewSession } from './screens/Review'
import { Profile } from './screens/Profile'
import { LessonPlayer } from './screens/lesson/LessonPlayer'
import { TabBar } from './components/TabBar'

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const tab = useStore((s) => s.tab)
  const overlay = useStore((s) => s.overlay)

  if (!onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    )
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        <motion.main
          key={tab}
          className="tab-main"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        >
          {tab === 'ruta' && <Home />}
          {tab === 'repas' && <ReviewTab />}
          {tab === 'perfil' && <Profile />}
        </motion.main>
      </AnimatePresence>
      <TabBar />

      <AnimatePresence>
        {overlay && (
          <motion.div
            className="overlay"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {overlay.kind === 'lesson' && <LessonPlayer lessonId={overlay.lessonId} />}
            {overlay.kind === 'review' && <ReviewSession />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
