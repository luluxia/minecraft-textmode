import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fusion-pixel-12px-proportional-sc'
import './styles.css'
import { App } from './App'
import { setMinecraftSoundVolume } from './components/minecraft/minecraft-sound'
import { applyInterfaceScale, useInterfaceSettings } from './ui/interfaceSettings'

applyInterfaceScale()
setMinecraftSoundVolume(useInterfaceSettings.getState().componentSound ? 1 : 0)
window.addEventListener('resize', applyInterfaceScale)
useInterfaceSettings.subscribe((settings, previous) => {
  if (settings.componentSound !== previous.componentSound) {
    setMinecraftSoundVolume(settings.componentSound ? 1 : 0)
  }
  if (settings.scale !== previous.scale) {
    applyInterfaceScale()
    window.dispatchEvent(new Event('resize'))
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
