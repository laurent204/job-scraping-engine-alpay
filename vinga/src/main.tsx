import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/base.css'
import './styles/screens.css'
import App from './App.tsx'
import { wordById } from './data/content'
import { useStore } from './store'

// Small QA/demo bridge: lets end-to-end tests drive the app deterministically.
declare global {
  interface Window {
    __vinga?: { words: { id: string; ca: string; fr: string; ex?: { ca: string; fr: string } }[]; store: typeof useStore }
  }
}
window.__vinga = { words: [...wordById.values()], store: useStore }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
