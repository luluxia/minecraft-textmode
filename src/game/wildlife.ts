import type { Bag } from './data'

interface Encounter {
  name: string
  action: string
  cost?: Bag
  underwater?: boolean
  repeatable?: boolean
}

export const WILDLIFE: Record<string, Encounter> = {
  wolf: { name: '狼', action: '用骨头驯服', cost: { bone: 2 } },
  mooshroom: { name: '哞菇', action: '从哞菇取得蘑菇煲', cost: { bowl: 1 }, repeatable: true },
  horse: { name: '马', action: '驯马', cost: { apple: 2 } },
  donkey: { name: '驴', action: '驯驴', cost: { apple: 2 } },
  camel: { name: '骆驼', action: '带骆驼同行', cost: { wheat: 2 } },
  armadillo: { name: '犰狳', action: '刷取犰狳鳞甲', cost: {}, repeatable: true },
  dolphin: { name: '海豚', action: '喂鱼寻找沉船', cost: { fish: 1 }, underwater: true },
  axolotl: { name: '美西螈', action: '用铁桶带走美西螈', cost: { bucket: 1 } },
  nautilus_mob: { name: '鹦鹉螺', action: '喂食并驯服鹦鹉螺', cost: { pufferfish: 1 }, underwater: true },
  sulfur_cube: { name: '硫磺立方体', action: '喂石块开路', cost: { cobble: 1 }, repeatable: true },
  turtle: { name: '海龟', action: '在沙滩观察海龟' },
  frog: { name: '青蛙', action: '观察青蛙捕食' },
  panda: { name: '熊猫', action: '观察竹林里的熊猫' },
  parrot: { name: '鹦鹉', action: '观察林间的鹦鹉' },
  fox: { name: '狐狸', action: '在林边观察狐狸' },
  goat: { name: '山羊', action: '观察崖边的山羊' },
  polar_bear: { name: '北极熊', action: '保持距离观察北极熊' },
  trader: { name: '流浪商人', action: '交换种子', cost: { emerald: 1 }, repeatable: true },
}

const habitats: Record<string, string[]> = {
  forest: ['wolf'],
  plains: ['horse', 'donkey'],
  village: ['trader'],
  taiga: ['wolf', 'fox'],
  dappled_forest: ['fox', 'wolf'],
  snow: ['polar_bear', 'fox'],
  mountain: ['goat'],
  jungle: ['panda', 'parrot'],
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
