import { create } from 'zustand'

const SCALE_KEY = 'block-idle-ui-scale'
export const UI_SCALES = [75, 90, 100, 110, 125, 150] as const
export const UI_SCALE_MIN = UI_SCALES[0]
export const UI_SCALE_MAX = UI_SCALES[UI_SCALES.length - 1]
const validScale = (value: number) => UI_SCALES.some((scale) => scale === value)

function readScale() {
  try {
    const value = Number(localStorage.getItem(SCALE_KEY))
    if (!Number.isFinite(value) || value < UI_SCALE_MIN || value > UI_SCALE_MAX) return 100
    return UI_SCALES.reduce<number>((nearest, scale) => Math.abs(scale - value) < Math.abs(nearest - value) ? scale : nearest, 100)
  } catch {
    return 100
  }
}

export const useInterfaceSettings = create<{
  scale: number
  setScale: (scale: number) => void
}>((set) => ({
  scale: readScale(),
  setScale: (scale) => {
    if (!validScale(scale)) return
    set({ scale })
    try { localStorage.setItem(SCALE_KEY, String(scale)) } catch { /* Still apply when storage is unavailable. */ }
  },
}))

export function applyInterfaceScale() {
  const scale = useInterfaceSettings.getState().scale / 100
  const root = document.documentElement
  root.style.setProperty('--ui-scale', String(scale))
  root.dataset.uiCompact = String(window.innerWidth / scale <= 960)
  root.dataset.uiNarrow = String(window.innerWidth / scale <= 480)
  root.dataset.uiShort = String(window.innerHeight / scale <= 700)
}
