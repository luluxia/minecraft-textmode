import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ITEM_LIST, ITEMS, RECIPES, SMELTS, MOBS, BIOMES, BUILDINGS, JOBS, ACTIONS, TRADES, FUELS } from '../src/game/data.ts'
const root = new URL('../', import.meta.url)
const bag = (entries) => { for (const id of Object.keys(entries)) assert.ok(ITEMS[id], `Unknown item: ${id}`) }
for (const entry of [...ITEM_LIST, ...Object.values(MOBS), ...Object.values(BIOMES), ...BUILDINGS, ...JOBS]) {
 const path = fileURLToPath(new URL('public' + entry.icon, root))
 assert.ok(existsSync(path), `Missing texture: ${entry.name}: ${path}`)
 assert.equal(readFileSync(path).subarray(0,8).toString('hex'), '89504e470d0a1a0a', `Invalid PNG: ${path}`)
}
for (const recipe of RECIPES) { bag(recipe.cost); assert.ok(ITEMS[recipe.out]) }
for (const smelt of SMELTS) { assert.ok(ITEMS[smelt.from]); assert.ok(ITEMS[smelt.out]) }
for (const mob of Object.values(MOBS)) for (const drop of mob.drops) assert.ok(ITEMS[drop.item])
for (const biome of Object.values(BIOMES)) for (const action of biome.actions) assert.ok(ACTIONS[action])
for (const b of BUILDINGS) bag(b.cost)
for (const job of JOBS) bag(job.out)
for (const trade of TRADES) { bag(trade.give); bag(trade.get) }
assert.equal(SMELTS.find(s=>s.from==='wood').out, 'charcoal')
assert.equal(FUELS.charcoal, FUELS.coal)
assert.equal(MOBS.pig.drops[0].item, 'porkchop')
assert.equal(MOBS.cow.drops[0].item, 'meat')
assert.ok(MOBS.sheep.drops.some(d=>d.item==='mutton'))
for (const raw of ['porkchop','meat','mutton','fish']) assert.ok(SMELTS.some(s=>s.from===raw))
assert.equal(RECIPES.find(r=>r.out==='armor_iron').cost.iron,8)
assert.equal(RECIPES.find(r=>r.out==='map').cost.compass,1)
console.log(`Validated ${ITEM_LIST.length} items, all textures, recipes, smelts, drops, buildings and trades.`)
const { migrateMinecraftNames } = await import('../src/game/migrate.ts')
const old = { inv: { pearl: 12, iron_ore: 16 }, locs: { 1: { name: '虚空祭坛' } }, log: [{ text: '获得虚空珍珠' }], combat: { lines: ['炽焰灵出现了！'] }, flags: { portal: true } }
const result = migrateMinecraftNames(structuredClone(old))
assert.deepEqual(result.inv, old.inv)
assert.deepEqual(result.flags, old.flags)
assert.equal(result.locs[1].name, '要塞传送门房间')
assert.equal(result.log[0].text, '获得末影珍珠')
assert.equal(result.combat.lines[0], '烈焰人出现了！')
assert.deepEqual(migrateMinecraftNames(structuredClone(result)), result)
console.log('Save migration preserves inventory/progression and is idempotent.')
