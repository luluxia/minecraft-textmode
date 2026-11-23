import { consolidateGear } from './inventory'
import { companionIds } from './wildlife'
import { arriveAtVillage } from './village'
import { BIOMES, BUILDING_MAP, ENCHANTS, EYES_NEEDED, ITEMS, JOB_MAP, MOBS, SMELTS, type Bag } from './data'
import { LEADS, SITES, VARIANT_NAMES, distinctLocationName, nearbySites } from './exploration'
import { getAchievement, getCompletedAchievements } from './advancements'
import { LOG_LIMIT, LOG_TEXT_LIMIT, logOfflineSettlement } from './log'
import { migrateMinecraftNames } from './migrate'
import { EXPEDITIONS, LINES, MAX_AIR, PLANTS } from './progression'
import { PACK_LIMIT, addStock, carriesLimit, room } from './inventory'
import type { GameState, Loc } from './store'

export const SAVE_KEY = 'block-idle-save'
export const SAVE_VERSION = 19
export type SaveSnapshot = GameState

type Fields = Record<string, unknown>
const record = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value)
const number = (value: unknown, max = 1e9): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
const integer = (value: unknown, max?: number): value is number => number(value, max) && Number.isInteger(value)
const boolean = (value: unknown) => typeof value === 'boolean'
const shortText = (value: unknown): value is string => typeof value === 'string' && value.length <= 600
const safeKey = (key: string) => /^[a-z][a-z0-9_]*$/i.test(key) && !Object.hasOwn(Object.prototype, key)
const known = (registry: object) => (key: string) => Object.hasOwn(registry, key)
const fields = (value: unknown, check: (value: unknown, key: string) => boolean) =>
  record(value) && Object.keys(value).length <= 2000 && Object.entries(value).every(([key, entry]) => check(entry, key))
const bag = (value: unknown, keyOk = safeKey, entryOk: (value: unknown) => boolean = number) =>
  fields(value, (entry, key) => keyOk(key) && entryOk(entry))

export function snapshot(state: GameState, defaults: GameState): SaveSnapshot {
  return Object.fromEntries(
    (Object.keys(defaults) as (keyof GameState)[]).map((key) => [key, state[key]]),
  ) as unknown as SaveSnapshot
}

export function encodeSave(state: GameState, defaults: GameState) {
  return JSON.stringify({ version: SAVE_VERSION, state: snapshot(state, defaults) }, null, 2)
}

export function decodeSave(raw: string, defaults: GameState): SaveSnapshot | string {
  if (raw.length > 2_000_000) return '存档文件过大。'
  try {
    const envelope: unknown = JSON.parse(raw)
    if (!record(envelope) || !integer(envelope.version, SAVE_VERSION) || !record(envelope.state)) {
      return '存档格式无效，或来自较新的游戏版本。'
    }
    const state = normalizeSave(envelope.state, envelope.version, defaults)
    return state ?? '存档的数据不完整或含有无效的游戏状态。'
  } catch {
    return '无法读取存档。请选择由游戏导出的 JSON 文件。'
  }
}

export function normalizeSave(input: unknown, version: number, defaults: GameState): SaveSnapshot | null {
  if (!record(input) || version > SAVE_VERSION || !Object.hasOwn(input, 'inv') || !Object.hasOwn(input, 'locs')) return null
  const keys = Object.keys(defaults)
  if (version === SAVE_VERSION && keys.some((key) => !Object.hasOwn(input, key))) return null
  const raw = Object.fromEntries(keys.filter((key) => Object.hasOwn(input, key)).map((key) => [key, input[key]]))
  const s = { ...defaults, ...raw }
  if (!bag(s.inv, known(ITEMS)) || !bag(s.seen, known(ITEMS), boolean) || !bag(s.flags, safeKey, boolean)) return null
  if (!number(s.hp, 20) || s.hp <= 0 || !number(s.hunger, 20) || !integer(s.level, 100_000) ||
    !integer(s.xp) || !boolean(s.autoEat) || !integer(s.minute, Number.MAX_SAFE_INTEGER - 1_000_000) ||
    !['clear', 'rain', 'storm'].includes(s.weather) || !integer(s.lastTick, Number.MAX_SAFE_INTEGER)) return null

  if (!fields(s.locs, (loc, key) => record(loc) && integer(loc.id) && String(loc.id) === key &&
    typeof loc.biome === 'string' && Object.hasOwn(BIOMES, loc.biome) && shortText(loc.name) &&
    boolean(loc.saved) && boolean(loc.shelter) &&
    (loc.shaftsLeft === undefined || integer(loc.shaftsLeft, 2)) &&
    (loc.marked === undefined || boolean(loc.marked)) &&
    (loc.variant === undefined || (typeof loc.variant === 'string' && Object.hasOwn(VARIANT_NAMES, loc.variant))) &&
    (loc.frameMold === undefined || boolean(loc.frameMold)) &&
    (loc.placedLava === undefined || loc.placedLava === 'ground' || (loc.placedLava === 'frame' && loc.frameMold === true && !loc.netherGate)) &&
    (loc.castBlocks === undefined || integer(loc.castBlocks, 9)) &&
    (loc.cooledBlocks === undefined || integer(loc.cooledBlocks)) &&
    (loc.netherGate === undefined || boolean(loc.netherGate) || loc.netherGate === 'frame') &&
    (loc.chest === undefined || boolean(loc.chest)) &&
    (loc.villageLayout === undefined || (loc.biome === 'village' && record(loc.villageLayout) &&
      integer(loc.villageLayout.villagers, 1000) && loc.villageLayout.villagers >= 1 &&
      record(loc.villageLayout.buildings) && integer(loc.villageLayout.buildings.house, 100) &&
      loc.villageLayout.buildings.house * 2 >= loc.villageLayout.villagers &&
      bag(loc.villageLayout.buildings, known(BUILDING_MAP), (n) => integer(n, 100) && n > 0))) &&
    (loc.visitorRep === undefined || integer(loc.visitorRep)) &&
    (loc.growingCrop === undefined || boolean(loc.growingCrop)) &&
    (loc.commissioned === undefined || boolean(loc.commissioned)) &&
    (loc.cleared === undefined || boolean(loc.cleared)) &&
    (loc.lootTaken === undefined || boolean(loc.lootTaken)) &&
    (loc.stock === undefined || bag(loc.stock, known(ITEMS))) &&
    (loc.pending === undefined || bag(loc.pending, known(ITEMS))) &&
    (loc.leads === undefined || (Array.isArray(loc.leads) && loc.leads.length <= Object.keys(LEADS).length &&
      loc.leads.every((id) => typeof id === 'string' && Object.hasOwn(LEADS, id)))) &&
    (loc.metCompanions === undefined || (Array.isArray(loc.metCompanions) && loc.metCompanions.length <= companionIds.length &&
      new Set(loc.metCompanions).size === loc.metCompanions.length && loc.metCompanions.every((id) =>
        typeof id === 'string' && companionIds.includes(id) && s.flags['wildlife_' + id]))) &&
    (loc.sites === undefined || (Array.isArray(loc.sites) && loc.sites.length <= 3 &&
      loc.sites.every((id) => typeof id === 'string' && Object.hasOwn(SITES, id)))) &&
    (loc.discovered === undefined || integer(loc.discovered, Array.isArray(loc.sites) ? loc.sites.length : 0)) &&
    bag(loc.res, (id) => (version < 9 && loc.biome === 'cave' && ['diamond', 'obsidian'].includes(id)) || Object.hasOwn(BIOMES[loc.biome as string].res, id) ||
      (Array.isArray(loc.sites) && loc.sites.some((site) => SITES[site]?.resource?.id === id)), integer))) return null
  if (!integer(s.locId) || !s.locs[s.locId] || !integer(s.nextId) ||
    Object.values(s.locs).some((loc: Loc) => loc.id >= s.nextId)) return null
  if (s.allayTarget !== null && (typeof s.allayTarget !== 'string' || !Object.hasOwn(ITEMS, s.allayTarget))) return null
  if (!bag(s.leads, known(LEADS), boolean) || !bag(s.seenPlaces, known(BIOMES), boolean) ||
    (s.previousLocId !== null && (!integer(s.previousLocId) || !s.locs[s.previousLocId]))) return null
  if (!integer(s.air, MAX_AIR) || !boolean(s.submerged) ||
    (s.submerged && (!BIOMES[s.locs[s.locId].biome].diving || !s.flags.explore))) return null
  if (s.homeId !== null && (!integer(s.homeId) || !s.locs[s.homeId]?.shelter)) return null
  if (s.homeId === null && s.village !== null) return null
  if (s.village !== null) {
    const v = s.village
    if (!record(v) || (v.honeyTicks !== undefined && !integer(v.honeyTicks, 12000)) || !integer(v.villagers, 1000) || !integer(v.rep) || !boolean(v.founded) ||
      !boolean(v.mayor) || !bag(v.buildings, known(BUILDING_MAP), (n) => integer(n, 100)) ||
      !bag(v.jobs, known(JOB_MAP), (n) => integer(n, 1000))) return null
  }

  if (!fields(s.cds, (cd, key) => safeKey(key) && record(cd) &&
    number(cd.until, Number.MAX_SAFE_INTEGER) && number(cd.dur, 3600000))) return null
  if (!Array.isArray(s.log) || s.log.length > LOG_LIMIT || !integer(s.logId) ||
    !s.log.every((entry) => record(entry) && integer(entry.id) &&
      typeof entry.text === 'string' && entry.text.length <= LOG_TEXT_LIMIT &&
      typeof entry.kind === 'string' && ['info', 'good', 'bad', 'event'].includes(entry.kind))) return null
  if (s.trackedAchievement !== null &&
    (typeof s.trackedAchievement !== 'string' || !getAchievement(s.trackedAchievement))) return null
  if (!bag(s.loggedAchievements, (id) => !!getAchievement(id), boolean)) return null
  if (!record(s.stats) || ![s.stats.actions, s.stats.kills, s.stats.deaths, s.stats.explored].every((n) => integer(n))) return null
  if (version < 18) s.stats = { ...defaults.stats, ...s.stats }
  if (!Object.keys(defaults.stats).every((key) => integer(s.stats[key as keyof GameState['stats']]))) return null
  if (!bag(s.ench, (key) => ENCHANTS.some((entry) => entry.id === key), (n) => integer(n, 5))) return null
  if (!integer(s.eyesThrown, 3) || !integer(s.altarEyes, EYES_NEEDED)) return null
  if (s.combat !== null) {
    const c = s.combat
    if (!record(c) || typeof c.mob !== 'string' || !Object.hasOwn(MOBS, c.mob) || !number(c.hp, 10000) ||
      c.hp <= 0 || !boolean(c.boss) || !integer(c.turn) || !Array.isArray(c.lines) ||
      c.lines.length > (version < 3 ? 1000 : 6) || !c.lines.every(shortText) ||
      (c.crystals !== undefined && !integer(c.crystals, 3)) ||
      (c.trial !== undefined && (c.mob !== 'breeze' || !['normal', 'ominous'].includes(c.trial))) ||
      (c.heartLocated !== undefined && (c.mob !== 'creaking' || !boolean(c.heartLocated))) ||
      (c.breathTaken !== undefined && (c.mob !== 'dragon' || !boolean(c.breathTaken))) ||
      (s.submerged !== ['guardian', 'elder_guardian'].includes(c.mob))) return null
  }
  if (!integer(s.brewingFuel, 19)) return null
  if (!record(s.furnace) || !integer(s.furnace.fuel)) return null
  if (s.furnace.job !== null) {
    const job = s.furnace.job
    if (!record(job) || (job.locId !== undefined && (!integer(job.locId) || !s.locs[job.locId])) || !integer(job.left) || job.left < 1 || !SMELTS.some((r) => r.id === job.r && integer(job.prog, r.time - 1))) return null
  }
  if (!integer(s.crop, 120) || !PLANTS.some((plant) => plant.id === s.cropKind) || !integer(s.recruitment) || !bag(s.lines, (key) => LINES.some((entry) => entry.id === key), integer) ||
    !bag(s.expeditions, (key) => key === 'raid' || EXPEDITIONS.some((entry) => entry.id === key), integer)) return null
  if (s.expedition !== null) {
    const trip = s.expedition
    if (!record(trip) || !EXPEDITIONS.some((entry) => entry.id === trip.id &&
      integer(trip.left, entry.seconds) && trip.left > 0 &&
      (trip.total === undefined || (integer(trip.total, entry.seconds) && trip.total >= trip.left))) ||
      (trip.returnBottle !== undefined && !boolean(trip.returnBottle))) return null
  }
  if (version < 2) migrateMinecraftNames(s)
  if (version < 5) {
    for (const loc of Object.values(s.locs)) {
      for (const [id, [min]] of Object.entries(BIOMES[loc.biome].res)) loc.res[id] ??= min
    }
  }
  if (version < 8) {
    if (s.flags.spyglass) s.leads = { copper: true }
    if (s.homeId !== null) {
      s.flags.builtCamp = !!s.village?.founded
      s.flags.joinedVillage = !!s.village && !s.village.founded
      s.flags.preparedTrip = true
      s.flags.harvestedFood = true
    }
    if (s.flags.nether) s.flags.enteredNether = true
    if (s.village?.villagers) s.flags.firstJobOutput = true
    if (s.village?.founded && s.village.villagers === 0) s.flags.metTraveler = true
    if (s.village?.founded && s.village.villagers > 0) s.flags.invitedVillager = true
    if (s.flags.automation) s.flags.legacyAutomation = true
    else if (s.trackedAchievement === 'automation') s.trackedAchievement = 'first-line-output'
    for (const loc of Object.values(s.locs)) {
      loc.sites = nearbySites(loc.biome)
      for (const id of loc.sites) {
        const resource = SITES[id].resource
        if (resource) loc.res[resource.id] ??= resource.range[0]
      }
      s.seenPlaces[loc.biome] = true
      loc.discovered = 0
    }
    const destination = s.locs[s.homeId ?? s.locId]
    const packed: Bag = {}
    for (const [item, amount] of Object.entries(s.inv)) {
      const toPack = carriesLimit(item) ? Math.min(amount, room(packed, item, PACK_LIMIT)) : amount
      addStock(packed, item, toPack)
      if (toPack < amount) {
        destination.chest = true
        destination.saved = true
        addStock((destination.stock ??= {}), item, amount - toPack)
      }
    }
    s.inv = packed
  }
  const usedNames = new Set<string>()
  const reservedNames = new Set(Object.values(s.locs).map((loc) => loc.name))
  for (const loc of Object.values(s.locs)) {
    if (version < 19 && loc.castBlocks && !loc.netherGate) loc.frameMold = true
    if (version < 10 && loc.biome === 'village' && !loc.villageLayout && !(s.village && loc.id === s.homeId)) {
      loc.villageLayout = { villagers: 1, buildings: { house: 1, farm: 1 } }
    }
    if (usedNames.has(loc.name)) {
      loc.name = distinctLocationName(loc.name, reservedNames)
      reservedNames.add(loc.name)
    }
    usedNames.add(loc.name)
    if (loc.shelter) loc.saved = true
    if (loc.sites?.includes('campsite') && loc.res.camp_supplies === undefined) {
      // Earlier saves awarded these supplies when the site was revealed.
      loc.res.camp_supplies = loc.sites.indexOf('campsite') < (loc.discovered ?? 0) ? 0 : 1
    }
  }
  if (version < 9) {
    for (const loc of Object.values(s.locs)) {
      if (loc.biome === 'cave') {
        delete loc.res.diamond
        delete loc.res.obsidian
      }
      if (loc.biome === 'mineshaft') loc.res.diamond ??= 3
      if (loc.biome === 'sulfur_caves') loc.res.obsidian ??= 2
      if (loc.biome === 'ancient_city') loc.res.city_chest ??= 2
      if (loc.biome === 'rift') loc.res.obsidian = Math.min(loc.res.obsidian ?? 0, 3)
      loc.shaftsLeft = 1
    }
  }
  if (version < 7) {
    if (Object.values(s.locs).some((loc) => loc.biome === 'trial_chamber')) s.flags.trialVisited = true
    if (Object.values(s.village?.jobs ?? {}).some((count) => count > 0)) s.flags.firstJob = true
  }
  if (version < 3 && s.combat) {
    s.combat.lines = s.combat.lines.slice(0, 6)
    if (s.combat.mob === 'dragon') s.combat.hp = Math.max(1, Math.ceil(s.combat.hp * MOBS.dragon.hp / 220))
  }
  const village = s.village
  if (version < 11 && village && !village.founded && village.villagers > 0 &&
    (village.buildings.house || village.buildings.farm) && !s.flags.firstJob && !s.flags.firstJobOutput &&
    !Object.values(village.jobs).some((count) => count > 0)) {
    village.jobs.farmer = 1
  }
  for (const bag of [s.inv, ...Object.values(s.locs).flatMap((loc) => [loc.stock, loc.pending])]) {
    for (const [item, amount] of Object.entries(bag ?? {})) if (amount > 0) s.seen[item] = true
  }
  consolidateGear(s.inv)
  if (version < 15 && s.flags.nether) {
    const origin = s.locs[s.homeId ?? 1]
    if (origin) origin.netherGate = origin.saved = true
    for (const loc of Object.values(s.locs)) {
      if (['rift', 'warped'].includes(loc.biome)) loc.netherGate = loc.saved = true
    }
  }
  if (s.flags.won && !s.seen.dragon_egg) {
    s.inv.dragon_egg = 1
    s.seen.dragon_egg = true
  }
  if (s.lastTick > defaults.lastTick) {
    const offset = s.lastTick - defaults.lastTick
    for (const cd of Object.values(s.cds)) cd.until = Math.max(0, cd.until - offset)
    s.lastTick = defaults.lastTick
  }
  if (version < 6 && input.offline != null) {
    const report = input.offline
    if (!record(report) || !integer(report.seconds) || !integer(report.villagers) ||
      !bag(report.items, known(ITEMS), (n) => typeof n === 'number' && integer(Math.abs(n))) ||
      (report.expedition !== null && (typeof report.expedition !== 'string' ||
        !EXPEDITIONS.some((trip) => trip.id === report.expedition)))) return null
    s.log = [...s.log]
    logOfflineSettlement(s, {
      seconds: report.seconds,
      items: report.items as Bag,
      villagers: report.villagers,
      expedition: report.expedition,
    })
  }
  arriveAtVillage(s)
  s.loggedAchievements = { ...s.loggedAchievements }
  for (const id of getCompletedAchievements(s)) s.loggedAchievements[id] = true
  return s
}
