import { ITEMS, PICKS, type Bag, type IngredientAlternatives } from './data'

const armorTiers = ['leather', 'iron', 'diamond', 'netherite']
export const armorFamilies = ['armor', 'helmet', 'leggings', 'boots'].map(slot => armorTiers.map(tier => slot + '_' + tier))
const families = [PICKS, PICKS.map(id => id.replace('pick_', 'sword_')),
  ['axe_stone', 'axe_iron', 'axe_diamond', 'axe_netherite'], ...armorFamilies]

export function ownsUpgrade(bag: Bag, item: string) {
  const family = families.find(group => group.includes(item))
  return family ? family.slice(family.indexOf(item)).some(id => bag[id] > 0) : bag[item] > 0
}

export function consolidateGear(bag: Bag) {
  for (const family of families) {
    const best = family.filter(id => bag[id] > 0).pop()
    if (!best) continue
    bag[best] = 1
    for (const id of family.slice(0, family.indexOf(best))) delete bag[id]
  }
}

export const PACK_LIMIT = 64
export const CHEST_LIMIT = 160
export const CHEST_COST: Bag = { chest: 1 }

const woodFamilies: Record<string, string[]> = {
  wood: ['wood', 'birch_log', 'spruce_log', 'jungle_log', 'mangrove_log', 'cherry_log', 'poplar_log'],
  plank: ['plank', 'birch_plank', 'spruce_plank', 'jungle_plank', 'mangrove_plank', 'cherry_plank', 'poplar_plank'],
}

export const materialOptions = (item: string, alternatives?: IngredientAlternatives) =>
  alternatives?.[item] ?? woodFamilies[item] ?? [item]
export const quantity = (bag: Bag | undefined, item: string) => bag?.[item] ?? 0
export const materialQuantity = (bag: Bag | undefined, item: string, alternatives?: IngredientAlternatives) =>
  materialOptions(item, alternatives).reduce((total, id) => total + quantity(bag, id), 0)
export const whole = (n: number) => Math.floor(n + 1e-9)
export const carriesLimit = (item: string) => !['gear', 'tool', 'special'].includes(ITEMS[item]?.cat)
export const room = (bag: Bag | undefined, item: string, cap: number) =>
  Math.max(0, cap - quantity(bag, item))
export const hasStock = (bag: Bag | undefined) => Object.values(bag ?? {}).some((n) => n > 0)

export function addStock(bag: Bag, item: string, n: number) {
  if (n > 0) bag[item] = quantity(bag, item) + n
}

export function takeStock(bag: Bag, item: string, n: number) {
  const amount = Math.min(quantity(bag, item), n)
  if (!amount) return 0
  const remaining = quantity(bag, item) - amount
  if (remaining > 1e-9) bag[item] = remaining
  else delete bag[item]
  return amount
}

export function planPayment(cost: Bag, bags: Bag[], alternatives?: IngredientAlternatives): Bag[] | null {
  const payments: Bag[] = bags.map(() => ({}))
  // Reserve exact variants before allocating interchangeable materials.
  const items = Object.entries(cost).sort(([a], [b]) =>
    Number(materialOptions(a, alternatives).length > 1) - Number(materialOptions(b, alternatives).length > 1))
  for (const [item, amount] of items) {
    let needed = amount
    for (const [i, bag] of bags.entries()) {
      for (const variant of materialOptions(item, alternatives)) {
        const planned = Math.max(0, Math.min(needed, quantity(bag, variant) - quantity(payments[i], variant)))
        addStock(payments[i], variant, planned)
        needed -= planned
      }
    }
    if (needed > 1e-9) return null
  }
  return payments
}

export function applyPayment(payments: Bag[], ...bags: Bag[]) {
  for (const [i, bag] of bags.entries()) {
    for (const [item, amount] of Object.entries(payments[i])) takeStock(bag, item, amount)
  }
}
