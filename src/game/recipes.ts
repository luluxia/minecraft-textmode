import { ACTIONS, BIOMES, RECIPES, SMELTS, type Bag, type IngredientAlternatives, type Recipe } from './data'
import { materialOptions, whole } from './inventory'
import { count, availableActions, recipeStationReady, retainedLocation, type GameState } from './store'

export interface RecipeTarget {
  kind: 'craft' | 'smelt'
  id: string
}

export interface RecipeStep extends RecipeTarget {
  out: string
  amount: number
  cost: Bag
  alternatives?: IngredientAlternatives
  station: Recipe['station'] | 'furnace'
}

export const STATION_NAMES: Record<RecipeStep['station'], string> = {
  hand: '徒手', table: '工作台', brewing: '酿造台', smithing: '锻造台', furnace: '熔炉',
}

const steps: RecipeStep[] = [
  ...RECIPES.map((recipe): RecipeStep => ({
    kind: 'craft', id: recipe.id, out: recipe.out, amount: recipe.n, cost: recipe.cost,
    alternatives: recipe.alternatives, station: recipe.station,
  })),
  ...SMELTS.map((recipe): RecipeStep => ({
    kind: 'smelt', id: recipe.id, out: recipe.out, amount: 1, cost: { [recipe.from]: 1 }, station: 'furnace',
  })),
]

const basics = ['wood', 'plank', 'stick', 'table', 'cobble', 'campfire', 'pick_wood']
const earlyTools = ['pick_stone', 'furnace', 'torch', 'charcoal', 'bread', 'rod', 'bed', 'boat', 'chest']
const metalworking = ['iron_ore', 'iron', 'flint', 'flint_and_steel', 'pick_iron', 'shield', 'compass', 'paper', 'map', 'brush', 'cane']

export function itemKnown(s: GameState, id: string) {
  if (id === 'elytra' && s.flags.won) return true
  if (id === 'obsidian' && (s.seen.bucket || s.flags.site_ruined_portal)) return true
  if (id === 'water_bottle' && (s.seen.bottle || s.seen.brewing_stand)) return true
  return !!s.seen[id] || basics.includes(id) || (!!s.flags.explore && earlyTools.includes(id)) ||
    (!!s.flags.furnace && metalworking.includes(id))
}

export function recipeKnown(s: GameState, step: RecipeStep) {
  return (step.station === 'brewing' && !!s.seen.brewing_stand) || itemKnown(s, step.out) || Object.keys(step.cost).every((id) => materialOptions(id, step.alternatives).some((item) => s.seen[item]))
}

export const recipeOptions = (s: GameState, item: string) =>
  steps.filter((step) => step.out === item && recipeKnown(s, step))
export const recipeUses = (s: GameState, item: string) => [...new Set(steps
  .filter((step) => Object.keys(step.cost).some((id) => materialOptions(id, step.alternatives).includes(item)) && recipeKnown(s, step))
  .map((step) => step.out))]
export const canUseStation = (s: GameState, station: RecipeStep['station']) =>
  station === 'furnace' ? count(s, 'furnace') > 0 : recipeStationReady(s, station)

const sourceHints: Record<string, string> = {
  flint: '在沙滩、隐蔽河岸或洞穴的砂砾中寻找燧石。',
  obsidian: '在主世界用水冷却岩浆源。要把黑曜石收入背包，用钻石镐或下界合金镐开采。要建门，在采集页选择「就地浇筑一块门框」，也可以用背包里的黑曜石补齐。新门框需 10 块，废弃门框补 4 块，最后用打火石点燃。',
  elytra: '击败末影龙后，到村庄的「远征」页组织「搜寻末地船」。首次完成可获得鞘翅。',
  awkward_potion: '加入闪烁的西瓜片可酿治疗药水，加入河豚可酿水肺药水，加入岩浆膏可酿抗火药水。',
  blaze_powder: '可用来制作末影之眼，也可作为酿造台燃料。一份烈焰粉可酿 20 批。',
  glistering_melon_slice: '西瓜片可在丛林采摘。',
  carved_pumpkin: '携带剪刀，在当地行动中雕刻南瓜。',
  copper_golem: '在当地行动中将雕刻南瓜放到铜块上。',
  axolotl_bucket: '在繁茂洞穴用水桶装起美西螈，在水边放出可成为伙伴并收回铁桶。',
  water_bottle: '携带玻璃瓶，在水边装水。',
  water_bucket: '在水边用铁桶取水。',
  lava_bucket: '在硫磺洞穴或下界用铁桶取岩浆。',
  wood: '从林地采集原木。',
  cobble: '用木镐开采露出的石料。森林和丘陵都可以找到。',
  iron_ore: '带石镐到丘陵或洞穴找铁矿。',
  redstone: '带铁镐寻找洞穴里的红石矿。',
  cane: '沿河岸、沼泽或海滩寻找甘蔗。',
  coal: '开采煤矿可得煤，挖掘石头时也有机会获得。',
  charcoal: '在熔炉中烧制原木可得到木炭。',
  wheat: '在营地播种小麦，或在有作物的地点采集。',
  string: '可从蜘蛛取得，也可以在有鱼的水域尝试钓鱼。',
  pearl: '挑战末影人，或在下界尝试交易。',
  amethyst: '沿岩层线索寻找紫水晶洞。',
  explorer_map: '检查废弃营地的物资或矿井中的矿车。',
}

export function itemSources(s: GameState, item: string) {
  const sites = Object.values(s.locs).filter((loc) => loc.id === s.locId || retainedLocation(loc))
  const names = sites.filter((loc) => (item === 'obsidian' && !!loc.cooledBlocks) || availableActions(loc).some((id) => {
    const action = ACTIONS[id]
    return action?.drops?.some((drop) => drop.item === item)
  })).map((loc) => loc.name)
  const stored = sites.filter((loc) => s.locId !== loc.id &&
    whole(loc.stock?.[item] ?? 0) > 0).map((loc) => loc.name)
  const locations = [...new Set(names)]
  if (!locations.length && s.seen[item]) {
    const biomes = Object.values(BIOMES).filter((biome) =>
      biome.actions.some((id) => ACTIONS[id]?.drops?.some((drop) => drop.item === item)))
    for (const biome of biomes.slice(0, 3)) if (biome.weight >= 6) locations.push(biome.name)
  }
  return { locations, stored, hint: sourceHints[item] }
}
