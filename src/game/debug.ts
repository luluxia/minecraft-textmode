import type { PersistStorage } from 'zustand/middleware'
import { BIOMES, EYES_NEEDED, ITEM_LIST, type Bag } from './data'
import { initial, useGame, type Game, type GameState } from './store'

export const DEBUG_SCENARIOS = [
  { id: 'start', label: '新游戏', detail: '初生森林 · 空背包' },
  { id: 'village', label: '村庄经营', detail: '村民岗位 · 红石产线 · 熔炉' },
  { id: 'expansion', label: '遗迹与远航', detail: '备好刷子、望远镜和船 · 可勘察或派远征' },
  { id: 'nether', label: '下界探索', detail: '下界门已建成 · 从家出发' },
  { id: 'stronghold', label: '末影龙战前', detail: '传送门房间 · 门已开启' },
  { id: 'endgame', label: '通关后经营', detail: '末地远征 · 纪念碑条件' },
  { id: 'complete', label: '全部成就与图鉴', detail: '全部成就已完成 · 全部物资已收录' },
] as const

export type DebugScenario = typeof DEBUG_SCENARIOS[number]['id']

const sandbox: PersistStorage<GameState> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

let session: { normal: Game; storage?: PersistStorage<GameState> } | null = null

export function startDebug() {
  if (!import.meta.env.DEV || session) return
  const persist = useGame.persist
  session = { normal: useGame.getState(), storage: persist?.getOptions().storage }
  persist?.setOptions({ storage: sandbox })
}

export function exitDebug() {
  if (!session) return
  const { normal, storage } = session
  session = null
  useGame.setState(normal)
  if (storage) useGame.persist.setOptions({ storage })
  useGame.getState().tick(true)
}

const STOCK: Bag = {
  wood: 120, plank: 80, stick: 32, cobble: 160, coal: 40, iron_ore: 28, iron: 32,
  gold: 16, redstone: 30, lapis: 24, obsidian: 18, torch: 32, wheat: 70, seed: 24,
  string: 20, leather: 12, glass: 24, cane: 24, paper: 20, book: 6, bread: 28, steak: 16,
}

const addStock = (s: GameState, stock: Bag) => {
  for (const [item, n] of Object.entries(stock)) {
    s.inv[item] = Math.max(s.inv[item] ?? 0, n)
    s.seen[item] = true
  }
}

export function loadDebugScenario(id: DebugScenario) {
  if (!session) return
  const s = initial()
  if (id === 'start') { useGame.setState(s); return }

  addStock(s, STOCK)
  addStock(s, { table: 1, furnace: 1, campfire: 1, bed: 1, map: 1, pick_iron: 1, axe_iron: 1, sword_iron: 1, armor_iron: 1, shield: 1 })
  s.level = 20
  s.stats.actions = 20
  s.homeId = s.locId
  s.locs[s.locId].shelter = true
  s.flags = { inv: true, status: true, explore: true, furnace: true, village: true, waypoint: true, deepMine: true, automation: true }
  s.village = {
    villagers: 6, jobs: { farmer: 2, lumberjack: 1, miner: 2, gardener: 1 },
    buildings: { house: 4, farm: 1, lumber: 1, mine: 1, cane_field: 1, redstone: 1, warehouse: 1 },
    rep: 40, founded: true, mayor: false,
  }
  s.lines.sawmill = 0
  s.furnace = { fuel: 20, job: { r: 'iron', left: 12, prog: 2 } }
  if (id === 'village') { useGame.setState(s); return }
  if (id === 'expansion') {
    addStock(s, { boat: 1, brush: 1, spyglass: 1, shears: 1, bottle: 12, wool: 16, copper: 24, amethyst: 16 })
    useGame.setState(s)
    return
  }

  addStock(s, { pick_diamond: 1, sword_diamond: 1, armor_diamond: 1, diamond: 24, potion: 4, brewing_stand: 1 })
  if (id === 'endgame' || id === 'complete') {
    addStock(s, { dragon_egg: 1, nether_star: 1, shulker_shell: 12, pearl: 8, elytra: 1 })
    s.village.villagers = 8
    s.village.rep = 80
    s.village.mayor = true
    s.expeditions.city = 1
  }
  if (id === 'complete') {
    for (const item of ITEM_LIST) s.seen[item.id] = true
    Object.assign(s.flags, { trialVault: true, maceLeap: true, dragonAgain: true })
    Object.assign(s.village.buildings, { beacon: 1, monument: 1, shulker_store: 1, apiary: 1, end_store: 1 })
    Object.assign(s.expeditions, { raid: 1, flight: 1, ocean_monument: 1, chorus_grove: 1 })
  }
  useGame.setState(s)
  useGame.getState().buildNether()
  if (id === 'nether') return

  useGame.setState((draft) => {
    const idOfAltar = draft.nextId++
    draft.locs[idOfAltar] = {
      id: idOfAltar, biome: 'altar', name: BIOMES.altar.name, res: {}, saved: true, shelter: false,
    }
    draft.flags.eye = true
    draft.flags.altar = true
    draft.flags.portal = true
    draft.eyesThrown = 3
    draft.altarEyes = EYES_NEEDED
    if (id === 'stronghold') draft.locId = idOfAltar
    else {
      draft.flags.won = true
      draft.flags.wither = true
    }
  })
}

export function refreshDebugSupplies() {
  if (!session) return
  useGame.setState((s) => {
    addStock(s, STOCK)
    s.flags.inv = true
    s.hp = 20
    s.hunger = 20
  })
}

export function clearDebugCooldowns() {
  if (session) useGame.setState({ cds: {} })
}

export function simulateDebugOffline(seconds: number) {
  if (!session) return
  const elapsed = seconds * 1000
  useGame.setState((s) => {
    s.lastTick = Date.now() - elapsed
    for (const cd of Object.values(s.cds)) cd.until = Math.max(0, cd.until - elapsed)
  })
  useGame.getState().tick(true)
}
