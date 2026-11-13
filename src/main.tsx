import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fusion-pixel-12px-proportional-sc'
import './styles.css'
import { App } from './App'
import { applyInterfaceScale, useInterfaceSettings } from './ui/interfaceSettings'

applyInterfaceScale()
window.addEventListener('resize', applyInterfaceScale)
useInterfaceSettings.subscribe(() => {
  applyInterfaceScale()
  window.dispatchEvent(new Event('resize'))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
