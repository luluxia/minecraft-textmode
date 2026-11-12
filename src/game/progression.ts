import type { Bag } from './data'

export const NETHER_COST: Bag = { obsidian: 10, iron: 1 }
export const WITHER_COST: Bag = { wither_skull: 3, soul_sand: 4 }
export const BARTER_COST: Bag = { gold: 3 }
export const BARTER_OFFERS: { weight: number; reward: Bag }[] = [
  { weight: 3, reward: { pearl: 2 } },
  { weight: 3, reward: { obsidian: 3, string: 4 } },
  { weight: 2, reward: { pearl: 1, leather: 4 } },
]
export const SURVEY_COST: Bag = { torch: 4 }
export const OFFLINE_LIMIT = 8 * 60 * 60
export const DAYS_PER_SEASON = 4
export const SEASONS = [
  { name: '春', crops: 1.2 },
  { name: '夏', crops: 1.1 },
  { name: '秋', crops: 1 },
  { name: '冬', crops: 0.8 },
]
export const seasonAt = (minute: number) => SEASONS[Math.floor(minute / (1440 * DAYS_PER_SEASON)) % SEASONS.length]

export const ROUTES = [
  { biome: 'forest', name: '返回橡树林', requirement: '工作台', pick: 0 },
  { biome: 'plains', name: '踏查草原', requirement: '工作台', pick: 0 },
  { biome: 'coast', name: '沿河前往海岸', requirement: '工作台', pick: 0 },
  { biome: 'mountain', name: '勘察露天矿脉', requirement: '木镐', pick: 1 },
  { biome: 'village', name: '循着炊烟寻访村庄', requirement: '木镐', pick: 1 },
  { biome: 'cave', name: '深入洞穴', requirement: '石镐', pick: 2 },
] as const

interface Line { id: string; name: string; input: Bag; output: Bag; seconds: number }
export const LINES: Line[] = [
  { id: 'sawmill', name: '锯木机', input: { wood: 1 }, output: { plank: 4 }, seconds: 8 },
  { id: 'bakery', name: '面包坊', input: { wheat: 3 }, output: { bread: 1 }, seconds: 18 },
  { id: 'blast', name: '高炉', input: { iron_ore: 4, coal: 1 }, output: { iron: 4 }, seconds: 36 },
  { id: 'paper', name: '造纸机', input: { cane: 3 }, output: { paper: 3 }, seconds: 18 },
  { id: 'kiln', name: '玻璃窑', input: { sand: 4, charcoal: 1 }, output: { glass: 4 }, seconds: 30 },
]

export interface ExpeditionDef { id: string; name: string; desc: string; cost: Bag; reward: Bag; seconds: number; xp: number; flight?: boolean }
export const EXPEDITIONS: ExpeditionDef[] = [
  { id: 'bridge', name: '架桥渡过虚空', desc: '架设栈桥，在最近的末地城搜寻潜影壳。', cost: { cobble: 48, bread: 4 }, reward: { shulker_shell: 4 }, seconds: 180, xp: 12 },
  { id: 'city', name: '搜寻末地船', desc: '带着末影珍珠穿过塔楼，寻找末地船留下的宝藏。', cost: { pearl: 2, bread: 8, glass: 8 }, reward: { shulker_shell: 8, diamond: 4 }, seconds: 420, xp: 24 },
  { id: 'flight', name: '飞往远端群岛', desc: '用鞘翅越过虚空，探索栈桥触及不到的岛屿。', cost: { bread: 12, paper: 16, gold: 4 }, reward: { shulker_shell: 16, diamond: 10, emerald: 10 }, seconds: 720, xp: 50, flight: true },
]
