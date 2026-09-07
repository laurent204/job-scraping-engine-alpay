import { motion } from 'framer-motion'
import { useStore, type Tab } from '../store'
import { IconCards, IconPerson, IconRoute } from './Icons'
import { sfx } from '../lib/sfx'
import { dueWords } from '../lib/srs'

const TABS: { id: Tab; label: string; icon: typeof IconRoute }[] = [
  { id: 'ruta', label: 'La ruta', icon: IconRoute },
  { id: 'repas', label: 'Repàs', icon: IconCards },
  { id: 'perfil', label: 'Perfil', icon: IconPerson },
]

export function TabBar() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const srs = useStore((s) => s.srs)
  const due = dueWords(srs, Date.now()).length

  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            className={`tabbar-item ${active ? 'is-active' : ''}`}
            onClick={() => {
              sfx.tap()
              setTab(id)
            }}
            aria-label={label}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="tabbar-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="tabbar-icon">
              <Icon size={23} />
              {id === 'repas' && due > 0 && <span className="tabbar-badge">{due > 9 ? '9+' : due}</span>}
            </span>
            <span className="tabbar-label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
