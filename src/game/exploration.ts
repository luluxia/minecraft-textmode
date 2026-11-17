import { BIOMES } from './data'

export const NEARBY_COST = 1.5
export const JOURNEY_COST = 3
export const RETURN_COST = 1

export const LEADS: Record<string, { name: string; description: string; destinations: string[] }> = {
  tracks: { name: '车辙与炊烟', description: '旧车辙朝远处延伸，地平线上隐约有炊烟。', destinations: ['plains', 'village', 'savanna'] },
  river: { name: '下游的水迹', description: '顺着水迹往下游走，可能到达更开阔的水域。', destinations: ['coast', 'swamp', 'mangrove', 'warm_ocean'] },
  rocks: { name: '裸露的岩层', description: '裸露的岩层延伸向远处，沿途可能有洞口。', destinations: ['mountain', 'cave', 'dripstone_caves', 'geode', 'mineshaft'] },
  copper: { name: '凝灰岩和铜片', description: '散落的铜片和凝灰岩碎块指向地下遗迹。', destinations: ['cave', 'mineshaft', 'trial_chamber'] },
  sculk: { name: '岩壁上的幽匿', description: '岩壁上的幽匿一路蔓延至更深处。', destinations: ['cave', 'deep_dark', 'ancient_city'] },
  pottery: { name: '沙地里的陶片', description: '沙地里散落着陶片，附近可能埋有遗迹。', destinations: ['desert', 'badlands', 'desert_ruin', 'desert_pyramid'] },
  canopy: { name: '幽暗的树冠', description: '幽暗的树冠连成一片，林径还在继续向前。', destinations: ['dark_forest', 'pale_garden', 'mansion'] },
  wreck: { name: '海上的漂流木', description: '漂流木顺水而来，附近的海域可能有沉船。', destinations: ['coast', 'warm_ocean', 'deep_ocean', 'monument'] },
  snow: { name: '雪中的足迹', description: '积雪上的足迹朝更冷的地带延伸。', destinations: ['snow', 'cold_ocean', 'dappled_forest'] },
  raid: { name: '遭遗弃的旗帜', description: '废弃旗帜立在旧路旁，附近可能有前哨站。', destinations: ['plains', 'savanna', 'outpost'] },
  sulfur: { name: '冒泡的硫磺泉', description: '冒泡的硫磺泉下方可能有一片洞穴。', destinations: ['cave', 'sulfur_caves'] },
  nether: { name: '黑石残垣', description: '黑石残垣朝远处延伸，可能通往堡垒遗迹。', destinations: ['nether_wastes', 'crimson_forest', 'bastion'] },
}

interface Site {
  name: string
  hint: string
  actions?: string[]
  resource?: { id: string; range: [number, number] }
}

export const SITES: Record<string, Site> = {
  thicket: { name: '野果灌木', hint: '灌木间有鸟啄过的痕迹', actions: ['gather_wild_berries'], resource: { id: 'wild_berries', range: [2, 4] } },
  outcrop: { name: '石料露头', hint: '地面散着碎石', actions: ['mine_stone'] },
  road: { name: '旧车辙', hint: '草地上有两道凹痕' },
  bank: { name: '隐蔽河岸', hint: '能听见水声', actions: ['gather_cane', 'fish'] },
  campsite: { name: '废弃营地', hint: '倒木后露出一角旧草床', actions: ['search_campsite'], resource: { id: 'camp_supplies', range: [1, 1] } },
  traveler: { name: '落脚的旅人', hint: '附近传来整理行装的声音', actions: ['meet_traveler'] },
  ore: { name: '浅层矿脉', hint: '岩石间泛着锈迹', actions: ['mine_iron'], resource: { id: 'iron', range: [4, 7] } },
  masonry: { name: '铜制残件', hint: '碎石下露出一截金属' },
  echo: { name: '幽匿裂隙', hint: '深处传来回声' },
  sand: { name: '可疑沙层', hint: '沙丘下露出几块碎砖', actions: ['brush_ruin'], resource: { id: 'suspicious', range: [3, 5] } },
  dark: { name: '深色林径', hint: '树干上有斧痕' },
  drift: { name: '沉船残骸', hint: '浪里漂着几块木板', actions: ['search_wreck'], resource: { id: 'wreck', range: [1, 1] } },
  seabed: { name: '海底遗迹', hint: '水下石块排成一列', actions: ['dive_ruin'], resource: { id: 'sunken_sand', range: [3, 5] } },
  trail_ruins: { name: '古迹废墟', hint: '泥土间露出几块陶瓦', actions: ['brush_trail_ruins'], resource: { id: 'trail', range: [2, 4] } },
  warm_ruins: { name: '暖水海底废墟', hint: '鱼群下方有碎石拱门', actions: ['dive_warm_ruins'], resource: { id: 'warm_ruins', range: [2, 4] } },
  igloo: { name: '雪屋', hint: '雪中露出一道矮门', actions: ['search_igloo'], resource: { id: 'igloo', range: [1, 1] } },
  snow_cellar: { name: '雪屋地下室', hint: '雪屋地毯下有一扇活板门', actions: ['rescue_igloo_villager'] },
  hut: { name: '女巫小屋', hint: '雾里有灯火', actions: ['hunt_witch'] },
  jungle_pyramid: { name: '丛林神庙', hint: '藤蔓后露出石墙', actions: ['search_jungle_pyramid'], resource: { id: 'jungle_temple', range: [1, 1] } },
  ruined_portal: { name: '废弃传送门', hint: '裸露的黑曜石上有紫纹', actions: ['search_ruined_portal'], resource: { id: 'ruined_portal', range: [1, 1] } },
  cage: { name: '笼中的悦灵', hint: '木笼边闪过蓝光', actions: ['free_allay'] },
  dungeon: { name: '刷怪笼房间', hint: '墙后传来骨骼碰撞声', actions: ['search_dungeon'], resource: { id: 'dungeon', range: [1, 1] } },
  spring: { name: '硫磺泉', hint: '低处有一片冒泡的水面' },
  ashes: { name: '黑石碎片', hint: '岩浆边有砌过的石块' },
}

const sitePools: Record<string, string[]> = {
  forest: ['thicket', 'outcrop', 'campsite', 'road', 'traveler', 'dark'],
  plains: ['road', 'bank', 'outcrop', 'traveler', 'campsite', 'ruined_portal'],
  village: ['road', 'bank', 'traveler'],
  birch_grove: ['campsite', 'traveler', 'road', 'trail_ruins'],
  taiga: ['thicket', 'campsite', 'traveler', 'outcrop', 'trail_ruins'],
  dappled_forest: ['campsite', 'traveler', 'thicket'],
  cherry_grove: ['campsite', 'road', 'bank'],
  snow: ['campsite', 'outcrop', 'traveler', 'igloo', 'snow_cellar'],
  savanna: ['road', 'campsite', 'traveler'],
  dark_forest: ['dark', 'thicket', 'campsite'],
  pale_garden: ['campsite', 'dark'],
  jungle: ['bank', 'campsite', 'jungle_pyramid'],
  swamp: ['bank', 'traveler', 'hut'],
  mangrove: ['bank', 'traveler', 'ruined_portal'],
  coast: ['drift', 'seabed', 'bank', 'traveler'],
  warm_ocean: ['drift', 'warm_ruins'],
  deep_ocean: ['drift', 'seabed'],
  cold_ocean: ['drift', 'seabed', 'bank'],
  outpost: ['cage', 'road'],
  mansion: ['cage', 'dark'],
  mountain: ['ore', 'outcrop', 'spring', 'echo'],
  cave: ['ore', 'masonry', 'echo', 'outcrop', 'spring', 'dungeon'],
  dripstone_caves: ['masonry', 'ore'],
  lush_caves: ['thicket', 'ore'],
  deep_dark: ['echo', 'masonry'],
  mineshaft: ['ore', 'masonry', 'dungeon'],
  desert: ['sand', 'road', 'outcrop', 'ruined_portal'],
  badlands: ['sand', 'ore', 'masonry'],
  nether_wastes: ['ashes'],
  crimson_forest: ['ashes'],
  basalt_deltas: ['ashes'],
}

const regions: Record<string, string[]> = {
  forest: ['plains', 'birch_grove', 'taiga', 'cherry_grove', 'dark_forest', 'dappled_forest'],
  plains: ['forest', 'village', 'savanna', 'mountain', 'coast', 'outpost'],
  mountain: ['cave', 'snow', 'geode', 'cherry_grove', 'dripstone_caves', 'deep_dark'],
  cave: ['mountain', 'geode', 'mineshaft', 'trial_chamber', 'deep_dark', 'dripstone_caves', 'lush_caves', 'sulfur_caves'],
  coast: ['swamp', 'mangrove', 'warm_ocean', 'deep_ocean', 'cold_ocean', 'mushroom_fields'],
  desert: ['savanna', 'badlands', 'desert_ruin', 'desert_pyramid', 'village'],
  dark_forest: ['pale_garden', 'mansion', 'forest'],
  deep_dark: ['ancient_city', 'cave'],
  deep_ocean: ['monument', 'warm_ocean', 'cold_ocean', 'coast'],
  snow: ['coast', 'taiga', 'dappled_forest', 'cold_ocean'],
  badlands: ['savanna', 'desert_ruin', 'mineshaft'],
}

export function nearbySites(biome: string) {
  const remaining = [...(sitePools[biome] ?? [])]
  const chosen: string[] = []
  const count = Math.min(remaining.length, Math.random() < 0.38 ? 1 : Math.random() < 0.8 ? 2 : 3)
  while (chosen.length < count) {
    const index = Math.floor(Math.random() * remaining.length)
    chosen.push(remaining.splice(index, 1)[0])
  }
  return chosen
}

export function journeyDestination(origin: string, leads: readonly string[]) {
  const nether = !!BIOMES[origin].nether
  const nearby = regions[origin] ?? []
  const hinted = new Set(leads.flatMap((id) => LEADS[id].destinations))
  const options = Object.values(BIOMES).filter((biome) => !!biome.nether === nether && biome.id !== 'altar')
    .map((biome) => ({
      id: biome.id,
      weight: (biome.weight || (nether && ['rift', 'warped', 'nether_wastes', 'bastion'].includes(biome.id) ? 4 : 0)) +
        (nearby.includes(biome.id) ? 7 : 0) + (hinted.has(biome.id) ? 30 : 0),
    }))
  let roll = Math.random() * options.reduce((total, biome) => total + biome.weight, 0)
  return options.find((biome) => (roll -= biome.weight) < 0)?.id ?? origin
}


const variants: Record<string, string[]> = {
  plains: ['向日葵平原', '草甸'],
  forest: ['繁花森林'],
  birch_grove: ['原始白桦森林'],
  taiga: ['原始针叶林', '积雪针叶林'],
  jungle: ['竹林', '稀疏丛林'],
  snow: ['冰刺之地', '积雪平原'],
  mountain: ['裸岩山峰', '积雪山坡'],
  coast: ['沙滩', '河口'],
}

export const VARIANT_NAMES = Object.fromEntries(Object.entries(variants).flatMap(
  ([biome, names]) => names.map((name, i) => [biome + '_' + i, name]),
))

export function journeyVariant(biome: string) {
  const choices = variants[biome]
  if (!choices?.length || Math.random() > 0.4) return undefined
  const index = Math.floor(Math.random() * choices.length)
  return { id: biome + '_' + index, name: choices[index] }
}
