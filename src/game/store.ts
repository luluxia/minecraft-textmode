import { migrateMinecraftNames } from './migrate'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  ACTIONS, ARMORS, BIOMES, BUILDING_MAP, BUILDINGS, COST_RATIO, CONTROL_REP, ENCHANTS, EYES_NEEDED, FUELS,
  ITEMS, ITEM_LIST, JOBS, JOB_MAP, MAYOR_POP, MAYOR_REP, MOBS, PICKS, RECIPES, SMELTS, SWORDS, TALK_LINES,
  TRADES, randomLocName, type Bag, type Drop,
} from './data'

export interface Loc { id: number; biome: string; name: string; res: Bag; saved: boolean; shelter: boolean }
export interface Village { villagers: number; jobs: Bag; buildings: Bag; rep: number; founded: boolean; mayor: boolean }
export type LogKind = 'info' | 'good' | 'bad' | 'event'
export interface LogEntry { id: number; text: string; kind: LogKind }
export interface Combat { mob: string; hp: number; boss: boolean; lines: string[]; turn: number }
export type Weather = 'clear' | 'rain' | 'storm'

export interface GameState {
  inv: Bag
  seen: Record<string, boolean>
  hp: number
  hunger: number
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
}

export interface GameActions {
  tick(): void
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
  trade(id: string): void
  talk(): void
  runMayor(): void
  attack(): void
  flee(): void
  throwEye(): void
  insertEyes(): void
  enterPortal(): void
  dismissWin(): void
  reset(): void
  devUnlock(): void
}
export type Game = GameState & GameActions

export const SHELTER_COST: Bag = { wood: 10, plank: 20 }

// ---------- 纯函数（供界面与逻辑共用） ----------
export const count = (s: GameState, item: string) => Math.floor(s.inv[item] ?? 0)
export const canAfford = (s: GameState, cost: Bag) => Object.entries(cost).every(([k, n]) => (s.inv[k] ?? 0) >= n)
export const pickTier = (s: GameState) => {
  for (let i = PICKS.length - 1; i >= 0; i--) if (count(s, PICKS[i]) > 0) return i + 1
  return 0
}
export const attackPower = (s: GameState) =>
  1 + (SWORDS.find(([id]) => count(s, id) > 0)?.[1] ?? 0) + (s.ench.sharp ?? 0)
export const defensePower = (s: GameState) =>
  (ARMORS.find(([id]) => count(s, id) > 0)?.[1] ?? 0) + (count(s, 'shield') > 0 ? 1 : 0) + (s.ench.prot ?? 0)
export const hourOf = (minute: number) => Math.floor(minute / 60) % 24
export const isNight = (minute: number) => { const h = hourOf(minute); return h >= 20 || h < 6 }
export const dayOf = (minute: number) => Math.floor(minute / 1440) + 1
export const xpNeed = (level: number) => 10 + level * 5
export const curLoc = (s: GameState) => s.locs[s.locId]
export const atHome = (s: GameState) => s.homeId !== null && s.homeId === s.locId
export const canControl = (v: Village) => v.founded || v.mayor || v.rep >= CONTROL_REP
export const housing = (v: Village) => (v.buildings.house ?? 0) * 2
export const employed = (v: Village) => Object.values(v.jobs).reduce((a, b) => a + b, 0)
export const jobSlots = (v: Village, job: string) =>
  BUILDINGS.filter((b) => b.job === job).reduce((a, b) => a + (v.buildings[b.id] ?? 0) * (b.slots ?? 0), 0)
export const villageCap = (v: Village) => 200 + 300 * (v.buildings.warehouse ?? 0)
export const villageDefense = (v: Village) =>
  (v.jobs.guard ?? 0) * 3 + (v.buildings.watchtower ?? 0) * 5 + (v.buildings.golem ?? 0) * 10
export const buildCost = (v: Village, id: string): Bag => {
  const n = v.buildings[id] ?? 0
  return Object.fromEntries(
    Object.entries(BUILDING_MAP[id].cost).map(([k, c]) => [k, Math.ceil(c * Math.pow(COST_RATIO, n))]),
  )
}
export const production = (v: Village): Bag => {
  const out: Bag = {}
  const mult = v.mayor ? 1.25 : 1
  for (const j of JOBS) {
    const n = v.jobs[j.id] ?? 0
    if (!n) continue
    for (const [k, r] of Object.entries(j.out)) out[k] = (out[k] ?? 0) + r * n * mult
  }
  if (v.buildings.cobblegen) out.cobble = (out.cobble ?? 0) + 0.25 * v.buildings.cobblegen
  return out
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
  s.inv[item] = (s.inv[item] ?? 0) + n
  s.seen[item] = true
}
const pay = (s: GameState, cost: Bag) => { for (const [k, n] of Object.entries(cost)) s.inv[k] -= n }
const setCd = (s: GameState, id: string, sec: number, raw = false) => {
  const dur = sec * 1000 * (raw ? 1 : 1 - 0.08 * (s.ench.eff ?? 0))
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
    if (Math.random() < 0.12 * (s.ench.fortune ?? 0)) n *= 2
    give(s, dr.item, n)
    parts.push(`${ITEMS[dr.item].name} +${n}`)
  }
  return parts.join('，')
}
const makeLoc = (s: GameState, biome?: string): Loc => {
  if (!biome) {
    const pool = Object.values(BIOMES).map((b) => ({ id: b.id, w: b.id === 'rift' && s.flags.rift ? 7 : b.weight }))
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
  s.combat = { mob: mobId, hp: m.hp, boss, lines: [`${m.name}出现了！`], turn: 0 }
}
const maybeEncounter = (s: GameState) => {
  if (!s.flags.explore || s.combat) return
  const loc = curLoc(s)
  const night = isNight(s.minute)
  let p = (night ? 0.16 : 0.025) * BIOMES[loc.biome].danger
  if (s.weather === 'storm') p *= 1.5
  if (night && count(s, 'torch') > 0) p *= 0.7
  if (loc.shelter) p *= 0.5
  if (Math.random() > p) return
  const pool = Object.values(MOBS)
    .filter((m) => m.hostile && (!m.nightOnly || night))
    .map((m) => ({ id: m.id, w: (m.weight ?? 1) * (m.id === 'witch' && loc.biome === 'swamp' ? 4 : 1) }))
  let r = Math.random() * pool.reduce((a, b) => a + b.w, 0)
  const id = pool.find((m) => (r -= m.w) < 0)?.id ?? 'zombie'
  pushLog(s, `${night ? '黑暗中' : '突然'}，一只${MOBS[id].name}向你扑来！`, 'bad')
  startCombat(s, id)
}
const fixJobs = (v: Village) => {
  while (employed(v) > v.villagers) {
    const j = Object.keys(v.jobs).find((k) => v.jobs[k] > 0)
    if (!j) break
    v.jobs[j]--
  }
}
const die = (s: GameState, cause: string) => {
  s.stats.deaths++
  s.combat = null
  for (const def of ITEM_LIST) {
    if ((def.cat === 'material' || def.cat === 'food') && s.inv[def.id]) s.inv[def.id] = Math.floor(s.inv[def.id] * 0.7)
  }
  s.level = Math.floor(s.level / 2)
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
  if (count(s, 'map') > 0 && count(s, 'compass') > 0) unlock(s, 'waypoint', '地图与指南针在手，你可以记录走过的地点了。')
  if (pickTier(s) >= 3) unlock(s, 'rift', '铁镐沉甸甸的。据说带着它的人，能找到通往下界要塞的路。')
  if (count(s, 'eye') > 0) unlock(s, 'eye', '末影之眼在掌心微微颤动，似乎想飞向某个方向。')
}

const initial = (): GameState => ({
  inv: {},
  seen: {},
  hp: 20,
  hunger: 20,
  xp: 0,
  level: 0,
  autoEat: false,
  minute: 8 * 60,
  weather: 'clear',
  locs: { 1: { id: 1, biome: 'forest', name: '初生森林', res: { pig: 5 }, saved: false, shelter: false } },
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
})

export const useGame = create<Game>()(
  persist(
    immer((set) => ({
      ...initial(),

      tick: () => set((s) => {
        const prevHour = hourOf(s.minute)
        s.minute += 5
        const hour = hourOf(s.minute)
        if (s.flags.explore && hour !== prevHour) {
          if (hour === 20) pushLog(s, '夜幕降临。黑暗中有东西在移动。', 'event')
          if (hour === 6) pushLog(s, '天亮了。', 'event')
          if (Math.random() < 0.07) {
            const r = Math.random()
            const next: Weather = s.weather !== 'clear' ? 'clear' : r < 0.75 ? 'rain' : 'storm'
            s.weather = next
            pushLog(s, next === 'clear' ? '云层散开，天放晴了。' : next === 'rain' ? '下雨了。' : '雷声滚滚，暴风雨来了。')
          }
        }
        // 生存
        if (s.flags.status) {
          s.hunger = Math.max(0, s.hunger - 0.02)
          if (s.hunger <= 0) {
            s.hp -= 0.5
            if (s.hp <= 0) { die(s, '饥饿夺走了你最后的力气。'); return }
          } else if (s.hunger > 14 && s.hp < 20) s.hp = Math.min(20, s.hp + 0.15)
          if (s.autoEat && s.hunger <= 14) {
            const room = 20 - s.hunger
            const foods = ITEM_LIST.filter((i) => i.food && i.id !== 'rotten' && count(s, i.id) > 0)
              .sort((a, b) => b.food! - a.food!)
            const pick = foods.find((f) => f.food! <= room) ?? (s.hunger < 6 ? foods[foods.length - 1] : undefined)
            if (pick) {
              s.inv[pick.id]--
              s.hunger = Math.min(20, s.hunger + pick.food!)
              pushLog(s, `你自动吃掉了一份${pick.name}。`)
            }
          }
        }
        // 熔炉
        const job = s.furnace.job
        if (job && s.furnace.fuel >= 1) {
          const def = SMELTS.find((x) => x.id === job.r)!
          job.prog++
          if (job.prog >= def.time) {
            job.prog = 0
            job.left--
            s.furnace.fuel--
            give(s, def.out, 1)
            if (job.left <= 0) { s.furnace.job = null; pushLog(s, `熔炉完成了${ITEMS[def.out].name}的熔炼。`) }
          }
        }
        // 村庄
        const v = s.village
        if (v) {
          const cap = villageCap(v)
          for (const [k, r] of Object.entries(production(v))) {
            const cur = s.inv[k] ?? 0
            if (cur < cap) give(s, k, Math.min(r, cap - cur))
          }
          if (housing(v) > v.villagers && Math.random() < 0.02) {
            v.villagers++
            pushLog(s, v.villagers === 1 ? '一位流浪的村民看中了你的空房子，住了下来。' : '又一位村民搬进了空房子。', 'good')
          }
          if (v.villagers > 0 && isNight(s.minute) && Math.random() < 0.004) {
            const strength = 4 + dayOf(s.minute) * 1.2 + rand(0, 4)
            const def = villageDefense(v) + (atHome(s) ? attackPower(s) + defensePower(s) : 0)
            if (def >= strength) {
              v.rep += 4
              give(s, 'bone', rand(1, 3)); give(s, 'rotten', rand(1, 3))
              pushLog(s, '一群怪物趁夜袭击村庄，被守卫击退了。村民们对你更加信赖。', 'good')
            } else {
              for (const k of ['wheat', 'wood', 'cobble', 'meat', 'fish']) if (s.inv[k]) s.inv[k] = Math.floor(s.inv[k] * 0.85)
              v.rep = Math.max(0, v.rep - 2)
              if (v.villagers > 2 && Math.random() < 0.5) { v.villagers--; fixJobs(v) }
              pushLog(s, '怪物趁夜洗劫了村庄，损失了一些物资。也许该加强防御了。', 'bad')
            }
          }
        }
        // 战斗：怪物回合
        const c = s.combat
        if (c) {
          c.turn++
          const m = MOBS[c.mob]
          if (m.atk > 0 && c.turn % 2 === 0) {
            if (count(s, 'shield') > 0 && Math.random() < 0.15) c.lines.unshift('你举盾挡下了攻击。')
            else {
              const dmg = Math.max(1, Math.round(m.atk + rand(0, 1) - defensePower(s) * 0.5))
              s.hp -= dmg
              c.lines.unshift(`${m.name}击中了你，造成 ${dmg} 点伤害。`)
              if (s.hp <= 0) { die(s, `${m.name}没有给你留下机会。`); return }
            }
            if (c.lines.length > 6) c.lines.length = 6
          }
        }
        checkUnlocks(s)
      }),

      act: (id) => set((s) => {
        const a = ACTIONS[id]
        if (!a || s.combat || onCd(s, id)) return
        const loc = curLoc(s)
        if (a.pick && pickTier(s) < a.pick) return
        if (a.tool && count(s, a.tool) < 1) return
        if (a.finite && (loc.res[a.finite] ?? 0) <= 0) return
        let cd = a.cd
        if (id === 'chop') cd *= count(s, 'axe_iron') ? 0.5 : count(s, 'axe_stone') ? 0.7 : 1
        setCd(s, id, cd)
        s.stats.actions++
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - a.hunger)
        if (a.finite) loc.res[a.finite]--
        if (a.mob) {
          pushLog(s, `你盯上了一只${MOBS[a.mob].name}。`)
          startCombat(s, a.mob)
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
        if (s.combat || onCd(s, 'move')) return
        const old = curLoc(s)
        if (!old.saved && !old.shelter && !s.flags.lostHint) {
          s.flags.lostHint = true
          pushLog(s, '没有地图，你再也找不回刚才的地方了。', 'event')
        }
        leaveLoc(s)
        const loc = makeLoc(s)
        s.locId = loc.id
        s.stats.explored++
        setCd(s, 'move', 8)
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - 0.5)
        const b = BIOMES[loc.biome]
        pushLog(s, `你走了很久，来到了${loc.name}。${b.desc}`, 'event')
        if (loc.biome === 'village') unlock(s, 'metVillage', '这里住着村民。也许可以在此定居。')
        gainXp(s, 1)
        maybeEncounter(s)
      }),

      travel: (id) => set((s) => {
        if (s.combat || onCd(s, 'move') || !s.locs[id] || id === s.locId) return
        leaveLoc(s)
        s.locId = id
        setCd(s, 'move', 5)
        if (s.flags.status) s.hunger = Math.max(0, s.hunger - 0.3)
        pushLog(s, `你沿着熟悉的路回到了${s.locs[id].name}。`, 'event')
        maybeEncounter(s)
      }),

      saveLoc: () => set((s) => {
        if (!s.flags.waypoint) return
        curLoc(s).saved = true
        pushLog(s, `你在地图上标记了${curLoc(s).name}。`, 'good')
      }),

      forgetLoc: (id) => set((s) => {
        const loc = s.locs[id]
        if (!loc || loc.shelter || loc.biome === 'altar') return
        loc.saved = false
        if (id !== s.locId) delete s.locs[id]
      }),

      eat: (item) => set((s) => {
        const def = ITEMS[item]
        if (!def?.food || count(s, item) < 1 || onCd(s, 'eat')) return
        s.inv[item]--
        s.hunger = Math.min(20, s.hunger + def.food)
        setCd(s, 'eat', 1, true)
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
        s.hp = Math.min(20, s.hp + 8)
        s.hunger = Math.max(0, s.hunger - 2)
        pushLog(s, '你在床上睡了一觉。醒来时天已经亮了。', 'good')
      }),

      craft: (id, times = 1) => set((s) => {
        const r = RECIPES.find((x) => x.id === id)
        if (!r || (r.station === 'table' && count(s, 'table') < 1)) return
        let made = 0
        for (let i = 0; i < times && canAfford(s, r.cost); i++) { pay(s, r.cost); give(s, r.out, r.n); made += r.n }
        if (!made) return
        pushLog(s, `你合成了${ITEMS[r.out].name} ×${made}。`)
        checkUnlocks(s)
      }),

      addFuel: (item) => set((s) => {
        if (!FUELS[item] || count(s, item) < 1) return
        s.inv[item]--
        s.furnace.fuel += FUELS[item]
      }),

      smelt: (id, n) => set((s) => {
        const def = SMELTS.find((x) => x.id === id)
        if (!def || count(s, 'furnace') < 1) return
        if (s.furnace.job && s.furnace.job.r !== id) return
        n = Math.min(n, count(s, def.from))
        if (n <= 0) return
        s.inv[def.from] -= n
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
        s.inv.lapis -= cost.lapis
        s.ench[id] = lvl + 1
        pushLog(s, `符文渗入了你的装备：${def.name} ${lvl + 1} 级。`, 'good')
      }),

      buildShelter: () => set((s) => {
        if (s.homeId !== null || !canAfford(s, SHELTER_COST)) return
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
        if (s.homeId !== null || loc.biome !== 'village') return
        loc.shelter = true
        s.homeId = loc.id
        s.village = { villagers: 4, jobs: { farmer: 2 }, buildings: { house: 3, farm: 1 }, rep: 0, founded: false, mayor: false }
        pushLog(s, '你在村庄边缘住了下来。村民们还不太信任你。', 'good')
        unlock(s, 'village', '多与村民交谈、交易，赢得他们的信任。')
      }),

      build: (id) => set((s) => {
        const v = s.village
        if (!v || !atHome(s) || !canControl(v)) return
        const cost = buildCost(v, id)
        if (!canAfford(s, cost)) return
        pay(s, cost)
        v.buildings[id] = (v.buildings[id] ?? 0) + 1
        if (v.villagers > 0) v.rep += 2
        pushLog(s, `你建造了一座${BUILDING_MAP[id].name}。`, 'good')
      }),

      assign: (job, delta) => set((s) => {
        const v = s.village
        if (!v || !canControl(v) || !JOB_MAP[job]) return
        const cur = v.jobs[job] ?? 0
        if (delta > 0 && (employed(v) >= v.villagers || cur >= jobSlots(v, job))) return
        if (delta < 0 && cur <= 0) return
        v.jobs[job] = cur + delta
      }),

      trade: (id) => set((s) => {
        const v = s.village
        const t = TRADES.find((x) => x.id === id)
        if (!v || !t || !atHome(s) || v.villagers < 1 || !canAfford(s, t.give)) return
        pay(s, t.give)
        for (const [k, n] of Object.entries(t.get)) give(s, k, n)
        v.rep += v.buildings.market ? 2 : 1
      }),

      talk: () => set((s) => {
        const v = s.village
        if (!v || !atHome(s) || v.villagers < 1 || onCd(s, 'talk')) return
        setCd(s, 'talk', 15, true)
        v.rep += v.rep < 20 ? 2 : 1
        pushLog(s, TALK_LINES[rand(0, TALK_LINES.length - 1)])
      }),

      runMayor: () => set((s) => {
        const v = s.village
        if (!v || v.mayor || v.rep < MAYOR_REP || v.villagers < MAYOR_POP) return
        v.mayor = true
        pushLog(s, '村民们一致推举你为村长。钟声响彻了整个村庄。（村庄产出 +25%）', 'good')
      }),

      attack: () => set((s) => {
        const c = s.combat
        if (!c || onCd(s, 'attack')) return
        setCd(s, 'attack', 1, true)
        const m = MOBS[c.mob]
        const crit = Math.random() < 0.1
        const dmg = (attackPower(s) + rand(0, 1)) * (crit ? 2 : 1)
        c.hp -= dmg
        c.lines.unshift(`你${crit ? '打出暴击，' : ''}对${m.name}造成 ${dmg} 点伤害。`)
        if (c.lines.length > 6) c.lines.length = 6
        if (c.hp > 0) return
        s.combat = null
        s.stats.kills++
        const got = rollDrops(s, m.drops)
        gainXp(s, m.xp)
        pushLog(s, `你击败了${m.name}。${got ? `（${got}）` : ''}`, 'good')
        if (c.mob === 'dragon') {
          s.flags.won = true
          s.flags.showWin = true
          pushLog(s, '末影龙发出最后一声长啸，化作漫天光点。世界安静了下来。', 'event')
        }
        checkUnlocks(s)
      }),

      flee: () => set((s) => {
        const c = s.combat
        if (!c || c.boss || onCd(s, 'flee')) return
        setCd(s, 'flee', 3, true)
        if (Math.random() < 0.55) {
          s.combat = null
          pushLog(s, `你从${MOBS[c.mob].name}面前逃走了。`)
        } else c.lines.unshift('你没能逃掉！')
      }),

      throwEye: () => set((s) => {
        if (s.combat || count(s, 'eye') < 1 || onCd(s, 'eye')) return
        setCd(s, 'eye', 4, true)
        if (s.flags.altar) { pushLog(s, '末影之眼飞向祭坛的方向，又落回你手中。'); return }
        s.inv.eye--
        s.eyesThrown++
        if (s.eyesThrown < 3) { pushLog(s, '末影之眼升上半空，朝远方飞去，然后碎裂了。你朝那个方向又走了一段。', 'event'); return }
        s.flags.altar = true
        const loc = makeLoc(s, 'altar')
        loc.name = '要塞传送门房间'
        loc.saved = true
        pushLog(s, '末影之眼径直钻入了地下。你在脚下发现了一条通往要塞传送门房间的阶梯——它的位置已被牢牢记住。', 'good')
      }),

      insertEyes: () => set((s) => {
        if (curLoc(s).biome !== 'altar' || s.flags.portal) return
        const n = Math.min(count(s, 'eye'), EYES_NEEDED - s.altarEyes)
        if (n <= 0) return
        s.inv.eye -= n
        s.altarEyes += n
        pushLog(s, `你把 ${n} 只末影之眼嵌入了凹槽。（${s.altarEyes}/${EYES_NEEDED}）`)
        if (s.altarEyes >= EYES_NEEDED) {
          s.flags.portal = true
          pushLog(s, '最后一只眼睛归位。传送门中涌出了星空般的黑暗。', 'event')
        }
      }),

      enterPortal: () => set((s) => {
        if (!s.flags.portal || s.combat || curLoc(s).biome !== 'altar') return
        pushLog(s, '你踏入传送门。末地之中，一双巨大的紫色眼睛缓缓睁开。', 'event')
        startCombat(s, 'dragon', true)
      }),

      dismissWin: () => set((s) => { s.flags.showWin = false }),

      reset: () => set(() => initial()),

      devUnlock: () => set((s) => {
        const stock: Bag = {
          wood: 200, plank: 300, stick: 60, cobble: 300, coal: 60, iron: 80, gold: 10, diamond: 20, emerald: 30,
          lapis: 40, redstone: 10, obsidian: 8, wheat: 80, seed: 40, string: 20, wool: 10, leather: 12, paper: 20,
          book: 8, torch: 24, bread: 20, steak: 20, apple: 6, fish: 8, iron_ore: 16, sand: 12, pearl: 12,
          blaze_rod: 6, bone: 10, bucket: 2,
        }
        for (const [k, n] of Object.entries(stock)) give(s, k, n)
        for (const k of ['table', 'furnace', 'pick_iron', 'axe_iron', 'sword_iron', 'armor_iron', 'shield', 'rod', 'bed', 'map', 'compass', 'enchant_table']) {
          if (!count(s, k)) give(s, k, 1)
        }
        s.level = Math.max(s.level, 30)
        s.stats.actions = Math.max(s.stats.actions, 10)
        if (!s.village) {
          const loc = curLoc(s)
          loc.shelter = true
          s.homeId = loc.id
          s.village = { villagers: 6, jobs: { farmer: 2, lumberjack: 1 }, buildings: { house: 4, farm: 1, lumber: 1 }, rep: 40, founded: true, mayor: false }
          s.flags.village = true
        }
        pushLog(s, '【开发者】已发放物资并解锁大部分界面。', 'event')
        checkUnlocks(s)
      }),
    })),
    { name: 'block-idle-save', version: 2, migrate: (state) => migrateMinecraftNames(state as GameState) },
  ),
)
