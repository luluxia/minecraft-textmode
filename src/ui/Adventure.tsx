import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/minecraft/tabs'
import { Button } from '../components/minecraft/button'
import { Texture } from './Texture'
import { ACTIONS, BIOMES, EYES_NEEDED, ITEM_LIST, RES_NAMES, ITEMS } from '../game/data'
import { BARTER_COST, EXCAVATION_COST, NETHER_COST, PLANTS, RESPAWN_COST, ROUTES, SURVEY_COST, TRIAL_VAULTS, WITHER_COST } from '../game/progression'
import {
  CAMP_COOK, SHELTER_COST, actionAllowed, actionLock, atHome, canAfford, canCampHere, canSurvey, count, curLoc, inNether,
  isNight, mineResources, pickTier, routeReady, scoutAllowed, travelAllowed, useGame,
} from '../game/store'
import { Btn, Cost, EntryHeader, Section, bagText } from './kit'
import { useScrollReset } from './ScrollArea'

export function Adventure() {
  const s = useGame()
  const [tab, setTab] = useState('gather')
  const resetScroll = useScrollReset()
  const loc = curLoc(s)
  const biome = BIOMES[loc.biome]
  const tier = pickTier(s)
  const night = isNight(s.minute)
  const busy = !!s.combat
  const nether = inNether(loc)
  const fireWard = (s.cds.fire_ward?.until ?? 0) > Date.now()

  const actions = biome.actions.filter((id) => actionAllowed(s, id))
  const routes = ROUTES.filter((route) => !!route.nether === nether && (!route.newRoute || routeReady(s, route)) &&
    !Object.values(s.locs).some((place) => place.biome === route.biome && (place.saved || place.shelter)))
  const protectedLoc = ['altar', 'rift', 'warped'].includes(loc.biome)
  const camp = atHome(s) && count(s, 'campfire') > 0
  const foods = ITEM_LIST.filter((i) => i.food && count(s, i.id) > 0)
  const places = Object.values(s.locs).filter((l) => l.id !== s.locId)
  const resLeft = Object.entries(loc.res)
  const tabs = [
    { id: 'gather', label: '采集', available: true },
    { id: 'map', label: '地图', available: s.flags.explore },
    { id: 'survival', label: '生存', available: s.flags.explore || s.flags.status },
    { id: 'dimensions', label: '维度', available: tier >= 3 || s.flags.nether || s.flags.eye || loc.biome === 'altar' },
  ].filter((entry) => entry.available)
  const currentTab = tabs.some((entry) => entry.id === tab) ? tab : 'gather'

  return (
    <Tabs className="adventure" value={currentTab} onValueChange={(value) => { resetScroll(); setTab(String(value)) }}>
      {tabs.length > 1 && <TabsList className="subtabs" aria-label="冒险页面">
        {tabs.map(({ id, label }) => <TabsTrigger key={id} value={id} aria-label={label}>{label}</TabsTrigger>)}
      </TabsList>}
      <TabsContent value="gather">
        {s.flags.explore && (
          <Section title="当前位置">
            <div className="row">
              <span className="loc-name icon-text"><Texture src={biome.icon} /> {loc.name}</span>
              {loc.shelter && <span className="tag g">家</span>}
              {loc.saved && <span className="tag y">已记录</span>}
              {night && !loc.shelter && <span className="tag">夜晚</span>}
            </div>
            <p className="dim sm" style={{ marginTop: 4 }}>{biome.desc}</p>
            {resLeft.length > 0 && (
              <div className="row sm" style={{ marginTop: 6 }}>
                {resLeft.map(([k, n]) => (
                  <span key={k} className={`tag ${n > 0 ? '' : 'bad'}`}>{RES_NAMES[k] ?? k} 剩余 {n}</span>
                ))}
              </div>
            )}
          </Section>
        )}

        <Section title="行动">
          <div className="actions">
            {actions.map((id) => {
              const a = ACTIONS[id]
              const lock = actionLock(s, a)
              return (
                <Btn key={id} cd={id} disabled={busy || !!lock} onClick={() => s.act(id)} sub={lock || undefined}>
                  {a.name}
                </Btn>
              )
            })}
            {tier >= 2 && mineResources(loc).length > 0 && (
              <Btn cd="survey" disabled={busy || !canSurvey(s) || !canAfford(s, SURVEY_COST)}
                onClick={s.survey} sub="消耗 4 火把 · 补充矿脉">开拓矿道</Btn>
            )}
          </div>
        </Section>
        <SiteTasks />

      </TabsContent>

      {s.flags.explore && <TabsContent value="map">
        <Section title="移动" extra={loc.name}>
          <div className="actions move-actions">
            {!nether && <Btn cd="move" disabled={busy} onClick={s.explore} sub={!loc.saved && !loc.shelter ? '将丢失当前地点' : '随机前往新地点'}>
              探索
            </Btn>}
            {routes.map((route) => (
              <Btn key={route.biome} cd="move" disabled={busy || !scoutAllowed(s, route.biome)} onClick={() => s.scout(route.biome)}
                sub={routeReady(s, route) ? '首次到达后记住路线' : '需要' + route.requirement}>
                {route.name}
              </Btn>
            ))}
            {s.flags.waypoint && !loc.saved && (
              <Btn onClick={s.saveLoc} sub="写入地图">记录地点</Btn>
            )}
            {places.filter((l) => !nether || l.shelter || inNether(l)).map((l) => (
              <Btn key={l.id} cd="move" disabled={busy || !travelAllowed(s, l)} onClick={() => s.travel(l.id)}
                sub={l.shelter ? '回家' : !travelAllowed(s, l) ? '从家的传送门进入' : BIOMES[l.biome].name}>
                <Texture src={BIOMES[l.biome].icon} /> {l.name}
              </Btn>
            ))}
            {s.flags.waypoint && loc.saved && !loc.shelter && !protectedLoc && (
              <Btn onClick={() => s.forgetLoc(loc.id)}>从地图上抹去此地</Btn>
            )}
          </div>
          {!s.flags.waypoint && !nether && (
            <p className="notice" style={{ marginTop: 8 }}>
              定向勘察会留下路标。带上地图，便能记下自由探索时遇到的地点。
            </p>
          )}
        </Section>
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
            <div className="actions">
              <Btn cd="rest" disabled={busy || (s.hp >= 20 && s.hunger >= 8)} onClick={s.rest}
                sub={camp ? '回复 10 生命 · 补至 8 饱食' : '回复 4 生命 · 补至 8 饱食'}>休整</Btn>
              {foods.length === 0 && <span className="dim sm">没有可以吃的东西。</span>}
              {foods.map((f) => (
                <Btn key={f.id} cd="eat" disabled={s.hunger >= 20} onClick={() => s.eat(f.id)} sub={`饱食 +${f.food} · 余 ${count(s, f.id)}`}>
                  吃{f.name}
                </Btn>
              ))}
              {count(s, 'potion') > 0 && <Btn cd="drink" disabled={s.hp >= 20} onClick={() => s.drink()} sub="回复 8 生命">饮用治疗药水</Btn>}
              {count(s, 'fire_resistance') > 0 && <Btn cd="drink" disabled={busy || fireWard} onClick={() => s.drink('fire_resistance')} sub={fireWard ? '抗火生效中' : '持续 60 秒'}>饮用抗火药水</Btn>}
              {atHome(s) && count(s, 'bed') > 0 && (
                <Btn disabled={busy || !night} onClick={s.sleep} sub={night ? '跳过夜晚' : '只能在夜晚入睡'}>睡觉</Btn>
              )}
            </div>
          </Section>
        )}

        {s.flags.explore && s.homeId === null && canCampHere(loc) && (
          <Section title="安家">
            {loc.biome === 'village' ? (
              <div className="actions">
                <Btn className="primary" disabled={busy} onClick={s.settle} sub="与村民为邻">定居于此</Btn>
              </div>
            ) : (
              <article className="content-entry shelter-entry">
                <EntryHeader actions={
                  <Btn className="primary" disabled={busy || !canAfford(s, SHELTER_COST)} onClick={s.buildShelter}>建立庇护所</Btn>
                }>
                  <span className="icon-text"><Texture src={ITEMS.bed.icon} /> 庇护所</span>
                </EntryHeader>
                <span className="sm dim">在当前区域安家：永久记住此地，并解锁建筑与自动化。</span>
                <Cost cost={SHELTER_COST} />
              </article>
            )}
          </Section>
        )}

        {atHome(s) && (
          <Section title="营地">
            <div className="actions">
              {PLANTS.filter((plant) => plant.id === 'wheat' || Object.keys(plant.cost).every((id) => s.seen[id])).map((plant) => (
                <Btn key={plant.id} disabled={busy || s.crop > 0 || !canAfford(s, plant.cost)} onClick={() => s.plant(plant.id)}
                  sub={s.crop && s.cropKind === plant.id
                    ? '成熟还需 ' + s.crop + ' 秒'
                    : Object.entries(plant.cost).map(([id, n]) => ITEMS[id].name + ' ×' + n).join('、')}>
                  播种{plant.name}
                </Btn>
              ))}
              {camp && CAMP_COOK.filter((recipe) => count(s, recipe.from) > 0).map((recipe) => (
                <Btn key={recipe.id} cd="cook" disabled={busy} onClick={() => s.cook(recipe.from)}
                  sub={'余 ' + count(s, recipe.from) + ' 份原料'}>烤制{ITEMS[recipe.out].name}</Btn>
              ))}
            </div>
          </Section>
        )}
        {s.homeId !== null && !atHome(s) && <p className="notice camp-return-notice">回到营地可播种、烹饪或使用床铺。</p>}
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
            <div className="actions">
              {!s.flags.altar && (
                <Btn cd="eye" disabled={busy || count(s, 'eye') < 1} onClick={s.throwEye} sub={`已追踪 ${s.eyesThrown}/3`}>投掷末影之眼</Btn>
              )}
              {loc.biome === 'altar' && !s.flags.portal && (
                <Btn disabled={busy || count(s, 'eye') < 1} onClick={s.insertEyes} sub={`${s.altarEyes}/${EYES_NEEDED}`}>嵌入末影之眼</Btn>
              )}
              {loc.biome === 'altar' && s.flags.portal && !s.flags.won && (
                <Btn className="danger" disabled={busy} onClick={s.enterPortal} sub="护甲与熟食可帮助战斗，玻璃瓶可收集龙息">踏入传送门</Btn>
              )}
              {loc.biome === 'altar' && s.flags.portal && s.flags.won && (
                <Btn className="danger" disabled={busy || !canAfford(s, RESPAWN_COST)} onClick={s.enterPortal}
                  sub="消耗 4 座末地水晶">复活末影龙</Btn>
              )}
            </div>
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
        <p className="notice entry-list-notice">击败旋风人后可取得钥匙。开启普通宝库获得不祥之瓶，再用它挑战强化试炼。</p>
        <div className="actions">
          <Btn cd="trial" disabled={busy} onClick={() => s.startTrial(false)}>开始试炼</Btn>
          <Btn cd="trial" disabled={busy || !s.flags.trialVault || count(s, 'ominous_bottle') < 1}
            onClick={() => s.startTrial(true)} sub="消耗 1 瓶不祥之瓶">开启不祥试炼</Btn>
        </div>
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
        <div className="actions">
          <Btn cd="excavation" disabled={busy || (loc.res.suspicious ?? 0) > 0 || !canAfford(s, EXCAVATION_COST)}
            onClick={s.searchDig} sub="消耗 1 面包和 2 火把">寻找下一片沙层</Btn>
        </div>
      </Section>
    )
  }

  if (loc.biome === 'bastion') {
    return (
      <Section title="堡垒藏宝箱">
        <div className="actions">
          <Btn disabled={busy || !s.flags.bastionCleared} onClick={s.openBastion} sub="击败猪灵蛮兵后开启">取出锻造模板</Btn>
        </div>
      </Section>
    )
  }

  return null
}
