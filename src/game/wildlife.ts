import type { Bag } from './data'

interface Encounter {
  name: string
  action: string
  reward?: Bag
  cost?: Bag
  underwater?: boolean
  companion?: string
  observation?: boolean
  repeatable?: boolean
}

export const WILDLIFE: Record<string, Encounter> = {
  wolf: { companion: '在陆上并肩迎敌，攻击 +1。携带狼铠时，防御也 +1。', name: '狼', action: '用骨头驯服狼', cost: { bone: 2 } },
  ocelot: { name: '豹猫', action: '喂鱼取得豹猫信任', cost: { fish: 2 }, companion: '提前察觉动静，随机遇敌概率减半。' },
  mooshroom: { name: '哞菇', action: '从哞菇取得蘑菇煲', reward: { mushroom_stew: 1 }, cost: { bowl: 1 }, repeatable: true },
  horse: { companion: '陆上当地行动的饱食消耗减半。', name: '马', action: '驯马', cost: { apple: 2 } },
  donkey: { companion: '远行和返回地点的移动冷却缩短 30%。', name: '驴', action: '驯驴', cost: { apple: 2 } },
  camel: { companion: '从沙漠、热带草原或恶地出发远行时，饱食消耗减半。', name: '骆驼', action: '带骆驼同行', cost: { wheat: 2 } },
  armadillo: { name: '犰狳', action: '刷取犰狳鳞甲', reward: { armadillo_scute: 1 }, cost: {}, repeatable: true },
  dolphin: { name: '海豚', action: '喂海豚吃鱼寻找沉船', cost: { fish: 1 }, underwater: true },
  axolotl: { companion: '潜水时协助攻击，攻击 +1。', name: '美西螈', action: '用水桶装起美西螈', cost: { water_bucket: 1 } },
  nautilus_mob: { companion: '潜水时，自然耗氧速度减半。', name: '鹦鹉螺', action: '喂食并驯服鹦鹉螺', cost: { pufferfish: 1 }, underwater: true },
  sulfur_cube: { name: '硫磺立方体', action: '喂硫磺立方体石块开路', cost: { cobble: 1 }, repeatable: true },
  turtle: { observation: true, name: '海龟', action: '在沙滩观察海龟' },
  frog: { observation: true, name: '青蛙', action: '观察青蛙捕食' },
  panda: { observation: true, name: '熊猫', action: '观察竹林里的熊猫' },
  parrot: { observation: true, name: '鹦鹉', action: '观察林间的鹦鹉' },
  fox: { observation: true, name: '狐狸', action: '在林边观察狐狸' },
  goat: { observation: true, name: '山羊', action: '观察崖边的山羊' },
  polar_bear: { observation: true, name: '北极熊', action: '保持距离观察北极熊' },
  trader: { name: '流浪商人', action: '向流浪商人换种子', reward: { seed: 4, pumpkin: 1 }, cost: { emerald: 1 }, repeatable: true },
}

const habitats: Record<string, string[]> = {
  forest: ['wolf'],
  plains: ['horse', 'donkey'],
  village: ['trader'],
  taiga: ['wolf', 'fox'],
  dappled_forest: ['fox', 'wolf'],
  snow: ['polar_bear', 'fox'],
  mountain: ['goat'],
  jungle: ['panda', 'parrot', 'ocelot'],
  desert: ['camel'],
  savanna: ['armadillo', 'horse', 'donkey'],
  badlands: ['armadillo'],
  swamp: ['frog'],
  mangrove: ['frog'],
  coast: ['turtle', 'dolphin'],
  warm_ocean: ['dolphin', 'nautilus_mob'],
  deep_ocean: ['nautilus_mob'],
  cold_ocean: ['polar_bear', 'nautilus_mob'],
  mushroom_fields: ['mooshroom'],
  lush_caves: ['axolotl'],
  sulfur_caves: ['sulfur_cube'],
}

export function wildlifeAt(biome: string) {
  return habitats[biome] ?? []
}

export const companionIds = Object.keys(WILDLIFE).filter((id) => WILDLIFE[id].companion)
