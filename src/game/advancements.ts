import { BIOMES, BUILDING_MAP, ITEMS, JOB_MAP, MOBS, PICKS } from './data'
import type { GameState } from './store'

type GoalTone = 'material' | 'equipment' | 'place' | 'danger' | 'project' | 'special'

export interface GoalTerm {
  name: string
  icon: string
  tone: GoalTone
  itemId?: string
}

export type GoalHint = readonly (string | GoalTerm)[]

interface Goal {
  title: string
  icon: GoalTerm
  hint: GoalHint
}

interface Milestone extends Goal {
  id: string
  requires?: readonly string[]
  available?: (state: GameState) => boolean
  complete: (state: GameState) => boolean
}

const item = (id: string, tone: GoalTone, name = ITEMS[id].name): GoalTerm => ({
  name, icon: ITEMS[id].icon, tone, itemId: id,
})
const building = (id: string): GoalTerm => ({
  name: BUILDING_MAP[id].name, icon: BUILDING_MAP[id].icon, tone: 'project',
})
const place = (id: string, name = BIOMES[id].name): GoalTerm => ({
  name, icon: BIOMES[id].icon, tone: 'place',
})
const mob = (id: string): GoalTerm => ({ name: MOBS[id].name, icon: MOBS[id].icon, tone: 'danger' })

const wood = item('wood', 'material')
const cobble = item('cobble', 'material')
const ironOre = item('iron_ore', 'material')
const iron = item('iron', 'material')
const diamond = item('diamond', 'special')
const obsidian = item('obsidian', 'material')
const glass = item('glass', 'material')
const table = item('table', 'equipment')
const furnace = item('furnace', 'equipment')
const woodPick = item('pick_wood', 'equipment')
const stonePick = item('pick_stone', 'equipment')
const ironPick = item('pick_iron', 'equipment')
const diamondPick = item('pick_diamond', 'equipment')
const shield = item('shield', 'equipment')
const armor = item('armor_iron', 'equipment', '护甲')
const food = item('steak', 'material', '熟食')
const blazeRod = item('blaze_rod', 'special')
const pearl = item('pearl', 'special')
const eye = item('eye', 'special')
const shell = item('shulker_shell', 'special')
const elytra = item('elytra', 'equipment')
const netherStar = item('nether_star', 'special')

const forest = place('forest', '初生森林')
const cave = place('cave')
const village = place('village')
const stronghold = place('altar')
const endPortal = place('altar', '末地传送门')
const shelter: GoalTerm = { name: '庇护所', icon: ITEMS.bed.icon, tone: 'place' }
const fortress = place('rift')
const warpedForest = place('warped')
const netherPortal: GoalTerm = { name: '下界传送门', icon: '/textures/minecraft/nether_portal.png', tone: 'place' }
const overworld: GoalTerm = { name: '主世界', icon: '/textures/minecraft/grass_block.png', tone: 'place' }
const end: GoalTerm = { name: '末地', icon: '/textures/minecraft/end_stone.png', tone: 'place' }
const crystal: GoalTerm = { name: '末地水晶', icon: '/textures/minecraft/end_crystal.png', tone: 'special' }
const endShip: GoalTerm = { name: '末地船远征', icon: '/textures/minecraft/end_ship.png', tone: 'place' }
const outerIslands: GoalTerm = { name: '远端群岛远征', icon: end.icon, tone: 'place' }
const villager: GoalTerm = { name: '村民', icon: '/textures/minecraft/mob_villager.png', tone: 'project' }
const mayor: GoalTerm = { name: '村长', icon: BIOMES.village.icon, tone: 'project' }
const watchtower = building('watchtower')
const guard: GoalTerm = { name: JOB_MAP.guard.name, icon: JOB_MAP.guard.icon, tone: 'project' }
const workshop = building('redstone')
const beacon = building('beacon')
const shulkerStore = building('shulker_store')
const monument = building('monument')
const wither = mob('wither')
const dragon = mob('dragon')
const monumentRequirements: GoalHint = ['成为', mayor, '、点亮', beacon, '并完成', outerIslands]

export const STORY: Milestone[] = [
  { id: 'cook-food', title: '第一顿熟食', icon: food, hint: ['在营火或熔炉烹饪一次食物。'], complete: (s) => !!s.flags.cookedFood },
  { id: 'nearby-discovery', title: '近处的发现', icon: forest, hint: ['在采集页探索附近。'], complete: (s) => !!s.flags.nearbyFound },
  { id: 'wood', title: '徒手伐木', icon: wood, hint: ['收集', wood, '。'], complete: (s) => !!s.seen.wood },
  {
    id: 'table', requires: ['wood'], title: '工作台', icon: table, hint: ['把', wood, '做成木板，再合成', table, '。'],
    complete: (s) => !!s.seen.table,
  },
  {
    id: 'home', requires: ['table'], title: '安家', icon: shelter,
    hint: ['建立', shelter, '，或找到', village, '安顿下来。'],
    complete: (s) => s.homeId !== null,
  },
  {
    id: 'stone-age', requires: ['table'], title: '石器时代', icon: stonePick,
    hint: ['用', woodPick, '从森林或丘陵取得', cobble, '，再制作', stonePick, '。'],
    complete: (s) => PICKS.slice(1).some((id) => s.seen[id]),
  },
  {
    id: 'iron-pick', requires: ['stone-age'], title: '获得升级', icon: ironPick,
    hint: ['用', stonePick, '开采', ironOre, '。合成', furnace, '、添加燃料，熔出 3 块', iron, '制作', ironPick, '。'],
    complete: (s) => PICKS.slice(2).some((id) => s.seen[id]),
  },
  {
    id: 'diamond-pick', requires: ['iron-pick'], title: '钻石！', icon: diamond,
    hint: ['探索', cave, '附近的浅层矿脉，循线索前往废弃矿井。用', ironPick, '开采', diamond, '，再做一把', diamondPick, '。'],
    complete: (s) => PICKS.slice(3).some((id) => s.seen[id]),
  },
  {
    id: 'nether', requires: ['iron-pick'], title: '勇往直下', icon: netherPortal,
    hint: ['在主世界用水冷却岩浆源，选择「就地浇筑一块门框」。也可用', diamondPick, '采走', obsidian, '，从背包补齐余下部分。新门框共需 10 块，废弃门框补 4 块。用', item('flint_and_steel', 'equipment'), '点燃', netherPortal, '并进入下界。'],
    complete: (s) => !!s.flags.enteredNether || !!s.flags.altar,
  },
  {
    id: 'stronghold', requires: ['nether'], title: '跟随末影之眼', icon: eye,
    hint: ['前往', fortress, '和', warpedForest, '，收集', blazeRod, '和', pearl, '。合成 3 只', eye, '后，回到', overworld, '从采集页投掷。'],
    complete: (s) => !!s.flags.altar,
  },
  {
    id: 'end-portal', requires: ['stronghold'], title: '末地传送门', icon: endPortal,
    hint: ['从地图页前往', stronghold, '，在采集页嵌入 12 只', eye, '。'],
    complete: (s) => !!s.flags.portal,
  },
  {
    id: 'dragon', requires: ['end-portal'], title: '解放末地', icon: dragon,
    hint: ['带上', armor, '、', shield, '与', food, '。若要备药，可在酿造台用闪烁的西瓜片把粗制的药水酿成', item('potion', 'special'), '。进入', end, '后先击碎 3 座', crystal, '，再攻击', dragon, '。'],
    complete: (s) => !!s.flags.won,
  },
]

export const PROJECTS: Milestone[] = [
  { id: 'joined-village', title: '村里的新邻居', icon: village, hint: ['到访村庄，在村庄页选择「在此定居」。'], available: (s) => !s.village?.founded, complete: (s) => !!s.flags.joinedVillage },
  { id: 'invited-resident', title: '第一位住民', icon: villager, hint: ['安顿好后，为结识的旅人准备住房和口粮。'], available: (s) => !s.village || s.village.founded, complete: (s) => !!s.flags.invitedVillager },
  {
    id: 'first-job', requires: ['home'], title: '村庄的第一班岗', icon: villager, hint: ['安排一位', villager, '工作，并等到首次产出。'],
    complete: (s) => !!s.flags.firstJobOutput,
  },
  {
    id: 'raid', requires: ['home'], title: '有备而来', icon: watchtower, hint: ['造起', watchtower, '，安排', guard, '后在村庄概况敲钟迎击袭击。'],
    complete: (s) => !!s.expeditions.raid,
  },
  {
    id: 'automation', title: '启用产线', icon: workshop, hint: ['已在旧存档中启用过产线。'],
    available: (s) => !!s.flags.legacyAutomation,
    complete: (s) => !!s.flags.legacyAutomation,
  },
  {
    id: 'first-line-output', requires: ['first-job'], title: '自动化时代', icon: workshop,
    hint: ['在', workshop, '启用一条产线，并在仓库备好原料。'],
    complete: (s) => !!s.flags.lineOutput,
  },
  {
    id: 'mayor', requires: ['home'], title: '你就是村长', icon: mayor, hint: ['把人口发展到 8 人，并累积 60 声望。'],
    complete: (s) => !!s.village?.mayor,
  },
  {
    id: 'beacon', requires: ['nether'], title: '信标工程', icon: beacon,
    hint: ['击败', wither, '取得', netherStar, '，再收集', glass, '、', obsidian, '搭建信标本体，用 9 个铁块铺设基座，点亮', beacon, '。'],
    complete: (s) => !!s.village?.buildings.beacon,
  },
  {
    id: 'end-city', requires: ['dragon'], title: '在游戏尽头的城市', icon: endShip, hint: ['战胜', dragon, '后，在村庄的远征页选择「搜寻末地船」。首次完成可带回', elytra, '。'],
    complete: (s) => !!s.expeditions.city,
  },
  {
    id: 'end-flight', requires: ['dragon'], title: '越过虚空', icon: elytra, hint: ['携带首次搜寻末地船所得的', elytra, '，回到村庄组织「飞往远端群岛」远征。'],
    complete: (s) => !!s.expeditions.flight,
  },
  {
    id: 'monument', requires: ['mayor', 'beacon', 'end-flight'], title: '方块纪元', icon: monument, hint: [...monumentRequirements, '，再建成', monument, '。'],
    complete: (s) => !!s.village?.buildings.monument,
  },
  {
    id: 'shulker-store', requires: ['dragon'], title: '潜影仓库', icon: shulkerStore, hint: ['把远征所得的', shell, '用于扩建', shulkerStore, '。'],
    complete: (s) => !!s.village?.buildings.shulker_store,
  },
]

const spyglass = item('spyglass', 'equipment')
const brush = item('brush', 'equipment')
const pot = item('pot', 'special')
const apiary = building('apiary')
const honeycomb = item('honeycomb', 'material')
const campfire = item('campfire', 'equipment')
const shears = item('shears', 'equipment')
const ruin = place('desert_ruin')
const trial = place('trial_chamber')
const breeze = mob('breeze')
const trialKey = item('trial_key', 'special')
const ominousBottle = item('ominous_bottle', 'special')
const mace = item('mace', 'equipment')
const windCharge = item('wind_charge', 'special')
const echoShard = item('echo_shard', 'special')
const city = place('ancient_city')
const compass = item('recovery_compass', 'equipment')
const treasureMap = item('treasure_map', 'special')
const heart = item('heart_of_sea', 'special')
const shellNautilus = item('nautilus', 'special')
const conduit = item('conduit', 'equipment')
const snifferEgg = item('sniffer_egg', 'special')
const torchflower = item('torchflower_seed', 'material')
const wasteland = place('nether_wastes')
const bastion = place('bastion')
const debris = item('ancient_debris', 'special')
const netherite = item('netherite_ingot', 'special')
const smithing = item('smithing_table', 'equipment')
const endCrystal = item('end_crystal', 'special')
const enderChest = item('ender_chest', 'equipment')
const endStore = building('end_store')

export const EXPLORATION: Milestone[] = [
  { id: 'followed-lead', title: '循着线索', icon: forest, hint: ['在地图选择一条当地线索并远行。'], complete: (s) => !!s.flags.followedLead },
  { id: 'return-to-mark', title: '重返旧地', icon: item('map', 'equipment'), hint: ['用地图标记地点，离开后再回来。'], complete: (s) => !!s.flags.returnedToMark },
  { id: 'local-supplies', title: '就地取材', icon: item('chest', 'material'), hint: ['使用箱子或仓库材料完成一次制作或建造。'], complete: (s) => !!s.flags.usedLocalStock },
  { id: 'creeper', title: '嘶声过后', icon: mob('creeper'), hint: ['应对一次苦力怕的遭遇。'], complete: (s) => !!s.flags.defeatedCreeper },
  {
    id: 'apiary', requires: ['home'], title: '蜂巢下的烟火', icon: apiary,
    hint: ['带上', campfire, '与', shears, '，到白桦森林或平原采', honeycomb, '，再建起', apiary, '。'],
    complete: (s) => !!s.village?.buildings.apiary,
  },
  {
    id: 'pottery', requires: ['table'], title: '古陶复原', icon: pot,
    hint: ['制作', brush, '，在', ruin, '和暖水海底废墟收集陶片，再制作', pot, '。'],
    complete: (s) => !!s.seen.pot,
  },
  {
    id: 'trial-chamber', title: '远望地下', icon: spyglass, available: (s) => !!s.leads.copper,
    hint: ['探索洞穴时寻找铜与凝灰岩线索，或用', spyglass, '协助寻找', trial, '。'],
    complete: (s) => !!s.flags.trialVisited || !!s.flags.trialVault ||
      Object.values(s.locs).some((loc) => loc.biome === 'trial_chamber'),
  },
  {
    id: 'trial-vault', requires: ['trial-chamber'], title: '珍藏密敛', icon: trialKey,
    hint: ['在', trial, '挑战', breeze, '，用获得的', trialKey, '开启宝库。'],
    complete: (s) => !!s.flags.trialVault,
  },
  {
    id: 'mace', requires: ['trial-vault'], title: '天赐良击', icon: mace,
    hint: ['用', ominousBottle, '开启强化试炼，取出沉重核心，合成', mace, '并在战斗中配合', windCharge, '使用。'],
    complete: (s) => !!s.flags.maceLeap,
  },
  {
    id: 'recovery-compass', requires: ['diamond-pick'], title: '故地重寻', icon: compass, available: (s) => !!s.leads.sculk || !!s.seenPlaces.ancient_city,
    hint: ['用羊毛在', city, '潜行搜寻', echoShard, '，制作', compass, '。'],
    complete: (s) => !!s.seen.recovery_compass,
  },
  {
    id: 'heart-of-sea', title: '海洋之心', icon: heart,
    hint: ['从海岸沉船或村庄远征获得', treasureMap, '，再找到', heart, '。'],
    complete: (s) => !!s.expeditions.buried_treasure || !!s.seen.heart_of_sea,
  },
  {
    id: 'conduit', requires: ['heart-of-sea'], title: '潮涌能量', icon: conduit,
    hint: ['用', heart, '和 8 个', shellNautilus, '制作', conduit, '，再完成一次海底神殿远征。'],
    complete: (s) => !!s.seen.conduit && !!s.expeditions.ocean_monument,
  },
  {
    id: 'sniffer', requires: ['home'], title: '播种过往', icon: torchflower, available: (s) => !!s.flags.foundWarmRuins || !!s.seen.sniffer_egg,
    hint: ['考察暖水海底废墟，带回并孵化', snifferEgg, '，然后在营地种下', torchflower, '。'],
    complete: (s) => !!s.seen.torchflower,
  },
  {
    id: 'netherite', requires: ['nether'], title: '残骸裹身', icon: netherite,
    hint: ['在', wasteland, '采', debris, '，前往', bastion, '取得模板，再用', smithing, '升级钻石胸甲。'],
    complete: (s) => !!s.seen.armor_netherite,
  },
  {
    id: 'end-supply', requires: ['end-flight'], title: '末地补给线', icon: enderChest,
    hint: ['制作', enderChest, '，绘制紫颂林地图，并建成', endStore, '。'],
    complete: (s) => !!s.expeditions.chorus_grove && !!s.village?.buildings.end_store,
  },
  {
    id: 'dragon-again', requires: ['dragon'], title: '结束了……再一次', icon: dragon,
    hint: ['在要塞传送门房间使用 4 座', endCrystal, '，复活并再次击败', dragon, '。'],
    complete: (s) => !!s.flags.dragonAgain,
  },
]

const achievements = [...STORY, ...PROJECTS, ...EXPLORATION]
const achievementsById = new Map(achievements.map((entry) => [entry.id, entry]))

export const achievementVisible = (entry: Milestone, state: GameState) => entry.complete(state) || (entry.available?.(state) ?? true)

export const getAchievement = (id: string) => achievementsById.get(id)
export const TUTORIAL = STORY.filter(({ id }) => ['wood', 'table', 'cook-food', 'nearby-discovery', 'stone-age', 'home'].includes(id))

export function getCompletedAchievements(state: GameState) {
  // Evaluate each prerequisite before its dependent achievements.
  const completed = new Set<string>()
  for (const entry of achievements) {
    if (entry.requires?.some((id) => !completed.has(id))) continue
    if (entry.complete(state)) completed.add(entry.id)
  }
  return completed
}
