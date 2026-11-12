import { BIOMES, BUILDING_MAP, ENCHANTS, EYES_NEEDED, ITEMS, JOB_MAP, MOBS, SMELTS, type Bag } from './data'
import { migrateMinecraftNames } from './migrate'
import { EXPEDITIONS, LINES, MAX_AIR, PLANTS } from './progression'
import type { GameState, Loc } from './store'

export const SAVE_KEY = 'block-idle-save'
export const SAVE_VERSION = 5
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
    boolean(loc.saved) && boolean(loc.shelter) && bag(loc.res, known(BIOMES[loc.biome].res), integer))) return null
  if (!integer(s.locId) || !s.locs[s.locId] || !integer(s.nextId) ||
    Object.values(s.locs).some((loc: Loc) => loc.id >= s.nextId)) return null
  if (!integer(s.air, MAX_AIR) || !boolean(s.submerged) ||
    (s.submerged && (s.locs[s.locId].biome !== 'coast' || !s.flags.explore))) return null
  if (s.homeId !== null && (!integer(s.homeId) || !s.locs[s.homeId]?.shelter)) return null
  if ((s.homeId === null) !== (s.village === null)) return null
  if (s.village !== null) {
    const v = s.village
    if (!record(v) || !integer(v.villagers, 1000) || !integer(v.rep) || !boolean(v.founded) ||
      !boolean(v.mayor) || !bag(v.buildings, known(BUILDING_MAP), (n) => integer(n, 100)) ||
      !bag(v.jobs, known(JOB_MAP), (n) => integer(n, 1000))) return null
  }

  if (!fields(s.cds, (cd, key) => safeKey(key) && record(cd) &&
    number(cd.until, Number.MAX_SAFE_INTEGER) && number(cd.dur, 3600000))) return null
  if (!Array.isArray(s.log) || s.log.length > 80 || !integer(s.logId) ||
    !s.log.every((entry) => record(entry) && integer(entry.id) && shortText(entry.text) &&
      typeof entry.kind === 'string' && ['info', 'good', 'bad', 'event'].includes(entry.kind))) return null
  if (!record(s.stats) || ![s.stats.actions, s.stats.kills, s.stats.deaths, s.stats.explored].every((n) => integer(n))) return null
  if (!bag(s.ench, (key) => ENCHANTS.some((entry) => entry.id === key), (n) => integer(n, 5))) return null
  if (!integer(s.eyesThrown, 3) || !integer(s.altarEyes, EYES_NEEDED)) return null
  if (s.combat !== null) {
    const c = s.combat
    if (!record(c) || typeof c.mob !== 'string' || !Object.hasOwn(MOBS, c.mob) || !number(c.hp, 10000) ||
      c.hp <= 0 || !boolean(c.boss) || !integer(c.turn) || !Array.isArray(c.lines) ||
      c.lines.length > (version < 3 ? 1000 : 6) || !c.lines.every(shortText) ||
      (c.crystals !== undefined && !integer(c.crystals, 3)) ||
      (c.trial !== undefined && (c.mob !== 'breeze' || !['normal', 'ominous'].includes(c.trial))) ||
      (c.breathTaken !== undefined && (c.mob !== 'dragon' || !boolean(c.breathTaken))) ||
      (s.submerged !== (c.mob === 'guardian'))) return null
  }
  if (!record(s.furnace) || !integer(s.furnace.fuel)) return null
  if (s.furnace.job !== null) {
    const job = s.furnace.job
    if (!record(job) || !integer(job.left) || job.left < 1 || !SMELTS.some((r) => r.id === job.r && integer(job.prog, r.time - 1))) return null
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
  if (s.offline !== null) {
    const report = s.offline
    if (!record(report) || !integer(report.seconds) || !integer(report.villagers) ||
      !bag(report.items, known(ITEMS), (n) => typeof n === 'number' && integer(Math.abs(n))) ||
      (report.expedition !== null && !EXPEDITIONS.some((trip) => trip.id === report.expedition))) return null
  }
  if (version < 2) migrateMinecraftNames(s)
  if (version < 5) {
    for (const loc of Object.values(s.locs)) {
      for (const [id, [min]] of Object.entries(BIOMES[loc.biome].res)) loc.res[id] ??= min
    }
  }
  if (version < 3 && s.combat) {
    s.combat.lines = s.combat.lines.slice(0, 6)
    if (s.combat.mob === 'dragon') s.combat.hp = Math.max(1, Math.ceil(s.combat.hp * MOBS.dragon.hp / 220))
  }
  for (const [item, amount] of Object.entries(s.inv)) {
    if (amount > 0) s.seen[item] = true
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
  return s
}
