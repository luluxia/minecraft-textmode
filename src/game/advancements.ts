import { BIOMES, BUILDING_MAP, ITEMS, JOB_MAP, MOBS } from './data'
import type { GameState } from './store'

type GoalTone = 'material' | 'equipment' | 'place' | 'danger' | 'project' | 'special'

export interface GoalTerm {
  name: string
  icon: string
  tone: GoalTone
}

export type GoalHint = readonly (string | GoalTerm)[]

interface Goal {
  title: string
  icon: GoalTerm
  hint: GoalHint
}

interface Milestone extends Goal {
  complete: (state: GameState) => boolean
}

const item = (id: string, tone: GoalTone, name = ITEMS[id].name): GoalTerm => ({
  name, icon: ITEMS[id].icon, tone,
})
const building = (id: string): GoalTerm => ({
  name: BUILDING_MAP[id].name, icon: BUILDING_MAP[id].icon, tone: 'project',
})
const place = (id: string, name = BIOMES[id].name): GoalTerm => ({
  name, icon: BIOMES[id].icon, tone: 'place',
})
const mob = (id: string): GoalTerm => ({ name: MOBS[id].name, icon: MOBS[id].icon, tone: 'danger' })

const wood = item('wood', 'material')
const plank = item('plank', 'material', '木板')
const stick = item('stick', 'material')
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
const torch = item('torch', 'equipment')
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

export const MONUMENT_GOAL: Goal = {
  title: '方块纪元纪念碑', icon: monument,
  hint: [dragon, '已被击败。', ...monumentRequirements, '，即可建造。'],
}

export const COMPLETED_MONUMENT: Goal = {
  title: '方块纪元纪念碑已落成', icon: monument, hint: ['村庄产出额外提高 25%。'],
}

export const STORY: Milestone[] = [
  { title: '徒手伐木', icon: wood, hint: ['收集', wood, '。'], complete: (s) => !!s.seen.wood },
  {
    title: '工作台', icon: table, hint: ['在制造页把', wood, '做成', plank, '，再用 4 块木板合成', table, '。'],
    complete: (s) => !!s.seen.table,
  },
  {
    title: '石器时代', icon: stonePick,
    hint: ['用', plank, '和', stick, '做一把', woodPick, '，在', forest, '挖', cobble, '，换上', stonePick, '。'],
    complete: (s) => !!s.seen.pick_stone || !!s.seen.pick_iron || !!s.seen.pick_diamond,
  },
  {
    title: '安家', icon: shelter,
    hint: ['在生存页建立', shelter, '，也可以从地图页寻找', village, '，再到生存页定居。'],
    complete: (s) => s.homeId !== null,
  },
  {
    title: '获得升级', icon: ironPick,
    hint: ['用', stonePick, '开采', ironOre, '。合成', furnace, '、添加燃料，熔出 3 块', iron, '制作', ironPick, '。'],
    complete: (s) => !!s.seen.pick_iron || !!s.seen.pick_diamond,
  },
  {
    title: '钻石！', icon: diamond,
    hint: ['勘察', cave, '，用', ironPick, '开采', diamond, '，再做一把', diamondPick, '。', torch, '可以降低遇敌概率并补充矿脉。'],
    complete: (s) => !!s.seen.pick_diamond,
  },
  {
    title: '勇往直下', icon: netherPortal,
    hint: ['用', diamondPick, '开采', obsidian, '，回家在维度页用 10 块黑曜石和 1 块', iron, '搭建', netherPortal, '。'],
    complete: (s) => !!s.flags.nether || !!s.flags.altar,
  },
  {
    title: '跟随末影之眼', icon: eye,
    hint: ['前往', fortress, '和', warpedForest, '，收集', blazeRod, '和', pearl, '。合成 3 只', eye, '后，回到', overworld, '从维度页投掷。'],
    complete: (s) => !!s.flags.altar,
  },
  {
    title: '末地传送门', icon: endPortal,
    hint: ['从地图页前往', stronghold, '，在维度页嵌入 12 只', eye, '。'],
    complete: (s) => !!s.flags.portal,
  },
  {
    title: '解放末地', icon: dragon,
    hint: ['带上', armor, '、', shield, '与', food, '。进入', end, '后先击碎 3 座', crystal, '，再攻击', dragon, '。'],
    complete: (s) => !!s.flags.won,
  },
]

export const PROJECTS: Milestone[] = [
  {
    title: '村庄的第一班岗', icon: villager, hint: ['在村庄页为一位', villager, '安排工作。'],
    complete: (s) => !!s.flags.firstJob || Object.values(s.village?.jobs ?? {}).some((n) => n > 0),
  },
  {
    title: '有备而来', icon: watchtower, hint: ['造起', watchtower, '，安排', guard, '后在村庄概况敲钟迎击袭击。'],
    complete: (s) => !!s.expeditions.raid,
  },
  {
    title: '自动化时代', icon: workshop, hint: ['建造', workshop, '，启用任意一条产线。'],
    complete: (s) => !!s.flags.automation,
  },
  {
    title: '你就是村长', icon: mayor, hint: ['把人口发展到 8 人，并累积 60 声望。'],
    complete: (s) => !!s.village?.mayor,
  },
  {
    title: '信标工程', icon: beacon,
    hint: ['击败', wither, '取得', netherStar, '，再收集', glass, '、', obsidian, '和', iron, '点亮', beacon, '。'],
    complete: (s) => !!s.village?.buildings.beacon,
  },
  {
    title: '在游戏尽头的城市', icon: endShip, hint: ['战胜', dragon, '后，在村庄组织一次', endShip, '。'],
    complete: (s) => !!s.expeditions.city,
  },
  {
    title: '越过虚空', icon: elytra, hint: ['用', shell, '制作', elytra, '，并完成一次', outerIslands, '。'],
    complete: (s) => !!s.expeditions.flight,
  },
  {
    title: '方块纪元', icon: monument, hint: [...monumentRequirements, '，再建成', monument, '。'],
    complete: (s) => !!s.village?.buildings.monument,
  },
  {
    title: '潜影仓库', icon: shulkerStore, hint: ['把远征所得的', shell, '用于扩建', shulkerStore, '。'],
    complete: (s) => !!s.village?.buildings.shulker_store,
  },
]

const spyglass = item('spyglass', 'equipment')
const copper = item('copper', 'material')
const amethyst = item('amethyst', 'special')
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
const boat = item('boat', 'equipment')
const treasureMap = item('treasure_map', 'special')
const heart = item('heart_of_sea', 'special')
const shellNautilus = item('nautilus', 'special')
const conduit = item('conduit', 'equipment')
const snifferEgg = item('sniffer_egg', 'special')
const torchflower = item('torchflower', 'material')
const wasteland = place('nether_wastes')
const bastion = place('bastion')
const debris = item('ancient_debris', 'special')
const netherite = item('netherite_ingot', 'special')
const smithing = item('smithing_table', 'equipment')
const endCrystal = item('end_crystal', 'special')
const enderChest = item('ender_chest', 'equipment')
const endStore = building('end_store')

export const EXPLORATION: Milestone[] = [
  {
    title: '蜂巢下的烟火', icon: apiary,
    hint: ['带上', campfire, '与', shears, '，到白桦森林或平原采', honeycomb, '，再建起', apiary, '。'],
    complete: (s) => !!s.village?.buildings.apiary,
  },
  {
    title: '古陶复原', icon: pot,
    hint: ['制作', brush, '，在', ruin, '和暖水海底废墟收集陶片，再制作', pot, '。'],
    complete: (s) => !!s.seen.pot,
  },
  {
    title: '远望地下', icon: spyglass,
    hint: ['熔出', copper, '，采收', amethyst, '，合成', spyglass, '，用铁镐勘察', trial, '。'],
    complete: (s) => Object.values(s.locs).some((loc) => loc.biome === 'trial_chamber') || !!s.flags.trialVault,
  },
  {
    title: '珍藏密敛', icon: trialKey,
    hint: ['在', trial, '挑战', breeze, '，用获得的', trialKey, '开启宝库。'],
    complete: (s) => !!s.flags.trialVault,
  },
  {
    title: '天赐良击', icon: mace,
    hint: ['用', ominousBottle, '开启强化试炼，取出沉重核心，合成', mace, '并在战斗中配合', windCharge, '使用。'],
    complete: (s) => !!s.flags.maceLeap,
  },
  {
    title: '故地重寻', icon: compass,
    hint: ['用羊毛在', city, '潜行搜寻', echoShard, '，制作', compass, '。'],
    complete: (s) => !!s.seen.recovery_compass,
  },
  {
    title: '海洋之心', icon: heart,
    hint: ['造一艘', boat, '，在村庄派队打捞沉船，再凭', treasureMap, '找到', heart, '。'],
    complete: (s) => !!s.seen.heart_of_sea,
  },
  {
    title: '潮涌能量', icon: conduit,
    hint: ['用', heart, '和 8 个', shellNautilus, '制作', conduit, '，再完成一次海底神殿远征。'],
    complete: (s) => !!s.seen.conduit && !!s.expeditions.ocean_monument,
  },
  {
    title: '播种过往', icon: torchflower,
    hint: ['考察暖水海底废墟，带回并孵化', snifferEgg, '，然后在营地种下', torchflower, '。'],
    complete: (s) => !!s.seen.torchflower,
  },
  {
    title: '残骸裹身', icon: netherite,
    hint: ['在', wasteland, '采', debris, '，前往', bastion, '取得模板，再用', smithing, '升级钻石胸甲。'],
    complete: (s) => !!s.seen.armor_netherite,
  },
  {
    title: '末地补给线', icon: enderChest,
    hint: ['制作', enderChest, '，绘制紫颂林地图，并建成', endStore, '。'],
    complete: (s) => !!s.expeditions.chorus_grove && !!s.village?.buildings.end_store,
  },
  {
    title: '结束了……再一次', icon: dragon,
    hint: ['在要塞传送门房间使用 4 座', endCrystal, '，复活并再次击败', dragon, '。'],
    complete: (s) => !!s.flags.dragonAgain,
  },
]
