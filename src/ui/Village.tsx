import { useState } from 'react'
import { ActionGrid } from './ActionGrid'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/minecraft/tabs'
import { Texture } from './Texture'
import {
  BUILDINGS, BUILDING_MAP, CONTROL_REP, ITEMS, JOBS, MAYOR_POP, MAYOR_REP, TRADES, repTier, villageLevel,
} from '../game/data'
import {
  localLine, activeLines, attackPower, atHome, buildCost, canAfford, canControl, canVisitMarket, curLoc, marketReputation, count, cropMultiplier, defensePower, employed,
  expeditionCost, expeditionLock, expeditionTime, expeditionVisible, housing,
  jobSlots, lineIssue, lineLimit, mayBuildVillage, monumentReady, villageGrowthReady, production, raidStrength, recruitTime, useGame, villageCap, villageDefense, wheatDemand,
} from '../game/store'
import { EXPEDITIONS, LINES, seasonAt, type ExpeditionDef } from '../game/progression'
import { LocationName, ActionTitle, Bar, Btn, Cost, EntryHeader, Section, bagText } from './kit'
import { useScrollReset } from './ScrollArea'
import { villageBeforeSettlement } from '../game/village'

export function Village() {
  const s = useGame()
  const [sub, setSub] = useState('overview')
  const resetScroll = useScrollReset()
  const v = s.village
  const market = canVisitMarket(s)
  const control = !!v && canControl(v)
  const showAutomation = control && lineLimit(s) > 0 && villageGrowthReady(s)
  const hasVillagers = (v?.villagers ?? 0) > 0
  const trips = v ? EXPEDITIONS.filter((entry) => expeditionVisible(s, entry)) : []
  const tabs: [string, string, boolean][] = [
    ['overview', '概况', true],
    ['buildings', '建筑', !!v],
    ['villagers', '村民', hasVillagers],
    ['exchange', '交易', hasVillagers || market],
    ['automation', '红石', showAutomation],
    ['expeditions', '远征', trips.length > 0],
  ]
  const cur = tabs.some(([id, , available]) => id === sub && available) ? sub : 'overview'
  const navigation = (
    <TabsList className="subtabs" aria-label="村庄页面">
      {tabs.filter(([, , available]) => available).map(([id, name]) => (
        <TabsTrigger key={id} value={id} aria-label={name}>
          {name}
        </TabsTrigger>
      ))}
    </TabsList>
  )
  const changeTab = (value: unknown) => { resetScroll(); setSub(String(value)) }
  const talkButton = <Btn cd="talk" disabled={!market || !!s.combat} onClick={s.talk}
    title={'声望 +' + (marketReputation(s) < CONTROL_REP ? 4 : 2)}>与村民交谈</Btn>
  if (!v) {
    if (!s.flags.metVillage) return null
    if (!market) return <p className="notice">到村庄后可与村民交谈和交易。</p>
    const loc = curLoc(s)
    const local = villageBeforeSettlement(loc)
    return (
      <Tabs value={cur} onValueChange={changeTab}>
        {navigation}
        <TabsContent value="overview">
          <Section title="概况" extra={<LocationName name={loc.name} />}>
            <dl className="village-stats sm">
              <dt>村民</dt>
              <dd>{local.villagers} 人（农夫 {local.jobs.farmer} 人）</dd>
              <dt>已有建筑</dt>
              <dd>{Object.entries(local.buildings).map(([id, n]) => `${BUILDING_MAP[id].name} ×${n}`).join('、')}</dd>
              <dt>当地声望</dt>
              <dd>{local.rep} · {repTier(local.rep)}</dd>
            </dl>
            <ActionGrid className="village-overview-actions">
              {talkButton}
              <Btn disabled={!!s.combat} onClick={s.settle}>在此定居</Btn>
            </ActionGrid>
          </Section>
        </TabsContent>
        <TabsContent value="exchange"><VillageExchange /></TabsContent>
      </Tabs>
    )
  }
  const home = atHome(s)
  const free = v.villagers - employed(v)
  const prod = Object.entries(production(s))
  const nextRep = v.rep >= CONTROL_REP ? MAYOR_REP : CONTROL_REP
  const reputation = `${v.rep} · ${repTier(v.rep)}`
  const raid = raidStrength(s)
  const readyDefense = villageDefense(v) + attackPower(s) + defensePower(s)

  return (
    <Tabs value={cur} onValueChange={changeTab}>
      {navigation}
      {(!home || !control) && <div className="village-notices">
        {!home && <p className="notice">建造和安排岗位需要返回自己的村庄。</p>}
        {!control && <p className="notice">村民还不信任你。声望达到 {CONTROL_REP} 后，才能在此建造并安排村民的工作。</p>}
      </div>}
      <TabsContent value="overview">
        <Section title="概况">
          <div className="row">
            <span className="loc-name"><LocationName name={s.locs[s.homeId!].name} /></span>
            <span className="tag g">{villageLevel(v.villagers)}</span>
            {v.mayor && <span className="tag y">村长</span>}
          </div>
          <dl className="village-stats sm">
            <dt>村民</dt>
            <dd>{v.villagers}/{housing(v)}</dd>
            {control && villageGrowthReady(s) && housing(v) > v.villagers && <>
              <dt>招募</dt>
              <dd>{Math.min(s.recruitment, recruitTime(v))}/{recruitTime(v)} 秒{v.villagers >= 2 && ' · 小麦 ' + (3 + Math.floor(v.villagers / 2))}</dd>
            </>}
            <dt>防御</dt>
            <dd>{villageDefense(v)}</dd>
            <dt>储量上限</dt>
            <dd>{villageCap(s)}</dd>
            {control && <>
              <dt>农时</dt>
              <dd>{seasonAt(s.minute).name} · 作物产出 {Math.round(cropMultiplier(s) * 100)}%</dd>
            </>}
            {control && wheatDemand(v) > 0 && <>
              <dt>村民口粮</dt>
              <dd>小麦 {wheatDemand(v).toFixed(2)}/秒 · 口粮不足时非农业岗位效率降至 65%</dd>
            </>}
            {hasVillagers && (
              <>
                <dt>声望</dt>
                <dd className="village-reputation">
                  <span>{reputation}</span>
                  <Bar value={v.rep} max={nextRep} color="#3f8fbf" label="村庄声望" valueText={reputation} />
                </dd>
              </>
            )}
            {prod.length > 0 && (
              <>
                <dt>每秒净变化</dt>
                <dd>{prod.map(([k, r]) => `${ITEMS[k].name} ${r >= 0 ? '+' : ''}${r.toFixed(2)}`).join('，')}</dd>
              </>
            )}
          </dl>
          {(hasVillagers || market) && (
            <ActionGrid className="village-overview-actions">
              {talkButton}
              {!v.mayor && hasVillagers && <Btn className="primary"
                disabled={!home || v.rep < MAYOR_REP || v.villagers < MAYOR_POP}
                onClick={s.runMayor} sub={v.rep < MAYOR_REP ? `声望 ${v.rep}/${MAYOR_REP}` : v.villagers < MAYOR_POP ? `村民 ${v.villagers}/${MAYOR_POP}` : undefined}>
                竞选村长
              </Btn>}
              {!!v.buildings.watchtower && v.villagers >= 2 && (
                <Btn cd="raid" disabled={!home || readyDefense < raid} onClick={s.challengeRaid}
                  sub={'防御 ' + readyDefense + '/' + raid}>敲钟迎击袭击</Btn>
              )}
            </ActionGrid>
          )}
        </Section>

      </TabsContent>

      <TabsContent value="buildings">
        <Section title="建筑">
          {control && !villageGrowthReady(s) && <p className="notice">村民首次产出后可扩建更多建筑。</p>}
          <div className="entry-grid">
            {BUILDINGS.filter((b) => v.buildings[b.id] || !b.need || s.seen[b.need]).map((b) => {
              const cost = buildCost(v, b.id)
              const full = (v.buildings[b.id] ?? 0) >= (b.limit ?? 40)
              const locked = b.project && !monumentReady(s)
              const missingTool = b.tool && !s.freeResources && !count(s, b.tool) ? ITEMS[b.tool].name : undefined
              return (
                <article key={b.id} className="content-entry">
                  <EntryHeader actions={
                    <Btn disabled={!mayBuildVillage(s, b.id) || full || locked || !!missingTool || !home || !control || !canAfford(s, cost)} onClick={() => s.build(b.id)}>{full ? '已达上限' : '建造'}</Btn>
                  }>
                    <span className="icon-text"><Texture src={b.icon} /> {b.name}</span>
                    <span className="sm dim">已建 {v.buildings[b.id] ?? 0}</span>
                  </EntryHeader>
                  <span className="sm dim">{b.desc}</span>
                  {locked && <span className="sm bad">需要成为村长、点亮信标并完成远端群岛远征。</span>}
                  {missingTool && <span className="sm bad">需要{missingTool}</span>}
                  {b.id === 'beacon' ? <>
                    <span className="sm dim">信标本体</span>
                    <Cost cost={{ nether_star: cost.nether_star, glass: cost.glass, obsidian: cost.obsidian }} />
                    <span className="sm dim">3 × 3 铁块基座</span><Cost cost={{ iron_block: cost.iron_block }} />
                  </> : <Cost cost={cost} />}
                  {b.id === 'apiary' && !!v.buildings.apiary && <ActionGrid>
                    <Btn disabled={!home || !!s.combat || (v.honeyTicks ?? 0) < 30 || !canAfford(s, { bottle: 1 })}
                      onClick={s.bottleApiary} sub={s.freeResources ? undefined : '玻璃瓶 −1'}><ActionTitle name="收取蜂蜜" quantity={Math.floor((v.honeyTicks ?? 0) / 30)} /></Btn>
                  </ActionGrid>}
                </article>
              )
            })}
          </div>
        </Section>
      </TabsContent>

      {hasVillagers && (
        <TabsContent value="villagers">
          <Section title="村民" extra={`空闲 ${free}`}>
            <div className="entry-grid">
              {JOBS.filter((j) => jobSlots(v, j.id) > 0 || v.jobs[j.id]).map((j) => {
                const n = v.jobs[j.id] ?? 0
                const slots = jobSlots(v, j.id)
                const out = Object.entries(j.out).map(([k, r]) => `${ITEMS[k].name} +${r}`).join(' ')
                return (
                  <article key={j.id} className="content-entry">
                    <EntryHeader actions={
                      <div className="stepper">
                        <Btn className="mini" disabled={!home || !control || n <= 0} onClick={() => s.assign(j.id, -1)} title={`减少${j.name}`} aria-label={`减少${j.name}`}>−</Btn>
                        <b>{n}/{slots}</b>
                        <Btn className="mini" disabled={!home || !control || free <= 0 || n >= slots} onClick={() => s.assign(j.id, 1)} title={`增加${j.name}`} aria-label={`增加${j.name}`}>+</Btn>
                      </div>
                    }>
                      <span className="icon-text"><Texture src={j.icon} /> {j.name}</span>
                    </EntryHeader>
                    <span className="sm dim">{slots === 0 ? '需要先建造对应建筑。' : `${j.desc}。${control && out ? `每人每秒 ${out}` : ''}`}</span>
                  </article>
                )
              })}
            </div>
          </Section>
        </TabsContent>
      )}

      {(hasVillagers || market) && (
        <TabsContent value="exchange">
          <VillageExchange />
        </TabsContent>
      )}
      {showAutomation && <TabsContent value="automation"><Automation /></TabsContent>}
      {trips.length > 0 && <TabsContent value="expeditions"><Expeditions trips={trips} /></TabsContent>}
    </Tabs>
  )
}

function VillageExchange() {
  const s = useGame()
  const v = s.village
  const rep = marketReputation(s)
  const market = canVisitMarket(s)
  const home = atHome(s)
  return (
    <Section title="交易">
      <div className="entry-grid">
        {TRADES.filter((t) => !t.need || (home && v?.buildings[t.need] && Object.keys(t.give).every((k) => s.seen[k]))).map((t) => {
          const locked = (t.rep ?? 0) > rep
          return (
            <article key={t.id} className="content-entry">
              <EntryHeader actions={<>
                <Btn disabled={!market || !!s.combat || locked || !canAfford(s, t.give)} onClick={() => s.trade(t.id)}>交易</Btn>
                <Btn disabled={!market || !!s.combat || locked || !canAfford(s, t.give)} onClick={() => s.trade(t.id, 5)}>最多 5 次</Btn>
              </>}>
                <span className="item-flow">{bagText(t.get)}</span>
              </EntryHeader>
              {locked && <span className="sm bad">需要声望 {t.rep}</span>}
              <Cost cost={t.give} />
            </article>
          )
        })}
      </div>
    </Section>
  )
}

function Automation() {
  const s = useGame()
  const active = activeLines(s)
  const cap = lineLimit(s)
  return (
    <Section title="红石产线" extra={active + '/' + cap}>
      <div className="entry-grid">
        {LINES.filter((line) => line.id in s.lines || Object.keys(line.input).some((item) => s.seen[item])).map((def) => {
          const line = localLine(s, def)
          const running = line.id in s.lines
          const issue = running ? lineIssue(s, line) : ''
          const building = line.building && !s.village?.buildings[line.building] ? BUILDINGS.find((entry) => entry.id === line.building) : undefined
          return (
            <article className="content-entry" key={line.id}>
              <EntryHeader actions={
                <Btn disabled={!atHome(s) || !!building || (!running && active >= cap)} onClick={() => s.setLine(line.id)}>
                  {running ? '停用' : '启用'}
                </Btn>
              }>
                <span>{line.name}</span>
                <span className="sm dim">{running ? s.lines[line.id] + '/' + line.seconds + ' 秒' : line.seconds + ' 秒/批'}</span>
              </EntryHeader>
              {building && <span className="sm bad">需要{building.name}</span>}
              {issue && <span className="sm bad">{issue}</span>}
              <div className="item-flow">{bagText(line.output)}</div>
              {line.id === 'sawmill' ? <span className="sm dim">每份原木产出 4 块同树种木板</span> : <Cost cost={line.input} />}
            </article>
          )
        })}
      </div>
    </Section>
  )
}

const TRIP_SECTIONS = [
  ['ocean', '海洋远征'],
  ['camp', '营地照料'],
  ['end', '末地外岛'],
] as const

function Expeditions({ trips }: { trips: ExpeditionDef[] }) {
  const s = useGame()
  const trip = s.expedition
  return (
    <>
      <p className="notice">同一时间可安排一项远征或孵化。派出后可以继续经营，离线也会结算。</p>
      {TRIP_SECTIONS.map(([region, title]) => {
        const entries = trips.filter((entry) => entry.region === region)
        if (!entries.length) return null
        return (
          <Section key={region} title={title}>
            <div className="entry-grid">
              {entries.map((entry) => {
                const locked = expeditionLock(s, entry)
                const running = trip?.id === entry.id ? trip : null
                const total = running ? running.total ?? entry.seconds : expeditionTime(s, entry)
                const time = running?.left ?? total
                const cost = expeditionCost(s, entry)
                const reward = s.expeditions[entry.id] ? entry.reward : { ...entry.reward, ...entry.first }
                return (
                  <article className="content-entry" key={entry.id}>
                    <EntryHeader actions={
                      <Btn disabled={!atHome(s) || !!trip || !!locked || !canAfford(s, cost)} onClick={() => s.launch(entry.id)}>
                        {running ? '进行中' : region === 'camp' ? '开始孵化' : '出发'}
                      </Btn>
                    }>
                      <span>{entry.name}</span>
                      <span className="sm dim">{Math.floor(time / 60)} 分 {time % 60} 秒</span>
                    </EntryHeader>
                    <span className="sm dim">{entry.desc}</span>
                    {locked && <span className="sm bad">{locked}</span>}
                    <div className="item-flow">{bagText(reward)}</div>
                    {running && <Bar value={total - time} max={total} color="#8d3fbf" label="远征进度" />}
                    <Cost cost={cost} />
                  </article>
                )
              })}
            </div>
          </Section>
        )
      })}
    </>
  )
}
