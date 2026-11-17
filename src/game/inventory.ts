import { ITEMS, type Bag } from './data'

export const PACK_LIMIT = 64
export const CHEST_LIMIT = 160
export const CHEST_COST: Bag = { chest: 1 }

const woodFamilies: Record<string, string[]> = {
  wood: ['wood', 'birch_log', 'spruce_log', 'jungle_log', 'mangrove_log', 'cherry_log', 'poplar_log'],
  plank: ['plank', 'birch_plank', 'spruce_plank', 'jungle_plank', 'mangrove_plank', 'cherry_plank', 'poplar_plank'],
}

const familyIds = Object.fromEntries(Object.entries(woodFamilies).flatMap(
  ([family, items]) => items.map((item) => [item, family]),
))

export const itemFamily = (item: string) => familyIds[item] ?? item
export const materialOptions = (item: string) => woodFamilies[item] ?? [item]
export const quantity = (bag: Bag | undefined, item: string) => bag?.[item] ?? 0
export const materialQuantity = (bag: Bag | undefined, item: string) =>
  materialOptions(item).reduce((total, id) => total + quantity(bag, id), 0)
export const whole = (n: number) => Math.floor(n + 1e-9)
export const carriesLimit = (item: string) => !['gear', 'tool', 'special'].includes(ITEMS[item]?.cat)
export const room = (bag: Bag | undefined, item: string, cap: number) =>
  Math.max(0, cap - materialQuantity(bag, itemFamily(item)))
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

export function planPayment(cost: Bag, ...bags: Bag[]): Bag[] | null {
  const payments: Bag[] = bags.map(() => ({}))
  // Reserve exact variants before allocating interchangeable materials.
  const items = Object.entries(cost).sort(([a], [b]) =>
    Number(materialOptions(a).length > 1) - Number(materialOptions(b).length > 1))
  for (const [item, amount] of items) {
    let needed = amount
    for (const [i, bag] of bags.entries()) {
      for (const variant of materialOptions(item)) {
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
