import type { Bag } from './data'

export const NETHER_COST: Bag = { obsidian: 10, iron: 1 }
export const WITHER_COST: Bag = { wither_skull: 3, soul_sand: 4 }
export const RESPAWN_COST: Bag = { end_crystal: 4 }
export const TRIAL_VAULTS: { id: 'normal' | 'ominous'; name: string; cost: Bag; reward: Bag; flag: string }[] = [
  { id: 'normal', name: '宝库', cost: { trial_key: 1 }, reward: { ominous_bottle: 1, emerald: 4, copper: 6 }, flag: 'trialVault' },
  { id: 'ominous', name: '不祥宝库', cost: { ominous_key: 1 }, reward: { heavy_core: 1, diamond: 3, gold: 4 }, flag: 'ominousVault' },
]
export const BARTER_COST: Bag = { gold: 3 }
export const BARTER_OFFERS: { weight: number; reward: Bag }[] = [
  { weight: 3, reward: { pearl: 2 } },
  { weight: 3, reward: { obsidian: 3, string: 4 } },
  { weight: 2, reward: { pearl: 1, leather: 4 } },
  { weight: 1, reward: { quartz: 5, fire_resistance: 1 } },
]
export const SURVEY_COST: Bag = { torch: 4 }
export const EXCAVATION_COST: Bag = { bread: 1, torch: 2 }
export const OFFLINE_LIMIT = 8 * 60 * 60
export const MAX_AIR = 20
export const WATER_BREATHING_SECONDS = 60
export const DAYS_PER_SEASON = 4
export const SEASONS = [
  { name: '春', crops: 1.2 },
  { name: '夏', crops: 1.1 },
  { name: '秋', crops: 1 },
  { name: '冬', crops: 0.8 },
]
export const seasonAt = (minute: number) => SEASONS[Math.floor(minute / (1440 * DAYS_PER_SEASON)) % SEASONS.length]

interface Route { biome: string; name: string; requirement: string; pick: number; tool?: string; nether?: boolean; newRoute?: boolean }
export const ROUTES: Route[] = [
  { biome: 'forest', name: '返回橡树林', requirement: '工作台', pick: 0 },
  { biome: 'plains', name: '踏查草原', requirement: '工作台', pick: 0 },
  { biome: 'coast', name: '沿河前往海岸', requirement: '工作台', pick: 0 },
  { biome: 'mountain', name: '勘察露天矿脉', requirement: '木镐', pick: 1 },
  { biome: 'village', name: '循着炊烟寻访村庄', requirement: '木镐', pick: 1 },
  { biome: 'cave', name: '深入洞穴', requirement: '石镐', pick: 2 },
  { biome: 'birch_grove', name: '勘察白桦森林', requirement: '木镐', pick: 1, newRoute: true },
  { biome: 'taiga', name: '沿山路进入针叶林', requirement: '木镐', pick: 1, newRoute: true },
  { biome: 'jungle', name: '沿暖河深入丛林', requirement: '石镐', pick: 2, newRoute: true },
  { biome: 'mangrove', name: '驾船前往红树林', requirement: '橡木船', pick: 0, tool: 'boat', newRoute: true },
  { biome: 'cherry_grove', name: '寻访樱花树林', requirement: '石镐', pick: 2, newRoute: true },
  { biome: 'geode', name: '寻找紫水晶洞', requirement: '石镐', pick: 2, newRoute: true },
  { biome: 'desert_ruin', name: '勘察沙漠遗迹', requirement: '刷子', pick: 0, tool: 'brush', newRoute: true },
  { biome: 'trial_chamber', name: '定位试炼密室', requirement: '铁镐和望远镜', pick: 3, tool: 'spyglass', newRoute: true },
  { biome: 'ancient_city', name: '深入远古城市', requirement: '钻石镐', pick: 4, newRoute: true },
  { biome: 'nether_wastes', name: '探查下界荒地', requirement: '铁镐', pick: 3, nether: true, newRoute: true },
  { biome: 'bastion', name: '寻找堡垒遗迹', requirement: '钻石镐', pick: 4, nether: true, newRoute: true },
]

interface Line { id: string; name: string; input: Bag; output: Bag; seconds: number; building?: string; reserveWheat?: boolean }
export const LINES: Line[] = [
  { id: 'sawmill', name: '锯木机', input: { wood: 1 }, output: { plank: 4 }, seconds: 8 },
  { id: 'bakery', name: '面包坊', input: { wheat: 3 }, output: { bread: 1 }, seconds: 18, reserveWheat: true },
  { id: 'blast', name: '高炉', input: { iron_ore: 4, coal: 1 }, output: { iron: 4 }, seconds: 36 },
  { id: 'paper', name: '造纸机', input: { cane: 3 }, output: { paper: 3 }, seconds: 18 },
  { id: 'kiln', name: '玻璃窑', input: { sand: 4, charcoal: 1 }, output: { glass: 4 }, seconds: 30 },
  { id: 'copper_blast', name: '铜熔炼线', input: { copper_ore: 4, coal: 1 }, output: { copper: 4 }, seconds: 28 },
  { id: 'waxing', name: '涂蜡线', input: { copper_block: 1, honeycomb: 1 }, output: { waxed_copper: 1 }, seconds: 20, building: 'crafter' },
  { id: 'honey_bottler', name: '蜂场装瓶', input: { honeycomb: 2, bottle: 1 }, output: { honey: 1 }, seconds: 30, building: 'apiary' },
  { id: 'brick_kiln', name: '制砖窑', input: { clay: 4, coal: 1 }, output: { brick_block: 1 }, seconds: 24 },
  { id: 'potato_oven', name: '马铃薯烤炉', input: { potato: 4, charcoal: 1 }, output: { baked_potato: 4 }, seconds: 24 },
  { id: 'pastry', name: '甜点工坊', input: { pumpkin: 1, sugar: 1, egg: 1 }, output: { pumpkin_pie: 1 }, seconds: 28, building: 'crafter' },
  { id: 'purpur_press', name: '紫珀压制机', input: { popped_chorus: 4 }, output: { purpur: 4 }, seconds: 25, building: 'crafter' },
  { id: 'sponge_dryer', name: '海绵烘干架', input: { wet_sponge: 4, charcoal: 1 }, output: { sponge: 4 }, seconds: 32, building: 'harbor' },
]

interface Plant { id: string; name: string; cost: Bag; reward: Bag; seconds: number }
export const PLANTS: Plant[] = [
  { id: 'wheat', name: '小麦', cost: { seed: 2 }, reward: { wheat: 4, seed: 2 }, seconds: 24 },
  { id: 'carrot', name: '胡萝卜', cost: { carrot: 1 }, reward: { carrot: 4 }, seconds: 32 },
  { id: 'potato', name: '马铃薯', cost: { potato: 1 }, reward: { potato: 4 }, seconds: 32 },
  { id: 'pumpkin', name: '南瓜', cost: { pumpkin: 1 }, reward: { pumpkin: 3 }, seconds: 44 },
  { id: 'torchflower', name: '火把花', cost: { torchflower_seed: 1 }, reward: { torchflower: 2 }, seconds: 60 },
  { id: 'pitcher', name: '瓶子草', cost: { pitcher_pod: 1 }, reward: { pitcher: 2 }, seconds: 60 },
  { id: 'chorus', name: '紫颂花', cost: { chorus_flower: 1, end_stone: 1 }, reward: { chorus_fruit: 6, chorus_flower: 1, end_stone: 1 }, seconds: 75 },
]

export interface ExpeditionDef {
  id: string
  name: string
  desc: string
  cost: Bag
  reward: Bag
  first?: Bag
  seconds: number
  xp: number
  region: 'ocean' | 'end' | 'camp'
  tool?: string
  after?: string
  breathing?: boolean
}
export const EXPEDITIONS: ExpeditionDef[] = [
  { id: 'shipwreck', name: '打捞沉船', desc: '驾船沿岸寻找沉船，带回指向埋藏宝藏的地图。', cost: { bread: 3 }, reward: { treasure_map: 1, iron_ore: 5, salmon: 4 }, seconds: 90, xp: 8, region: 'ocean', tool: 'boat' },
  { id: 'buried_treasure', name: '循图挖掘宝藏', desc: '消耗藏宝图，挖掘沙滩下的沉箱。第一次会获得海洋之心。', cost: { treasure_map: 1, bread: 4 }, reward: { gold: 4, emerald: 2, diamond: 1 }, first: { heart_of_sea: 1 }, seconds: 150, xp: 15, region: 'ocean', tool: 'boat', after: 'shipwreck' },
  { id: 'warm_ruins', name: '考察暖水海底废墟', desc: '用刷子清理水下沙层。首次找到嗅探兽蛋，随后可持续带回陶片和贝壳。', cost: { bread: 5, torch: 4 }, reward: { angler_sherd: 2, nautilus: 3, pufferfish: 2 }, first: { sniffer_egg: 1 }, seconds: 210, xp: 18, region: 'ocean', tool: 'brush', after: 'shipwreck' },
  { id: 'ocean_monument', name: '探访海底神殿', desc: '备好水肺药水，或带上潮涌核心。远征队可带回海晶材料和湿海绵。', cost: { bread: 8 }, reward: { prismarine_shard: 16, prismarine_crystal: 12, wet_sponge: 6, gold: 6 }, seconds: 420, xp: 35, region: 'ocean', tool: 'boat', after: 'buried_treasure', breathing: true },
  { id: 'hatch_sniffer', name: '孵化嗅探兽', desc: '在营地孵化嗅探兽蛋，等它首次找到远古植物的种子。', cost: { sniffer_egg: 1 }, reward: { torchflower_seed: 2, pitcher_pod: 2 }, seconds: 150, xp: 10, region: 'camp', after: 'warm_ruins' },
  { id: 'bridge', name: '架桥渡过虚空', desc: '架设栈桥，在最近的末地城搜寻潜影壳，顺路采集末地石。', cost: { cobble: 48, bread: 4 }, reward: { shulker_shell: 4, end_stone: 8, chorus_fruit: 8 }, seconds: 180, xp: 12, region: 'end' },
  { id: 'city', name: '搜寻末地船', desc: '带着末影珍珠穿过塔楼，寻找末地船留下的宝藏。', cost: { pearl: 2, bread: 8, glass: 8 }, reward: { shulker_shell: 8, diamond: 4, chorus_flower: 2, end_stone: 12 }, seconds: 420, xp: 24, region: 'end' },
  { id: 'flight', name: '飞往远端群岛', desc: '用鞘翅越过虚空，探索栈桥触及不到的岛屿。', cost: { bread: 12, paper: 16, gold: 4 }, reward: { shulker_shell: 16, diamond: 10, emerald: 10, chorus_fruit: 16, end_stone: 16 }, seconds: 720, xp: 50, region: 'end', tool: 'elytra' },
  { id: 'chorus_grove', name: '绘制紫颂林地图', desc: '带着末影箱建立补给点，回收紫颂花和潜影壳。', cost: { purpur: 8, bread: 8, end_stone: 6 }, reward: { chorus_flower: 5, chorus_fruit: 24, shulker_shell: 8, pearl: 4 }, seconds: 600, xp: 40, region: 'end', tool: 'ender_chest', after: 'flight' },
]
