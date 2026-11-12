// 静态游戏数据：物品、配方、地形、生物、建筑、职业、交易
export type Cat = 'material' | 'food' | 'tool' | 'gear' | 'special'
export type Bag = Record<string, number>

export const ITEM_CATEGORIES = [
  ['material', '材料'], ['food', '食物'], ['special', '奇物'], ['tool', '工具'], ['gear', '装备'],
] as const satisfies readonly (readonly [Cat, string])[]

export interface ItemDef {
  id: string
  name: string
  icon: string
  cat: Cat
  food?: number
  desc?: string
}

const it = (id: string, name: string, icon: string, cat: Cat, extra: Partial<ItemDef> = {}): ItemDef => ({
  id, name, icon, cat, ...extra,
})

export const ITEM_LIST: ItemDef[] = [
  it('wood', '橡木原木', '/textures/minecraft/oak_log.png', 'material'),
  it('plank', '橡木木板', '/textures/minecraft/oak_planks.png', 'material'),
  it('stick', '木棍', '/textures/minecraft/stick.png', 'material'),
  it('grass', '矮草', '/textures/minecraft/short_grass.png', 'material'),
  it('seed', '小麦种子', '/textures/minecraft/wheat_seeds.png', 'material'),
  it('wheat', '小麦', '/textures/minecraft/wheat.png', 'material'),
  it('cobble', '圆石', '/textures/minecraft/cobblestone.png', 'material'),
  it('coal', '煤炭', '/textures/minecraft/coal.png', 'material'),
  it('iron_ore', '粗铁', '/textures/minecraft/raw_iron.png', 'material'),
  it('iron', '铁锭', '/textures/minecraft/iron_ingot.png', 'material'),
  it('gold_ore', '粗金', '/textures/minecraft/raw_gold.png', 'material'),
  it('gold', '金锭', '/textures/minecraft/gold_ingot.png', 'material'),
  it('redstone', '红石粉', '/textures/minecraft/redstone.png', 'material'),
  it('lapis', '青金石', '/textures/minecraft/lapis_lazuli.png', 'material'),
  it('diamond', '钻石', '/textures/minecraft/diamond.png', 'material'),
  it('emerald', '绿宝石', '/textures/minecraft/emerald.png', 'material', { desc: '村民通用的货币' }),
  it('obsidian', '黑曜石', '/textures/minecraft/obsidian.png', 'material'),
  it('sand', '沙子', '/textures/minecraft/sand.png', 'material'),
  it('glass', '玻璃', '/textures/minecraft/glass.png', 'material'),
  it('cane', '甘蔗', '/textures/minecraft/sugar_cane.png', 'material'),
  it('paper', '纸', '/textures/minecraft/paper.png', 'material'),
  it('book', '书', '/textures/minecraft/book.png', 'material'),
  it('leather', '皮革', '/textures/minecraft/leather.png', 'material'),
  it('wool', '白色羊毛', '/textures/minecraft/white_wool.png', 'material'),
  it('string', '线', '/textures/minecraft/string.png', 'material'),
  it('bone', '骨头', '/textures/minecraft/bone.png', 'material'),
  it('torch', '火把', '/textures/minecraft/torch.png', 'material', { desc: '持有时显著降低夜间与洞穴的遇敌概率，也用于开拓新矿层' }),
  it('pearl', '末影珍珠', '/textures/minecraft/ender_pearl.png', 'special'),
  it('blaze_rod', '烈焰棒', '/textures/minecraft/blaze_rod.png', 'special'),
  it('blaze_powder', '烈焰粉', '/textures/minecraft/blaze_powder.png', 'special'),
  it('eye', '末影之眼', '/textures/minecraft/ender_eye.png', 'special', { desc: '它会指引你前往要塞传送门房间' }),

  it('campfire', '营火', '/textures/minecraft/campfire.png', 'tool', { desc: '使庇护所成为可以做饭和休整的营地' }),
  it('dragon_egg', '龙蛋', '/textures/minecraft/dragon_egg.png', 'special'),
  it('wither_skull', '凋灵骷髅头颅', '/textures/minecraft/wither_skeleton_skull.png', 'special'),
  it('nether_star', '下界之星', '/textures/minecraft/nether_star.png', 'special'),
  it('shulker_shell', '潜影壳', '/textures/minecraft/shulker_shell.png', 'special'),
  it('soul_sand', '灵魂沙', '/textures/minecraft/soul_sand.png', 'material'),
  it('nether_wart', '下界疣', '/textures/minecraft/nether_wart.png', 'material'),
  it('potion', '治疗药水', '/textures/minecraft/healing_potion.png', 'food', { desc: '在战斗内外回复 8 点生命' }),
  it('brewing_stand', '酿造台', '/textures/minecraft/brewing_stand.png', 'tool', { desc: '用烈焰粉、下界疣和金锭酿造治疗药水' }),
  it('elytra', '鞘翅', '/textures/minecraft/elytra.png', 'tool', { desc: '缩短移动冷却，解锁远端岛屿航线' }),

  it('charcoal', '木炭', '/textures/minecraft/charcoal.png', 'material'),
  it('porkchop', '生猪排', '/textures/minecraft/porkchop.png', 'food', { food: 3 }),
  it('cooked_porkchop', '熟猪排', '/textures/minecraft/cooked_porkchop.png', 'food', { food: 8 }),
  it('mutton', '生羊肉', '/textures/minecraft/mutton.png', 'food', { food: 2 }),
  it('cooked_mutton', '熟羊肉', '/textures/minecraft/cooked_mutton.png', 'food', { food: 6 }),
  it('apple', '苹果', '/textures/minecraft/apple.png', 'food', { food: 4 }),
  it('bread', '面包', '/textures/minecraft/bread.png', 'food', { food: 5 }),
  it('fish', '生鳕鱼', '/textures/minecraft/cod.png', 'food', { food: 2 }),
  it('cooked_fish', '熟鳕鱼', '/textures/minecraft/cooked_cod.png', 'food', { food: 5 }),
  it('meat', '生牛肉', '/textures/minecraft/beef.png', 'food', { food: 3 }),
  it('steak', '牛排', '/textures/minecraft/cooked_beef.png', 'food', { food: 8 }),
  it('rotten', '腐肉', '/textures/minecraft/rotten_flesh.png', 'food', { food: 2, desc: '吃下去可能会不舒服' }),

  it('table', '工作台', '/textures/minecraft/crafting_table.png', 'tool', { desc: '解锁更多合成配方' }),
  it('furnace', '熔炉', '/textures/minecraft/furnace.png', 'tool', { desc: '解锁熔炼' }),
  it('pick_wood', '木镐', '/textures/minecraft/wooden_pickaxe.png', 'tool'),
  it('pick_stone', '石镐', '/textures/minecraft/stone_pickaxe.png', 'tool'),
  it('pick_iron', '铁镐', '/textures/minecraft/iron_pickaxe.png', 'tool'),
  it('pick_diamond', '钻石镐', '/textures/minecraft/diamond_pickaxe.png', 'tool'),
  it('axe_stone', '石斧', '/textures/minecraft/stone_axe.png', 'tool', { desc: '伐木更快' }),
  it('axe_iron', '铁斧', '/textures/minecraft/iron_axe.png', 'tool', { desc: '伐木更快' }),
  it('rod', '钓鱼竿', '/textures/minecraft/fishing_rod.png', 'tool'),
  it('bucket', '铁桶', '/textures/minecraft/bucket.png', 'tool'),
  it('bed', '白色床', '/textures/minecraft/white_bed.png', 'tool', { desc: '在庇护所中度过夜晚' }),
  it('map', '地图', '/textures/minecraft/filled_map.png', 'tool'),
  it('compass', '指南针', '/textures/minecraft/compass_00.png', 'tool'),
  it('enchant_table', '附魔台', '/textures/minecraft/enchanting_table.png', 'tool'),
  it('sword_wood', '木剑', '/textures/minecraft/wooden_sword.png', 'gear'),
  it('sword_stone', '石剑', '/textures/minecraft/stone_sword.png', 'gear'),
  it('sword_iron', '铁剑', '/textures/minecraft/iron_sword.png', 'gear'),
  it('sword_diamond', '钻石剑', '/textures/minecraft/diamond_sword.png', 'gear'),
  it('armor_leather', '皮革外套', '/textures/minecraft/leather_chestplate.png', 'gear'),
  it('armor_iron', '铁胸甲', '/textures/minecraft/iron_chestplate.png', 'gear'),
  it('armor_diamond', '钻石胸甲', '/textures/minecraft/diamond_chestplate.png', 'gear'),
  it('shield', '盾牌', '/textures/minecraft/shield.png', 'gear'),
]
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]))

export const PICKS = ['pick_wood', 'pick_stone', 'pick_iron', 'pick_diamond']
export const PICK_NAMES = ['', '木镐', '石镐', '铁镐', '钻石镐']
export const SWORDS: [string, number][] = [
  ['sword_diamond', 7], ['sword_iron', 5], ['sword_stone', 3], ['sword_wood', 2],
]
export const ARMORS: [string, number][] = [
  ['armor_diamond', 5], ['armor_iron', 3], ['armor_leather', 1],
]

// ---------- 合成 ----------
export interface Recipe {
  id: string
  out: string
  n: number
  cost: Bag
  station: 'hand' | 'table' | 'brewing'
}
const rc = (out: string, n: number, cost: Bag, station: 'hand' | 'table' = 'table'): Recipe => ({
  id: out, out, n, cost, station,
})
export const RECIPES: Recipe[] = [
  rc('plank', 4, { wood: 1 }, 'hand'),
  rc('campfire', 1, { wood: 3, stick: 3, coal: 1 }, 'hand'),
  { id: 'campfire_charcoal', out: 'campfire', n: 1, cost: { wood: 3, stick: 3, charcoal: 1 }, station: 'hand' },
  rc('stick', 4, { plank: 2 }, 'hand'),
  rc('table', 1, { plank: 4 }, 'hand'),
  rc('pick_wood', 1, { plank: 3, stick: 2 }),
  rc('sword_wood', 1, { plank: 2, stick: 1 }),
  rc('pick_stone', 1, { cobble: 3, stick: 2 }),
  rc('axe_stone', 1, { cobble: 3, stick: 2 }),
  rc('sword_stone', 1, { cobble: 2, stick: 1 }),
  rc('furnace', 1, { cobble: 8 }),
  rc('torch', 4, { coal: 1, stick: 1 }),
  { id: 'torch_charcoal', out: 'torch', n: 4, cost: { charcoal: 1, stick: 1 }, station: 'table' },
  rc('bread', 1, { wheat: 3 }),
  rc('rod', 1, { stick: 3, string: 2 }),
  rc('bed', 1, { wool: 3, plank: 3 }),
  rc('armor_leather', 1, { leather: 8 }),
  rc('pick_iron', 1, { iron: 3, stick: 2 }),
  rc('axe_iron', 1, { iron: 3, stick: 2 }),
  rc('sword_iron', 1, { iron: 2, stick: 1 }),
  rc('shield', 1, { iron: 1, plank: 6 }),
  rc('bucket', 1, { iron: 3 }),
  rc('armor_iron', 1, { iron: 8 }),
  rc('paper', 3, { cane: 3 }),
  rc('map', 1, { paper: 8, compass: 1 }),
  rc('compass', 1, { iron: 4, redstone: 1 }),
  rc('book', 1, { paper: 3, leather: 1 }),
  rc('pick_diamond', 1, { diamond: 3, stick: 2 }),
  rc('sword_diamond', 1, { diamond: 2, stick: 1 }),
  rc('armor_diamond', 1, { diamond: 8 }),
  rc('enchant_table', 1, { book: 1, diamond: 2, obsidian: 4 }),
  rc('blaze_powder', 2, { blaze_rod: 1 }),
  rc('eye', 1, { pearl: 1, blaze_powder: 1 }),
  rc('brewing_stand', 1, { blaze_rod: 1, cobble: 3 }),
  { id: 'potion', out: 'potion', n: 3, cost: { nether_wart: 1, blaze_powder: 1, glass: 3, gold: 1 }, station: 'brewing' },
  rc('elytra', 1, { shulker_shell: 12, string: 8, leather: 4 }),
]

// ---------- 熔炼 ----------
export interface Smelt { id: string; from: string; out: string; time: number }
export const SMELTS: Smelt[] = [
  { id: 'cooked_porkchop', from: 'porkchop', out: 'cooked_porkchop', time: 3 },
  { id: 'cooked_mutton', from: 'mutton', out: 'cooked_mutton', time: 3 },
  { id: 'iron', from: 'iron_ore', out: 'iron', time: 5 },
  { id: 'gold', from: 'gold_ore', out: 'gold', time: 5 },
  { id: 'glass', from: 'sand', out: 'glass', time: 4 },
  { id: 'coal', from: 'wood', out: 'charcoal', time: 4 },
  { id: 'cooked_fish', from: 'fish', out: 'cooked_fish', time: 3 },
  { id: 'steak', from: 'meat', out: 'steak', time: 3 },
]
export const FUELS: Record<string, number> = { plank: 1, wood: 2, coal: 8, charcoal: 8, blaze_rod: 12 }

// ---------- 附魔 ----------
export interface EnchDef { id: string; name: string; desc: string; max: number }
export const ENCHANTS: EnchDef[] = [
  { id: 'sharp', name: '锋利', desc: '每级攻击 +1', max: 5 },
  { id: 'prot', name: '保护', desc: '每级防御 +1', max: 4 },
  { id: 'eff', name: '效率', desc: '每级行动冷却 -8%', max: 5 },
  { id: 'fortune', name: '时运', desc: '每级 12% 概率双倍掉落', max: 3 },
]

// ---------- 行动 ----------
export interface Drop { item: string; min: number; max: number; p?: number }
export interface ActionDef {
  id: string
  name: string
  kind: 'gather' | 'mine' | 'fish' | 'hunt'
  cd: number
  hunger: number
  pick?: number
  tool?: string
  finite?: string
  mob?: string
  drops?: Drop[]
  xp?: number
  text?: string
}
const d = (item: string, min: number, max: number, p = 1): Drop => ({ item, min, max, p })
const ACTION_LIST: ActionDef[] = [
  { id: 'chop', name: '撸树', kind: 'gather', cd: 2, hunger: 0.18, drops: [d('wood', 2, 3), d('stick', 1, 2, 0.2), d('apple', 1, 1, 0.1)], text: '树干在拳头下碎裂。' },
  { id: 'grass', name: '撸草', kind: 'gather', cd: 2, hunger: 0.1, drops: [d('grass', 1, 2), d('seed', 1, 2), d('wheat', 1, 1, 0.08)], text: '草丛沙沙作响。' },
  { id: 'forage', name: '采集野果', kind: 'gather', cd: 4, hunger: 0.1, drops: [d('apple', 1, 2), d('seed', 1, 1, 0.3)], text: '你在灌木间翻找。' },
  { id: 'gather_wheat', name: '采集小麦', kind: 'gather', cd: 4, hunger: 0.15, finite: 'wheat', drops: [d('wheat', 2, 4), d('seed', 1, 2, 0.5)], text: '金黄的麦穗落入手中。' },
  { id: 'gather_cane', name: '采集甘蔗', kind: 'gather', cd: 3, hunger: 0.15, drops: [d('cane', 1, 3)], text: '水边的甘蔗被齐根折断。' },
  { id: 'dig_sand', name: '挖掘沙子', kind: 'gather', cd: 3, hunger: 0.2, drops: [d('sand', 1, 3)], text: '沙子从指缝间流下。' },
  { id: 'fish', name: '钓鱼', kind: 'fish', cd: 6, hunger: 0.1, tool: 'rod', drops: [d('fish', 1, 1, 0.7), d('string', 1, 1, 0.12), d('leather', 1, 1, 0.06), d('bone', 1, 1, 0.06)], xp: 1, text: '浮标沉了一下。' },
  { id: 'mine_stone', name: '挖掘石头', kind: 'mine', cd: 3, hunger: 0.3, pick: 1, drops: [d('cobble', 2, 3), d('coal', 1, 1, 0.25)], text: '镐尖凿开岩层。' },
  { id: 'mine_coal', name: '挖掘煤矿', kind: 'mine', cd: 4, hunger: 0.3, pick: 1, finite: 'coal', drops: [d('coal', 1, 3)], xp: 1 },
  { id: 'mine_iron', name: '挖掘铁矿', kind: 'mine', cd: 5, hunger: 0.35, pick: 2, finite: 'iron', drops: [d('iron_ore', 1, 2)], xp: 1 },
  { id: 'mine_lapis', name: '挖掘青金石', kind: 'mine', cd: 5, hunger: 0.35, pick: 2, finite: 'lapis', drops: [d('lapis', 2, 4)], xp: 2 },
  { id: 'mine_gold', name: '挖掘金矿', kind: 'mine', cd: 6, hunger: 0.35, pick: 3, finite: 'gold', drops: [d('gold_ore', 1, 2)], xp: 2 },
  { id: 'mine_redstone', name: '挖掘红石', kind: 'mine', cd: 6, hunger: 0.35, pick: 3, finite: 'redstone', drops: [d('redstone', 2, 4)], xp: 2 },
  { id: 'mine_emerald', name: '挖掘绿宝石', kind: 'mine', cd: 7, hunger: 0.4, pick: 3, finite: 'emerald', drops: [d('emerald', 1, 1)], xp: 4 },
  { id: 'mine_diamond', name: '挖掘钻石', kind: 'mine', cd: 8, hunger: 0.4, pick: 3, finite: 'diamond', drops: [d('diamond', 1, 2)], xp: 5 },
  { id: 'mine_obsidian', name: '挖掘黑曜石', kind: 'mine', cd: 10, hunger: 0.5, pick: 4, finite: 'obsidian', drops: [d('obsidian', 2, 2)], xp: 2 },
  { id: 'hunt_pig', name: '讨伐猪', kind: 'hunt', cd: 4, hunger: 0.3, finite: 'pig', mob: 'pig' },
  { id: 'hunt_cow', name: '讨伐牛', kind: 'hunt', cd: 4, hunger: 0.3, finite: 'cow', mob: 'cow' },
  { id: 'hunt_sheep', name: '讨伐羊', kind: 'hunt', cd: 4, hunger: 0.3, finite: 'sheep', mob: 'sheep' },
  { id: 'hunt_spider', name: '搜寻蜘蛛', kind: 'hunt', cd: 9, hunger: 0.25, mob: 'spider' },
  { id: 'hunt_ender', name: '搜寻末影人', kind: 'hunt', cd: 9, hunger: 0.45, mob: 'shade' },
  { id: 'gather_wart', name: '收获下界疣', kind: 'gather', cd: 6, hunger: 0.2, finite: 'nether_wart', drops: [d('nether_wart', 2, 3)] },
  { id: 'dig_soul_sand', name: '收集灵魂沙', kind: 'gather', cd: 4, hunger: 0.2, drops: [d('soul_sand', 2, 4)] },
  { id: 'hunt_wither', name: '搜寻凋灵骷髅', kind: 'hunt', cd: 12, hunger: 0.5, mob: 'wither_skeleton' },
  { id: 'hunt_blaze', name: '讨伐烈焰人', kind: 'hunt', cd: 6, hunger: 0.4, mob: 'blaze' },
]
export const ACTIONS: Record<string, ActionDef> = Object.fromEntries(ACTION_LIST.map((a) => [a.id, a]))

// ---------- 地形 ----------
export interface BiomeDef {
  id: string
  name: string
  icon: string
  desc: string
  actions: string[]
  res: Record<string, [number, number]>
  danger: number
  weight: number
}
export const BIOMES: Record<string, BiomeDef> = {
  forest: { id: 'forest', name: '森林', icon: '/textures/minecraft/oak_log.png', desc: '高大的橡树遮住了天空，林间散落着野果。', actions: ['chop', 'grass', 'forage', 'mine_stone', 'hunt_pig', 'hunt_spider'], res: { pig: [3, 7] }, danger: 1, weight: 20 },
  plains: { id: 'plains', name: '平原', icon: '/textures/minecraft/grass_block.png', desc: '一望无际的草地，牛羊在远处漫步。', actions: ['grass', 'forage', 'chop', 'hunt_cow', 'hunt_sheep'], res: { cow: [3, 8], sheep: [3, 8] }, danger: 0.8, weight: 18 },
  coast: { id: 'coast', name: '沙滩', icon: '/textures/minecraft/sand.png', desc: '潮水拍打着沙滩，岸边长着成片的甘蔗。', actions: ['fish', 'dig_sand', 'gather_cane'], res: {}, danger: 0.7, weight: 12 },
  swamp: { id: 'swamp', name: '沼泽', icon: '/textures/minecraft/lily_pad.png', desc: '浑浊的水面漂着睡莲，空气又湿又闷。', actions: ['chop', 'fish', 'gather_cane', 'grass'], res: {}, danger: 1.4, weight: 8 },
  desert: { id: 'desert', name: '沙漠', icon: '/textures/minecraft/cactus.png', desc: '炽热的沙丘连绵起伏，岩缝里闪着金光。', actions: ['dig_sand', 'mine_stone', 'mine_gold'], res: { gold: [2, 6] }, danger: 1.2, weight: 8 },
  mountain: { id: 'mountain', name: '风袭丘陵', icon: '/textures/minecraft/stone.png', desc: '裸露的岩壁上能看到煤与铁的矿脉。', actions: ['mine_stone', 'mine_coal', 'mine_iron', 'mine_emerald', 'hunt_sheep'], res: { coal: [10, 24], iron: [6, 14], emerald: [0, 3], sheep: [2, 5] }, danger: 1, weight: 14 },
  cave: { id: 'cave', name: '洞穴', icon: '/textures/minecraft/coal_ore.png', desc: '深不见底的洞穴，黑暗中传来低沉的声响。', actions: ['mine_stone', 'mine_coal', 'mine_iron', 'mine_lapis', 'mine_gold', 'mine_redstone', 'mine_diamond', 'mine_obsidian'], res: { coal: [8, 20], iron: [8, 18], lapis: [2, 8], gold: [2, 8], redstone: [3, 9], diamond: [5, 8], obsidian: [6, 9] }, danger: 1.25, weight: 12 },
  snow: { id: 'snow', name: '雪原', icon: '/textures/minecraft/snow.png', desc: '白茫茫的冻土，云杉林覆盖着积雪。', actions: ['chop', 'fish', 'mine_stone'], res: {}, danger: 0.9, weight: 7 },
  village: { id: 'village', name: '村庄', icon: '/textures/minecraft/bell.png', desc: '炊烟升起，村民们打量着你这个外来者。', actions: ['gather_wheat', 'grass', 'chop'], res: { wheat: [6, 12] }, danger: 0.4, weight: 7 },
  rift: { id: 'rift', name: '下界要塞', icon: '/textures/minecraft/nether_bricks.png', desc: '岩浆在脚下翻涌，烈焰人在热浪中游荡。', actions: ['mine_obsidian', 'mine_gold', 'hunt_blaze', 'hunt_wither', 'gather_wart', 'dig_soul_sand'], res: { obsidian: [6, 14], gold: [4, 10], nether_wart: [3, 6] }, danger: 2, weight: 0 },
  warped: { id: 'warped', name: '诡异森林', icon: '/textures/minecraft/warped_stem.png', desc: '蓝绿色的菌柄间，回荡着末影人的低鸣。', actions: ['hunt_ender'], res: {}, danger: 0, weight: 0 },
  altar: { id: 'altar', name: '要塞传送门房间', icon: '/textures/minecraft/end_portal_frame_top.png', desc: '地底深处的古老石室，十二个空洞的凹槽环绕着一座沉寂的传送门。', actions: ['mine_stone'], res: {}, danger: 1.5, weight: 0 },
}
export const RES_NAMES: Record<string, string> = {
  pig: '猪', cow: '牛', sheep: '羊', coal: '煤矿', iron: '铁矿', gold: '金矿', lapis: '青金石',
  nether_wart: '下界疣', redstone: '红石', diamond: '钻石', emerald: '绿宝石', obsidian: '黑曜石', wheat: '麦田',
}
const NAME_A = ['寂静', '迷雾', '晨曦', '落日', '苍翠', '风鸣', '荒芜', '幽暗', '回声', '霜白', '赤红', '遗忘']
export const randomLocName = (biome: string) =>
  NAME_A[Math.floor(Math.random() * NAME_A.length)] + BIOMES[biome].name

// ---------- 生物 ----------
export interface MobDef {
  id: string
  name: string
  icon: string
  hp: number
  atk: number
  xp: number
  drops: Drop[]
  hostile?: boolean
  weight?: number
  nightOnly?: boolean
}
export const MOBS: Record<string, MobDef> = {
  pig: { id: 'pig', name: '猪', icon: '/textures/minecraft/mob_pig.png', hp: 6, atk: 0, xp: 1, drops: [d('porkchop', 1, 3)] },
  cow: { id: 'cow', name: '牛', icon: '/textures/minecraft/mob_cow.png', hp: 8, atk: 0, xp: 1, drops: [d('meat', 1, 2), d('leather', 1, 2)] },
  sheep: { id: 'sheep', name: '羊', icon: '/textures/minecraft/mob_sheep.png', hp: 6, atk: 0, xp: 1, drops: [d('wool', 1, 2), d('mutton', 1, 2)] },
  zombie: { id: 'zombie', name: '僵尸', icon: '/textures/minecraft/mob_zombie.png', hp: 14, atk: 2, xp: 4, drops: [d('rotten', 1, 2), d('iron', 1, 1, 0.05)], hostile: true, weight: 10 },
  skeleton: { id: 'skeleton', name: '骷髅', icon: '/textures/minecraft/mob_skeleton.png', hp: 12, atk: 3, xp: 4, drops: [d('bone', 1, 3)], hostile: true, weight: 8 },
  spider: { id: 'spider', name: '蜘蛛', icon: '/textures/minecraft/mob_spider.png', hp: 10, atk: 2, xp: 4, drops: [d('string', 1, 3)], hostile: true, weight: 8 },
  witch: { id: 'witch', name: '女巫', icon: '/textures/minecraft/mob_witch.png', hp: 16, atk: 3, xp: 6, drops: [d('redstone', 1, 3, 0.6), d('cane', 1, 3, 0.5)], hostile: true, weight: 2 },
  shade: { id: 'shade', name: '末影人', icon: '/textures/minecraft/mob_shade.png', hp: 24, atk: 5, xp: 10, drops: [d('pearl', 1, 2)], hostile: true, weight: 2, nightOnly: true },
  blaze: { id: 'blaze', name: '烈焰人', icon: '/textures/minecraft/mob_blaze.png', hp: 18, atk: 4, xp: 8, drops: [d('blaze_rod', 1, 2)] },
  wither_skeleton: { id: 'wither_skeleton', name: '凋灵骷髅', icon: '/textures/minecraft/mob_wither_skeleton.png', hp: 32, atk: 5, xp: 12, drops: [d('wither_skull', 1, 1), d('coal', 1, 3)] },
  wither: { id: 'wither', name: '凋灵', icon: '/textures/minecraft/mob_wither.png', hp: 130, atk: 7, xp: 90, drops: [d('nether_star', 1, 1)] },
  dragon: { id: 'dragon', name: '末影龙', icon: '/textures/minecraft/mob_dragon.png', hp: 150, atk: 6, xp: 200, drops: [d('dragon_egg', 1, 1)] },
}

// ---------- 村庄 ----------
export interface BuildingDef {
  id: string
  name: string
  icon: string
  desc: string
  cost: Bag
  job?: string
  slots?: number
  need?: string
  limit?: number
  project?: boolean
}
export const BUILDINGS: BuildingDef[] = [
  { id: 'house', name: '房屋', icon: '/textures/minecraft/oak_door.png', desc: '住房 +2，空房会吸引村民入住', cost: { wood: 8, plank: 12 } },
  { id: 'warehouse', name: '仓库', icon: '/textures/minecraft/barrel_side.png', desc: '村庄产物储量上限 +300', cost: { plank: 40, cobble: 20 } },
  { id: 'farm', name: '农场', icon: '/textures/minecraft/composter_side.png', desc: '农夫岗位 +2', cost: { plank: 8, seed: 3 }, job: 'farmer', slots: 2 },
  { id: 'lumber', name: '伐木场', icon: '/textures/minecraft/stone_axe.png', desc: '伐木工岗位 +2', cost: { wood: 10, cobble: 8 }, job: 'lumberjack', slots: 2 },
  { id: 'pasture', name: '牧场', icon: '/textures/minecraft/oak_fence.png', desc: '牧民岗位 +2', cost: { plank: 30, wheat: 10 }, job: 'herder', slots: 2 },
  { id: 'fishery', name: '渔屋', icon: '/textures/minecraft/fishing_rod.png', desc: '渔夫岗位 +2', cost: { plank: 25, string: 4 }, job: 'fisher', slots: 2 },
  { id: 'mine', name: '矿井', icon: '/textures/minecraft/iron_pickaxe.png', desc: '矿工岗位 +2', cost: { plank: 30, cobble: 40, torch: 8 }, job: 'miner', slots: 2 },
  { id: 'cobblegen', name: '刷石机', icon: '/textures/minecraft/lava_bucket.png', desc: '自动化：无需人手，持续产出圆石', cost: { iron: 6, cobble: 30 }, need: 'bucket' },
  { id: 'watchtower', name: '瞭望塔', icon: '/textures/minecraft/stone_brick_wall.png', desc: '防御 +5，守卫岗位 +2', cost: { cobble: 50, plank: 30 }, job: 'guard', slots: 2 },
  { id: 'smithy', name: '铁匠铺', icon: '/textures/minecraft/smithing_table_front.png', desc: '解锁金属交易', cost: { cobble: 60, iron: 10 }, need: 'iron' },
  { id: 'market', name: '集市', icon: '/textures/minecraft/emerald.png', desc: '解锁稀有交易，交易声望翻倍', cost: { plank: 50, emerald: 5 }, need: 'emerald' },
  { id: 'library', name: '图书馆', icon: '/textures/minecraft/bookshelf.png', desc: '附魔所需青金石减半', cost: { plank: 60, book: 6 }, need: 'book' },
  { id: 'cane_field', name: '甘蔗圃', icon: '/textures/minecraft/sugar_cane.png', desc: '园丁岗位 +2；持续收获甘蔗', cost: { cane: 6, sand: 8, plank: 12 }, need: 'cane', job: 'gardener', slots: 2 },
  { id: 'redstone', name: '红石工坊', icon: '/textures/minecraft/observer.png', desc: '漏斗与发射器自动制造、烧炼或烘焙；每座可开一条产线', cost: { redstone: 8, iron: 6, glass: 4, cobble: 20 }, need: 'redstone', limit: 3 },
  { id: 'deep_mine', name: '深层采掘站', icon: '/textures/minecraft/diamond_pickaxe.png', desc: '深层矿工岗位 +2，自动开采金矿与红石', cost: { diamond: 4, iron: 12, cobble: 80, torch: 12 }, need: 'diamond', job: 'deep_miner', slots: 2 },
  { id: 'shulker_store', name: '潜影仓库', icon: '/textures/minecraft/shulker_box.png', desc: '村庄产物储量上限 +1200', cost: { shulker_shell: 6, plank: 80, iron: 10 }, need: 'shulker_shell' },
  { id: 'beacon', name: '信标', icon: '/textures/minecraft/beacon.png', desc: '村庄产出 +35%，采集与移动冷却 −15%', cost: { nether_star: 1, glass: 5, obsidian: 3, iron: 36 }, need: 'nether_star', limit: 1 },
  { id: 'monument', name: '方块纪元纪念碑', icon: '/textures/minecraft/dragon_egg.png', desc: '以龙蛋纪念征途。竣工后村庄产出再提高 25%。', cost: { shulker_shell: 24, diamond: 20, gold: 32, glass: 64, obsidian: 12 }, need: 'dragon_egg', limit: 1, project: true },
  { id: 'golem', name: '铁傀儡', icon: '/textures/minecraft/mob_iron_golem.png', desc: '防御 +10', cost: { iron: 40, cobble: 20 }, need: 'iron' },
]
export const BUILDING_MAP: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]))
export const COST_RATIO = 1.16

export interface JobDef { id: string; name: string; icon: string; out: Bag; desc: string }
export const JOBS: JobDef[] = [
  { id: 'farmer', name: '农夫', icon: '/textures/minecraft/wheat.png', out: { wheat: 0.18, seed: 0.025 }, desc: '种植小麦' },
  { id: 'lumberjack', name: '伐木工', icon: '/textures/minecraft/stone_axe.png', out: { wood: 0.22 }, desc: '砍伐原木' },
  { id: 'miner', name: '矿工', icon: '/textures/minecraft/iron_pickaxe.png', out: { cobble: 0.20, coal: 0.045, iron_ore: 0.035 }, desc: '开采石料与矿物' },
  { id: 'herder', name: '牧民', icon: '/textures/minecraft/shears.png', out: { meat: 0.04, leather: 0.02, wool: 0.02 }, desc: '照料牲畜' },
  { id: 'fisher', name: '渔夫', icon: '/textures/minecraft/fishing_rod.png', out: { fish: 0.06 }, desc: '捕鱼' },
  { id: 'deep_miner', name: '深层矿工', icon: '/textures/minecraft/diamond_pickaxe.png', out: { gold_ore: 0.045, redstone: 0.06 }, desc: '沿着支巷采集深层矿物' },
  { id: 'gardener', name: '园丁', icon: '/textures/minecraft/sugar_cane.png', out: { cane: 0.15 }, desc: '在水渠边种植甘蔗' },
  { id: 'guard', name: '守卫', icon: '/textures/minecraft/iron_sword.png', out: {}, desc: '每人防御 +3' },
]
export const JOB_MAP: Record<string, JobDef> = Object.fromEntries(JOBS.map((j) => [j.id, j]))

export interface Trade { id: string; give: Bag; get: Bag; need?: string; rep?: number }
export const TRADES: Trade[] = [
  { id: 't_wheat', give: { wheat: 12 }, get: { emerald: 1 } },
  { id: 't_coal', give: { coal: 15 }, get: { emerald: 1 } },
  { id: 't_bone', give: { bone: 8 }, get: { emerald: 1 } },
  { id: 't_string', give: { string: 10 }, get: { emerald: 1 } },
  { id: 't_rotten', give: { rotten: 16 }, get: { emerald: 1 } },
  { id: 't_paper', give: { paper: 12 }, get: { emerald: 1 } },
  { id: 't_bread', give: { emerald: 1 }, get: { bread: 4 } },
  { id: 't_book', give: { emerald: 3 }, get: { book: 1 }, rep: 20 },
  { id: 't_iron', give: { emerald: 2 }, get: { iron: 1 }, need: 'smithy' },
  { id: 't_diamond', give: { emerald: 12 }, get: { diamond: 1 }, need: 'smithy', rep: 80 },
  { id: 't_lapis', give: { emerald: 1 }, get: { lapis: 3 }, need: 'market' },
  { id: 't_redstone', give: { emerald: 1 }, get: { redstone: 3 }, need: 'market' },
  { id: 't_provisions', give: { emerald: 2 }, get: { steak: 4 }, need: 'market' },
  { id: 't_glass', give: { emerald: 1 }, get: { glass: 4 }, need: 'market' },
  { id: 't_pearl', give: { emerald: 6 }, get: { pearl: 1 }, need: 'market', rep: 60 },
]

export const REP_TIERS: [number, string][] = [[100, '受人敬仰'], [50, '值得信任'], [20, '面熟'], [0, '陌生人']]
export const repTier = (rep: number) => REP_TIERS.find(([n]) => rep >= n)![1]
export const villageLevel = (n: number) =>
  n >= 16 ? '城镇' : n >= 8 ? '村庄' : n >= 4 ? '小村' : n >= 1 ? '聚落' : '庇护所'
export const CONTROL_REP = 20
export const MAYOR_REP = 60
export const MAYOR_POP = 8

export const TALK_LINES = [
  '“哈——？”村民歪着头看你，最后还是递来一个善意的眼神。',
  '村民说，洞穴深处才有钻石，但要带上铁镐。',
  '村民说，纸做的地图和一枚指南针，能让人记住走过的路。',
  '村民压低声音：夜里出没的末影人，身上带着末影珍珠。',
  '村民提到，钻石镐能采下黑曜石。十块黑曜石足够搭一座下界传送门。',
  '村民说，空房子总会等来新的住客。',
  '村民说，十二只末影之眼能唤醒地底的祭坛。',
  '村民抱怨最近夜里不太平，要是有座瞭望塔就好了。',
]
export const EYES_NEEDED = 12
