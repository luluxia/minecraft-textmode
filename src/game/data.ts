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
  container?: string
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

  it('birch_log', '白桦原木', '/textures/minecraft/birch_log.png', 'material'),
  it('birch_plank', '白桦木板', '/textures/minecraft/birch_planks.png', 'material'),
  it('spruce_log', '云杉原木', '/textures/minecraft/spruce_log.png', 'material'),
  it('spruce_plank', '云杉木板', '/textures/minecraft/spruce_planks.png', 'material'),
  it('jungle_log', '丛林原木', '/textures/minecraft/jungle_log.png', 'material'),
  it('jungle_plank', '丛林木板', '/textures/minecraft/jungle_planks.png', 'material'),
  it('mangrove_log', '红树原木', '/textures/minecraft/mangrove_log.png', 'material'),
  it('mangrove_plank', '红树木板', '/textures/minecraft/mangrove_planks.png', 'material'),
  it('cherry_log', '樱花原木', '/textures/minecraft/cherry_log.png', 'material'),
  it('cherry_plank', '樱花木板', '/textures/minecraft/cherry_planks.png', 'material'),
  it('bamboo', '竹子', '/textures/minecraft/bamboo.png', 'material'),
  it('scaffolding', '脚手架', '/textures/minecraft/scaffolding.png', 'tool', { desc: '使勘察和返回路标更快。' }),
  it('cocoa', '可可豆', '/textures/minecraft/cocoa_beans.png', 'material'),
  it('cookie', '曲奇', '/textures/minecraft/cookie.png', 'food', { food: 2 }),
  it('melon', '西瓜片', '/textures/minecraft/melon_slice.png', 'food', { food: 3 }),
  it('berries', '甜浆果', '/textures/minecraft/sweet_berries.png', 'food', { food: 2 }),
  it('carrot', '胡萝卜', '/textures/minecraft/carrot.png', 'food', { food: 3 }),
  it('potato', '马铃薯', '/textures/minecraft/potato.png', 'food', { food: 1 }),
  it('baked_potato', '烤马铃薯', '/textures/minecraft/baked_potato.png', 'food', { food: 5 }),
  it('beetroot', '甜菜根', '/textures/minecraft/beetroot.png', 'food', { food: 1 }),
  it('bowl', '碗', '/textures/minecraft/bowl.png', 'material'),
  it('beet_soup', '甜菜汤', '/textures/minecraft/beetroot_soup.png', 'food', { food: 6, container: 'bowl' }),
  it('red_mushroom', '红色蘑菇', '/textures/minecraft/red_mushroom.png', 'material'),
  it('brown_mushroom', '棕色蘑菇', '/textures/minecraft/brown_mushroom.png', 'material'),
  it('mushroom_stew', '蘑菇煲', '/textures/minecraft/mushroom_stew.png', 'food', { food: 6, container: 'bowl' }),
  it('chicken', '生鸡肉', '/textures/minecraft/chicken.png', 'food', { food: 2 }),
  it('cooked_chicken', '熟鸡肉', '/textures/minecraft/cooked_chicken.png', 'food', { food: 6 }),
  it('feather', '羽毛', '/textures/minecraft/feather.png', 'material'),
  it('egg', '鸡蛋', '/textures/minecraft/egg.png', 'material'),
  it('sugar', '糖', '/textures/minecraft/sugar.png', 'material'),
  it('pumpkin', '南瓜', '/textures/minecraft/pumpkin.png', 'material'),
  it('pumpkin_pie', '南瓜派', '/textures/minecraft/pumpkin_pie.png', 'food', { food: 8 }),
  it('shears', '剪刀', '/textures/minecraft/shears.png', 'tool'),
  it('bottle', '玻璃瓶', '/textures/minecraft/glass_bottle.png', 'material'),
  it('honeycomb', '蜜脾', '/textures/minecraft/honeycomb.png', 'material'),
  it('honey', '蜂蜜瓶', '/textures/minecraft/honey_bottle.png', 'food', { food: 6, container: 'bottle' }),
  it('honey_block', '蜂蜜块', '/textures/minecraft/honey_block.png', 'material'),
  it('copper_ore', '粗铜', '/textures/minecraft/raw_copper.png', 'material'),
  it('copper', '铜锭', '/textures/minecraft/copper_ingot.png', 'material'),
  it('copper_block', '铜块', '/textures/minecraft/copper_block.png', 'material'),
  it('waxed_copper', '涂蜡的铜块', '/textures/minecraft/waxed_copper_block.png', 'material'),
  it('copper_bulb', '铜灯', '/textures/minecraft/copper_bulb.png', 'material'),
  it('lightning_rod', '避雷针', '/textures/minecraft/lightning_rod.png', 'material'),
  it('amethyst', '紫水晶碎片', '/textures/minecraft/amethyst_shard.png', 'material'),
  it('amethyst_block', '紫水晶块', '/textures/minecraft/amethyst_block.png', 'material'),
  it('tinted_glass', '遮光玻璃', '/textures/minecraft/tinted_glass.png', 'material'),
  it('spyglass', '望远镜', '/textures/minecraft/spyglass.png', 'tool', { desc: '可以辨识远处的遗迹与入口。' }),
  it('tuff', '凝灰岩', '/textures/minecraft/tuff.png', 'material'),
  it('tuff_bricks', '凝灰岩砖', '/textures/minecraft/tuff_bricks.png', 'material'),
  it('clay', '黏土球', '/textures/minecraft/clay_ball.png', 'material'),
  it('brick', '红砖', '/textures/minecraft/brick.png', 'material'),
  it('brick_block', '红砖块', '/textures/minecraft/bricks.png', 'material'),
  it('brush', '刷子', '/textures/minecraft/brush.png', 'tool'),
  it('sherd', '弓箭纹样陶片', '/textures/minecraft/archer_pottery_sherd.png', 'special'),
  it('angler_sherd', '垂钓纹样陶片', '/textures/minecraft/angler_pottery_sherd.png', 'special'),
  it('pot', '饰纹陶罐', '/textures/minecraft/decorated_pot.png', 'material'),
  it('sniffer_egg', '嗅探兽蛋', '/textures/minecraft/sniffer_egg.png', 'special'),
  it('torchflower_seed', '火把花种子', '/textures/minecraft/torchflower_seeds.png', 'material'),
  it('torchflower', '火把花', '/textures/minecraft/torchflower.png', 'material'),
  it('pitcher_pod', '瓶子草荚果', '/textures/minecraft/pitcher_pod.png', 'material'),
  it('pitcher', '瓶子草', '/textures/minecraft/pitcher_plant.png', 'material'),
  it('boat', '橡木船', '/textures/minecraft/oak_boat.png', 'tool'),
  it('treasure_map', '藏宝图', '/textures/minecraft/treasure_map.png', 'special', { desc: '根据地图的标记组织埋藏宝藏远征。' }),
  it('heart_of_sea', '海洋之心', '/textures/minecraft/heart_of_the_sea.png', 'special'),
  it('nautilus', '鹦鹉螺壳', '/textures/minecraft/nautilus_shell.png', 'special'),
  it('prismarine_shard', '海晶碎片', '/textures/minecraft/prismarine_shard.png', 'material'),
  it('prismarine_crystal', '海晶砂粒', '/textures/minecraft/prismarine_crystals.png', 'material'),
  it('prismarine', '海晶石', '/textures/minecraft/prismarine.png', 'material'),
  it('sea_lantern', '海晶灯', '/textures/minecraft/sea_lantern.png', 'material'),
  it('wet_sponge', '湿海绵', '/textures/minecraft/wet_sponge.png', 'material'),
  it('sponge', '海绵', '/textures/minecraft/sponge.png', 'material'),
  it('pufferfish', '河豚', '/textures/minecraft/pufferfish.png', 'material'),
  it('salmon', '生鲑鱼', '/textures/minecraft/salmon.png', 'food', { food: 2 }),
  it('cooked_salmon', '熟鲑鱼', '/textures/minecraft/cooked_salmon.png', 'food', { food: 6 }),
  it('water_breathing', '水肺药水', '/textures/minecraft/water_breathing_potion.png', 'special'),
  it('conduit', '潮涌核心', '/textures/minecraft/conduit.png', 'tool'),
  it('breeze_rod', '旋风棒', '/textures/minecraft/breeze_rod.png', 'special'),
  it('wind_charge', '风弹', '/textures/minecraft/wind_charge.png', 'special'),
  it('trial_key', '试炼钥匙', '/textures/minecraft/trial_key.png', 'special'),
  it('ominous_bottle', '不祥之瓶', '/textures/minecraft/ominous_bottle.png', 'special'),
  it('ominous_key', '不祥试炼钥匙', '/textures/minecraft/ominous_trial_key.png', 'special'),
  it('heavy_core', '沉重核心', '/textures/minecraft/heavy_core.png', 'special'),
  it('mace', '重锤', '/textures/minecraft/mace.png', 'gear', { desc: '携带重锤时，风弹跃起后的下一击额外造成 8 点伤害。' }),
  it('sculk', '幽匿块', '/textures/minecraft/sculk.png', 'material'),
  it('sculk_sensor', '幽匿感测体', '/textures/minecraft/sculk_sensor.png', 'special'),
  it('sculk_catalyst', '幽匿催发体', '/textures/minecraft/sculk_catalyst.png', 'special'),
  it('echo_shard', '回响碎片', '/textures/minecraft/echo_shard.png', 'special'),
  it('recovery_compass', '追溯指针', '/textures/minecraft/recovery_compass.png', 'tool', { desc: '复活时找回丢失的一部分资源。' }),
  it('netherrack', '下界岩', '/textures/minecraft/netherrack.png', 'material'),
  it('quartz', '下界石英', '/textures/minecraft/quartz.png', 'material'),
  it('glowstone_dust', '荧石粉', '/textures/minecraft/glowstone_dust.png', 'material'),
  it('glowstone', '荧石', '/textures/minecraft/glowstone.png', 'material'),
  it('blackstone', '黑石', '/textures/minecraft/blackstone.png', 'material'),
  it('ancient_debris', '远古残骸', '/textures/minecraft/ancient_debris.png', 'special'),
  it('netherite_scrap', '下界合金碎片', '/textures/minecraft/netherite_scrap.png', 'special'),
  it('netherite_ingot', '下界合金锭', '/textures/minecraft/netherite_ingot.png', 'special'),
  it('netherite_template', '下界合金升级锻造模板', '/textures/minecraft/netherite_upgrade_smithing_template.png', 'special'),
  it('smithing_table', '锻造台', '/textures/minecraft/smithing_table_front.png', 'tool'),
  it('pick_netherite', '下界合金镐', '/textures/minecraft/netherite_pickaxe.png', 'tool'),
  it('axe_netherite', '下界合金斧', '/textures/minecraft/netherite_axe.png', 'tool'),
  it('sword_netherite', '下界合金剑', '/textures/minecraft/netherite_sword.png', 'gear'),
  it('armor_netherite', '下界合金胸甲', '/textures/minecraft/netherite_chestplate.png', 'gear'),
  it('magma_cream', '岩浆膏', '/textures/minecraft/magma_cream.png', 'special'),
  it('fire_resistance', '抗火药水', '/textures/minecraft/fire_resistance_potion.png', 'special'),
  it('chorus_fruit', '紫颂果', '/textures/minecraft/chorus_fruit.png', 'food', { food: 4 }),
  it('popped_chorus', '爆裂紫颂果', '/textures/minecraft/popped_chorus_fruit.png', 'material'),
  it('chorus_flower', '紫颂花', '/textures/minecraft/chorus_flower.png', 'material'),
  it('end_stone', '末地石', '/textures/minecraft/end_stone.png', 'material'),
  it('purpur', '紫珀块', '/textures/minecraft/purpur_block.png', 'material'),
  it('ender_chest', '末影箱', '/textures/minecraft/ender_chest.png', 'tool', { desc: '村庄产物储量上限 +600。' }),
  it('shulker_box', '潜影盒', '/textures/minecraft/shulker_box.png', 'material'),
  it('dragon_breath', '龙息', '/textures/minecraft/dragon_breath.png', 'special'),
  it('end_crystal', '末地水晶', '/textures/minecraft/end_crystal.png', 'special'),
  it('axe_diamond', '钻石斧', '/textures/minecraft/diamond_axe.png', 'tool'),
  it('ghast_tear', '恶魂之泪', '/textures/minecraft/ghast_tear.png', 'special'),
  it('gunpowder', '火药', '/textures/minecraft/gunpowder.png', 'material'),
  it('splash_healing', '喷溅型治疗药水', '/textures/minecraft/splash_healing_potion.png', 'special', { desc: '战斗中可投掷，回复 8 点生命。' }),
  it('lingering_healing', '滞留型治疗药水', '/textures/minecraft/lingering_healing_potion.png', 'special', { desc: '战斗中回复 12 点生命。' }),
]
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]))

export const PICKS = ['pick_wood', 'pick_stone', 'pick_iron', 'pick_diamond', 'pick_netherite']
export const SWORDS: [string, number][] = [
  ['sword_netherite', 9], ['mace', 8], ['sword_diamond', 7], ['sword_iron', 5], ['sword_stone', 3], ['sword_wood', 2],
]
export const ARMORS: [string, number][] = [
  ['armor_netherite', 7], ['armor_diamond', 5], ['armor_iron', 3], ['armor_leather', 1],
]

// ---------- 合成 ----------
export interface Recipe {
  id: string
  out: string
  n: number
  cost: Bag
  station: 'hand' | 'table' | 'brewing' | 'smithing'
  returns?: Bag
}
const rc = (out: string, n: number, cost: Bag, station: Recipe['station'] = 'table', returns?: Bag): Recipe => ({
  id: out, out, n, cost, station, returns,
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
  rc('scaffolding', 1, { bamboo: 6, string: 1 }),
  rc('bowl', 4, { plank: 3 }),
  rc('beet_soup', 1, { beetroot: 6, bowl: 1 }),
  rc('mushroom_stew', 1, { red_mushroom: 1, brown_mushroom: 1, bowl: 1 }),
  rc('cookie', 8, { wheat: 2, cocoa: 1 }),
  rc('sugar', 1, { cane: 1 }, 'hand'),
  rc('pumpkin_pie', 1, { pumpkin: 1, sugar: 1, egg: 1 }),
  rc('shears', 1, { iron: 2 }),
  rc('bottle', 3, { glass: 3 }),
  rc('honey_block', 1, { honey: 4 }, 'table', { bottle: 4 }),
  rc('copper_block', 1, { copper: 9 }),
  rc('waxed_copper', 1, { copper_block: 1, honeycomb: 1 }, 'hand'),
  rc('copper_bulb', 4, { copper_block: 3, blaze_rod: 1, redstone: 1 }),
  rc('lightning_rod', 1, { copper: 3 }),
  rc('amethyst_block', 1, { amethyst: 4 }),
  rc('tinted_glass', 2, { glass: 1, amethyst: 4 }),
  rc('spyglass', 1, { copper: 2, amethyst: 1 }),
  rc('tuff_bricks', 4, { tuff: 4 }),
  rc('brick_block', 1, { brick: 4 }),
  rc('brush', 1, { feather: 1, copper: 1, stick: 1 }),
  rc('pot', 1, { sherd: 2, angler_sherd: 1, brick: 1 }),
  rc('boat', 1, { plank: 5 }),
  rc('prismarine', 1, { prismarine_shard: 4 }),
  rc('sea_lantern', 1, { prismarine_shard: 4, prismarine_crystal: 5 }),
  rc('water_breathing', 3, { pufferfish: 1, nether_wart: 1, bottle: 3, blaze_powder: 1 }, 'brewing'),
  rc('fire_resistance', 3, { magma_cream: 1, nether_wart: 1, bottle: 3, blaze_powder: 1 }, 'brewing'),
  rc('conduit', 1, { nautilus: 8, heart_of_sea: 1 }),
  rc('wind_charge', 4, { breeze_rod: 1 }),
  rc('mace', 1, { heavy_core: 1, breeze_rod: 1 }),
  rc('recovery_compass', 1, { echo_shard: 8, compass: 1 }),
  rc('glowstone', 1, { glowstone_dust: 4 }, 'hand'),
  rc('netherite_ingot', 1, { netherite_scrap: 4, gold: 4 }),
  rc('smithing_table', 1, { iron: 2, plank: 4 }),
  rc('pick_netherite', 1, { pick_diamond: 1, netherite_ingot: 1, netherite_template: 1 }, 'smithing'),
  rc('axe_netherite', 1, { axe_diamond: 1, netherite_ingot: 1, netherite_template: 1 }, 'smithing'),
  rc('sword_netherite', 1, { sword_diamond: 1, netherite_ingot: 1, netherite_template: 1 }, 'smithing'),
  rc('armor_netherite', 1, { armor_diamond: 1, netherite_ingot: 1, netherite_template: 1 }, 'smithing'),
  { id: 'copy_netherite_template', out: 'netherite_template', n: 2, cost: { netherite_template: 1, diamond: 7, netherrack: 1 }, station: 'table' },
  rc('purpur', 4, { popped_chorus: 4 }),
  rc('ender_chest', 1, { obsidian: 8, eye: 1 }),
  rc('shulker_box', 1, { plank: 8, shulker_shell: 2 }),
  rc('end_crystal', 1, { glass: 7, eye: 1, ghast_tear: 1 }),
  rc('splash_healing', 3, { potion: 3, gunpowder: 1 }, 'brewing'),
  rc('lingering_healing', 3, { splash_healing: 3, dragon_breath: 1 }, 'brewing'),
  rc('axe_diamond', 1, { diamond: 3, stick: 2 }),
  rc('birch_plank', 4, { birch_log: 1 }, 'hand'),
  { id: 'stick_birch', out: 'stick', n: 4, cost: { birch_plank: 2 }, station: 'hand' },
  rc('spruce_plank', 4, { spruce_log: 1 }, 'hand'),
  { id: 'stick_spruce', out: 'stick', n: 4, cost: { spruce_plank: 2 }, station: 'hand' },
  rc('jungle_plank', 4, { jungle_log: 1 }, 'hand'),
  { id: 'stick_jungle', out: 'stick', n: 4, cost: { jungle_plank: 2 }, station: 'hand' },
  rc('mangrove_plank', 4, { mangrove_log: 1 }, 'hand'),
  { id: 'stick_mangrove', out: 'stick', n: 4, cost: { mangrove_plank: 2 }, station: 'hand' },
  rc('cherry_plank', 4, { cherry_log: 1 }, 'hand'),
  { id: 'stick_cherry', out: 'stick', n: 4, cost: { cherry_plank: 2 }, station: 'hand' },
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
  { id: 'copper', from: 'copper_ore', out: 'copper', time: 4 },
  { id: 'brick', from: 'clay', out: 'brick', time: 4 },
  { id: 'cooked_chicken', from: 'chicken', out: 'cooked_chicken', time: 3 },
  { id: 'baked_potato', from: 'potato', out: 'baked_potato', time: 3 },
  { id: 'cooked_salmon', from: 'salmon', out: 'cooked_salmon', time: 3 },
  { id: 'sponge', from: 'wet_sponge', out: 'sponge', time: 6 },
  { id: 'netherite_scrap', from: 'ancient_debris', out: 'netherite_scrap', time: 8 },
  { id: 'popped_chorus', from: 'chorus_fruit', out: 'popped_chorus', time: 4 },
]
export const FUELS: Record<string, number> = { plank: 1, wood: 2, coal: 8, charcoal: 8, blaze_rod: 12, bamboo: 1,
  birch_log: 2, spruce_log: 2, jungle_log: 2, mangrove_log: 2, cherry_log: 2,
  birch_plank: 1, spruce_plank: 1, jungle_plank: 1, mangrove_plank: 1, cherry_plank: 1,
}

// ---------- 附魔 ----------
export interface EnchDef { id: string; name: string; desc: string; max: number }
export const ENCHANTS: EnchDef[] = [
  { id: 'sharp', name: '锋利', desc: '每级攻击 +1', max: 5 },
  { id: 'prot', name: '保护', desc: '每级防御 +1', max: 4 },
  { id: 'eff', name: '效率', desc: '每级行动冷却 -8%', max: 5 },
  { id: 'silk', name: '精准采集', desc: '可完整采集远古城市的幽匿块', max: 1 },
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
  cost?: Bag
  needs?: string[]
  enchant?: string
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
  { id: 'chop_birch', name: '砍伐白桦', kind: 'gather', cd: 3, hunger: 0.18, drops: [d('birch_log', 2, 4)] },
  { id: 'chop_spruce', name: '砍伐云杉', kind: 'gather', cd: 3, hunger: 0.18, drops: [d('spruce_log', 2, 4)] },
  { id: 'chop_jungle', name: '砍伐丛林木', kind: 'gather', cd: 3, hunger: 0.18, drops: [d('jungle_log', 2, 4)] },
  { id: 'chop_mangrove', name: '砍伐红树', kind: 'gather', cd: 3, hunger: 0.18, drops: [d('mangrove_log', 2, 4)] },
  { id: 'chop_cherry', name: '砍伐樱花树', kind: 'gather', cd: 3, hunger: 0.18, drops: [d('cherry_log', 2, 4)] },
  { id: 'gather_bamboo', name: '收割竹子', kind: 'gather', cd: 4, hunger: 0.12, drops: [d('bamboo', 3, 6)] },
  { id: 'gather_jungle_fruit', name: '采摘可可与西瓜', kind: 'gather', cd: 5, hunger: 0.15, finite: 'jungle_fruit', drops: [d('cocoa', 2, 3), d('melon', 2, 5)] },
  { id: 'gather_berries', name: '采摘甜浆果', kind: 'gather', cd: 4, hunger: 0.08, finite: 'berries', drops: [d('berries', 2, 4)] },
  { id: 'gather_vegetables', name: '收获村庄菜地', kind: 'gather', cd: 6, hunger: 0.15, finite: 'vegetables', drops: [d('carrot', 2, 4), d('potato', 2, 4), d('beetroot', 3, 5)] },
  { id: 'gather_pumpkin', name: '采收南瓜', kind: 'gather', cd: 5, hunger: 0.12, finite: 'pumpkin', drops: [d('pumpkin', 1, 2)] },
  { id: 'gather_mushrooms', name: '采摘蘑菇', kind: 'gather', cd: 5, hunger: 0.1, finite: 'mushrooms', drops: [d('red_mushroom', 1, 2), d('brown_mushroom', 1, 2)] },
  { id: 'hunt_chicken', name: '讨伐鸡', kind: 'hunt', cd: 5, hunger: 0.2, finite: 'chicken', mob: 'chicken' },
  { id: 'gather_egg', name: '捡拾鸡蛋', kind: 'gather', cd: 5, hunger: 0.08, finite: 'eggs', drops: [d('egg', 1, 2)] },
  { id: 'shear_sheep', name: '剪羊毛', kind: 'gather', cd: 5, hunger: 0.12, tool: 'shears', finite: 'fleece', drops: [d('wool', 2, 3)] },
  { id: 'harvest_comb', name: '用营火烟雾采蜜脾', kind: 'gather', cd: 6, hunger: 0.12, tool: 'shears', needs: ['campfire'], finite: 'nectar', drops: [d('honeycomb', 3, 3)] },
  { id: 'bottle_honey', name: '用营火烟雾收集蜂蜜', kind: 'gather', cd: 6, hunger: 0.12, tool: 'campfire', cost: { bottle: 1 }, finite: 'nectar', drops: [d('honey', 1, 1)] },
  { id: 'mine_copper', name: '开采铜矿', kind: 'mine', cd: 4, hunger: 0.26, pick: 2, finite: 'copper', drops: [d('copper_ore', 2, 4)], xp: 1 },
  { id: 'mine_amethyst', name: '采收紫水晶簇', kind: 'mine', cd: 6, hunger: 0.22, pick: 2, finite: 'amethyst', drops: [d('amethyst', 3, 4)], xp: 2 },
  { id: 'mine_tuff', name: '开采凝灰岩', kind: 'mine', cd: 4, hunger: 0.24, pick: 2, drops: [d('tuff', 2, 4)] },
  { id: 'dig_clay', name: '挖掘黏土', kind: 'gather', cd: 4, hunger: 0.2, drops: [d('clay', 2, 4)] },
  { id: 'brush_ruin', name: '刷开可疑的沙子', kind: 'gather', cd: 7, hunger: 0.14, tool: 'brush', finite: 'suspicious', drops: [d('sherd', 1, 1), d('emerald', 1, 1, 0.25), d('clay', 1, 2)], xp: 3 },
  { id: 'fish_deep', name: '在深水区垂钓', kind: 'fish', cd: 7, hunger: 0.12, tool: 'rod', drops: [d('salmon', 1, 2), d('pufferfish', 1, 1, 0.45), d('nautilus', 1, 1, 0.12)], xp: 2 },
  { id: 'mine_sculk', name: '精准采集幽匿块', kind: 'mine', cd: 5, hunger: 0.25, pick: 3, enchant: 'silk', drops: [d('sculk', 2, 4)], xp: 1 },
  { id: 'sneak_city', name: '铺羊毛潜行搜寻箱子', kind: 'gather', cd: 15, hunger: 0.4, cost: { wool: 3 }, drops: [d('echo_shard', 2, 3), d('sculk_sensor', 1, 1), d('diamond', 1, 2, 0.25)], xp: 5 },
  { id: 'hunt_warden', name: '挑战监守者', kind: 'hunt', cd: 45, hunger: 0.8, mob: 'warden' },
  { id: 'mine_netherrack', name: '开采下界岩', kind: 'mine', cd: 3, hunger: 0.24, pick: 1, drops: [d('netherrack', 3, 6)] },
  { id: 'mine_quartz', name: '开采下界石英矿', kind: 'mine', cd: 5, hunger: 0.3, pick: 2, finite: 'quartz', drops: [d('quartz', 2, 4)], xp: 3 },
  { id: 'gather_glowstone', name: '敲碎荧石', kind: 'gather', cd: 5, hunger: 0.2, drops: [d('glowstone_dust', 2, 4)] },
  { id: 'mine_blackstone', name: '开采黑石', kind: 'mine', cd: 4, hunger: 0.3, pick: 2, drops: [d('blackstone', 2, 4)] },
  { id: 'mine_ancient', name: '开采远古残骸', kind: 'mine', cd: 9, hunger: 0.5, pick: 4, finite: 'ancient_debris', drops: [d('ancient_debris', 1, 2)], xp: 5 },
  { id: 'hunt_brute', name: '挑战猪灵蛮兵', kind: 'hunt', cd: 24, hunger: 0.6, mob: 'piglin_brute' },
  { id: 'hunt_magma', name: '讨伐岩浆怪', kind: 'hunt', cd: 9, hunger: 0.4, mob: 'magma_cube' },
  { id: 'hunt_ghast', name: '讨伐恶魂', kind: 'hunt', cd: 12, hunger: 0.4, mob: 'ghast' },
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
  nether?: boolean
  renew?: string[]
}
export const BIOMES: Record<string, BiomeDef> = {
  forest: { id: 'forest', name: '森林', icon: '/textures/minecraft/oak_log.png', desc: '高大的橡树遮住了天空，林间散落着野果。', actions: ['chop', 'grass', 'forage', 'mine_stone', 'hunt_pig', 'hunt_spider', 'hunt_chicken', 'gather_egg'], res: { pig: [3, 7], chicken: [3, 5], eggs: [3, 5] }, renew: ['pig', 'chicken', 'eggs'], danger: 1, weight: 20 },
  plains: { id: 'plains', name: '平原', icon: '/textures/minecraft/grass_block.png', desc: '一望无际的草地，牛羊在远处漫步。', actions: ['grass', 'forage', 'chop', 'hunt_cow', 'hunt_sheep', 'shear_sheep', 'gather_pumpkin', 'gather_egg', 'harvest_comb', 'bottle_honey'], res: { cow: [3, 8], sheep: [3, 8], fleece: [4, 6], pumpkin: [4, 6], eggs: [3, 5], nectar: [4, 6] }, renew: ['cow', 'sheep', 'fleece', 'pumpkin', 'eggs', 'nectar'], danger: 0.8, weight: 18 },
  coast: { id: 'coast', name: '沙滩', icon: '/textures/minecraft/sand.png', desc: '潮水拍打着沙滩，岸边长着成片的甘蔗。', actions: ['fish', 'fish_deep', 'dig_sand', 'gather_cane', 'dig_clay'], res: {}, danger: 0.7, weight: 12 },
  swamp: { id: 'swamp', name: '沼泽', icon: '/textures/minecraft/lily_pad.png', desc: '浑浊的水面漂着睡莲，空气又湿又闷。', actions: ['chop', 'fish', 'gather_cane', 'grass', 'gather_mushrooms', 'dig_clay'], res: { mushrooms: [6, 9] }, renew: ['mushrooms'], danger: 1.4, weight: 8 },
  desert: { id: 'desert', name: '沙漠', icon: '/textures/minecraft/cactus.png', desc: '炽热的沙丘连绵起伏，岩缝里闪着金光。', actions: ['dig_sand', 'mine_stone', 'mine_gold'], res: { gold: [2, 6] }, danger: 1.2, weight: 8 },
  mountain: { id: 'mountain', name: '风袭丘陵', icon: '/textures/minecraft/stone.png', desc: '裸露的岩壁上能看到煤与铁的矿脉。', actions: ['mine_stone', 'mine_coal', 'mine_iron', 'mine_copper', 'mine_emerald', 'hunt_sheep', 'shear_sheep'], res: { coal: [10, 24], iron: [6, 14], emerald: [0, 3], sheep: [2, 5], fleece: [3, 6], copper: [10, 16] }, renew: ['sheep', 'fleece'], danger: 1, weight: 14 },
  cave: { id: 'cave', name: '洞穴', icon: '/textures/minecraft/coal_ore.png', desc: '深不见底的洞穴，黑暗中传来低沉的声响。', actions: ['mine_stone', 'mine_coal', 'mine_iron', 'mine_copper', 'mine_tuff', 'mine_lapis', 'mine_gold', 'mine_redstone', 'mine_diamond', 'mine_obsidian'], res: { coal: [8, 20], iron: [8, 18], copper: [10, 16], lapis: [2, 8], gold: [2, 8], redstone: [3, 9], diamond: [5, 8], obsidian: [6, 9] }, danger: 1.25, weight: 12 },
  snow: { id: 'snow', name: '雪原', icon: '/textures/minecraft/snow.png', desc: '白茫茫的冻土，云杉林覆盖着积雪。', actions: ['chop_spruce', 'fish', 'fish_deep', 'mine_stone'], res: {}, danger: 0.9, weight: 7 },
  village: { id: 'village', name: '村庄', icon: '/textures/minecraft/bell.png', desc: '炊烟升起，村民们打量着你这个外来者。', actions: ['gather_wheat', 'gather_vegetables', 'gather_pumpkin', 'gather_egg', 'grass', 'chop'], res: { wheat: [6, 12], vegetables: [5, 8], pumpkin: [3, 6], eggs: [3, 5] }, renew: ['wheat', 'vegetables', 'pumpkin', 'eggs'], danger: 0.4, weight: 7 },
  rift: { id: 'rift', name: '下界要塞', icon: '/textures/minecraft/nether_bricks.png', desc: '岩浆在脚下翻涌，烈焰人在热浪中游荡。', actions: ['mine_obsidian', 'mine_gold', 'hunt_blaze', 'hunt_wither', 'gather_wart', 'dig_soul_sand', 'mine_netherrack'], res: { obsidian: [6, 14], gold: [4, 10], nether_wart: [3, 6] }, renew: ['nether_wart'], danger: 2, weight: 0, nether: true },
  warped: { id: 'warped', name: '诡异森林', icon: '/textures/minecraft/warped_stem.png', desc: '蓝绿色的菌柄间，回荡着末影人的低鸣。', actions: ['hunt_ender'], res: {}, danger: 0, weight: 0, nether: true },
  altar: { id: 'altar', name: '要塞传送门房间', icon: '/textures/minecraft/end_portal_frame_top.png', desc: '地底深处的古老石室，十二个空洞的凹槽环绕着一座沉寂的传送门。', actions: ['mine_stone'], res: {}, danger: 1.5, weight: 0 },
  birch_grove: { id: 'birch_grove', name: '白桦森林', icon: '/textures/minecraft/birch_log.png', desc: '白桦间有野生蜂巢，带上营火和剪刀可以安全采收。', actions: ['chop_birch', 'forage', 'harvest_comb', 'bottle_honey'], res: { nectar: [5, 7] }, renew: ['nectar'], danger: 0.6, weight: 7 },
  taiga: { id: 'taiga', name: '针叶林', icon: '/textures/minecraft/spruce_log.png', desc: '云杉下有甜浆果与野生蘑菇。', actions: ['chop_spruce', 'gather_berries', 'gather_mushrooms', 'hunt_chicken', 'gather_egg'], res: { berries: [5, 8], mushrooms: [5, 8], chicken: [3, 6], eggs: [3, 6] }, renew: ['berries', 'mushrooms', 'chicken', 'eggs'], danger: 0.8, weight: 7 },
  jungle: { id: 'jungle', name: '丛林', icon: '/textures/minecraft/jungle_log.png', desc: '高树间生长着竹子、可可与西瓜。', actions: ['chop_jungle', 'gather_bamboo', 'gather_jungle_fruit', 'hunt_chicken'], res: { jungle_fruit: [5, 8], chicken: [3, 6] }, renew: ['jungle_fruit', 'chicken'], danger: 1.2, weight: 6 },
  mangrove: { id: 'mangrove', name: '红树林沼泽', icon: '/textures/minecraft/mangrove_log.png', desc: '水道之间是盘结的红树根与丰富的黏土。', actions: ['chop_mangrove', 'dig_clay', 'fish_deep', 'gather_mushrooms'], res: { mushrooms: [4, 7] }, renew: ['mushrooms'], danger: 1, weight: 0 },
  cherry_grove: { id: 'cherry_grove', name: '樱花树林', icon: '/textures/minecraft/cherry_log.png', desc: '山坡开满樱花，蜂巢挂在花林边缘。', actions: ['chop_cherry', 'harvest_comb', 'bottle_honey', 'forage'], res: { nectar: [5, 8] }, renew: ['nectar'], danger: 0.6, weight: 5 },
  geode: { id: 'geode', name: '紫水晶洞', icon: '/textures/minecraft/amethyst_block.png', desc: '紫水晶母岩会重新长出水晶簇。', actions: ['mine_amethyst', 'mine_stone', 'mine_tuff'], res: { amethyst: [4, 7] }, renew: ['amethyst'], danger: 0.7, weight: 0 },
  desert_ruin: { id: 'desert_ruin', name: '沙漠遗迹', icon: '/textures/minecraft/sandstone.png', desc: '砂岩废墟的可疑沙层保存着陶片，刷子可以安全清理。', actions: ['brush_ruin', 'dig_sand'], res: { suspicious: [5, 7] }, danger: 0.55, weight: 0 },
  trial_chamber: { id: 'trial_chamber', name: '试炼密室', icon: '/textures/minecraft/chiseled_tuff_bricks.png', desc: '凝灰岩走廊尽头有试炼刷怪笼和宝库。', actions: ['mine_tuff', 'mine_copper'], res: { copper: [6, 12] }, danger: 0, weight: 0 },
  ancient_city: { id: 'ancient_city', name: '远古城市', icon: '/textures/minecraft/sculk_catalyst.png', desc: '幽匿感测体会察觉脚步。铺羊毛搜索箱子，或主动挑战监守者。', actions: ['sneak_city', 'mine_sculk', 'hunt_warden'], res: {}, danger: 0, weight: 0 },
  nether_wastes: { id: 'nether_wastes', name: '下界荒地', icon: '/textures/minecraft/netherrack.png', desc: '下界岩下藏着远古残骸，空中传来恶魂的回声。', actions: ['mine_netherrack', 'mine_quartz', 'mine_ancient', 'gather_glowstone', 'hunt_ghast', 'hunt_magma'], res: { quartz: [9, 18], ancient_debris: [6, 10] }, danger: 1.2, weight: 0, nether: true },
  bastion: { id: 'bastion', name: '堡垒遗迹', icon: '/textures/minecraft/blackstone.png', desc: '黑石堆砌的遗迹由猪灵蛮兵驻守。', actions: ['mine_blackstone', 'mine_gold', 'hunt_brute', 'hunt_magma'], res: { gold: [7, 12] }, danger: 0.8, weight: 0, nether: true },
}
export const RES_NAMES: Record<string, string> = {
  pig: '猪', cow: '牛', sheep: '羊', coal: '煤矿', iron: '铁矿', gold: '金矿', lapis: '青金石',
  chicken: '鸡', eggs: '鸡蛋', fleece: '羊毛', nectar: '成熟蜂巢', vegetables: '菜地', jungle_fruit: '丛林果实',
  berries: '甜浆果', pumpkin: '南瓜', mushrooms: '蘑菇', copper: '铜矿', amethyst: '紫水晶簇', suspicious: '可疑的沙子',
  quartz: '下界石英矿', ancient_debris: '远古残骸', nether_wart: '下界疣', redstone: '红石', diamond: '钻石', emerald: '绿宝石', obsidian: '黑曜石', wheat: '麦田',
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
  chicken: { id: 'chicken', name: '鸡', icon: '/textures/minecraft/mob_chicken.png', hp: 4, atk: 0, xp: 1, drops: [d('chicken', 1, 2), d('feather', 1, 2)] },
  breeze: { id: 'breeze', name: '旋风人', icon: '/textures/minecraft/mob_breeze.png', hp: 36, atk: 5, xp: 12, drops: [d('breeze_rod', 2, 3)] },
  warden: { id: 'warden', name: '监守者', icon: '/textures/minecraft/mob_warden.png', hp: 160, atk: 10, xp: 65, drops: [d('sculk_catalyst', 1, 1)] },
  piglin_brute: { id: 'piglin_brute', name: '猪灵蛮兵', icon: '/textures/minecraft/mob_piglin_brute.png', hp: 54, atk: 7, xp: 16, drops: [d('gold', 2, 4)] },
  magma_cube: { id: 'magma_cube', name: '岩浆怪', icon: '/textures/minecraft/mob_magma_cube.png', hp: 25, atk: 4, xp: 7, drops: [d('magma_cream', 1, 2)] },
  ghast: { id: 'ghast', name: '恶魂', icon: '/textures/minecraft/mob_ghast.png', hp: 30, atk: 6, xp: 9, drops: [d('ghast_tear', 1, 2), d('gunpowder', 1, 2)] },
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
  tool?: string
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
  { id: 'market_garden', name: '菜园', icon: '/textures/minecraft/carrot.png', desc: '菜农岗位 +2，种植胡萝卜、马铃薯、甜菜根和南瓜', cost: { plank: 18, carrot: 4, potato: 4, beetroot: 4 }, need: 'carrot', job: 'vegetable_grower', slots: 2 },
  { id: 'apiary', name: '蜂场', icon: '/textures/minecraft/beehive.png', desc: '养蜂人岗位 +2，持续收集蜜脾', cost: { plank: 12, honeycomb: 6 }, need: 'honeycomb', tool: 'campfire', job: 'beekeeper', slots: 2 },
  { id: 'henhouse', name: '鸡舍', icon: '/textures/minecraft/egg.png', desc: '养鸡人岗位 +2，收集鸡蛋、鸡肉与羽毛', cost: { plank: 24, wheat: 12, egg: 4 }, need: 'egg', job: 'poultry_keeper', slots: 2 },
  { id: 'copper_mine', name: '铜矿工棚', icon: '/textures/minecraft/raw_copper.png', desc: '铜矿工岗位 +2，开采粗铜和凝灰岩', cost: { plank: 30, copper: 8, tuff_bricks: 20 }, need: 'copper', job: 'copper_miner', slots: 2 },
  { id: 'sniffer_pen', name: '嗅探兽围栏', icon: '/textures/minecraft/sniffer_egg.png', desc: '照料员岗位 +2，收集火把花种子和瓶子草荚果', cost: { plank: 30, torchflower_seed: 1, pitcher_pod: 1, brick_block: 8 }, need: 'torchflower_seed', job: 'sniffer_keeper', slots: 2 },
  { id: 'greenhouse', name: '温室', icon: '/textures/minecraft/tinted_glass.png', desc: '农业岗位产量 +20%，冬季作物效率最低为 100%', cost: { tinted_glass: 12, honey_block: 4, brick_block: 20, torchflower: 2, pitcher: 2 }, need: 'tinted_glass', limit: 2 },
  { id: 'cultural_hall', name: '陶艺展馆', icon: '/textures/minecraft/decorated_pot.png', desc: '每次交易额外获得 1 声望', cost: { pot: 2, brick_block: 16, copper: 6 }, need: 'pot', limit: 1 },
  { id: 'crafter', name: '自动合成工坊', icon: '/textures/minecraft/crafter.png', desc: '可增开一条红石产线，解锁涂蜡、甜点和紫珀加工', cost: { iron: 10, quartz: 6, waxed_copper: 2, copper_bulb: 4, lightning_rod: 1 }, need: 'copper_bulb', limit: 2 },
  { id: 'harbor', name: '潮涌港口', icon: '/textures/minecraft/sea_lantern.png', desc: '海洋远征用时 −20%，解锁海绵烘干架', cost: { prismarine: 10, sea_lantern: 2, sponge: 4, plank: 24 }, need: 'prismarine_shard', limit: 1 },
  { id: 'sculk_station', name: '幽匿感测站', icon: '/textures/minecraft/sculk_sensor.png', desc: '村庄防御 +8，所有远征用时 −15%', cost: { sculk_sensor: 4, sculk: 16, sculk_catalyst: 1, amethyst_block: 4 }, need: 'sculk_sensor', limit: 1 },
  { id: 'end_store', name: '末地货栈', icon: '/textures/minecraft/shulker_box.png', desc: '村庄产物储量上限 +1800', cost: { shulker_box: 3, purpur: 24, end_stone: 18, glowstone: 6 }, need: 'purpur' },
  { id: 'nether_forge', name: '黑石锻坊', icon: '/textures/minecraft/blackstone.png', desc: '熔炼每秒推进 2 秒，缩短远古残骸的处理时间', cost: { blackstone: 36, quartz: 12, glowstone: 4, iron: 14 }, need: 'blackstone', limit: 1 },
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
  { id: 'vegetable_grower', name: '菜农', icon: '/textures/minecraft/beetroot.png', out: { carrot: 0.07, potato: 0.08, beetroot: 0.08, pumpkin: 0.03 }, desc: '照料四季菜地' },
  { id: 'beekeeper', name: '养蜂人', icon: '/textures/minecraft/honeycomb.png', out: { honeycomb: 0.06 }, desc: '用营火的烟雾安全采蜜' },
  { id: 'poultry_keeper', name: '养鸡人', icon: '/textures/minecraft/mob_chicken.png', out: { egg: 0.08, feather: 0.035, chicken: 0.04 }, desc: '喂养家禽' },
  { id: 'copper_miner', name: '铜矿工', icon: '/textures/minecraft/copper_ingot.png', out: { copper_ore: 0.075, tuff: 0.08 }, desc: '开采铜矿和凝灰岩' },
  { id: 'sniffer_keeper', name: '照料员', icon: '/textures/minecraft/torchflower_seeds.png', out: { torchflower_seed: 0.025, pitcher_pod: 0.025 }, desc: '照料嗅探兽并收集它挖到的种子' },
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
  { id: 't_carrot', give: { carrot: 18 }, get: { emerald: 1 } },
  { id: 't_potato', give: { potato: 18 }, get: { emerald: 1 } },
  { id: 't_cookie', give: { emerald: 1 }, get: { cookie: 12 } },
  { id: 't_copper', give: { copper: 8 }, get: { emerald: 1 }, need: 'smithy' },
  { id: 't_nautilus', give: { emerald: 3 }, get: { nautilus: 1 }, need: 'market' },
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
