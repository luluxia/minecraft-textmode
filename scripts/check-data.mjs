import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ITEM_LIST, ITEMS, RECIPES, SMELTS, MOBS, BIOMES, BUILDINGS, JOBS, ACTIONS, TRADES, FUELS } from '../src/game/data.ts'
import { BARTER_COST, BARTER_OFFERS, EXPEDITIONS, LINES, NETHER_COST, ROUTES, SURVEY_COST, WITHER_COST } from '../src/game/progression.ts'
const root = new URL('../', import.meta.url)
const bag = (entries) => { for (const id of Object.keys(entries)) assert.ok(ITEMS[id], `Unknown item: ${id}`) }
const assetSources = JSON.parse(readFileSync(new URL('public/textures/minecraft/sources.json', root), 'utf8'))
const documentedTextures = new Set(
 [assetSources, ...Object.values(assetSources)].flatMap((group) => Object.keys(group?.textures ?? {}).map((name) => name + '.png')),
)
for (const entry of [...ITEM_LIST, ...Object.values(MOBS), ...Object.values(BIOMES), ...BUILDINGS, ...JOBS]) {
 const path = fileURLToPath(new URL('public' + entry.icon, root))
 assert.ok(existsSync(path), `Missing texture: ${entry.name}: ${path}`)
 assert.equal(readFileSync(path).subarray(0,8).toString('hex'), '89504e470d0a1a0a', `Invalid PNG: ${path}`)
 assert.ok(documentedTextures.has(entry.icon.split('/').at(-1)), `Missing texture source: ${entry.icon}`)
}
for (const entries of [ITEM_LIST, Object.values(MOBS)]) {
 const icons = new Set(entries.map((entry) => entry.icon))
 assert.equal(icons.size, entries.length, 'Different items or combat creatures should have distinct icons')
}
for (const recipe of RECIPES) { bag(recipe.cost); assert.ok(ITEMS[recipe.out]) }
for (const smelt of SMELTS) { assert.ok(ITEMS[smelt.from]); assert.ok(ITEMS[smelt.out]) }
for (const mob of Object.values(MOBS)) for (const drop of mob.drops) assert.ok(ITEMS[drop.item])
for (const biome of Object.values(BIOMES)) for (const id of biome.actions) {
 const action = ACTIONS[id]
 assert.ok(action, `Unknown action: ${id}`)
 if (action.finite) assert.ok(biome.res[action.finite], `Missing deposit: ${biome.id}/${action.finite}`)
 if (action.mob) assert.ok(MOBS[action.mob])
 if (action.tool) assert.ok(ITEMS[action.tool])
 for (const drop of action.drops ?? []) assert.ok(ITEMS[drop.item])
}
for (const b of BUILDINGS) bag(b.cost)
for (const job of JOBS) bag(job.out)
for (const trade of TRADES) { bag(trade.give); bag(trade.get) }
for (const route of ROUTES) assert.ok(BIOMES[route.biome])
for (const cost of [NETHER_COST, WITHER_COST, SURVEY_COST, BARTER_COST]) bag(cost)
for (const offer of BARTER_OFFERS) bag(offer.reward)
for (const line of LINES) { bag(line.input); bag(line.output); assert.ok(line.seconds > 0) }
for (const trip of EXPEDITIONS) { bag(trip.cost); bag(trip.reward); assert.ok(trip.seconds > 0) }
assert.equal(new Set(RECIPES.map(r => r.id)).size, RECIPES.length)
assert.ok(BIOMES.forest.actions.includes('mine_stone'))
assert.ok(BIOMES.cave.res.obsidian[0] * ACTIONS.mine_obsidian.drops[0].min >= NETHER_COST.obsidian)
assert.ok(BIOMES.cave.res.diamond[0] * ACTIONS.mine_diamond.drops[0].min >= RECIPES.find(r => r.out === 'pick_diamond').cost.diamond)
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
