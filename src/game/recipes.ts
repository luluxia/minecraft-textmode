import { ACTIONS, BIOMES, RECIPES, SMELTS, type Bag, type IngredientAlternatives, type Recipe } from './data'
import { materialOptions, whole } from './inventory'
import { available, availableActions, recipeStationReady, retainedLocation, type GameState } from './store'

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
const metalworking = ['iron_ore', 'iron', 'pick_iron', 'shield', 'compass', 'paper', 'map', 'brush', 'cane']

export function itemKnown(s: GameState, id: string) {
  return !!s.seen[id] || basics.includes(id) || (!!s.flags.explore && earlyTools.includes(id)) ||
    (!!s.flags.furnace && metalworking.includes(id))
}

export function recipeKnown(s: GameState, step: RecipeStep) {
  return itemKnown(s, step.out) || Object.keys(step.cost).every((id) => materialOptions(id, step.alternatives).some((item) => s.seen[item]))
}

export const recipeOptions = (s: GameState, item: string) =>
  steps.filter((step) => step.out === item && recipeKnown(s, step))
export const recipeUses = (s: GameState, item: string) => [...new Set(steps
  .filter((step) => Object.keys(step.cost).some((id) => materialOptions(id, step.alternatives).includes(item)) && recipeKnown(s, step))
  .map((step) => step.out))]
export const canUseStation = (s: GameState, station: RecipeStep['station']) =>
  station === 'furnace' ? available(s, 'furnace') > 0 : recipeStationReady(s, station)

const sourceHints: Record<string, string> = {
  wood: '从林地采集原木。',
  cobble: '用木镐开采露出的石料。森林和丘陵都可以找到。',
  iron_ore: '带石镐到丘陵或洞穴找铁矿。',
  redstone: '带铁镐寻找洞穴里的红石矿。',
  cane: '沿河岸、沼泽或海滩寻找甘蔗。',
  coal: '从石料或煤矿取得，也可烧制木炭作燃料。',
  wheat: '在营地播种小麦，或在有作物的地点采集。',
  string: '可从蜘蛛取得，也可以在有鱼的水域尝试钓鱼。',
  pearl: '挑战末影人，或在下界尝试交易。',
  amethyst: '沿岩层线索寻找紫水晶洞。',
  explorer_map: '检查废弃营地的物资或矿井中的矿车。',
}

export function itemSources(s: GameState, item: string) {
  const ids = materialOptions(item)
  const sites = Object.values(s.locs).filter((loc) => loc.id === s.locId || retainedLocation(loc))
  const names = sites.filter((loc) => availableActions(loc).some((id) => {
    const action = ACTIONS[id]
    return action?.drops?.some((drop) => ids.includes(drop.item))
  })).map((loc) => loc.name)
  const stored = sites.filter((loc) => s.locId !== loc.id &&
    ids.some((id) => whole(loc.stock?.[id] ?? 0) > 0)).map((loc) => loc.name)
  const locations = [...new Set(names)]
  if (!locations.length && s.seen[item]) {
    const biomes = Object.values(BIOMES).filter((biome) =>
      biome.actions.some((id) => ACTIONS[id]?.drops?.some((drop) => ids.includes(drop.item))))
    for (const biome of biomes.slice(0, 3)) if (biome.weight >= 6) locations.push(biome.name)
  }
  return { locations, stored, hint: sourceHints[item] }
}
