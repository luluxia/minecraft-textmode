import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/minecraft/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/minecraft/select'
import { Button } from '../components/minecraft/button'
import { Texture } from './Texture'
import { ACTIONS, BIOMES, EYES_NEEDED, ITEM_LIST, ITEMS, itemCostText } from '../game/data'
import { BARTER_COST, EXCAVATION_COST, EXPEDITIONS, MAX_AIR, NETHER_COST, PLANTS, RESPAWN_COST, SURVEY_COST, TRIAL_VAULTS, WATER_BREATHING_SECONDS, WITHER_COST } from '../game/progression'
import { JOURNEY_COST, LEADS, NEARBY_COST, RETURN_COST, SITES } from '../game/exploration'
import {
  ALLAY_ITEMS, CAMP_COOK, SHELTER_COST, available, actionAllowed, actionLock, atHome, canAfford, canBreatheUnderwater, canCampHere, canDiveHere, canSurvey, count, curLoc, diveLock, canRetreat, hasConduitPower, inNether,
  availableActions, canExploreNearby, canInviteVillager, expeditionLock, explorerMapChoices, foundSites, invitationCost, isNight, locationLeads,
  locationCap, mineResources, pickTier, survivedIndependently, travelAllowed, useGame, wildlifeLock, wildlifeVisible,
} from '../game/store'
import { LocationName, ActionTitle, Btn, Cost, EntryHeader, Section, bagText } from './kit'
import { WILDLIFE } from '../game/wildlife'
import { hasStock } from '../game/inventory'
import { ActionGrid } from './ActionGrid'
import { LocationStorage } from './LocationStorage'
import { useScrollReset } from './ScrollArea'

export function Adventure({ onFirstChop }: { onFirstChop?: () => void }) {
  const s = useGame()
  const [tab, setTab] = useState('gather')
  const [biomeFilter, setBiomeFilter] = useState('all')
  const resetScroll = useScrollReset()
  const moveFromMap = (move: () => void) => {
    const previousLocation = useGame.getState().locId
    move()
    if (useGame.getState().locId !== previousLocation) {
      resetScroll()
      setTab('gather')
    }
  }
  const loc = curLoc(s)
  const biome = BIOMES[loc.biome]
  const tier = pickTier(s)
  const night = isNight(s.minute)
  const busy = !!s.combat
  const nether = inNether(loc)
  const fireWard = (s.cds.fire_ward?.until ?? 0) > Date.now()
  const breathing = canBreatheUnderwater(s)

  const actions = availableActions(loc).filter((id) => actionAllowed(s, id))
  const wildlife = s.flags.explore ? wildlifeVisible(s) : []
  const leads = locationLeads(loc).filter((id) => LEADS[id].destinations.some((dest) => !!BIOMES[dest].nether === nether))
  const discovered = foundSites(loc)
  const nearby = SITES[loc.sites?.[loc.discovered ?? 0] ?? '']
  const locationDescription = [
    biome.desc,
    discovered.length ? '附近发现了' + discovered.map((id) => SITES[id].name).join('、') + '。' : '',
    nearby ? nearby.hint + '。' : '',
  ].join('')
  const hasExplorerMap = !nether && count(s, 'explorer_map') > 0
  const protectedLoc = ['altar', 'rift', 'warped'].includes(loc.biome)
  const prepared = survivedIndependently(s)
  const divingIssue = diveLock(s)
  const canDive = canDiveHere(s)
  const canDigTreasure = !s.submerged && canDive && available(s, 'treasure_map') > 0
  const canOpenMine = !s.submerged && tier >= 2 && mineResources(loc).length > 0
  const storagePending = hasStock(loc.pending)
  const canOpenStorage = !!s.flags.explore || locationCap(s, loc) > 0 || storagePending
  const incubation = EXPEDITIONS.find((entry) => entry.id === 'hatch_sniffer')!
  const camp = atHome(s) && count(s, 'campfire') > 0
  const foods = ITEM_LIST.filter((i) => i.food && count(s, i.id) > 0)
  const places = Object.values(s.locs)
  const recorded = places.filter((place) => place.saved)
  const biomeTypes = [...new Set(recorded.map((place) => place.biome))]
    .sort((a, b) => BIOMES[a].name.localeCompare(BIOMES[b].name, 'zh-CN'))
  const filter = biomeTypes.includes(biomeFilter) ? biomeFilter : 'all'
  const previous = s.previousLocId === null ? undefined : s.locs[s.previousLocId]
  const travelButton = (place: typeof loc, label: string) => {
    const here = place.id === loc.id
    const access = travelAllowed(s, place)
    const tired = s.hunger < RETURN_COST
    const retreat = canRetreat(s, place.id)
    const detail = here ? '当前位置' : !access ? '需经家中传送门' :
      tired ? retreat ? '疲惫撤回' : '饱食不足' : '饱食 −' + RETURN_COST
    return <Btn key={place.id} cd="move" disabled={here || busy || !access || (tired && !retreat)}
      onClick={() => moveFromMap(() => s.travel(place.id))} sub={detail}>
      <Texture src={BIOMES[place.biome].icon} /> <LocationName name={label} />
    </Btn>
  }
  const unmarkedStock = places.filter((place) => place.id !== loc.id && !place.saved &&
    !place.shelter && (hasStock(place.stock) || hasStock(place.pending)))
  const tabs = [
    { id: 'gather', label: '采集', available: true },
    { id: 'map', label: '地图', available: s.flags.explore },
    { id: 'storage', label: '储存', available: canOpenStorage },
    { id: 'survival', label: '生存', available: s.flags.explore || s.flags.status },
    { id: 'dimensions', label: '维度', available: tier >= 3 || s.flags.nether || s.flags.eye || loc.biome === 'altar' },
  ].filter((entry) => entry.available)
  const currentTab = tabs.some((entry) => entry.id === tab) ? tab : 'gather'

  return (
    <Tabs className="adventure" value={currentTab} onValueChange={(value) => { resetScroll(); setTab(String(value)) }}>
      {tabs.length > 1 && <TabsList className="subtabs" aria-label="冒险页面">
        {tabs.map(({ id, label }) => (
          <TabsTrigger key={id} value={id} data-storage-pending={id === 'storage' && storagePending ? 'true' : undefined}
            aria-label={id === 'storage' && storagePending ? '储存，有待领取物资' : label}>{label}</TabsTrigger>
        ))}
      </TabsList>}
      <TabsContent value="gather" className="gather-panel">
        {s.flags.explore && (
          <Section title="当前位置">
            <div className="location-heading">
              <span className="loc-name icon-text"><Texture src={biome.icon} /> <LocationName name={loc.name} />{s.submerged && ' · 海底'}</span>
              <div className="location-status">
                {loc.shelter && !s.submerged && <span className="tag g">{loc.id === s.homeId ? '家' : '补给点'}</span>}
                {loc.saved && <span className="tag y">已记录</span>}
                {night && !loc.shelter && <span className="tag">夜晚</span>}
              </div>
            </div>
            <p className="dim sm location-description">{s.submerged ? '水下' : locationDescription}</p>
            {!s.submerged && (nearby || hasExplorerMap) && (
              <ActionGrid className="location-actions">
                {nearby && <Btn cd="nearby" disabled={!canExploreNearby(s)} onClick={s.exploreNearby}
                  sub={'饱食 −' + NEARBY_COST}>探索附近</Btn>}
                {hasExplorerMap && <Btn disabled={busy || !explorerMapChoices(loc).length}
                  onClick={s.readExplorerMap}>查看探险家地图</Btn>}
              </ActionGrid>
            )}
          </Section>
        )}

        {canDive && (
          <Section title="潜水">
            {s.submerged && !breathing && <p className="notice">每秒消耗 1 点空气，水下行动额外耗气。空气耗尽后每秒受到 2 点溺水伤害。</p>}
            <ActionGrid>
              {s.submerged
                ? <Btn onClick={s.surface}>上浮换气</Btn>
                : <Btn disabled={busy || !!divingIssue || s.air < MAX_AIR} onClick={s.dive}
                  sub={divingIssue || (s.air < MAX_AIR ? '正在换气' : '空气 ' + MAX_AIR)}>潜入海底</Btn>}
              {count(s, 'water_breathing') > 0 && !hasConduitPower(s) && (
                <Btn cd="drink" disabled={breathing || busy} onClick={s.drinkWaterBreathing}
                  sub={breathing ? '水下呼吸生效中' : '持续 ' + WATER_BREATHING_SECONDS + ' 秒'}>饮用水肺药水</Btn>
              )}
            </ActionGrid>
          </Section>
        )}
        {(actions.length > 0 || canDigTreasure || canOpenMine) && <Section title="当地行动">
          <ActionGrid>
            {actions.map((id) => {
              const a = ACTIONS[id]
              const lock = actionLock(s, a)
              const quantity = a.finite ? (loc.res[a.finite] ?? 0) : undefined
              const detail = lock || [a.cost && itemCostText(a.cost, a.name), a.diveAir && !breathing && `空气 −${a.diveAir}`].filter(Boolean).join(' · ')
              return (
                <Btn key={id} cd={id} disabled={busy || !!lock} onClick={() => {
                  const firstChop = id === 'chop' && !useGame.getState().flags.inv
                  s.act(id)
                  if (firstChop && useGame.getState().flags.inv) onFirstChop?.()
                }}
                  sub={detail}>
                  <ActionTitle name={a.name} quantity={quantity} />
                </Btn>
              )
            })}
            {canOpenMine && (
              <Btn cd="survey" disabled={busy || !canSurvey(s) || !canAfford(s, SURVEY_COST)}
                onClick={s.survey} sub={(loc.shaftsLeft ?? 1) > 0 ? itemCostText(SURVEY_COST) : '矿道已探尽'}>开拓矿道</Btn>
            )}
            {canDigTreasure && <Btn cd="treasure" disabled={busy || s.expedition?.id === 'buried_treasure'}
              onClick={s.digTreasure} sub={itemCostText({ treasure_map: 1 })}>寻找埋藏的宝箱</Btn>}
          </ActionGrid>
        </Section>}
        {wildlife.length > 0 && (
          <Section title="附近的生物">
            <ActionGrid>
              {wildlife.map((id) => {
                const encounter = WILDLIFE[id]
                const locked = wildlifeLock(s, id)
                return <Btn key={id} cd={'wildlife_' + id} disabled={busy || !!locked}
                  onClick={() => s.interactWildlife(id)} sub={locked || (itemCostText(encounter.cost ?? {}, encounter.action) || encounter.name)}>{encounter.action}</Btn>
              })}
            </ActionGrid>
          </Section>
        )}
        <SiteTasks />
        {!s.submerged && s.flags.allay && (
          <Section title="悦灵">
            <div className="actions">
              <Select value={s.allayTarget ?? 'none'} onValueChange={(value) => s.assignAllay(value === 'none' ? null : value)}>
                <SelectTrigger className="btn gather-select" aria-label="悦灵收集目标">
                  <SelectValue>{s.allayTarget ? ITEMS[s.allayTarget].name : '选择收集目标'}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} sideOffset={4}>
                  <SelectItem value="none">暂停收集</SelectItem>
                  {ALLAY_ITEMS.map((id) => <SelectItem key={id} value={id}>{ITEMS[id].name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Section>
        )}
      </TabsContent>

      {canOpenStorage && <TabsContent value="storage">
        {unmarkedStock.length > 0 && !s.submerged && <Section title="遗留物资">
          <ActionGrid>{unmarkedStock.map((place) => travelButton(place, place.name))}</ActionGrid>
        </Section>}
        <LocationStorage onOpenMap={() => { resetScroll(); setTab('map') }} />
      </TabsContent>}

      {s.flags.explore && <TabsContent value="map">
        {s.submerged ? <Section title="移动">
          <p className="notice">上浮后可以前往其他地点。</p>
          <ActionGrid><Btn onClick={s.surface}>上浮换气</Btn></ActionGrid>
        </Section> : (
        <>
          <Section title="远行" extra={<LocationName name={loc.name} />}>
            <ActionGrid>
              {[undefined, ...leads].map((id) => {
                const cost = id === undefined ? JOURNEY_COST : LEADS[id].hunger
                return <Btn key={id ?? 'free'} cd="move" disabled={busy || s.hunger < cost}
                  onClick={() => moveFromMap(() => s.explore(id))} sub={'饱食 −' + cost}>
                  {id === undefined ? '自由探索' : LEADS[id].action}
                </Btn>
              })}
              {previous && !previous.saved && previous.id !== s.homeId && previous.id !== loc.id &&
                travelButton(previous, '原路折返')}
              {s.flags.waypoint && !loc.saved && <Btn disabled={busy} onClick={s.saveLoc}>记录当前位置</Btn>}
              {s.flags.waypoint && loc.marked && !loc.shelter && !protectedLoc && (
                <Btn disabled={busy || !!loc.commissioned || s.furnace.job?.locId === loc.id || hasStock(loc.stock) || hasStock(loc.pending)}
                  sub={s.furnace.job?.locId === loc.id ? '熔炼进行中' : hasStock(loc.stock) || hasStock(loc.pending) ? '还有物资' : undefined}
                  onClick={() => s.forgetLoc(loc.id)}>移除标记</Btn>
              )}
            </ActionGrid>
          </Section>
          {recorded.length > 0 && <Section title="已记录地点">
            {biomeTypes.length > 1 && (
              <div className="row recipe-filters" role="group" aria-label="按地形筛选地点">
                {['all', ...biomeTypes].map((id) => (
                  <Button key={id} className={`btn mini ${filter === id ? 'on' : ''}`}
                    aria-pressed={filter === id} onClick={() => setBiomeFilter(id)}>
                    {id === 'all' ? '全部' : BIOMES[id].name}
                  </Button>
                ))}
              </div>
            )}
            <ActionGrid>
              {recorded.filter((place) => filter === 'all' || place.biome === filter).map((place) =>
                travelButton(place, place.name))}
            </ActionGrid>
          </Section>}
        </>
        )}
      </TabsContent>}

      <TabsContent value="survival">
        {s.flags.status && (
          <Section
            title="生存"
            extra={
              <Button className={`btn mini ${s.autoEat ? 'on' : ''}`} onClick={s.toggleAutoEat} aria-pressed={s.autoEat}>
                自动进食：{s.autoEat ? '开' : '关'}
              </Button>
            }
          >
            {s.hunger < 5 && <p className="notice">饱食低于 5，采集和移动冷却延长 25%。</p>}
            {foods.length === 0 && <p className="notice">没有可以吃的东西。</p>}
            <ActionGrid>
              <Btn cd="rest" disabled={s.submerged || busy || s.hp >= 20} onClick={s.rest}
                sub={camp ? '回复 10 生命' : '回复 4 生命'}>休整</Btn>
              {foods.map((f) => (
                <Btn key={f.id} cd="eat" disabled={s.hunger >= 20} onClick={() => s.eat(f.id)} sub={`饱食 +${f.food}`}>
                  <ActionTitle name={'吃' + f.name} quantity={count(s, f.id)} />
                </Btn>
              ))}
              {count(s, 'potion') > 0 && <Btn cd="drink" disabled={s.hp >= 20} onClick={() => s.drink()} sub="回复 8 生命"><ActionTitle name="饮用治疗药水" quantity={count(s, 'potion')} /></Btn>}
              {count(s, 'fire_resistance') > 0 && <Btn cd="drink" disabled={busy || fireWard} onClick={() => s.drink('fire_resistance')} sub={fireWard ? '抗火生效中' : '持续 60 秒'}><ActionTitle name="饮用抗火药水" quantity={count(s, 'fire_resistance')} /></Btn>}
              {atHome(s) && count(s, 'bed') > 0 && (
                <Btn disabled={busy || !night} onClick={s.sleep} sub={night ? '跳过夜晚' : '只能在夜晚入睡'}>睡觉</Btn>
              )}
            </ActionGrid>
          </Section>
        )}

        {s.flags.explore && !s.submerged && s.homeId === null && loc.biome !== 'village' && canCampHere(loc) && (
          <Section title="安家">
            <article className="content-entry shelter-entry">
              <EntryHeader actions={<Btn disabled={busy || !canAfford(s, SHELTER_COST)} onClick={s.buildShelter}>建立庇护所</Btn>}>
                <span className="icon-text"><Texture src={ITEMS.bed.icon} /> 庇护所</span>
              </EntryHeader>
              <Cost cost={SHELTER_COST} />
            </article>
          </Section>
        )}

        {atHome(s) && (
          <Section title="营地">
            <ActionGrid>
              {PLANTS.filter((plant) => plant.id === 'wheat' || Object.keys(plant.cost).every((id) => s.seen[id])).map((plant) => (
                <Btn key={plant.id} disabled={busy || s.crop > 0 || !canAfford(s, plant.cost)} onClick={() => s.plant(plant.id)}
                  sub={s.crop && s.cropKind === plant.id
                    ? '成熟还需 ' + s.crop + ' 秒'
                    : itemCostText(plant.cost, plant.name)}>
                  播种{plant.name}
                </Btn>
              ))}
              {camp && CAMP_COOK.filter((recipe) => available(s, recipe.from) > 0).map((recipe) => (
                <Btn key={recipe.id} cd="cook" disabled={busy} onClick={() => s.cook(recipe.from)} sub={itemCostText({ [recipe.from]: 1 })}>
                  <ActionTitle name={'烤制' + ITEMS[recipe.out].name} quantity={available(s, recipe.from)} />
                </Btn>
              ))}
              {s.seen.sniffer_egg && !s.expeditions.hatch_sniffer && (
                <Btn disabled={busy || !!s.expedition || !!expeditionLock(s, incubation) || !canAfford(s, incubation.cost)}
                  onClick={() => s.launch(incubation.id)}
                  sub={s.expedition?.id === incubation.id ? '剩余 ' + s.expedition.left + ' 秒' : itemCostText(incubation.cost)}>
                  孵化嗅探兽
                </Btn>
              )}
            </ActionGrid>
            {canInviteVillager(s) && <article className="content-entry village-commission">
              <EntryHeader actions={<Btn disabled={busy || !prepared || !s.flags.metTraveler || !canAfford(s, invitationCost(s))}
                onClick={s.inviteVillager}>邀请入住</Btn>}>住民住房</EntryHeader>
              <Cost cost={invitationCost(s)} />
              {!prepared && <p className="notice">需要自己烹饪或收获一次作物，并带口粮远行。</p>}
              {prepared && !s.flags.metTraveler && <p className="notice">在附近探索或远行时结识旅人。</p>}
            </article>}
          </Section>
        )}
        {s.homeId !== null && !atHome(s) && <p className="notice">回到营地可播种、烹饪或使用床铺。</p>}
      </TabsContent>

      <TabsContent value="dimensions">
        {tier >= 3 && !s.flags.nether && !atHome(s) && (
          <p className="notice">{s.homeId === null ? '先在生存页建立庇护所，再建造下界传送门。' : '回到家中即可建造下界传送门。'}</p>
        )}
        {s.flags.nether && !inNether(loc) && (
          <p className="notice">在地图页从家的传送门前往下界要塞或诡异森林。</p>
        )}
        {((tier >= 3 && atHome(s) && !s.flags.nether) || (s.flags.nether && loc.biome === 'rift' && !s.flags.wither)) && (
          <Section title="下界">
            <article className="content-entry">
              <EntryHeader actions={s.flags.nether
                ? <Btn disabled={busy || (!s.flags.witherSummoned && !canAfford(s, WITHER_COST))} onClick={s.summonWither}>挑战凋灵</Btn>
                : <Btn disabled={busy || !canAfford(s, NETHER_COST)} onClick={s.buildNether}>建造下界传送门</Btn>
              }>
                <p className="sm dim">{s.flags.nether ? '用灵魂沙和三颗凋灵骷髅头颅召来凋灵。它的下界之星可以点亮信标。' : '在家搭建传送门，打通前往下界要塞和诡异森林的路线。'}</p>
              </EntryHeader>
              {(!s.flags.nether || !s.flags.witherSummoned) && <Cost cost={s.flags.nether ? WITHER_COST : NETHER_COST} />}
            </article>
          </Section>
        )}

        {s.flags.nether && inNether(loc) && (
          <Section title="猪灵交易">
            <article className="content-entry">
              <EntryHeader actions={
                <Btn cd="barter" disabled={busy || !canAfford(s, BARTER_COST)} onClick={s.barter}>递上金锭</Btn>
              }>
                <p className="sm dim">猪灵会用末影珍珠、黑曜石、石英或其他物资交换金锭。</p>
              </EntryHeader>
              <Cost cost={BARTER_COST} />
            </article>
          </Section>
        )}

        {!inNether(loc) && (s.flags.eye || loc.biome === 'altar') && (
          <Section title="末地">
            {s.flags.won && <p className="notice">末影龙已被击败。回到村庄，可组织远征探索末地外岛。</p>}
            {s.flags.altar && !s.flags.won && loc.biome !== 'altar' && (
              <p className="notice">要塞已定位。可在地图页前往要塞传送门房间。</p>
            )}
            <ActionGrid>
              {!s.flags.altar && (
                <Btn cd="eye" disabled={busy || count(s, 'eye') < 1} onClick={s.throwEye} sub={`已追踪 ${s.eyesThrown}/3`}>投掷末影之眼</Btn>
              )}
              {loc.biome === 'altar' && !s.flags.portal && (
                <Btn disabled={busy || count(s, 'eye') < 1} onClick={s.insertEyes} sub={`−${Math.min(count(s, 'eye'), EYES_NEEDED - s.altarEyes)} · ${s.altarEyes}/${EYES_NEEDED}`}>嵌入末影之眼</Btn>
              )}
              {loc.biome === 'altar' && s.flags.portal && !s.flags.won && (
                <Btn className="danger" disabled={busy} onClick={s.enterPortal} sub="护甲与熟食可帮助战斗，玻璃瓶可收集龙息">踏入传送门</Btn>
              )}
              {loc.biome === 'altar' && s.flags.portal && s.flags.won && (
                <Btn className="danger" disabled={busy || !canAfford(s, RESPAWN_COST)} onClick={s.enterPortal}
                  sub={itemCostText(RESPAWN_COST)}>复活末影龙</Btn>
              )}
            </ActionGrid>
          </Section>
        )}
      </TabsContent>
    </Tabs>
  )
}

function SiteTasks() {
  const s = useGame()
  const loc = curLoc(s)
  const busy = !!s.combat

  if (loc.biome === 'trial_chamber') {
    return (
      <Section title="试炼刷怪笼与宝库">
        <p className="notice">击败旋风人后可取得钥匙。开启普通宝库获得不祥之瓶，再用它挑战强化试炼。</p>
        <ActionGrid>
          <Btn cd="trial" disabled={busy} onClick={() => s.startTrial(false)}>开始试炼</Btn>
          <Btn cd="trial" disabled={busy || !s.flags.trialVault || count(s, 'ominous_bottle') < 1}
            onClick={() => s.startTrial(true)} sub={itemCostText({ ominous_bottle: 1 })}>开启不祥试炼</Btn>
        </ActionGrid>
        <div className="entry-grid trial-vaults">
          {TRIAL_VAULTS.map((vault) => (
            <article className="content-entry" key={vault.id}>
              <EntryHeader actions={
                <Btn cd="vault" disabled={busy || !canAfford(s, vault.cost)} onClick={() => s.openVault(vault.id === 'ominous')}>开启</Btn>
              }>
                <span>{vault.name}</span>
              </EntryHeader>
              <div className="item-flow">{bagText(vault.reward)}</div>
              <Cost cost={vault.cost} />
            </article>
          ))}
        </div>
      </Section>
    )
  }

  if (loc.biome === 'desert_ruin') {
    return (
      <Section title="考古">
        <ActionGrid>
          <Btn cd="excavation" disabled={busy || (loc.res.suspicious ?? 0) > 0 || !canAfford(s, EXCAVATION_COST)}
            onClick={s.searchDig} sub={itemCostText(EXCAVATION_COST)}>寻找下一片沙层</Btn>
        </ActionGrid>
      </Section>
    )
  }

  if (loc.biome === 'bastion') {
    return (
      <Section title="堡垒藏宝箱">
        <ActionGrid>
          <Btn disabled={busy || !!loc.lootTaken || !(loc.cleared || s.flags.bastionCleared)} onClick={s.openBastion} sub={!loc.cleared && !s.flags.bastionCleared ? '先击败猪灵蛮兵' : undefined}>{loc.lootTaken ? '宝箱已开启' : '取出锻造模板'}</Btn>
        </ActionGrid>
      </Section>
    )
  }

  return null
}
