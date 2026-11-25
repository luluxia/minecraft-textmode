import { pushLog } from './log'
import type { GameState, Loc, Village } from './store'

export type VillageLayout = Pick<Village, 'villagers' | 'buildings'>

const originalLayout: VillageLayout = { villagers: 1, buildings: { house: 1, farm: 1 } }
const workplaces = ['farm', 'lumber', 'fishery', 'pasture', 'mine']

function generateVillageLayout(): VillageLayout {
  const villagers = 1 + Math.floor(Math.random() * 4)
  const buildings: Village['buildings'] = { house: Math.ceil(villagers / 2) }
  const options = [...workplaces]
  const count = villagers >= 3 ? 2 : 1
  for (let i = 0; i < count; i++) {
    const [workplace] = options.splice(Math.floor(Math.random() * options.length), 1)
    buildings[workplace] = 1
  }
  return { villagers, buildings }
}

export function villageBeforeSettlement(loc: Loc): Village {
  const { villagers, buildings } = loc.villageLayout ?? originalLayout
  return { villagers, jobs: { farmer: 1 }, buildings: { ...buildings }, rep: loc.visitorRep ?? 0, founded: false, mayor: false }
}

export function arriveAtVillage(s: GameState) {
  const loc = s.locs[s.locId]
  if (loc.biome !== 'village') return
  if (!loc.villageLayout && !(s.village && loc.id === s.homeId)) loc.villageLayout = generateVillageLayout()
  s.flags.metTraveler = true
  if (!s.flags.metVillage) pushLog(s, '发现村庄。可以在村庄页与村民交流。', 'event')
  s.flags.metVillage = true
}

export function settleInVillage(s: GameState) {
  const loc = s.locs[s.locId]
  if (loc.biome !== 'village' || s.combat || s.submerged || s.village) return
  if (s.homeId !== null && s.homeId !== loc.id && s.crop > 0) {
    s.locs[s.homeId].growingCrop = true
  }
  loc.saved = true
  loc.shelter = true
  loc.stock ??= {}
  s.homeId = loc.id
  s.village = villageBeforeSettlement(loc)
  delete loc.visitorRep
  s.flags.joinedVillage = true
  s.flags.village = true
  pushLog(s, '你在村庄安顿下来。', 'good')
}
