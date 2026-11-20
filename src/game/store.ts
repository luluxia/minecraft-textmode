import { arriveAtVillage, settleInVillage, type VillageLayout } from './village'
import {
  BARTER_COST, BARTER_OFFERS, EXCAVATION_COST, EXPEDITIONS, LINES, MAX_AIR, NETHER_COST, OFFLINE_LIMIT, PLANTS,
  RESPAWN_COST, SURVEY_COST, TRIAL_VAULTS, WATER_BREATHING_SECONDS, WITHER_COST, seasonAt, type ExpeditionDef,
} from './progression'
import { JOURNEY_COST, LEADS, NEARBY_COST, RETURN_COST, SITES, distinctLocationName, journeyDestination, journeyVariant, nearbySites } from './exploration'
import {
  CHEST_COST, CHEST_LIMIT, PACK_LIMIT, addStock, applyPayment, carriesLimit, hasStock,
  materialQuantity, planPayment, quantity, room, takeStock, whole,
} from './inventory'
import { WILDLIFE, wildlifeAt } from './wildlife'
import { achievementVisible, getAchievement, getCompletedAchievements } from './advancements'
import { decodeSave, encodeSave, normalizeSave, SAVE_KEY, SAVE_VERSION, snapshot } from './save'
import { LOG_LIMIT, itemList, logOfflineSettlement, pushLog, type LogEntry } from './log'
import { current } from 'immer'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  ACTIONS, ARMORS, BIOMES, BUILDING_MAP, BUILDINGS, COST_RATIO, CONTROL_REP, ENCHANTS, EYES_NEEDED, FUELS,
  ITEMS, ITEM_LIST, JOBS, JOB_MAP, MAYOR_POP, MAYOR_REP, MOBS, PICKS, RECIPES, SMELTS, SWORDS, TALK_LINES,
  TRADES, itemCostText, type Bag, type Drop, type IngredientAlternatives, type Recipe,
} from './data'

export interface Loc { id: number; biome: string; name: string; res: Bag; saved: boolean; shelter: boolean; metCompanions?: string[]; sites?: string[]; leads?: string[]; discovered?: number; marked?: boolean; variant?: string; chest?: boolean; shaftsLeft?: number; villageLayout?: VillageLayout; visitorRep?: number; growingCrop?: boolean; commissioned?: boolean; cleared?: boolean; lootTaken?: boolean; stock?: Bag; pending?: Bag }
export interface Village { villagers: number; jobs: Bag; buildings: Bag; rep: number; founded: boolean; mayor: boolean }
export interface Combat {
  mob: string
  hp: number
  boss: boolean
  crystals?: number
  trial?: 'normal' | 'ominous'
  breathTaken?: boolean
  heartLocated?: boolean
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
  previousLocId: number | null
  leads: Record<string, boolean>
  seenPlaces: Record<string, boolean>
  allayTarget: string | null
  homeId: number | null
  nextId: number
  cds: Record<string, { until: number; dur: number }>
  log: LogEntry[]
  logId: number
  trackedAchievement: string | null
  loggedAchievements: Record<string, boolean>
  flags: Record<string, boolean>
  combat: Combat | null
  furnace: { fuel: number; job: { r: string; left: number; prog: number; locId?: number } | null }
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
}

export interface GameActions {
  tick(background?: boolean): void
  backup(): string
  restore(text: string): string | null
  trackAchievement(id: string | null): void
  exploreNearby(): void
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
  explore(lead?: string): void
  travel(id: number): void
  saveLoc(): void
  placeChest(): void
  deposit(item?: string): void
  withdraw(item: string): void
  claim(item: string): void
  toggleSorting(): void
  assignAllay(item: string | null): void
  forgetLoc(id: number): void
  eat(item: string): void
  toggleAutoEat(): void
  sleep(): void
  craft(id: string, times?: number): void
  addFuel(item: string): void
  smelt(id: string, n: number): void
  cancelSmelt(): void
  enchant(id: string): void
  settle(): void
  buildShelter(): void
  inviteVillager(): void
  readExplorerMap(): void
  digTreasure(): void
  interactWildlife(id: string): void
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
export const FIRST_HOME_COST: Bag = { plank: 12, wheat: 3 }

export const survivedIndependently = (s: GameState) => !!s.flags.preparedTrip && !!(s.flags.cookedFood || s.flags.harvestedFood)
export const canInviteVillager = (s: GameState) => !s.village || (s.village.founded && s.village.villagers === 0)
export const invitationCost = (s: GameState): Bag => s.village?.buildings.house ? { wheat: 3 } : FIRST_HOME_COST
export const villageGrowthReady = (s: GameState) => !!s.flags.firstJobOutput
export const mayBuildVillage = (s: GameState, id: string) =>
  villageGrowthReady(s) || (s.village?.founded && id === 'farm')

// ---------- 纯函数（供界面与逻辑共用） ----------
export const count = (s: GameState, item: string) => Math.floor((s.inv[item] ?? 0) + 1e-9)
const stockHere = (s: GameState) => s.submerged ? undefined : curLoc(s).stock
export const available = (s: GameState, item: string, alternatives?: IngredientAlternatives) =>
  whole(materialQuantity(s.inv, item, alternatives) + materialQuantity(stockHere(s), item, alternatives))
export const carryRoom = (s: GameState, item: string) =>
  carriesLimit(item) ? whole(room(s.inv, item, PACK_LIMIT)) : Infinity
export const canAfford = (s: GameState, cost: Bag, alternatives?: IngredientAlternatives) => {
  const local = stockHere(s)
  return !!planPayment(cost, local ? [local, s.inv] : [s.inv], alternatives)
}
export const pickTier = (s: GameState) => {
  for (let i = PICKS.length - 1; i >= 0; i--) if (count(s, PICKS[i]) > 0) return i + 1
  return 0
}
const axes: [string, number][] = [
  ['axe_netherite', 0.36], ['axe_diamond', 0.42], ['axe_iron', 0.5], ['axe_stone', 0.7],
]

export function currentAction(s: GameState, id: string) {
  const base = ACTIONS[id]
  const action = base && s.flags.wildlife_horse && !s.submerged ? { ...base, hunger: base.hunger / 2 } : base
  if (!action || !id.startsWith('chop')) return action
  const axe = axes.find(([item]) => count(s, item) > 0)
  if (!axe) return action
  const name = id === 'chop' ? '砍树' : action.name
  return { ...action, name, cd: action.cd * axe[1], text: `你挥动${ITEMS[axe[0]].name}${name}。` }
}

export function currentLocationDescription(s: GameState) {
  const loc = curLoc(s)
  const terrain = BIOMES[loc.biome].desc
  if (s.village && loc.id === s.homeId) {
    const greeting = s.village.mayor ? '路过的村民向你招手：“村长好！”'
      : s.village.founded ? '你建起的村庄里，住户们正忙着各自的活计。'
      : '炊烟升起，邻居们在自家门前向你问好。'
    return loc.biome === 'village' ? greeting : terrain + greeting
  }
  if (loc.biome === 'village' && loc.visitorRep) return '炊烟升起，有村民认出了你，停下脚步向你招手。'
  if (loc.biome === 'altar') {
    if (s.flags.portal) return '末影之眼环绕着传送门，门中翻涌着星空般的黑暗。'
    if (s.altarEyes > 0) return `石室中已有 ${s.altarEyes} 只末影之眼嵌入框架，还有 ${EYES_NEEDED - s.altarEyes} 个空槽。`
  }
  if (loc.cleared && loc.biome === 'mansion') return '窗后仍透出灯光，走廊里已听不见唤魔者的低语。'
  if (loc.cleared && loc.biome === 'bastion') return '黑石高墙仍在，驻守遗迹的猪灵蛮兵已被你击退。'
  return terrain
}

export const attackPower = (s: GameState) =>
  1 + (SWORDS.find(([id]) => count(s, id) > 0)?.[1] ?? 0) + (s.ench.sharp ?? 0) +
  Number(!!s.flags.wildlife_wolf && !s.submerged) + Number(!!s.flags.wildlife_axolotl && s.submerged)
export const defensePower = (s: GameState) =>
  (ARMORS.find(([id]) => count(s, id) > 0)?.[1] ?? 0) + (count(s, 'shield') > 0 ? 1 : 0) + (s.ench.prot ?? 0) + Number(!!s.flags.wildlife_wolf && !s.submerged && !!count(s, 'wolf_armor'))
const netherElites = ['blaze', 'wither_skeleton', 'piglin_brute']
export const combatInterval = (s: GameState, c: Combat) =>
  c.boss || netherElites.includes(c.mob) ? 3 : BIOMES[curLoc(s).biome].danger >= 1.2 ? 2 : 3
export const dragonLanded = (turn: number) => turn >= 6 && turn % 9 >= 6
export const nextStrike = (c: Combat) => {
  const hit = Math.floor(c.turn / 3) + 1
  if (c.mob === 'dragon') return ['龙息', '俯冲', '爪击'][(hit - 1) % 3]
  return netherElites.includes(c.mob) && hit % 2 === 0 ? '重击' : '攻击'
}
export const combatMaxHp = (combat: Combat) =>
  Math.ceil(MOBS[combat.mob].hp * (combat.trial === 'ominous' ? 1.65 : 1))
export const hourOf = (minute: number) => Math.floor(minute / 60) % 24
export const isNight = (minute: number) => { const h = hourOf(minute); return h >= 20 || h < 6 }
export const dayOf = (minute: number) => Math.floor(minute / 1440) + 1
export const xpNeed = (level: number) => 10 + level * 5
export const curLoc = (s: GameState) => s.locs[s.locId]
export const atHome = (s: GameState) => !s.submerged && s.homeId !== null && s.homeId === s.locId
export const canDiveHere = (s: GameState) => !!s.flags.explore && !!BIOMES[curLoc(s).biome].diving
export const hasConduitPower = (s: GameState) => count(s, 'conduit') > 0 && !!s.village?.buildings.harbor
export const waterBreathingLeft = (s: GameState) => Math.max(0, Math.ceil(((s.cds.water_breathing?.until ?? 0) - Date.now()) / 1000))
export const canBreatheUnderwater = (s: GameState) => hasConduitPower(s) || waterBreathingLeft(s) > 0
export const inNether = (loc: Loc) => !!BIOMES[loc.biome].nether
export const diveLock = (s: GameState) => {
  const location = curLoc(s).biome
  if (['deep_ocean', 'cold_ocean', 'monument'].includes(location) && !count(s, 'boat')) return '需要船只'
  return ''
}
export const canRetreat = (s: GameState, id: number) =>
  id === s.homeId || id === s.previousLocId || (s.homeId === null && id === 1)
export const canCampHere = (loc: Loc) => !inNether(loc) && !['altar', 'trial_chamber', 'ancient_city', 'village', 'outpost', 'mansion', 'warm_ocean', 'cold_ocean', 'deep_ocean', 'monument'].includes(loc.biome)
export const travelAllowed = (s: GameState, target: Loc) => {
  if (s.submerged || (!retainedLocation(target) && target.id !== s.previousLocId)) return false
  if (!s.flags.nether || s.homeId === null || inNether(curLoc(s)) === inNether(target)) return true
  return inNether(target) ? atHome(s) : target.id === s.homeId
}
export const marketReputation = (s: GameState) => s.village?.rep ?? curLoc(s).visitorRep ?? 0
const gainMarketReputation = (s: GameState, amount: number) => {
  if (s.village) s.village.rep += amount
  else curLoc(s).visitorRep = marketReputation(s) + amount
}
export const canVisitMarket = (s: GameState) => !s.submerged &&
  (curLoc(s).biome === 'village' || (atHome(s) && (s.village?.villagers ?? 0) > 0))
export const canControl = (v: Village) => v.founded || v.mayor || v.rep >= CONTROL_REP
export const housing = (v: Village) => (v.buildings.house ?? 0) * 2
export const employed = (v: Village) => Object.values(v.jobs).reduce((a, b) => a + b, 0)
export const jobSlots = (v: Village, job: string) =>
  (job === 'farmer' && !v.buildings.farm && v.buildings.house ? 1 : 0) +
  BUILDINGS.filter((b) => b.job === job).reduce((a, b) => a + (v.buildings[b.id] ?? 0) * (b.slots ?? 0), 0)
export const villageCap = (s: GameState) => {
  const v = s.village
  if (!v) return 0
  return 200 + 300 * (v.buildings.warehouse ?? 0) + 1200 * (v.buildings.shulker_store ?? 0) +
    1800 * (v.buildings.end_store ?? 0) + (count(s, 'ender_chest') ? 600 : 0)
}
export const locationCap = (s: GameState, loc: Loc) =>
  (loc.id === s.homeId && s.village ? villageCap(s) : loc.chest || loc.shelter ? CHEST_LIMIT : 0)
export const outputRoom = (s: GameState, item: string) =>
  carryRoom(s, item) + (s.submerged ? 0 : whole(room(curLoc(s).stock, item, locationCap(s, curLoc(s)))))
export const furnaceOutputBlocked = (s: GameState) => {
  const job = s.furnace.job
  if (!job) return ''
  const item = SMELTS.find((entry) => entry.id === job.r)?.out
  if (!item) return ''
  const location = job.locId === undefined ? undefined : s.locs[job.locId]
  if (location) return room(location.stock, item, locationCap(s, location)) < 1 ? '库存已满' : ''
  return outputRoom(s, item) < 1 ? '背包已满' : ''
}
export const villageStock = (s: GameState) => (s.homeId === null ? undefined : s.locs[s.homeId]?.stock) ?? {}
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
export const wheatDemand = (v: Village) => v.villagers * 0.008
export const cropMultiplier = (s: GameState) => {
  const greenhouses = s.village?.buildings.greenhouse ?? 0
  const season = seasonAt(s.minute).crops
  return (greenhouses ? Math.max(1, season) : season) * (1 + greenhouses * 0.2)
}
export const production = (s: GameState): Bag => {
  const v = s.village
  if (!v || !canControl(v)) return {}
  const out: Bag = {}
  const crops = cropMultiplier(s)
  const demand = wheatDemand(v)
  const mult = (v.mayor ? 1.25 : 1) * (v.buildings.beacon ? 1.35 : 1) * (v.buildings.monument ? 1.25 : 1)
  const wheat = (v.jobs.farmer ?? 0) * JOB_MAP.farmer.out.wheat * crops * mult
  const fed = (villageStock(s).wheat ?? 0) + wheat + 1e-9 >= demand
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
export const foundSites = (loc: Loc) => (loc.sites ?? []).slice(0, loc.discovered ?? 0)
const siteLeads: Record<string, string> = { dark: 'canopy', road: 'tracks', bank: 'river', ore: 'deep_ore', outcrop: 'rocks', spring: 'lava', masonry: 'copper', echo: 'sculk', drift: 'wreck', sand: 'pottery', ashes: 'nether' }
export const locationLeads = (loc: Loc) => loc.leads ?? []
export const explorerMapChoices = (loc: Loc) =>
  Object.keys(LEADS).filter((id) => id !== 'nether' && !locationLeads(loc).includes(id))
const learnLocationLead = (s: GameState, id: string) => {
  s.leads[id] = true
  const loc = curLoc(s)
  if (!locationLeads(loc).includes(id)) (loc.leads ??= []).push(id)
}
export const availableActions = (loc: Loc) => [...new Set([
  ...BIOMES[loc.biome].actions, ...foundSites(loc).flatMap((id) => SITES[id]?.actions ?? []),
])]
export const ALLAY_ITEMS = ['wood', 'cobble', 'coal', 'seed', 'iron_ore']
function discoverNearbySite(s: GameState, loc: Loc) {
  const index = loc.discovered ?? 0
  const id = loc.sites?.[index]
  if (!id) return false
  loc.discovered = index + 1
  if (siteLeads[id]) learnLocationLead(s, siteLeads[id])
  s.flags.nearbyFound = true
  s.flags['site_' + id] = true
  pushLog(s, '发现' + SITES[id].name + '。', 'event')
  return true
}

export const isReunion = (s: GameState, id: string) => !!WILDLIFE[id].companion && !!s.flags['wildlife_' + id]
export const wildlifeVisible = (s: GameState) => wildlifeAt(curLoc(s).biome).filter((id) =>
  !!WILDLIFE[id].underwater === s.submerged && (WILDLIFE[id].repeatable || !s.flags['wildlife_' + id] ||
    (isReunion(s, id) && !curLoc(s).metCompanions?.includes(id))))
export const wildlifeLock = (s: GameState, id: string) => {
  if (id === 'sulfur_cube' && s.flags.sulfurPath) return '可开采朱砂'
  if (id === 'armadillo' && !count(s, 'brush')) return '需要刷子'
  if (id === 'armadillo' && carryRoom(s, 'armadillo_scute') < 1) return '背包已满'
  if (id === 'mooshroom' && carryRoom(s, 'mushroom_stew') < 1) return '背包已满'
  if (s.submerged && s.air < 7 && !canBreatheUnderwater(s)) return '空气不足'
  if (isReunion(s, id)) return ''
  const cost = WILDLIFE[id].cost
  if (cost && !canAfford(s, cost)) return itemCostText(cost)
  return ''
}
export const nearbyCost = (s: GameState) => wildlifeAt(curLoc(s).biome).some((id) =>
  WILDLIFE[id].observation && s.flags['wildlife_' + id]) ? NEARBY_COST - 0.5 : NEARBY_COST
export function journeyCost(s: GameState, lead?: string) {
  const base = lead === undefined ? JOURNEY_COST : LEADS[lead].hunger
  return s.flags.wildlife_camel && ['desert', 'savanna', 'badlands'].includes(curLoc(s).biome) ? base / 2 : base
}
export const canExploreNearby = (s: GameState) => !!s.flags.explore && !s.combat && !s.submerged &&
  s.hunger >= nearbyCost(s) && (curLoc(s).discovered ?? 0) < (curLoc(s).sites?.length ?? 0)
export const lineIssue = (s: GameState, line: typeof LINES[number]) => {
  const v = s.village
  if (!v?.villagers) return '需要村民'
  const stock = villageStock(s)
  if (line.reserveWheat && quantity(stock, 'wheat') < line.input.wheat + wheatDemand(v) * 60) return '需预留村民口粮'
  if (!planPayment(line.input, [stock])) return '仓库原料不足'
  if (Object.entries(line.output).some(([item, n]) => room(stock, item, villageCap(s)) < n)) return '仓库已满'
  return ''
}

export const actionAllowed = (s: GameState, id: string) =>
  availableActions(curLoc(s)).includes(id) &&
  s.submerged === (ACTIONS[id].diveAir !== undefined) &&
  (s.flags.explore || id === 'chop' || id === 'forage' || (s.flags.inv && id === 'grass'))

export const actionLock = (s: GameState, action: typeof ACTIONS[string]) => {
  const tool = [action.tool, ...(action.needs ?? [])].find((id) => id && count(s, id) < 1)
  if (action.id === 'meet_traveler' && s.flags.metTraveler) return '已结识'
  if (action.id === 'rescue_igloo_villager' && curLoc(s).cleared) return '已得到帮助'
  if (action.id === 'free_allay') return s.flags.allay ? '已救出' : curLoc(s).cleared ? '' : '先击退守卫'
  if (action.id === 'hunt_slime' && !isNight(s.minute)) return '夜晚可搜寻'
  if (action.id === 'dive_warm_ruins' && s.expedition?.id === 'warm_ruins') return '远征队正在调查'
  if (action.id === 'track_creaking' && !isNight(s.minute)) return '夜晚可追查'
  if (action.pick && pickTier(s) < action.pick) return '需要' + ITEMS[PICKS[action.pick - 1]].name
  if (tool) return '需要' + ITEMS[tool].name
  const primary = action.drops?.[0]?.item
  if (primary && carriesLimit(primary) && carryRoom(s, primary) < 1) return '背包已满'
  if (action.drops?.some(({ item }) => (curLoc(s).pending?.[item] ?? 0) > 0 && carryRoom(s, item) < 1)) return '先领取物资'
  if (action.enchant && !s.ench[action.enchant]) return '需要精准采集'
  if (action.finite && (curLoc(s).res[action.finite] ?? 0) <= 0) return '已枯竭'
  if (action.diveAir && s.air < action.diveAir && !canBreatheUnderwater(s)) return '空气不足，先上浮换气'
  if (action.cost && !canAfford(s, action.cost)) {
    return itemCostText(action.cost)
  }
  return ''
}

export const expeditionCost = (s: GameState, trip: ExpeditionDef): Bag =>
  trip.breathing && !count(s, 'conduit') ? { ...trip.cost, water_breathing: 1 } : trip.cost
export const expeditionLock = (s: GameState, trip: ExpeditionDef) => {
  if (trip.region !== 'camp' && !s.village?.villagers) return '需要村民'
  if (trip.region === 'camp' && s.expeditions[trip.id]) return '孵化已完成'
  if (trip.region === 'end' && !s.flags.won) return '需要击败末影龙'
  if (trip.after && !(trip.id === 'buried_treasure' && available(s, 'treasure_map')) && !s.expeditions[trip.after]) return '需要完成「' + EXPEDITIONS.find((entry) => entry.id === trip.after)!.name + '」'
  if (trip.tool && !count(s, trip.tool)) return '需要' + ITEMS[trip.tool].name
  if (trip.region === 'ocean' && !count(s, 'boat')) return '需要橡木船'
  if (trip.id === 'shipwreck' && !s.flags.foundShipwreck && !s.expeditions.shipwreck) return '先在海岸附近发现沉船'
  if (trip.id === 'warm_ruins' && !s.flags.foundWarmRuins && !s.expeditions.warm_ruins) return '先发现暖水海底废墟'
  if (trip.id === 'ocean_monument' && !s.seenPlaces.monument && !s.expeditions.ocean_monument) return '先发现海底神殿'
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
const receive = (s: GameState, loc: Loc, item: string, n: number, toStock = false) => {
  if (n <= 0) return
  s.seen[item] = true
  const cap = locationCap(s, loc)
  const toLocal = (amount: number) => {
    if (!cap || amount <= 0) return 0
    const stock = (loc.stock ??= {})
    const stored = Math.min(amount, room(stock, item, cap))
    addStock(stock, item, stored)
    return stored
  }
  if (toStock) n -= toLocal(n)
  else {
    if (s.flags.copperSorting && loc.id === s.homeId && count(s, 'copper_golem') && ITEMS[item].cat === 'material') n -= toLocal(n)
    const carried = Math.min(n, carryRoom(s, item))
    addStock(s.inv, item, carried)
    n -= carried
    n -= toLocal(n)
  }
  if (n > 0) addStock((loc.pending ??= {}), item, n)
}
const give = (s: GameState, item: string, n: number) => receive(s, curLoc(s), item, n)
const giveItems = (s: GameState, items: Bag) => {
  for (const [item, n] of Object.entries(items)) give(s, item, n)
}
const pay = (s: GameState, cost: Bag, carriedOnly = false, trackLocal = false, alternatives?: IngredientAlternatives) => {
  const local = carriedOnly ? undefined : stockHere(s)
  const bags = local ? [local, s.inv] : [s.inv]
  const payments = planPayment(cost, bags, alternatives)
  if (!payments) return false
  if (trackLocal && local && hasStock(payments[0])) s.flags.usedLocalStock = true
  applyPayment(payments, ...bags)
  return true
}
const outputAtHome = (s: GameState, item: string, n: number) => {
  if (s.homeId === null) give(s, item, n)
  else receive(s, s.locs[s.homeId], item, n, true)
}
const totalInventory = (s: GameState) => {
  const totals = { ...s.inv }
  if (s.homeId !== null) {
    const loc = s.locs[s.homeId]
    for (const bag of [loc.stock, loc.pending]) {
      for (const [item, amount] of Object.entries(bag ?? {})) addStock(totals, item, amount)
    }
  }
  return totals
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
const rollDrops = (s: GameState, drops: Drop[], bonus: Bag = {}) => {
  const loot = { ...bonus }
  giveItems(s, bonus)
  for (const dr of drops) {
    if (Math.random() > (dr.p ?? 1)) continue
    let n = rand(dr.min, dr.max)
    if (!['dragon_egg', 'nether_star', 'sculk_catalyst', 'obsidian'].includes(dr.item) && Math.random() < 0.12 * (s.ench.fortune ?? 0)) n *= 2
    give(s, dr.item, n)
    loot[dr.item] = (loot[dr.item] ?? 0) + n
  }
  return itemList(loot)
}
const createLocation = (id: number, biome: string): Loc => {
  const res: Bag = {}
  for (const [k, [a, b]] of Object.entries(BIOMES[biome].res)) res[k] = rand(a, b)
  const sites = nearbySites(biome)
  for (const id of sites) {
    const resource = SITES[id].resource
    if (resource && res[resource.id] === undefined) res[resource.id] = rand(...resource.range)
  }
  if (biome === 'mineshaft') {
    res.diamond = sites.includes('deep_seam') ? 5 : rand(3, 4)
    res.minecart = sites.includes('siding') ? 2 : 1
  }
  const variant = journeyVariant(biome)
  return { id, biome, name: (SITES[sites[0]]?.prefix ?? '') + (variant?.name ?? BIOMES[biome].name), variant: variant?.id, res, saved: false, shelter: false, sites, discovered: 0, shaftsLeft: rand(1, 2) }
}
const makeLoc = (s: GameState, biome: string) => {
  const loc = createLocation(s.nextId++, biome)
  const names = new Set(Object.values(s.locs).map((place) => place.name))
  loc.name = distinctLocationName(loc.name, names)
  s.locs[loc.id] = loc
  return loc
}
const startingForest = (): Loc => ({
  ...createLocation(1, 'forest'), name: '初生森林', variant: undefined, saved: true,
})
export const retainedLocation = (loc: Loc) => loc.saved || loc.shelter || !!loc.commissioned || hasStock(loc.stock) || hasStock(loc.pending)
const discardLoc = (s: GameState, id: number | null) => {
  if (id !== null && s.locs[id] && !retainedLocation(s.locs[id])) delete s.locs[id]
}
const leaveLoc = (s: GameState) => {
  discardLoc(s, s.previousLocId)
  s.previousLocId = s.locId
}
const startCombat = (s: GameState, mobId: string, boss = false) => {
  const m = MOBS[mobId]
  s.combat = { mob: mobId, hp: m.hp, boss, crystals: mobId === 'dragon' ? 3 : undefined, lines: [mobId === 'creeper' ? '苦力怕发出嘶声，准备爆炸。' : `${m.name}出现了！`], turn: 0 }
}
const maybeEncounter = (s: GameState) => {
  if (!s.flags.explore || s.combat || s.submerged) return
  const loc = curLoc(s)
  const night = isNight(s.minute)
  const underground = ['cave', 'mineshaft', 'lush_caves', 'dripstone_caves', 'deep_dark', 'sulfur_caves', 'dark_forest'].includes(loc.biome) || inNether(loc)
  if (loc.shelter || (!night && !underground) || attackPower(s) <= 1) return
  let p = (underground ? 0.09 : 0.055) * BIOMES[loc.biome].danger
  if (s.flags.wildlife_ocelot) p *= 0.5
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
  if (count(s, 'totem')) {
    pay(s, { totem: 1 }, true)
    s.hp = 8
    s.stats.deaths--
    pushLog(s, '不死图腾救了你。', 'event')
    return
  }
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
  if (count(s, 'table') > 0) {
    unlock(s, 'explore', '可以探索附近或远行。')
    s.flags.status = true
  }
  if (count(s, 'furnace') > 0) unlock(s, 'furnace', '熔炉里升起了第一缕火光。')
  if (count(s, 'enchant_table') > 0) unlock(s, 'enchant', '附魔台上的书页无风自动，低语着陌生的文字。')
  if (count(s, 'map') > 0) unlock(s, 'waypoint', '地图已标明方位，你可以记录走过的地点了。')
  if (pickTier(s) >= 3) unlock(s, 'deepMine', '铁镐可以开采钻石。在洞穴开拓矿道，可找到废弃矿井和熔岩水迹的线索。')
  if (count(s, 'spyglass') && !s.flags.spyglass) {
    learnLocationLead(s, 'copper')
    unlock(s, 'spyglass', '望远镜发现了凝灰岩和铜片。')
  }
  if (count(s, 'boat')) unlock(s, 'ocean', '有了船，你可以在村庄组织海洋远征。')
  if (count(s, 'eye') > 0) unlock(s, 'eye', '末影之眼在掌心微微颤动，似乎想飞向某个方向。')
}

const moveTime = (s: GameState, base: number) => base * (count(s, 'elytra') ? 0.55 :
  s.flags.wildlife_donkey ? 0.7 : count(s, 'scaffolding') ? 0.85 : 1)
const depositRange = (loc: Loc, id: string) => BIOMES[loc.biome].res[id] ??
  foundSites(loc).map((site) => SITES[site].resource).find((resource) => resource?.id === id)?.range ?? [0, 0]
const replenish = (loc: Loc, keys: string[]) => {
  for (const key of keys) {
    const range = depositRange(loc, key)
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
  return availableActions(loc).flatMap((id) => {
    const action = ACTIONS[id]
    return action.kind === 'mine' && action.finite && !['diamond', 'obsidian'].includes(action.finite) && !biome.renew?.includes(action.finite) ? [action.finite] : []
  })
}
export const canSurvey = (s: GameState) => {
  const loc = curLoc(s)
  return !s.submerged && pickTier(s) >= 2 && (loc.shaftsLeft ?? 1) > 0 && mineResources(loc).length > 0
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
    s.flags.harvestedFood = true
    const oldCamp = Object.values(s.locs).find((loc) => loc.growingCrop)
    for (const [item, n] of Object.entries(plant.reward)) {
      if (oldCamp) receive(s, oldCamp, item, n, true)
      else outputAtHome(s, item, n)
    }
    if (oldCamp) delete oldCamp.growingCrop
    if (live) pushLog(s, '营地的' + plant.name + '成熟了，收获' + itemList(plant.reward) + '。', 'good')
  }

  const job = s.furnace.job
  if (job && s.furnace.fuel >= 1 && !furnaceOutputBlocked(s)) {
    const def = SMELTS.find((entry) => entry.id === job.r)!
    job.prog += s.village?.buildings.nether_forge ? 2 : 1
    if (job.prog >= def.time) {
      job.prog -= def.time
      job.left--
      s.furnace.fuel--
      give(s, def.out, 1)
      if (ITEMS[def.out].food) s.flags.cookedFood = true
      gainXp(s, 1)
      if (job.left <= 0) {
        s.furnace.job = null
        if (live) pushLog(s, `熔炉完成了${ITEMS[def.out].name}的熔炼。`)
      }
    }
  }

  const v = s.village
  if (v && canControl(v)) {
    const cap = villageCap(s)
    const stock = (s.locs[s.homeId!].stock ??= {})
    for (const [item, rate] of Object.entries(production(s))) {
      if (rate < 0) takeStock(stock, item, -rate)
      else if (rate > 0) {
        const added = Math.min(rate, room(stock, item, cap))
        if (added > 0) {
          addStock(stock, item, added)
          s.seen[item] = true
          s.flags.firstJobOutput = true
        }
      }
    }
    if (villageGrowthReady(s) && v.villagers > 0 && housing(v) > v.villagers) {
      s.recruitment = Math.min(recruitTime(v), s.recruitment + 1)
      const cost = 3 + Math.floor(v.villagers / 2)
      if (s.recruitment >= recruitTime(v) && quantity(stock, 'wheat') >= cost) {
        takeStock(stock, 'wheat', cost)
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
      if (ready < line.seconds || lineIssue(s, line)) continue
      const payment = planPayment(line.input, [stock])
      if (!payment) continue
      applyPayment(payment, stock)
      for (const [item, n] of Object.entries(line.output)) {
        addStock(stock, item, n)
        s.seen[item] = true
      }
      s.flags.lineOutput = true
      s.lines[line.id] = 0
    }
  }

  if (s.expedition && --s.expedition.left <= 0) {
    const def = EXPEDITIONS.find((entry) => entry.id === s.expedition?.id)!
    const reward = s.expeditions[def.id] ? def.reward : { ...def.reward, ...def.first }
    for (const [item, n] of Object.entries(reward)) outputAtHome(s, item, n)
    if (s.expedition.returnBottle) outputAtHome(s, 'bottle', 1)
    gainXp(s, def.xp)
    s.expeditions[def.id] = (s.expeditions[def.id] ?? 0) + 1
    s.expedition = null
    if (live) pushLog(s, `远征结束：${def.name}。物资已入库。`, 'good')
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
    if (!s.flags.wildlife_nautilus_mob || s.minute % 2 === 0) s.air--
    if (s.air === 5 && (!s.flags.wildlife_nautilus_mob || s.minute % 2 === 0)) pushLog(s, '空气所剩无几，该上浮了。', 'bad')
  } else {
    s.hp -= 2
    if (s.hp <= 0) { die(s, '你在海底溺水了。'); return }
  }
  if (!s.submerged && !s.combat && s.hp < 20) s.hp = Math.min(20, s.hp + (atHome(s) ? 0.5 : 0.2))
  if (s.autoEat && s.hunger <= 12 && !s.combat && !onCd(s, 'eat')) {
    const foods = ITEM_LIST.filter((item) => item.food && item.id !== 'rotten' && count(s, item.id) > 0)
    const food = foods.sort((a, b) => b.food! - a.food!).find((item) => item.food! <= 20 - s.hunger)
    if (food) {
      pay(s, { [food.id]: 1 }, true)
      s.hunger += food.food!
      if (food.container) give(s, food.container, 1)
      setCd(s, 'eat', 1, true)
      pushLog(s, `你自动吃掉了一份${food.name}。`)
    }
  }
  const c = s.combat
  if (!c) return
  const strike = nextStrike(c)
  c.turn++
  const mob = MOBS[c.mob]
  if (!mob.atk || onCd(s, 'staggered') || c.turn % combatInterval(s, c) !== 0) return
  const guarded = count(s, 'shield') > 0 && onCd(s, 'guarding')
  const enraged = c.mob === 'wither' && c.hp <= mob.hp / 2
  const fireWard = ['blaze', 'magma_cube', 'ghast'].includes(c.mob) && onCd(s, 'fire_ward')
  const armor = Math.floor(defensePower(s) * (c.mob === 'warden' || strike === '龙息' ? 0.35 : 0.6))
  const damage = Math.max(1, mob.atk + (strike === '重击' || strike === '龙息' ? 3 : strike === '俯冲' ? 2 : 0) + Number(enraged) + (c.trial === 'ominous' ? 2 : 0) +
    rand(0, 1) - armor - (guarded ? 4 : 0) - (fireWard ? 4 : 0))
  s.hp -= damage
  if (c.crystals) c.hp = Math.min(mob.hp, c.hp + c.crystals)
  combatLine(c, `${guarded ? '盾牌挡下了部分伤害。' : ''}${mob.name}的${strike}造成 ${damage} 点伤害。`)
  if (s.hp <= 0) die(s, `${mob.name}没有给你留下机会。`)
  else if (c.mob === 'creeper') {
    s.combat = null
    s.flags.defeatedCreeper = true
    pushLog(s, '苦力怕爆炸了。', 'event')
  }
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
  autoEat: true,
  minute: 8 * 60,
  weather: 'clear',
  locs: { 1: startingForest() },
  locId: 1,
  previousLocId: null,
  leads: {},
  seenPlaces: { forest: true },
  allayTarget: null,
  homeId: null,
  nextId: 2,
  cds: {},
  log: [
    { id: 1, text: '身边只有树。', kind: 'info' },
    { id: 0, text: '你在一片陌生的森林中醒来，两手空空。', kind: 'event' },
  ],
  logId: 2,
  trackedAchievement: null,
  loggedAchievements: {},
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
})

const defaults = initial()

export const useGame = create<Game>()(
  persist(
    immer((write, get) => {
      const set = (update: (state: GameState) => GameState | void) => write((draft) => {
        const replacement = update(draft)
        const state = replacement ?? draft
        for (const id of getCompletedAchievements(state)) {
          if (state.loggedAchievements[id]) continue
          state.loggedAchievements[id] = true
          pushLog(state, `完成成就「${getAchievement(id)!.title}」。`, 'good')
        }
        return replacement
      })
      return {
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
        // Simulate long catch-up on a plain copy and keep the existing log if no entries are added.
        const previous = offline && elapsed > 3 ? snapshot(current(draft), defaults) : null
        const s: GameState = previous ? structuredClone({ ...previous, log: [] }) : draft
        if (offline && s.submerged) surface(s, '你已在离开时返回水面。')
        s.lastTick = now - ((now - s.lastTick) % 1000)
        const seconds = Math.min(elapsed, OFFLINE_LIMIT)
        if (offline) s.air = Math.min(MAX_AIR, s.air + seconds * 5)
        const before = offline ? totalInventory(s) : null
        const villagers = s.village?.villagers ?? 0
        const expedition = s.expedition?.id
        for (let second = 0; second < seconds; second++) {
          advanceEconomy(s, !offline)
          if (!offline) advancePlayer(s)
        }
        if (before) {
          const items: Bag = {}
          const after = totalInventory(s)
          for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
            const change = whole(after[id] ?? 0) - Math.floor((before[id] ?? 0) + 1e-9)
            if (change) items[id] = change
          }
          logOfflineSettlement(s, {
            seconds,
            items,
            villagers: (s.village?.villagers ?? 0) - villagers,
            expedition: expedition && !s.expedition ? expedition : null,
          })
        }
        checkUnlocks(s)
        if (previous) {
          s.log = s.log.length ? [...s.log, ...previous.log].slice(0, LOG_LIMIT) : previous.log
          return s
        }
      }),

      backup: () => encodeSave(get(), defaults),
      restore: (raw) => {
        const saved = decodeSave(raw, initial())
        if (typeof saved === 'string') return saved
        write(() => saved)
        return null
      },
      trackAchievement: (id) => set((s) => {
        if (id !== null) {
          const entry = getAchievement(id)
          if (!entry || !achievementVisible(entry, s)) return
          const completed = getCompletedAchievements(s)
          if (completed.has(id) || entry.requires?.some((required) => !completed.has(required))) return
        }
        s.trackedAchievement = id
      }),

      dive: () => set((s) => {
        if (!canDiveHere(s) || diveLock(s) || s.submerged || s.combat || s.air < MAX_AIR) return
        s.submerged = true
        pushLog(s, '你潜入海底。留意空气槽，随时可以上浮。', 'event')
      }),

      surface: () => set((s) => surface(s, '你回到水面，重新开始换气。')),

      drinkWaterBreathing: () => set((s) => {
        if (!canDiveHere(s) || !count(s, 'water_breathing') || hasConduitPower(s) ||
          onCd(s, 'drink') || canBreatheUnderwater(s)) return
        pay(s, { water_breathing: 1 }, true)
        give(s, 'bottle', 1)
        setCd(s, 'drink', 8, true)
        setCd(s, 'water_breathing', WATER_BREATHING_SECONDS, true)
        s.air = MAX_AIR
        pushLog(s, '水肺药水生效，收回玻璃瓶 ×1。暂时可以在水下呼吸。', 'good')
      }),

      exploreNearby: () => set((s) => {
        if (!canExploreNearby(s) || onCd(s, 'nearby')) return
        const loc = curLoc(s)
        s.hunger -= nearbyCost(s)
        discoverNearbySite(s, loc)
        setCd(s, 'nearby', 4)
      }),

      survey: () => set((s) => {
        if (s.combat || onCd(s, 'survey') || !canSurvey(s) || !canAfford(s, SURVEY_COST)) return
        pay(s, SURVEY_COST)
        const loc = curLoc(s)
        const ores = mineResources(loc)
        const ore = ores[rand(0, ores.length - 1)]
        const amount = rand(2, 4)
        loc.res[ore] = (loc.res[ore] ?? 0) + amount
        loc.shaftsLeft = (loc.shaftsLeft ?? 1) - 1
        if (!inNether(loc)) {
          learnLocationLead(s, 'deep_ore')
          learnLocationLead(s, 'lava')
        }
        setCd(s, 'survey', 30, true)
        pushLog(s, `新矿道增加了 ${amount} 次${ITEMS[ore]?.name ?? ore}开采机会。${inNether(loc) ? '' : '地图上已标出钻石与黑曜石的去向。'}`, 'good')
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
        if (s.submerged || s.combat || onCd(s, 'rest') || !s.flags.status || s.hp >= 20) return
        const camp = atHome(s) && count(s, 'campfire') > 0
        s.hp = Math.min(20, s.hp + (camp ? 10 : 4))
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
        giveItems(s, vault.reward)
        s.flags[vault.flag] = true
        setCd(s, 'vault', 4, true)
        pushLog(s, vault.name + '喷出了战利品。', 'good')
      }),

      openBastion: () => set((s) => {
        const loc = curLoc(s)
        if (s.combat || loc.biome !== 'bastion' || loc.lootTaken || !(loc.cleared || s.flags.bastionCleared)) return
        loc.lootTaken = true
        s.flags.bastionCleared = false
        const reward = { netherite_template: 1, gold: 6 }
        giveItems(s, reward)
        pushLog(s, '取出锻造模板时，还发现了' + itemList({ gold: reward.gold }) + '。', 'good')
      }),

      gust: () => set((s) => {
        const c = s.combat
        if (!c || onCd(s, 'gust') || !count(s, 'wind_charge')) return
        pay(s, { wind_charge: 1 }, true)
        setCd(s, 'gust', 7, true)
        setCd(s, 'staggered', 2.5, true)
        if (count(s, 'mace')) setCd(s, 'leap', 4, true)
        combatLine(c, count(s, 'mace') ? '风弹将你推上空中，下一击可用重锤砸落。' : '风弹让对手失去平衡，短暂停止攻击。')
      }),

      bottleBreath: () => set((s) => {
        const c = s.combat
        if (c?.mob !== 'dragon' || c.turn < 4 || c.breathTaken || !count(s, 'bottle')) return
        pay(s, { bottle: 1 }, true)
        give(s, 'dragon_breath', 1)
        c.breathTaken = true
        combatLine(c, '你用玻璃瓶收集了末影龙留下的龙息。')
      }),

      cook: (item) => set((s) => {
        const recipe = CAMP_COOK.find((entry) => entry.from === item)
        if (!recipe || s.combat || !atHome(s) || !count(s, 'campfire') || onCd(s, 'cook') || available(s, item) < 1) return
        pay(s, { [item]: 1 })
        give(s, recipe.out, 1)
        s.flags.cookedFood = true
        setCd(s, 'cook', 4, true)
        pushLog(s, `你在营火上烤熟了一份${ITEMS[recipe.out].name}。`, 'good')
      }),

      setLine: (id) => set((s) => {
        const line = LINES.find((entry) => entry.id === id)
        if (!line || !atHome(s) || s.combat || !s.village || !canControl(s.village) || !villageGrowthReady(s) ||
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
        pay(s, { [item]: 1 }, true)
        setCd(s, 'drink', 8, true)
        if (item === 'fire_resistance') {
          give(s, 'bottle', 1)
          setCd(s, 'fire_ward', 60, true)
          pushLog(s, '你饮下了抗火药水，收回玻璃瓶 ×1。60 秒内降低来自烈焰人、岩浆怪和恶魂的伤害。', 'good')
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
        const a = currentAction(s, id)
        if (!a || s.combat || onCd(s, id) || !actionAllowed(s, id)) return
        const loc = curLoc(s)
        if (actionLock(s, a)) return
        if (a.diveAir && !canBreatheUnderwater(s)) s.air -= a.diveAir
        if (a.cost) pay(s, a.cost)
        let cd = a.cd
        if (a.kind === 'mine') cd *= Math.max(0.58, 1 - 0.14 * (pickTier(s) - (a.pick ?? 1)))
        setCd(s, id, cd)
        s.stats.actions++
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - a.hunger)
        if (a.finite) loc.res[a.finite]--
        if (id === 'search_wreck') {
          s.flags.foundShipwreck = true
          s.expeditions.shipwreck = Math.max(1, s.expeditions.shipwreck ?? 0)
        }
        const bonus: Bag = {}
        if (id === 'dive_warm_ruins') {
          s.flags.foundWarmRuins = true
          if (!s.expeditions.warm_ruins) {
            s.expeditions.warm_ruins = 1
            bonus.sniffer_egg = 1
          }
        }
        if (id === 'meet_traveler') {
          s.flags.metTraveler = true
          pushLog(s, '你和旅人交换了姓名。', 'event')
          return
        }
        if (id === 'mine_cinnabar' && s.flags.sulfurPath) {
          s.flags.sulfurPath = false
          bonus.cinnabar = 1
        }
        if (id === 'rescue_igloo_villager') {
          loc.cleared = true
          s.flags.metTraveler = true
          learnLocationLead(s, 'tracks')
          pushLog(s, '村民道了谢，并告诉你附近村庄的线索。', 'good')
          return
        }
        if (id === 'free_allay') {
          s.flags.allay = true
          pushLog(s, '悦灵已获救。', 'good')
          return
        }
        if (a.mob) {
          pushLog(s, `你盯上了一只${MOBS[a.mob].name}。`)
          startCombat(s, a.mob, a.mob === 'warden')
          return
        }
        let got = rollDrops(s, a.drops ?? [], bonus)
        const allayItem = s.allayTarget
        if (s.flags.allay && allayItem && a.drops?.some((drop) => drop.item === allayItem) &&
          carryRoom(s, allayItem) > 0 && Math.random() < 0.4) {
          give(s, allayItem, 1)
          got += (got ? '，' : '') + '悦灵收集 ' + ITEMS[allayItem].name + ' +1'
        }
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

      explore: (lead) => set((s) => {
        if (!s.flags.explore || s.combat || s.submerged || onCd(s, 'move')) return
        const origin = curLoc(s)
        const leads = locationLeads(origin)
        if (lead !== undefined && (!leads.includes(lead) ||
          !LEADS[lead]?.destinations.some((id) => !!BIOMES[id].nether === inNether(origin)))) return
        const cost = journeyCost(s, lead)
        if (s.hunger < cost) return
        if (ITEM_LIST.some((item) => (item.food ?? 0) >= 3 && item.id !== 'rotten' && count(s, item.id) > 0)) s.flags.preparedTrip = true
        const destination = journeyDestination(origin.biome, leads, lead)
        leaveLoc(s)
        const loc = makeLoc(s, destination)
        s.locId = loc.id
        s.seenPlaces[destination] = true
        if (loc.variant) s.flags['variant_' + loc.variant] = true
        s.stats.explored++
        s.hunger -= cost
        if (lead) s.flags.followedLead = true
        if (destination === 'mineshaft') learnLocationLead(s, 'lava')
        if (destination === 'sulfur_caves') learnLocationLead(s, 'deep_ore')
        if (destination === 'trial_chamber') s.flags.trialVisited = true
        arriveAtVillage(s)
        setCd(s, 'move', moveTime(s, 7))
        pushLog(s, '抵达' + loc.name + '。', 'event')
        gainXp(s, 1)
        maybeEncounter(s)
      }),

      travel: (id) => set((s) => {
        const target = s.locs[id]
        if (s.combat || onCd(s, 'move') || !target || id === s.locId || !travelAllowed(s, target)) return
        const emergency = s.hunger < RETURN_COST
        if (emergency && !canRetreat(s, id)) return
        const previous = s.previousLocId
        s.previousLocId = s.locId
        s.locId = id
        arriveAtVillage(s)
        if (previous !== id) discardLoc(s, previous)
        s.seenPlaces[target.biome] = true
        if (target.variant) s.flags['variant_' + target.variant] = true
        if (inNether(target)) s.flags.enteredNether = true
        if (target.marked) s.flags.returnedToMark = true
        s.hunger = Math.max(0, s.hunger - RETURN_COST)
        setCd(s, 'move', moveTime(s, emergency ? 14 : 3))
        pushLog(s, (emergency ? '撤回' : '返回') + target.name + '。', 'event')
        if (!emergency) maybeEncounter(s)
      }),

      saveLoc: () => set((s) => {
        if (!s.flags.waypoint || s.submerged || s.combat || curLoc(s).saved || Object.values(s.locs).filter((loc) => loc.marked).length >= 48) return
        curLoc(s).saved = true
        curLoc(s).marked = true
        pushLog(s, `你在地图上标记了${curLoc(s).name}。`, 'good')
      }),

      forgetLoc: (id) => set((s) => {
        const loc = s.locs[id]
        if (!loc || loc.shelter || loc.biome === 'altar' || loc.biome === 'rift' || loc.biome === 'warped') return
        if (loc.commissioned || s.furnace.job?.locId === loc.id || hasStock(loc.stock) || hasStock(loc.pending)) return
        loc.saved = false
        loc.marked = false
        if (id !== s.locId && id !== s.previousLocId) delete s.locs[id]
      }),

      placeChest: () => set((s) => {
        const loc = curLoc(s)
        if (s.combat || s.submerged || locationCap(s, loc) || !loc.saved || !canCampHere(loc)) return
        if (!pay(s, CHEST_COST)) return
        loc.chest = true
        loc.stock ??= {}
        pushLog(s, '已放置箱子。', 'good')
      }),

      deposit: (item) => set((s) => {
        const loc = curLoc(s)
        const cap = locationCap(s, loc)
        if (s.combat || s.submerged || !cap) return
        const stock = (loc.stock ??= {})
        const ids = item ? [item] : Object.keys(s.inv).filter((id) => ITEMS[id].cat === 'material')
        for (const id of ids) {
          if (!ITEMS[id] || (!carriesLimit(id) && ITEMS[id].cat !== 'special')) continue
          const stored = Math.min(count(s, id), whole(room(stock, id, cap)))
          addStock(stock, id, takeStock(s.inv, id, stored))
        }
      }),

      withdraw: (item) => set((s) => {
        const stock = stockHere(s)
        if (!stock || !ITEMS[item] || s.combat) return
        const amount = Math.min(carryRoom(s, item), whole(quantity(stock, item)))
        addStock(s.inv, item, takeStock(stock, item, amount))
      }),

      claim: (item) => set((s) => {
        const loc = curLoc(s)
        if (s.combat || s.submerged || !loc.pending || !ITEMS[item]) return
        const stock = (loc.stock ??= {})
        const carried = Math.min(carryRoom(s, item), whole(quantity(loc.pending, item)))
        addStock(s.inv, item, takeStock(loc.pending, item, carried))
        const stored = Math.min(whole(room(stock, item, locationCap(s, loc))), whole(quantity(loc.pending, item)))
        addStock(stock, item, takeStock(loc.pending, item, stored))
      }),

      toggleSorting: () => set((s) => {
        if (!atHome(s) || s.combat || !count(s, 'copper_golem')) return
        s.flags.copperSorting = !s.flags.copperSorting
      }),

      assignAllay: (id) => set((s) => {
        if (!s.flags.allay || s.combat || (id !== null && !ALLAY_ITEMS.includes(id))) return
        s.allayTarget = id
      }),

      eat: (item) => set((s) => {
        const def = ITEMS[item]
        if (!def?.food || count(s, item) < 1 || onCd(s, 'eat') || (s.hunger >= 20 && !s.combat)) return
        pay(s, { [item]: 1 }, true)
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
        if (!r || s.combat || s.submerged || !Number.isSafeInteger(times) || times <= 0 || !recipeStationReady(s, r.station)) return
        const unique = ['tool', 'gear'].includes(ITEMS[r.out].cat)
        if (unique && count(s, r.out)) return
        let made = 0
        for (let i = 0; i < Math.min(unique ? 1 : 100, times) && outputRoom(s, r.out) >= r.n; i++) {
          if (!pay(s, r.cost, false, true, r.alternatives)) break
          give(s, r.out, r.n)
          for (const [item, n] of Object.entries(r.returns ?? {})) give(s, item, n)
          made += r.n
        }
        if (!made) return
        const returned = r.returns ? '，返还' + itemList(r.returns, made / r.n) : ''
        pushLog(s, `你合成了${ITEMS[r.out].name} ×${made}${returned}。`)
        checkUnlocks(s)
      }),

      addFuel: (item) => set((s) => {
        if (s.combat || s.submerged || !FUELS[item] || available(s, item) < 1 || count(s, 'furnace') < 1) return
        pay(s, { [item]: 1 })
        s.furnace.fuel += FUELS[item]
      }),

      smelt: (id, n) => set((s) => {
        const def = SMELTS.find((x) => x.id === id)
        if (!def || s.combat || s.submerged || !Number.isSafeInteger(n) || n <= 0 || count(s, 'furnace') < 1) return
        if (s.furnace.job && (s.furnace.job.r !== id || (s.furnace.job.locId !== undefined && s.furnace.job.locId !== s.locId))) return
        n = Math.min(n, available(s, def.from))
        if (n <= 0) return
        pay(s, { [def.from]: n })
        if (s.furnace.job) s.furnace.job.left += n
        else s.furnace.job = { r: id, left: n, prog: 0, locId: locationCap(s, curLoc(s)) ? s.locId : undefined }
      }),

      cancelSmelt: () => set((s) => {
        const job = s.furnace.job
        if (!job || s.combat || s.submerged) return
        if (job.locId !== undefined && job.locId !== s.locId) return
        const item = SMELTS.find((x) => x.id === job.r)!.from
        give(s, item, job.left)
        pushLog(s, `取消熔炼，退回${ITEMS[item].name} ×${job.left}。`)
        s.furnace.job = null
      }),

      enchant: (id) => set((s) => {
        const def = ENCHANTS.find((e) => e.id === id)
        if (!def || count(s, 'enchant_table') < 1) return
        const lvl = s.ench[id] ?? 0
        const cost = enchantCost(s, id)
        if (lvl >= def.max || s.level < cost.levels || available(s, 'lapis') < cost.lapis) return
        s.level -= cost.levels
        pay(s, { lapis: cost.lapis })
        s.ench[id] = lvl + 1
        pushLog(s, `符文渗入了你的装备：${def.name} ${lvl + 1} 级。`, 'good')
      }),

      settle: () => set(settleInVillage),

      buildShelter: () => set((s) => {
        if (!s.flags.explore || s.submerged || s.combat || s.homeId !== null || !canCampHere(curLoc(s)) || !canAfford(s, SHELTER_COST)) return
        pay(s, SHELTER_COST, false, true)
        const loc = curLoc(s)
        loc.shelter = true
        loc.saved = true
        s.homeId = loc.id
        loc.stock ??= {}
        s.flags.builtCamp = true
        pushLog(s, '庇护所已搭好。', 'good')
      }),

      inviteVillager: () => set((s) => {
        if (s.combat || !atHome(s) || !canInviteVillager(s) || !survivedIndependently(s) || !s.flags.metTraveler || !pay(s, invitationCost(s))) return
        const village = (s.village ??= { villagers: 0, jobs: {}, buildings: {}, rep: 0, founded: true, mayor: false })
        village.villagers = 1
        village.buildings.house = Math.max(1, village.buildings.house ?? 0)
        s.flags.invitedVillager = true
        unlock(s, 'village', '第一位住民搬进营地。')
      }),

      readExplorerMap: () => set((s) => {
        if (s.combat || s.submerged || inNether(curLoc(s)) || !count(s, 'explorer_map')) return
        const choices = explorerMapChoices(curLoc(s))
        if (!choices.length) return
        if (!pay(s, { explorer_map: 1 }, true)) return
        const lead = choices[rand(0, choices.length - 1)]
        learnLocationLead(s, lead)
        pushLog(s, '地图记下了线索：' + LEADS[lead].name + '。', 'event')
      }),

      interactWildlife: (id) => set((s) => {
        if (s.combat || !wildlifeVisible(s).includes(id) || wildlifeLock(s, id) || onCd(s, 'wildlife_' + id)) return
        const animal = WILDLIFE[id]
        const reunion = isReunion(s, id)
        if (!reunion && !pay(s, animal.cost ?? {})) return
        if (animal.underwater && !canBreatheUnderwater(s)) s.air -= 7
        setCd(s, 'wildlife_' + id, 25, true)
        if (animal.companion) {
          const loc = curLoc(s)
          ;(loc.metCompanions ??= []).push(id)
          if (reunion) {
            pushLog(s, '你跟随' + animal.name + '熟悉的踪迹探索四周。')
            if (!discoverNearbySite(s, loc)) {
              gainXp(s, 2)
              pushLog(s, '沿途熟悉了当地的地形，经验 +2。', 'good')
            }
          } else {
            s.flags['wildlife_' + id] = true
            pushLog(s, animal.name + '成为了你的伙伴。' + animal.companion, 'event')
          }
          return
        }
        s.flags['wildlife_' + id] = true
        if (animal.reward) giveItems(s, animal.reward)
        switch (id) {
          case 'dolphin': learnLocationLead(s, 'wreck'); break
          case 'sulfur_cube':
            s.flags.sulfurPath = true
            pushLog(s, '硫磺立方体推开了碎石。下次开采可多得一份朱砂。')
            return
        }
        const received = animal.reward ? '，获得' + itemList(animal.reward) : ''
        pushLog(s, animal.name + '：' + animal.action + received + '。' + (animal.observation ? '认得了当地的踪迹，今后在其栖息地探索附近少耗 0.5 饱食。' : ''), 'event')
      }),

      digTreasure: () => set((s) => {
        if (!canDiveHere(s) || s.submerged || s.combat || s.expedition?.id === 'buried_treasure' ||
          onCd(s, 'treasure') || !pay(s, { treasure_map: 1 })) return
        const reward: Bag = { gold: 3, emerald: 1 }
        if (!s.expeditions.buried_treasure) reward.heart_of_sea = 1
        giveItems(s, reward)
        s.expeditions.buried_treasure = (s.expeditions.buried_treasure ?? 0) + 1
        setCd(s, 'treasure', 12, true)
        pushLog(s, '挖出了埋藏的宝箱，获得' + itemList(reward) + '。', 'good')
      }),

      build: (id) => set((s) => {
        const v = s.village
        const building = BUILDING_MAP[id]
        if (!v || !building || s.combat || !atHome(s) || !canControl(v) || !mayBuildVillage(s, id)) return
        if ((building.project && !monumentReady(s)) || (building.tool && !count(s, building.tool)) || (building.need && !s.seen[building.need]) || (v.buildings[id] ?? 0) >= (building.limit ?? 40)) return
        const cost = buildCost(v, id)
        if (!canAfford(s, cost)) return
        pay(s, cost, false, true)
        v.buildings[id] = (v.buildings[id] ?? 0) + 1
        if (v.villagers > 0) v.rep += 2
        pushLog(s, `你建造了一座${building.name}。`, 'good')
        if (building.project) pushLog(s, '村民们把龙蛋安放在纪念碑顶。钟声从村口一路传到初生的树林。', 'event')
      }),

      assign: (job, delta) => set((s) => {
        const v = s.village
        if (!v || !atHome(s) || !canControl(v) || !JOB_MAP[job] || (delta !== 1 && delta !== -1)) return
        const cur = v.jobs[job] ?? 0
        if (delta > 0 && (employed(v) >= v.villagers || cur >= jobSlots(v, job))) return
        if (delta < 0 && cur <= 0) return
        v.jobs[job] = cur + delta
        if (delta > 0) s.flags.firstJob = true
      }),

      trade: (id, times = 1) => set((s) => {
        const v = s.village
        const t = TRADES.find((x) => x.id === id)
        if (!t || s.combat || !canVisitMarket(s) || marketReputation(s) < (t.rep ?? 0) || (t.need && (!atHome(s) || !v?.buildings[t.need]))) return
        if (!Number.isSafeInteger(times) || times < 1) return
        let completed = 0
        for (; completed < Math.min(times, 5) && canAfford(s, t.give); completed++) {
          pay(s, t.give)
          giveItems(s, t.get)
          gainMarketReputation(s, (v?.buildings.market ? 2 : 1) + (v?.buildings.cultural_hall ? 1 : 0))
        }
        if (completed && completed < times) pushLog(s, `本次完成了 ${completed} 笔交易。`)
      }),

      talk: () => set((s) => {
        if (s.combat || !canVisitMarket(s) || onCd(s, 'talk')) return
        setCd(s, 'talk', 15, true)
        gainMarketReputation(s, marketReputation(s) < CONTROL_REP ? 4 : 2)
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
        if (c.mob === 'creaking' && !c.heartLocated) {
          c.heartLocated = true
          combatLine(c, '循着微光找到了嘎枝之心。')
          return
        }
        if (c.mob === 'creaking') c.hp = 1
        const crit = Math.random() < 0.1
        const leap = count(s, 'mace') && onCd(s, 'leap')
        const power = (attackPower(s) + rand(0, 1)) * (crit ? 2 : 1) + (leap ? 8 : 0)
        if (leap) {
          delete s.cds.leap
          s.flags.maceLeap = true
        }
        const dmg = c.crystals ? Math.max(1, Math.floor(power * 0.35)) : c.mob === 'dragon' && dragonLanded(c.turn) ? Math.ceil(power * 1.5) : power
        c.hp -= dmg
        const allyId = s.submerged ? 'axolotl' : 'wolf'
        const ally = s.flags['wildlife_' + allyId] ? WILDLIFE[allyId].name : ''
        combatLine(c, `你${ally ? '和' + ally + '合击，' : ''}${crit ? '打出暴击，' : ''}对${m.name}造成 ${dmg} 点伤害。`)
        if (c.hp > 0) return
        s.combat = null
        s.stats.kills++
        let got = rollDrops(s, m.drops.filter((drop) => drop.item !== 'dragon_egg' || !s.flags.won))
        if (c.trial) {
          const key = { [c.trial === 'ominous' ? 'ominous_key' : 'trial_key']: 1 }
          giveItems(s, key)
          got = [got, itemList(key)].filter(Boolean).join('，')
        }
        gainXp(s, m.xp)
        pushLog(s, `你击败了${m.name}。${got ? `（${got}）` : ''}`, 'good')
        if (c.mob === 'piglin_brute') curLoc(s).cleared = true
        if (c.mob === 'warden') s.flags.warden = true
        if (c.mob === 'dragon') {
          if (s.flags.won) s.flags.dragonAgain = true
          else s.flags.showWin = true
          s.flags.won = true
          pushLog(s, '末影龙发出最后一声长啸，化作漫天光点。世界安静了下来。', 'event')
        }
        if (c.mob === 'creeper') s.flags.defeatedCreeper = true
        if (['pillager', 'evoker'].includes(c.mob)) curLoc(s).cleared = true
        if (c.mob === 'elder_guardian') s.expeditions.ocean_monument = Math.max(1, s.expeditions.ocean_monument ?? 0)
        if (c.mob === 'wither') s.flags.wither = true
        checkUnlocks(s)
      }),

      flee: () => set((s) => {
        const c = s.combat
        if (!c || onCd(s, 'flee')) return
        if (s.submerged) { surface(s, '你游出守卫者的攻击范围，返回了水面。'); return }
        if (c.mob === 'creeper') {
          s.combat = null
          s.flags.defeatedCreeper = true
          pushLog(s, '你在爆炸前撤离了。', 'event')
          return
        }
        setCd(s, 'flee', 5, true)
        s.combat = null
        s.hunger = Math.max(0, s.hunger - 1)
        pushLog(s, `你撤离了与${MOBS[c.mob].name}的战斗。`)
      }),

      throwEye: () => set((s) => {
        if (s.combat || s.submerged || inNether(curLoc(s)) || count(s, 'eye') < 1 || onCd(s, 'eye')) return
        setCd(s, 'eye', 4, true)
        if (s.flags.altar) { pushLog(s, '末影之眼飞向祭坛的方向，又落回你手中。'); return }
        pay(s, { eye: 1 }, true)
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

      reset: () => write(() => initial()),

      }
    }),
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
