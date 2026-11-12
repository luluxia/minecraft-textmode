import {
  BARTER_COST, BARTER_OFFERS, EXCAVATION_COST, EXPEDITIONS, LINES, MAX_AIR, NETHER_COST, OFFLINE_LIMIT, PLANTS,
  RESPAWN_COST, ROUTES, SURVEY_COST, TRIAL_VAULTS, WATER_BREATHING_SECONDS, WITHER_COST, seasonAt, type ExpeditionDef,
} from './progression'
import { decodeSave, encodeSave, normalizeSave, SAVE_KEY, SAVE_VERSION, snapshot } from './save'
import { current } from 'immer'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  ACTIONS, ARMORS, BIOMES, BUILDING_MAP, BUILDINGS, COST_RATIO, CONTROL_REP, ENCHANTS, EYES_NEEDED, FUELS,
  ITEMS, ITEM_LIST, JOBS, JOB_MAP, MAYOR_POP, MAYOR_REP, MOBS, PICKS, RECIPES, SMELTS, SWORDS, TALK_LINES,
  TRADES, randomLocName, type Bag, type Drop, type Recipe,
} from './data'

export interface Loc { id: number; biome: string; name: string; res: Bag; saved: boolean; shelter: boolean }
export interface Village { villagers: number; jobs: Bag; buildings: Bag; rep: number; founded: boolean; mayor: boolean }
export type LogKind = 'info' | 'good' | 'bad' | 'event'
export interface LogEntry { id: number; text: string; kind: LogKind }
export interface Combat {
  mob: string
  hp: number
  boss: boolean
  crystals?: number
  trial?: 'normal' | 'ominous'
  breathTaken?: boolean
  lines: string[]
  turn: number
}
export type PotionId = 'potion' | 'fire_resistance' | 'splash_healing' | 'lingering_healing'
export type Weather = 'clear' | 'rain' | 'storm'

export interface GameState {
  inv: Bag
  seen: Record<string, boolean>
  hp: number
  hunger: number
  air: number
  submerged: boolean
  xp: number
  level: number
  autoEat: boolean
  minute: number
  weather: Weather
  locs: Record<number, Loc>
  locId: number
  homeId: number | null
  nextId: number
  cds: Record<string, { until: number; dur: number }>
  log: LogEntry[]
  logId: number
  flags: Record<string, boolean>
  combat: Combat | null
  furnace: { fuel: number; job: { r: string; left: number; prog: number } | null }
  ench: Bag
  village: Village | null
  stats: { actions: number; kills: number; deaths: number; explored: number }
  eyesThrown: number
  altarEyes: number
  lastTick: number
  crop: number
  cropKind: string
  recruitment: number
  lines: Bag
  expedition: { id: string; left: number; total?: number; returnBottle?: boolean } | null
  expeditions: Bag
  offline: { seconds: number; items: Bag; villagers: number; expedition: string | null } | null
}

export interface GameActions {
  tick(background?: boolean): void
  backup(): string
  restore(text: string): string | null
  dismissOffline(): void
  scout(biome: string): void
  survey(): void
  buildNether(): void
  rest(): void
  plant(id?: string): void
  startTrial(ominous: boolean): void
  openVault(ominous: boolean): void
  openBastion(): void
  searchDig(): void
  gust(): void
  bottleBreath(): void
  cook(item: string): void
  setLine(id: string): void
  launch(id: string): void
  challengeRaid(): void
  summonWither(): void
  breakCrystal(): void
  block(): void
  barter(): void
  drink(item?: PotionId): void
  dive(): void
  surface(): void
  drinkWaterBreathing(): void
  act(id: string): void
  explore(): void
  travel(id: number): void
  saveLoc(): void
  forgetLoc(id: number): void
  eat(item: string): void
  toggleAutoEat(): void
  sleep(): void
  craft(id: string, times?: number): void
  addFuel(item: string): void
  smelt(id: string, n: number): void
  cancelSmelt(): void
  enchant(id: string): void
  buildShelter(): void
  settle(): void
  build(id: string): void
  assign(job: string, delta: number): void
  trade(id: string, times?: number): void
  talk(): void
  runMayor(): void
  attack(): void
  flee(): void
  throwEye(): void
  insertEyes(): void
  enterPortal(): void
  dismissWin(): void
  reset(): void
}
export type Game = GameState & GameActions

export const SHELTER_COST: Bag = { wood: 6, plank: 12 }

// ---------- 纯函数（供界面与逻辑共用） ----------
export const count = (s: GameState, item: string) => Math.floor((s.inv[item] ?? 0) + 1e-9)
export const canAfford = (s: GameState, cost: Bag) => Object.entries(cost).every(([k, n]) => (s.inv[k] ?? 0) + 1e-9 >= n)
export const pickTier = (s: GameState) => {
  for (let i = PICKS.length - 1; i >= 0; i--) if (count(s, PICKS[i]) > 0) return i + 1
  return 0
}
export const attackPower = (s: GameState) =>
  1 + (SWORDS.find(([id]) => count(s, id) > 0)?.[1] ?? 0) + (s.ench.sharp ?? 0)
export const defensePower = (s: GameState) =>
  (ARMORS.find(([id]) => count(s, id) > 0)?.[1] ?? 0) + (count(s, 'shield') > 0 ? 1 : 0) + (s.ench.prot ?? 0)
export const combatMaxHp = (combat: Combat) =>
  Math.ceil(MOBS[combat.mob].hp * (combat.trial === 'ominous' ? 1.65 : 1))
export const hourOf = (minute: number) => Math.floor(minute / 60) % 24
export const isNight = (minute: number) => { const h = hourOf(minute); return h >= 20 || h < 6 }
export const dayOf = (minute: number) => Math.floor(minute / 1440) + 1
export const xpNeed = (level: number) => 10 + level * 5
export const curLoc = (s: GameState) => s.locs[s.locId]
export const atHome = (s: GameState) => !s.submerged && s.homeId !== null && s.homeId === s.locId
export const canDiveHere = (s: GameState) => !!s.flags.explore && curLoc(s).biome === 'coast'
export const hasConduitPower = (s: GameState) => count(s, 'conduit') > 0 && !!s.village?.buildings.harbor
export const waterBreathingLeft = (s: GameState) => Math.max(0, Math.ceil(((s.cds.water_breathing?.until ?? 0) - Date.now()) / 1000))
export const canBreatheUnderwater = (s: GameState) => hasConduitPower(s) || waterBreathingLeft(s) > 0
export const inNether = (loc: Loc) => !!BIOMES[loc.biome].nether
export const canCampHere = (loc: Loc) => !inNether(loc) && !['altar', 'trial_chamber', 'ancient_city'].includes(loc.biome)
export const travelAllowed = (s: GameState, target: Loc) => {
  if (s.submerged) return false
  if (!s.flags.nether || s.homeId === null || inNether(curLoc(s)) === inNether(target)) return true
  return inNether(target) ? atHome(s) : target.id === s.homeId
}
export const canControl = (v: Village) => v.founded || v.mayor || v.rep >= CONTROL_REP
export const housing = (v: Village) => (v.buildings.house ?? 0) * 2
export const employed = (v: Village) => Object.values(v.jobs).reduce((a, b) => a + b, 0)
export const jobSlots = (v: Village, job: string) =>
  BUILDINGS.filter((b) => b.job === job).reduce((a, b) => a + (v.buildings[b.id] ?? 0) * (b.slots ?? 0), 0)
export const villageCap = (s: GameState) => {
  const v = s.village
  if (!v) return 0
  return 200 + 300 * (v.buildings.warehouse ?? 0) + 1200 * (v.buildings.shulker_store ?? 0) +
    1800 * (v.buildings.end_store ?? 0) + (count(s, 'ender_chest') ? 600 : 0)
}
export const villageDefense = (v: Village) =>
  (v.jobs.guard ?? 0) * 3 + (v.buildings.watchtower ?? 0) * 5 + (v.buildings.golem ?? 0) * 10 + (v.buildings.sculk_station ?? 0) * 8
export const buildCost = (v: Village, id: string): Bag => {
  const n = v.buildings[id] ?? 0
  return Object.fromEntries(
    Object.entries(BUILDING_MAP[id].cost).map(([k, c]) => [k, Math.ceil(c * Math.pow(COST_RATIO, Math.min(n, 10)) * (1 + Math.max(0, n - 10) * 0.14))]),
  )
}
export const monumentReady = (s: GameState) =>
  !!s.village?.mayor && !!s.village.buildings.beacon && !!s.expeditions.flight
export const wheatDemand = (v: Village) => Math.max(0, v.villagers - 2) * 0.012
export const cropMultiplier = (s: GameState) => {
  const greenhouses = s.village?.buildings.greenhouse ?? 0
  const season = seasonAt(s.minute).crops
  return (greenhouses ? Math.max(1, season) : season) * (1 + greenhouses * 0.2)
}
export const production = (s: GameState): Bag => {
  const v = s.village
  if (!v) return {}
  const out: Bag = {}
  const crops = cropMultiplier(s)
  const demand = wheatDemand(v)
  const mult = (v.mayor ? 1.25 : 1) * (v.buildings.beacon ? 1.35 : 1) * (v.buildings.monument ? 1.25 : 1)
  const wheat = (v.jobs.farmer ?? 0) * JOB_MAP.farmer.out.wheat * crops * mult
  const fed = (s.inv.wheat ?? 0) + wheat + 1e-9 >= demand
  for (const j of JOBS) {
    const n = v.jobs[j.id] ?? 0
    if (!n) continue
    const factor = ['farmer', 'gardener', 'vegetable_grower', 'beekeeper'].includes(j.id) ? crops : fed ? 1 : 0.65
    for (const [k, r] of Object.entries(j.out)) out[k] = (out[k] ?? 0) + r * n * mult * factor
  }
  if (v.buildings.cobblegen) out.cobble = (out.cobble ?? 0) + 0.38 * v.buildings.cobblegen * mult
  if (demand) out.wheat = (out.wheat ?? 0) - demand
  return out
}
export const recipeStationReady = (s: GameState, station: Recipe['station']) => {
  if (station === 'hand') return true
  const item = station === 'brewing' ? 'brewing_stand' : station === 'smithing' ? 'smithing_table' : 'table'
  return count(s, item) > 0
}
export const raidStrength = (s: GameState) => 8 + (s.village?.villagers ?? 0) + 3 * (s.expeditions.raid ?? 0)
export const lineLimit = (s: GameState) => (s.village?.buildings.redstone ?? 0) + (s.village?.buildings.crafter ?? 0)
export const activeLines = (s: GameState) => LINES.filter((line) => line.id in s.lines).length
export const actionAllowed = (s: GameState, id: string) =>
  BIOMES[curLoc(s).biome].actions.includes(id) &&
  s.submerged === (ACTIONS[id].diveAir !== undefined) &&
  (s.flags.explore || id === 'chop' || (s.flags.inv && id === 'grass'))
export const routeReady = (s: GameState, route: typeof ROUTES[number]) =>
  pickTier(s) >= route.pick && (!route.tool || count(s, route.tool) > 0)
export const scoutAllowed = (s: GameState, biome: string) => {
  const route = ROUTES.find((entry) => entry.biome === biome)
  return !!route && !s.submerged && !!s.flags.explore && !!route.nether === inNether(curLoc(s)) && routeReady(s, route) &&
    !Object.values(s.locs).some((loc) => loc.biome === biome && (loc.saved || loc.shelter))
}

export const actionLock = (s: GameState, action: typeof ACTIONS[string]) => {
  const tool = [action.tool, ...(action.needs ?? [])].find((id) => id && count(s, id) < 1)
  if (action.pick && pickTier(s) < action.pick) return '需要' + ITEMS[PICKS[action.pick - 1]].name
  if (tool) return '需要' + ITEMS[tool].name
  if (action.enchant && !s.ench[action.enchant]) return '需要精准采集'
  if (action.finite && (curLoc(s).res[action.finite] ?? 0) <= 0) return '已枯竭'
  if (action.diveAir && s.air < action.diveAir && !canBreatheUnderwater(s)) return '空气不足，先上浮换气'
  if (action.cost && !canAfford(s, action.cost)) {
    return '需要 ' + Object.entries(action.cost).map(([id, n]) => ITEMS[id].name + ' ×' + n).join('、')
  }
  return ''
}

export const expeditionCost = (s: GameState, trip: ExpeditionDef): Bag =>
  trip.breathing && !count(s, 'conduit') ? { ...trip.cost, water_breathing: 1 } : trip.cost
export const expeditionLock = (s: GameState, trip: ExpeditionDef) => {
  if (trip.region === 'camp' && s.expeditions[trip.id]) return '孵化已完成'
  if (trip.region === 'end' && !s.flags.won) return '需要击败末影龙'
  if (trip.after && !s.expeditions[trip.after]) return '需要完成「' + EXPEDITIONS.find((entry) => entry.id === trip.after)!.name + '」'
  if (trip.tool && !count(s, trip.tool)) return '需要' + ITEMS[trip.tool].name
  if (trip.region === 'ocean' && !count(s, 'boat')) return '需要橡木船'
  return ''
}
export const expeditionTime = (s: GameState, trip: ExpeditionDef) => {
  let multiplier = s.village?.buildings.sculk_station ? 0.85 : 1
  if (trip.region === 'ocean') {
    if (s.village?.buildings.harbor) multiplier *= 0.8
    if (count(s, 'conduit')) multiplier *= 0.8
  }
  return Math.ceil(trip.seconds * multiplier)
}
export const expeditionVisible = (s: GameState, trip: ExpeditionDef) => {
  if (trip.region === 'end') return !!s.flags.won
  if (trip.region === 'camp') return !!s.expeditions.warm_ruins
  return !!s.seen.boat || !!s.expeditions.shipwreck
}

export const enchantCost = (s: GameState, id: string) => {
  const lvl = s.ench[id] ?? 0
  const lapis = (lvl + 1) * 3
  return { levels: (lvl + 1) * 2, lapis: s.village?.buildings.library ? Math.ceil(lapis / 2) : lapis }
}

// ---------- 内部辅助（作用于 immer draft） ----------
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pushLog = (s: GameState, text: string, kind: LogKind = 'info') => {
  s.log.unshift({ id: s.logId++, text, kind })
  if (s.log.length > 80) s.log.length = 80
}
const give = (s: GameState, item: string, n: number) => {
  if (n <= 0) return
  s.inv[item] = (s.inv[item] ?? 0) + n
  s.seen[item] = true
}
const pay = (s: GameState, cost: Bag) => {
  for (const [item, n] of Object.entries(cost)) {
    if (n) s.inv[item] = Math.max(0, (s.inv[item] ?? 0) - n)
  }
}
const setCd = (s: GameState, id: string, sec: number, raw = false) => {
  const dur = sec * 1000 * (raw ? 1 : (1 - 0.08 * (s.ench.eff ?? 0)) * (s.hunger < 5 ? 1.25 : 1) * (s.village?.buildings.beacon ? 0.85 : 1))
  s.cds[id] = { until: Date.now() + dur, dur }
}
const onCd = (s: GameState, id: string) => (s.cds[id]?.until ?? 0) > Date.now()
const gainXp = (s: GameState, n: number) => {
  s.xp += n
  while (s.xp >= xpNeed(s.level)) { s.xp -= xpNeed(s.level); s.level++ }
}
const rollDrops = (s: GameState, drops: Drop[]) => {
  const parts: string[] = []
  for (const dr of drops) {
    if (Math.random() > (dr.p ?? 1)) continue
    let n = rand(dr.min, dr.max)
    if (!['dragon_egg', 'nether_star', 'sculk_catalyst'].includes(dr.item) && Math.random() < 0.12 * (s.ench.fortune ?? 0)) n *= 2
    give(s, dr.item, n)
    parts.push(`${ITEMS[dr.item].name} +${n}`)
  }
  return parts.join('，')
}
const makeLoc = (s: GameState, biome?: string): Loc => {
  if (!biome) {
    const pool = Object.values(BIOMES).filter((b) => b.id !== 'cave' || pickTier(s) >= 2).map((b) => ({ id: b.id, w: b.weight }))
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0)
    biome = pool.find((b) => (r -= b.w) < 0)?.id ?? 'forest'
  }
  const res: Bag = {}
  for (const [k, [a, b]] of Object.entries(BIOMES[biome].res)) res[k] = rand(a, b)
  const loc: Loc = { id: s.nextId++, biome, name: randomLocName(biome), res, saved: false, shelter: false }
  s.locs[loc.id] = loc
  return loc
}
const leaveLoc = (s: GameState) => {
  const loc = curLoc(s)
  if (!loc.saved && !loc.shelter) delete s.locs[loc.id]
}
const startCombat = (s: GameState, mobId: string, boss = false) => {
  const m = MOBS[mobId]
  s.combat = { mob: mobId, hp: m.hp, boss, crystals: mobId === 'dragon' ? 3 : undefined, lines: [`${m.name}出现了！`], turn: 0 }
}
const maybeEncounter = (s: GameState) => {
  if (!s.flags.explore || s.combat || s.submerged) return
  const loc = curLoc(s)
  const night = isNight(s.minute)
  const underground = loc.biome === 'cave' || inNether(loc)
  if (loc.shelter || (!night && !underground) || attackPower(s) <= 1) return
  let p = (underground ? 0.09 : 0.055) * BIOMES[loc.biome].danger
  if (s.weather === 'storm') p *= 1.4
  if (count(s, 'torch') > 0) p *= 0.35
  if (Math.random() > p) return
  const pool = Object.values(MOBS)
    .filter((m) => m.hostile && (!m.nightOnly || night) && (m.id !== 'shade' || pickTier(s) >= 3))
    .map((m) => ({ id: m.id, w: (m.weight ?? 1) * (m.id === 'witch' && loc.biome === 'swamp' ? 4 : 1) }))
  let r = Math.random() * pool.reduce((a, b) => a + b.w, 0)
  const id = pool.find((m) => (r -= m.w) < 0)?.id ?? 'zombie'
  pushLog(s, `你在暗处遇到了${MOBS[id].name}！`, 'bad')
  startCombat(s, id)
}
const die = (s: GameState, cause: string) => {
  s.stats.deaths++
  s.combat = null
  s.submerged = false
  s.air = MAX_AIR
  for (const k of count(s, 'recovery_compass') ? ['wheat'] : ['wood', 'cobble', 'wheat', 'coal']) {
    if (s.inv[k]) s.inv[k] -= Math.min(12, Math.floor(s.inv[k] * 0.08))
  }
  s.level = Math.floor(s.level * 0.85)
  s.xp = 0
  s.hp = 20
  s.hunger = 16
  pushLog(s, `你死了。${cause}`, 'bad')
  if (s.homeId !== null) {
    if (s.locId !== s.homeId) leaveLoc(s)
    s.locId = s.homeId
    pushLog(s, '你在庇护所中醒来，丢失了一部分物资与经验。', 'event')
  } else {
    leaveLoc(s)
    s.locId = makeLoc(s, 'forest').id
    pushLog(s, '你在一片陌生的森林中醒来，丢失了一部分物资与经验。', 'event')
  }
}
const unlock = (s: GameState, flag: string, text: string) => {
  if (s.flags[flag]) return
  s.flags[flag] = true
  pushLog(s, text, 'event')
}
const checkUnlocks = (s: GameState) => {
  if (!s.flags.inv && Object.values(s.inv).some((n) => n > 0)) unlock(s, 'inv', '你把木头抱在怀里。也许能用它做点什么。')
  if (s.stats.actions >= 6) unlock(s, 'status', '肚子咕咕叫了起来。你得找点吃的。')
  if (count(s, 'table') > 0) unlock(s, 'explore', '有了工作台，你觉得可以走得更远一些了。')
  if (count(s, 'furnace') > 0) unlock(s, 'furnace', '熔炉里升起了第一缕火光。')
  if (count(s, 'enchant_table') > 0) unlock(s, 'enchant', '附魔台上的书页无风自动，低语着陌生的文字。')
  if (count(s, 'map') > 0) unlock(s, 'waypoint', '地图已标明方位，你可以记录走过的地点了。')
  if (pickTier(s) >= 3) unlock(s, 'deepMine', '铁镐可以凿开红石与钻石矿。洞穴深处还凝结着黑曜石。')
  if (count(s, 'spyglass')) unlock(s, 'spyglass', '望远镜让你辨认出试炼密室的铜制入口。')
  if (count(s, 'boat')) unlock(s, 'ocean', '有了船，你可以在村庄组织海洋远征。')
  if (count(s, 'eye') > 0) unlock(s, 'eye', '末影之眼在掌心微微颤动，似乎想飞向某个方向。')
}

const moveTime = (s: GameState, base: number) => base * (count(s, 'elytra') ? 0.55 : count(s, 'scaffolding') ? 0.85 : 1)
const replenish = (loc: Loc, keys: string[]) => {
  for (const key of keys) {
    const range = BIOMES[loc.biome].res[key]
    if (!range) continue
    const before = loc.res[key] ?? 0
    if (before >= range[1]) continue
    loc.res[key] = range[1]
  }
}
const renewResources = (s: GameState) => {
  for (const loc of Object.values(s.locs)) replenish(loc, BIOMES[loc.biome].renew ?? [])
}
export const mineResources = (loc: Loc) => {
  const biome = BIOMES[loc.biome]
  return biome.actions.flatMap((id) => {
    const action = ACTIONS[id]
    return action.kind === 'mine' && action.finite && !biome.renew?.includes(action.finite) ? [action.finite] : []
  })
}
export const canSurvey = (s: GameState) => {
  const loc = curLoc(s)
  return pickTier(s) >= 2 && mineResources(loc).some((id) => (loc.res[id] ?? 0) < BIOMES[loc.biome].res[id][1])
}
export const CAMP_COOK = SMELTS.filter((recipe) => ITEMS[recipe.from].food && ITEMS[recipe.out].food)

const advanceEconomy = (s: GameState, live: boolean) => {
  const previous = hourOf(s.minute)
  s.minute += 5
  const hour = hourOf(s.minute)
  if (hour !== previous && hour === 6) {
    renewResources(s)
  }
  if (live && s.flags.explore && hour !== previous) {
    if (hour === 20) pushLog(s, '夜幕降临，带上火把再出门。', 'event')
    if (hour === 6) pushLog(s, '天亮了。田里的作物和牲畜群恢复了。', 'event')
    if (Math.random() < 0.07) {
      const next: Weather = s.weather !== 'clear' ? 'clear' : Math.random() < 0.75 ? 'rain' : 'storm'
      s.weather = next
      pushLog(s, next === 'clear' ? '云层散开，天放晴了。' : next === 'rain' ? '下雨了。' : '雷声滚滚，暴风雨来了。')
    }
  }

  if (s.crop > 0 && --s.crop === 0) {
    const plant = PLANTS.find((entry) => entry.id === s.cropKind) ?? PLANTS[0]
    for (const [item, n] of Object.entries(plant.reward)) give(s, item, n)
    if (live) pushLog(s, '营地的' + plant.name + '成熟了，收获已收入背包。', 'good')
  }

  const job = s.furnace.job
  if (job && s.furnace.fuel >= 1) {
    const def = SMELTS.find((entry) => entry.id === job.r)!
    job.prog += s.village?.buildings.nether_forge ? 2 : 1
    if (job.prog >= def.time) {
      job.prog -= def.time
      job.left--
      s.furnace.fuel--
      give(s, def.out, 1)
      gainXp(s, 1)
      if (job.left <= 0) {
        s.furnace.job = null
        if (live) pushLog(s, `熔炉完成了${ITEMS[def.out].name}的熔炼。`)
      }
    }
  }

  const v = s.village
  if (v) {
    const cap = villageCap(s)
    for (const [item, rate] of Object.entries(production(s))) {
      const current = s.inv[item] ?? 0
      if (rate < 0) s.inv[item] = Math.max(0, current + rate)
      else if (current < cap) give(s, item, Math.min(rate, cap - current))
    }
    if (housing(v) > v.villagers) {
      s.recruitment = Math.min(recruitTime(v), s.recruitment + 1)
      const cost: Bag = { wheat: v.villagers < 2 ? 0 : 3 + Math.floor(v.villagers / 2) }
      if (s.recruitment >= recruitTime(v) && canAfford(s, cost)) {
        if (cost.wheat) pay(s, cost)
        v.villagers++
        v.rep += 2
        s.recruitment = 0
        if (live) pushLog(s, '一位村民搬进了空房子。', 'good')
      }
    }
    for (const line of LINES) {
      if (!(line.id in s.lines)) continue
      const ready = Math.min(line.seconds, s.lines[line.id] + 1)
      s.lines[line.id] = ready
      if (ready < line.seconds || !canAfford(s, line.input)) continue
      if (Object.entries(line.output).some(([item, n]) => (s.inv[item] ?? 0) + n > cap)) continue
      if (line.reserveWheat && (s.inv.wheat ?? 0) < line.input.wheat + wheatDemand(v) * 60) continue
      pay(s, line.input)
      for (const [item, n] of Object.entries(line.output)) give(s, item, n)
      s.lines[line.id] = 0
    }
  }

  if (s.expedition && --s.expedition.left <= 0) {
    const def = EXPEDITIONS.find((entry) => entry.id === s.expedition?.id)!
    const reward = s.expeditions[def.id] ? def.reward : { ...def.reward, ...def.first }
    for (const [item, n] of Object.entries(reward)) give(s, item, n)
    if (s.expedition.returnBottle) give(s, 'bottle', 1)
    gainXp(s, def.xp)
    s.expeditions[def.id] = (s.expeditions[def.id] ?? 0) + 1
    s.expedition = null
    if (live) pushLog(s, `远征结束：${def.name}。物资已收入背包。`, 'good')
  }
}
export const recruitTime = (v: Village) => v.villagers < 2 ? 20 : Math.min(180, 35 + v.villagers * 5)

const combatLine = (c: Combat, line: string) => {
  c.lines.unshift(line)
  if (c.lines.length > 6) c.lines.length = 6
}
const surface = (s: GameState, message: string) => {
  if (!s.submerged) return
  s.submerged = false
  s.combat = null
  pushLog(s, message)
}
const advancePlayer = (s: GameState) => {
  if (!s.submerged || canBreatheUnderwater(s)) s.air = Math.min(MAX_AIR, s.air + 5)
  else if (s.air > 0) {
    s.air--
    if (s.air === 5) pushLog(s, '空气所剩无几，该上浮了。', 'bad')
  } else {
    s.hp -= 2
    if (s.hp <= 0) { die(s, '你在海底溺水了。'); return }
  }
  if (!s.submerged && !s.combat && s.hunger >= 8 && s.hp < 20) s.hp = Math.min(20, s.hp + (atHome(s) ? 0.5 : 0.2))
  if (s.autoEat && s.hunger <= 12 && !s.combat && !onCd(s, 'eat')) {
    const foods = ITEM_LIST.filter((item) => item.food && item.id !== 'rotten' && count(s, item.id) > 0)
    const food = foods.sort((a, b) => b.food! - a.food!).find((item) => item.food! <= 20 - s.hunger)
    if (food) {
      pay(s, { [food.id]: 1 })
      s.hunger += food.food!
      if (food.container) give(s, food.container, 1)
      setCd(s, 'eat', 1, true)
      pushLog(s, `你自动吃掉了一份${food.name}。`)
    }
  }
  const c = s.combat
  if (!c) return
  c.turn++
  const mob = MOBS[c.mob]
  if (!mob.atk || onCd(s, 'staggered') || c.turn % (c.boss ? 4 : 3) !== 0) return
  const guarded = count(s, 'shield') > 0 && onCd(s, 'guarding')
  const enraged = c.mob === 'wither' && c.hp <= mob.hp / 2
  const fireWard = ['blaze', 'magma_cube', 'ghast'].includes(c.mob) && onCd(s, 'fire_ward')
  const armor = Math.floor(defensePower(s) * (c.mob === 'warden' ? 0.35 : 0.6))
  const damage = Math.max(1, mob.atk + Number(enraged) + (c.trial === 'ominous' ? 2 : 0) +
    rand(0, 1) - armor - (guarded ? 4 : 0) - (fireWard ? 4 : 0))
  s.hp -= damage
  if (c.crystals) c.hp = Math.min(mob.hp, c.hp + c.crystals)
  combatLine(c, `${guarded ? '盾牌挡下了部分伤害。' : ''}${mob.name}造成 ${damage} 点伤害。`)
  if (s.hp <= 0) die(s, `${mob.name}没有给你留下机会。`)
}

export const initial = (): GameState => ({
  inv: {},
  seen: {},
  hp: 20,
  hunger: 20,
  air: MAX_AIR,
  submerged: false,
  xp: 0,
  level: 0,
  autoEat: false,
  minute: 8 * 60,
  weather: 'clear',
  locs: { 1: { id: 1, biome: 'forest', name: '初生森林', res: { pig: 5, chicken: 4, eggs: 4 }, saved: true, shelter: false } },
  locId: 1,
  homeId: null,
  nextId: 2,
  cds: {},
  log: [
    { id: 1, text: '身边只有树。', kind: 'info' },
    { id: 0, text: '你在一片陌生的森林中醒来，两手空空。', kind: 'event' },
  ],
  logId: 2,
  flags: {},
  combat: null,
  furnace: { fuel: 0, job: null },
  ench: {},
  village: null,
  stats: { actions: 0, kills: 0, deaths: 0, explored: 0 },
  eyesThrown: 0,
  altarEyes: 0,
  lastTick: Date.now(),
  crop: 0,
  cropKind: 'wheat',
  recruitment: 0,
  lines: {},
  expedition: null,
  expeditions: {},
  offline: null,
})

const defaults = initial()

export const useGame = create<Game>()(
  persist(
    immer((set, get) => ({
      ...initial(),

      tick: (background = false) => set((draft) => {
        const now = Date.now()
        if (now < draft.lastTick) {
          const offset = draft.lastTick - now
          for (const cd of Object.values(draft.cds)) cd.until = Math.max(0, cd.until - offset)
          draft.lastTick = now
        }
        const elapsed = Math.floor((now - draft.lastTick) / 1000)
        if (elapsed <= 0) {
          if (background) surface(draft, '你已在离开时返回水面。')
          return
        }
        const offline = background || elapsed > 3
        // Long catch-up uses a plain copy to avoid per-second proxy overhead.
        const s = offline && elapsed > 3 ? structuredClone(snapshot(current(draft), defaults)) : draft
        if (offline && s.submerged) surface(s, '你已在离开时返回水面。')
        s.lastTick = now - ((now - s.lastTick) % 1000)
        const seconds = Math.min(elapsed, OFFLINE_LIMIT)
        if (offline) s.air = Math.min(MAX_AIR, s.air + seconds * 5)
        const before = offline ? { ...s.inv } : null
        const villagers = s.village?.villagers ?? 0
        const expedition = s.expedition?.id
        for (let second = 0; second < seconds; second++) {
          advanceEconomy(s, !offline)
          if (!offline) advancePlayer(s)
        }
        if (before && ((elapsed >= 5 && (s.flags.inv || s.village)) || s.offline)) {
          const items: Bag = { ...s.offline?.items }
          for (const [id, n] of Object.entries(s.inv)) {
            const change = count(s, id) - Math.floor((before[id] ?? 0) + 1e-9)
            if (change) items[id] = (items[id] ?? 0) + change
          }
          const arrivals = (s.village?.villagers ?? 0) - villagers
          const completed = expedition && !s.expedition ? expedition : s.offline?.expedition ?? null
          s.offline = {
            seconds: (s.offline?.seconds ?? 0) + seconds,
            items,
            villagers: (s.offline?.villagers ?? 0) + arrivals,
            expedition: completed,
          }
        }
        checkUnlocks(s)
        if (s !== draft) return s
      }),

      backup: () => encodeSave(get(), defaults),
      restore: (raw) => {
        const saved = decodeSave(raw, initial())
        if (typeof saved === 'string') return saved
        set(() => saved)
        return null
      },
      dismissOffline: () => set((s) => { s.offline = null }),

      dive: () => set((s) => {
        if (!canDiveHere(s) || s.submerged || s.combat || s.air < MAX_AIR) return
        s.submerged = true
        pushLog(s, '你潜入海底。留意空气槽，随时可以上浮。', 'event')
      }),

      surface: () => set((s) => surface(s, '你回到水面，重新开始换气。')),

      drinkWaterBreathing: () => set((s) => {
        if (!canDiveHere(s) || !count(s, 'water_breathing') || hasConduitPower(s) ||
          onCd(s, 'drink') || canBreatheUnderwater(s)) return
        pay(s, { water_breathing: 1 })
        give(s, 'bottle', 1)
        setCd(s, 'drink', 8, true)
        setCd(s, 'water_breathing', WATER_BREATHING_SECONDS, true)
        s.air = MAX_AIR
        pushLog(s, '水肺药水生效，暂时可以在水下呼吸。', 'good')
      }),

      scout: (biome) => set((s) => {
        if (s.combat || onCd(s, 'move') || !scoutAllowed(s, biome)) return
        const current = curLoc(s)
        const loc = current.biome === biome ? current : makeLoc(s, biome)
        if (loc !== current) leaveLoc(s)
        loc.saved = true
        s.locId = loc.id
        s.stats.explored++
        gainXp(s, 2)
        setCd(s, 'move', moveTime(s, 5))
        pushLog(s, `你找到了${loc.name}，沿途留下了路标。${BIOMES[biome].desc}`, 'event')
      }),

      survey: () => set((s) => {
        if (s.combat || onCd(s, 'survey') || !canSurvey(s) || !canAfford(s, SURVEY_COST)) return
        pay(s, SURVEY_COST)
        const loc = curLoc(s)
        replenish(loc, mineResources(loc))
        setCd(s, 'survey', 30, true)
        pushLog(s, '你架起火把，开辟了一段新的矿道。', 'good')
      }),

      buildNether: () => set((s) => {
        if (!atHome(s) || s.combat || s.flags.nether || !canAfford(s, NETHER_COST)) return
        pay(s, NETHER_COST)
        for (const id of ['rift', 'warped']) {
          const loc = Object.values(s.locs).find((entry) => entry.biome === id) ?? makeLoc(s, id)
          loc.saved = true
        }
        unlock(s, 'nether', '下界传送门亮起。下界要塞与诡异森林已标记在路线中。')
      }),

      rest: () => set((s) => {
        if (s.submerged || s.combat || onCd(s, 'rest') || !s.flags.status || (s.hp >= 20 && s.hunger >= 8)) return
        const camp = atHome(s) && count(s, 'campfire') > 0
        s.hp = Math.min(20, s.hp + (camp ? 10 : 4))
        s.hunger = Math.max(8, s.hunger)
        setCd(s, 'rest', camp ? 14 : 24, true)
        pushLog(s, camp ? '你在营火旁恢复了体力。' : '你找了一处安静的地方休整。')
      }),

      plant: (id = 'wheat') => set((s) => {
        const plant = PLANTS.find((entry) => entry.id === id)
        if (!plant || s.combat || !atHome(s) || s.crop || !canAfford(s, plant.cost)) return
        pay(s, plant.cost)
        s.cropKind = id
        s.crop = Math.ceil(plant.seconds / cropMultiplier(s))
        pushLog(s, '你在营地种下了' + plant.name + '。')
      }),

      searchDig: () => set((s) => {
        if (s.combat || curLoc(s).biome !== 'desert_ruin' || !count(s, 'brush') || onCd(s, 'excavation')) return
        if ((curLoc(s).res.suspicious ?? 0) > 0 || !canAfford(s, EXCAVATION_COST)) return
        pay(s, EXCAVATION_COST)
        replenish(curLoc(s), ['suspicious'])
        setCd(s, 'excavation', 35, true)
        pushLog(s, '你沿砂岩墙找到另一片未清理的沙层。', 'good')
      }),

      startTrial: (ominous) => set((s) => {
        if (s.combat || curLoc(s).biome !== 'trial_chamber' || onCd(s, 'trial')) return
        if (ominous && (!s.flags.trialVault || !count(s, 'ominous_bottle'))) return
        if (ominous) pay(s, { ominous_bottle: 1 })
        setCd(s, 'trial', ominous ? 45 : 30, true)
        startCombat(s, 'breeze')
        const combat = s.combat!
        combat.trial = ominous ? 'ominous' : 'normal'
        if (ominous) {
          combat.hp = combatMaxHp(combat)
          combatLine(combat, '不祥试炼刷怪笼强化了旋风人。')
        }
      }),

      openVault: (ominous) => set((s) => {
        if (s.combat || curLoc(s).biome !== 'trial_chamber') return
        const vault = TRIAL_VAULTS.find((entry) => entry.id === (ominous ? 'ominous' : 'normal'))!
        if (!canAfford(s, vault.cost) || onCd(s, 'vault')) return
        pay(s, vault.cost)
        for (const [item, n] of Object.entries(vault.reward)) give(s, item, n)
        s.flags[vault.flag] = true
        setCd(s, 'vault', 4, true)
        pushLog(s, vault.name + '喷出了战利品。', 'good')
      }),

      openBastion: () => set((s) => {
        if (s.combat || curLoc(s).biome !== 'bastion' || !s.flags.bastionCleared) return
        s.flags.bastionCleared = false
        give(s, 'netherite_template', 1)
        give(s, 'gold', 6)
        pushLog(s, '你从堡垒遗迹的箱子中找到下界合金升级锻造模板。', 'good')
      }),

      gust: () => set((s) => {
        const c = s.combat
        if (!c || onCd(s, 'gust') || !count(s, 'wind_charge')) return
        pay(s, { wind_charge: 1 })
        setCd(s, 'gust', 7, true)
        setCd(s, 'staggered', 2.5, true)
        if (count(s, 'mace')) setCd(s, 'leap', 4, true)
        combatLine(c, count(s, 'mace') ? '风弹将你推上空中，下一击可用重锤砸落。' : '风弹让对手失去平衡，短暂停止攻击。')
      }),

      bottleBreath: () => set((s) => {
        const c = s.combat
        if (c?.mob !== 'dragon' || c.turn < 4 || c.breathTaken || !count(s, 'bottle')) return
        pay(s, { bottle: 1 })
        give(s, 'dragon_breath', 1)
        c.breathTaken = true
        combatLine(c, '你用玻璃瓶收集了末影龙留下的龙息。')
      }),

      cook: (item) => set((s) => {
        const recipe = CAMP_COOK.find((entry) => entry.from === item)
        if (!recipe || s.combat || !atHome(s) || !count(s, 'campfire') || onCd(s, 'cook') || !count(s, item)) return
        pay(s, { [item]: 1 })
        give(s, recipe.out, 1)
        setCd(s, 'cook', 4, true)
        pushLog(s, `你在营火上烤熟了一份${ITEMS[recipe.out].name}。`, 'good')
      }),

      setLine: (id) => set((s) => {
        const line = LINES.find((entry) => entry.id === id)
        if (!line || !atHome(s) || s.combat || !s.village || !canControl(s.village) ||
          (line.building && !s.village.buildings[line.building])) return
        if (id in s.lines) delete s.lines[id]
        else if (activeLines(s) < lineLimit(s)) {
          s.lines[id] = 0
          s.flags.automation = true
        }
      }),

      launch: (id) => set((s) => {
        const def = EXPEDITIONS.find((entry) => entry.id === id)
        if (!def || s.combat || !atHome(s) || s.expedition || expeditionLock(s, def)) return
        const cost = expeditionCost(s, def)
        if (!canAfford(s, cost)) return
        const total = expeditionTime(s, def)
        pay(s, cost)
        s.expedition = { id, left: total, total, returnBottle: !!cost.water_breathing }
        pushLog(s, `远征出发：${def.name}。`, 'event')
      }),

      challengeRaid: () => set((s) => {
        const v = s.village
        if (!v || !atHome(s) || !v.buildings.watchtower || v.villagers < 2 || s.combat || onCd(s, 'raid')) return
        if (villageDefense(v) + attackPower(s) + defensePower(s) < raidStrength(s)) return
        setCd(s, 'raid', 120, true)
        v.rep += 12
        give(s, 'emerald', 3)
        give(s, 'bone', 4)
        give(s, 'ominous_bottle', 1)
        gainXp(s, 12)
        s.expeditions.raid = (s.expeditions.raid ?? 0) + 1
        pushLog(s, '袭击者被守卫和铁傀儡挡在村外。村庄声望 +12，缴获绿宝石 ×3、骨头 ×4、不祥之瓶 ×1。', 'good')
      }),

      summonWither: () => set((s) => {
        if (s.combat || !s.flags.nether || s.flags.wither || curLoc(s).biome !== 'rift') return
        if (!s.flags.witherSummoned) {
          if (!canAfford(s, WITHER_COST)) return
          pay(s, WITHER_COST)
          s.flags.witherSummoned = true
        }
        startCombat(s, 'wither', true)
      }),

      barter: () => set((s) => {
        if (!s.flags.nether || s.combat || !inNether(curLoc(s)) || onCd(s, 'barter') || !canAfford(s, BARTER_COST)) return
        pay(s, BARTER_COST)
        setCd(s, 'barter', 12, true)
        let ticket = Math.random() * BARTER_OFFERS.reduce((n, offer) => n + offer.weight, 0)
        const offer = BARTER_OFFERS.find((entry) => (ticket -= entry.weight) < 0)!
        for (const [item, n] of Object.entries(offer.reward)) give(s, item, n)
        const loot = Object.entries(offer.reward).map(([item, n]) => ITEMS[item].name + ' ×' + n)
        pushLog(s, '猪灵收下了金锭，扔给你' + loot.join('、') + '。', 'good')
      }),

      drink: (item = 'potion') => set((s) => {
        if (!['potion', 'fire_resistance', 'splash_healing', 'lingering_healing'].includes(item) || !count(s, item) || onCd(s, 'drink')) return
        if ((item === 'splash_healing' || item === 'lingering_healing') && !s.combat) return
        if (item === 'fire_resistance' ? onCd(s, 'fire_ward') : s.hp >= 20) return
        pay(s, { [item]: 1 })
        setCd(s, 'drink', 8, true)
        if (item === 'fire_resistance') {
          give(s, 'bottle', 1)
          setCd(s, 'fire_ward', 60, true)
          pushLog(s, '你饮下了抗火药水，60 秒内降低来自烈焰人、岩浆怪和恶魂的伤害。', 'good')
        } else {
          const heal = item === 'lingering_healing' ? 12 : 8
          s.hp = Math.min(20, s.hp + heal)
          pushLog(s, '你使用了' + ITEMS[item].name + '，回复至多 ' + heal + ' 点生命。', 'good')
        }
      }),

      breakCrystal: () => set((s) => {
        const c = s.combat
        if (!c?.crystals || onCd(s, 'attack')) return
        setCd(s, 'attack', 1, true)
        c.crystals--
        combatLine(c, c.crystals ? `末地水晶碎裂。还剩 ${c.crystals} 座。` : '最后一座水晶碎裂，末影龙失去了庇护。')
      }),

      block: () => set((s) => {
        if (!s.combat || !count(s, 'shield') || onCd(s, 'block')) return
        setCd(s, 'block', 7, true)
        setCd(s, 'guarding', 4, true)
        combatLine(s.combat, '你举起了盾牌，格挡持续 4 秒。')
      }),

      act: (id) => set((s) => {
        const a = ACTIONS[id]
        if (!a || s.combat || onCd(s, id) || !actionAllowed(s, id)) return
        const loc = curLoc(s)
        if (actionLock(s, a)) return
        if (a.diveAir && !canBreatheUnderwater(s)) s.air -= a.diveAir
        if (a.cost) pay(s, a.cost)
        let cd = a.cd
        if (a.kind === 'mine') cd *= Math.max(0.58, 1 - 0.14 * (pickTier(s) - (a.pick ?? 1)))
        if (id.startsWith('chop')) cd *= count(s, 'axe_netherite') ? 0.36 : count(s, 'axe_diamond') ? 0.42 :
          count(s, 'axe_iron') ? 0.5 : count(s, 'axe_stone') ? 0.7 : 1
        setCd(s, id, cd)
        s.stats.actions++
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - a.hunger)
        if (a.finite) loc.res[a.finite]--
        if (a.mob) {
          pushLog(s, `你盯上了一只${MOBS[a.mob].name}。`)
          startCombat(s, a.mob, a.mob === 'warden')
          return
        }
        let got = rollDrops(s, a.drops ?? [])
        if (a.kind === 'fish' && s.weather !== 'clear' && Math.random() < 0.5) {
          give(s, 'fish', 1)
          got += (got ? '，' : '') + '雨天鱼儿格外活跃，生鱼 +1'
        }
        pushLog(s, `${a.text ?? `你${a.name}。`}${got ? `（${got}）` : '一无所获。'}`)
        if (a.finite && loc.res[a.finite] <= 0) pushLog(s, '这里的资源已经枯竭了。')
        if (a.xp) gainXp(s, a.xp)
        maybeEncounter(s)
        checkUnlocks(s)
      }),

      explore: () => set((s) => {
        if (!s.flags.explore || s.combat || s.submerged || onCd(s, 'move')) return
        const old = curLoc(s)
        if (s.flags.nether && inNether(old)) return
        if (!old.saved && !old.shelter && !s.flags.lostHint) {
          s.flags.lostHint = true
          pushLog(s, '没有地图，你再也找不回刚才的地方了。', 'event')
        }
        leaveLoc(s)
        const loc = makeLoc(s)
        s.locId = loc.id
        s.stats.explored++
        setCd(s, 'move', moveTime(s, 7))
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - 0.5)
        const b = BIOMES[loc.biome]
        pushLog(s, `你走了很久，来到了${loc.name}。${b.desc}`, 'event')
        if (loc.biome === 'village') unlock(s, 'metVillage', '这里住着村民。也许可以在此定居。')
        gainXp(s, 1)
        maybeEncounter(s)
      }),

      travel: (id) => set((s) => {
        const target = s.locs[id]
        if (s.combat || onCd(s, 'move') || !target || id === s.locId || !travelAllowed(s, target)) return
        leaveLoc(s)
        s.locId = id
        setCd(s, 'move', moveTime(s, 3))
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - 0.3)
        pushLog(s, `你沿着熟悉的路回到了${s.locs[id].name}。`, 'event')
        maybeEncounter(s)
      }),

      saveLoc: () => set((s) => {
        if (!s.flags.waypoint || s.submerged || s.combat || curLoc(s).saved || Object.keys(s.locs).length > 48) return
        curLoc(s).saved = true
        pushLog(s, `你在地图上标记了${curLoc(s).name}。`, 'good')
      }),

      forgetLoc: (id) => set((s) => {
        const loc = s.locs[id]
        if (!loc || loc.shelter || loc.biome === 'altar' || loc.biome === 'rift' || loc.biome === 'warped') return
        loc.saved = false
        if (id !== s.locId) delete s.locs[id]
      }),

      eat: (item) => set((s) => {
        const def = ITEMS[item]
        if (!def?.food || count(s, item) < 1 || onCd(s, 'eat') || (s.hunger >= 20 && !s.combat)) return
        pay(s, { [item]: 1 })
        s.hunger = Math.min(20, s.hunger + def.food)
        if (def.container) give(s, def.container, 1)
        if (s.combat && item !== 'rotten') s.hp = Math.min(20, s.hp + Math.ceil(def.food / 2))
        setCd(s, 'eat', s.combat ? 4 : 1, true)
        if (item === 'rotten' && Math.random() < 0.3) {
          s.hp = Math.max(1, s.hp - 2)
          pushLog(s, '腐肉让你一阵反胃。', 'bad')
        } else pushLog(s, `你吃掉了一份${def.name}。`)
      }),

      toggleAutoEat: () => set((s) => { s.autoEat = !s.autoEat }),

      sleep: () => set((s) => {
        if (s.combat || !atHome(s) || count(s, 'bed') < 1 || !isNight(s.minute)) return
        const h = hourOf(s.minute)
        const skip = ((h >= 20 ? 30 - h : 6 - h) * 60) - (s.minute % 60)
        s.minute += skip
        renewResources(s)
        s.hp = Math.min(20, s.hp + 8)
        s.hunger = Math.max(0, s.hunger - 2)
        pushLog(s, '你在床上睡了一觉。醒来时天已经亮了。', 'good')
      }),

      craft: (id, times = 1) => set((s) => {
        const r = RECIPES.find((x) => x.id === id)
        if (!r || !Number.isSafeInteger(times) || times <= 0 || !recipeStationReady(s, r.station)) return
        const unique = ['tool', 'gear'].includes(ITEMS[r.out].cat)
        if (unique && count(s, r.out)) return
        let made = 0
        for (let i = 0; i < Math.min(unique ? 1 : 100, times) && canAfford(s, r.cost); i++) {
          pay(s, r.cost)
          give(s, r.out, r.n)
          for (const [item, n] of Object.entries(r.returns ?? {})) give(s, item, n)
          made += r.n
        }
        if (!made) return
        pushLog(s, `你合成了${ITEMS[r.out].name} ×${made}。`)
        checkUnlocks(s)
      }),

      addFuel: (item) => set((s) => {
        if (!FUELS[item] || count(s, item) < 1 || count(s, 'furnace') < 1) return
        pay(s, { [item]: 1 })
        s.furnace.fuel += FUELS[item]
      }),

      smelt: (id, n) => set((s) => {
        const def = SMELTS.find((x) => x.id === id)
        if (!def || !Number.isSafeInteger(n) || n <= 0 || count(s, 'furnace') < 1) return
        if (s.furnace.job && s.furnace.job.r !== id) return
        n = Math.min(n, count(s, def.from))
        if (n <= 0) return
        pay(s, { [def.from]: n })
        if (s.furnace.job) s.furnace.job.left += n
        else s.furnace.job = { r: id, left: n, prog: 0 }
      }),

      cancelSmelt: () => set((s) => {
        const job = s.furnace.job
        if (!job) return
        give(s, SMELTS.find((x) => x.id === job.r)!.from, job.left)
        s.furnace.job = null
      }),

      enchant: (id) => set((s) => {
        const def = ENCHANTS.find((e) => e.id === id)
        if (!def || count(s, 'enchant_table') < 1) return
        const lvl = s.ench[id] ?? 0
        const cost = enchantCost(s, id)
        if (lvl >= def.max || s.level < cost.levels || count(s, 'lapis') < cost.lapis) return
        s.level -= cost.levels
        pay(s, { lapis: cost.lapis })
        s.ench[id] = lvl + 1
        pushLog(s, `符文渗入了你的装备：${def.name} ${lvl + 1} 级。`, 'good')
      }),

      buildShelter: () => set((s) => {
        if (!s.flags.explore || s.submerged || s.combat || s.homeId !== null || !canCampHere(curLoc(s)) || !canAfford(s, SHELTER_COST)) return
        pay(s, SHELTER_COST)
        const loc = curLoc(s)
        loc.shelter = true
        s.homeId = loc.id
        s.village = { villagers: 0, jobs: {}, buildings: {}, rep: 0, founded: true, mayor: false }
        pushLog(s, '你用木头搭起了一间简陋的庇护所。从今往后，这里就是家。', 'good')
        unlock(s, 'village', '有了落脚的地方，或许可以再盖些别的。')
      }),

      settle: () => set((s) => {
        const loc = curLoc(s)
        if (s.combat || s.homeId !== null || loc.biome !== 'village') return
        loc.shelter = true
        s.homeId = loc.id
        s.village = { villagers: 4, jobs: { farmer: 2 }, buildings: { house: 3, farm: 1 }, rep: 0, founded: false, mayor: false }
        pushLog(s, '你在村庄边缘住了下来。村民们还不太信任你。', 'good')
        unlock(s, 'village', '多与村民交谈、交易，赢得他们的信任。')
      }),

      build: (id) => set((s) => {
        const v = s.village
        const building = BUILDING_MAP[id]
        if (!v || !building || s.combat || !atHome(s) || !canControl(v)) return
        if ((building.project && !monumentReady(s)) || (building.tool && !count(s, building.tool)) || (building.need && !s.seen[building.need]) || (v.buildings[id] ?? 0) >= (building.limit ?? 40)) return
        const cost = buildCost(v, id)
        if (!canAfford(s, cost)) return
        pay(s, cost)
        v.buildings[id] = (v.buildings[id] ?? 0) + 1
        if (v.villagers > 0) v.rep += 2
        pushLog(s, `你建造了一座${building.name}。`, 'good')
        if (building.project) pushLog(s, '村民们把龙蛋安放在纪念碑顶。钟声从村口一路传到初生的树林。', 'event')
      }),

      assign: (job, delta) => set((s) => {
        const v = s.village
        if (!v || !canControl(v) || !JOB_MAP[job] || (delta !== 1 && delta !== -1)) return
        const cur = v.jobs[job] ?? 0
        if (delta > 0 && (employed(v) >= v.villagers || cur >= jobSlots(v, job))) return
        if (delta < 0 && cur <= 0) return
        v.jobs[job] = cur + delta
        if (delta > 0) s.flags.firstJob = true
      }),

      trade: (id, times = 1) => set((s) => {
        const v = s.village
        const t = TRADES.find((x) => x.id === id)
        if (!v || !t || s.combat || !atHome(s) || v.villagers < 1 || v.rep < (t.rep ?? 0) || (t.need && !v.buildings[t.need])) return
        if (!Number.isSafeInteger(times) || times < 1) return
        for (let i = 0; i < Math.min(times, 5) && canAfford(s, t.give); i++) {
          pay(s, t.give)
          for (const [k, n] of Object.entries(t.get)) give(s, k, n)
          v.rep += (v.buildings.market ? 2 : 1) + (v.buildings.cultural_hall ? 1 : 0)
        }
      }),

      talk: () => set((s) => {
        const v = s.village
        if (!v || s.combat || !atHome(s) || v.villagers < 1 || onCd(s, 'talk')) return
        setCd(s, 'talk', 15, true)
        v.rep += v.rep < CONTROL_REP ? 4 : 2
        pushLog(s, TALK_LINES[rand(0, TALK_LINES.length - 1)])
      }),

      runMayor: () => set((s) => {
        const v = s.village
        if (!v || s.combat || !atHome(s) || v.mayor || v.rep < MAYOR_REP || v.villagers < MAYOR_POP) return
        v.mayor = true
        pushLog(s, '村民们一致推举你为村长。钟声响彻了整个村庄。（村庄产出 +25%）', 'good')
      }),

      attack: () => set((s) => {
        const c = s.combat
        if (!c || onCd(s, 'attack')) return
        setCd(s, 'attack', 1, true)
        const m = MOBS[c.mob]
        const crit = Math.random() < 0.1
        const leap = count(s, 'mace') && onCd(s, 'leap')
        const power = (attackPower(s) + rand(0, 1)) * (crit ? 2 : 1) + (leap ? 8 : 0)
        if (leap) {
          delete s.cds.leap
          s.flags.maceLeap = true
        }
        const dmg = c.crystals ? Math.max(1, Math.floor(power * 0.35)) : power
        c.hp -= dmg
        combatLine(c, `你${crit ? '打出暴击，' : ''}对${m.name}造成 ${dmg} 点伤害。`)
        if (c.hp > 0) return
        s.combat = null
        s.stats.kills++
        const got = rollDrops(s, m.drops.filter((drop) => drop.item !== 'dragon_egg' || !s.flags.won))
        gainXp(s, m.xp)
        pushLog(s, `你击败了${m.name}。${got ? `（${got}）` : ''}`, 'good')
        if (c.trial) give(s, c.trial === 'ominous' ? 'ominous_key' : 'trial_key', 1)
        if (c.mob === 'piglin_brute') s.flags.bastionCleared = true
        if (c.mob === 'warden') s.flags.warden = true
        if (c.mob === 'dragon') {
          if (s.flags.won) s.flags.dragonAgain = true
          else s.flags.showWin = true
          s.flags.won = true
          pushLog(s, '末影龙发出最后一声长啸，化作漫天光点。世界安静了下来。', 'event')
        }
        if (c.mob === 'wither') s.flags.wither = true
        checkUnlocks(s)
      }),

      flee: () => set((s) => {
        const c = s.combat
        if (!c || onCd(s, 'flee')) return
        if (s.submerged) { surface(s, '你游出守卫者的攻击范围，返回了水面。'); return }
        setCd(s, 'flee', 5, true)
        s.combat = null
        s.hunger = Math.max(0, s.hunger - 1)
        pushLog(s, `你撤离了与${MOBS[c.mob].name}的战斗。`)
      }),

      throwEye: () => set((s) => {
        if (s.combat || inNether(curLoc(s)) || count(s, 'eye') < 1 || onCd(s, 'eye')) return
        setCd(s, 'eye', 4, true)
        if (s.flags.altar) { pushLog(s, '末影之眼飞向祭坛的方向，又落回你手中。'); return }
        pay(s, { eye: 1 })
        s.eyesThrown++
        if (s.eyesThrown < 3) { pushLog(s, '末影之眼升上半空，朝远方飞去，然后碎裂了。你朝那个方向又走了一段。', 'event'); return }
        s.flags.altar = true
        const loc = makeLoc(s, 'altar')
        loc.name = '要塞传送门房间'
        loc.saved = true
        pushLog(s, '末影之眼径直钻入了地下。你在脚下发现了一条通往要塞传送门房间的阶梯——它的位置已被牢牢记住。', 'good')
      }),

      insertEyes: () => set((s) => {
        if (s.combat || curLoc(s).biome !== 'altar' || s.flags.portal) return
        const n = Math.min(count(s, 'eye'), EYES_NEEDED - s.altarEyes)
        if (n <= 0) return
        pay(s, { eye: n })
        s.altarEyes += n
        pushLog(s, `你把 ${n} 只末影之眼嵌入了凹槽。（${s.altarEyes}/${EYES_NEEDED}）`)
        if (s.altarEyes >= EYES_NEEDED) {
          s.flags.portal = true
          pushLog(s, '最后一只眼睛归位。传送门中涌出了星空般的黑暗。', 'event')
        }
      }),

      enterPortal: () => set((s) => {
        if (!s.flags.portal || s.combat || curLoc(s).biome !== 'altar') return
        if (s.flags.won) {
          if (!canAfford(s, RESPAWN_COST)) return
          pay(s, RESPAWN_COST)
          pushLog(s, '四座末地水晶重新点亮，末影龙回到了末地。', 'event')
        } else {
          pushLog(s, '你踏入传送门。末地之中，一双巨大的紫色眼睛缓缓睁开。', 'event')
        }
        startCombat(s, 'dragon', true)
      }),

      dismissWin: () => set((s) => { s.flags.showWin = false }),

      reset: () => set(() => initial()),

    })),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      partialize: (state) => snapshot(state, defaults),
      migrate: (state, version) => normalizeSave(state, version, initial()) ?? initial(),
      merge: (persisted, state) => {
        const saved = normalizeSave(persisted, SAVE_VERSION, initial())
        return saved ? { ...state, ...saved } : state
      },
    },
  ),
)
