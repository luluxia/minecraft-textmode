import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/minecraft/tabs'
import { Texture } from './Texture'
import {
  BUILDINGS, CONTROL_REP, ITEMS, JOBS, MAYOR_POP, MAYOR_REP, TRADES, repTier, villageLevel,
} from '../game/data'
import {
  activeLines, attackPower, atHome, buildCost, canAfford, canControl, defensePower, employed, housing,
  jobSlots, lineLimit, monumentReady, production, raidStrength, recruitTime, useGame, villageCap, villageDefense, wheatDemand,
} from '../game/store'
import { EXPEDITIONS, LINES, seasonAt } from '../game/progression'
import { Bar, Btn, Cost, EntryHeader, Section, bagText } from './kit'
import { useScrollReset } from './ScrollArea'

export function Village() {
  const s = useGame()
  const [sub, setSub] = useState('overview')
  const resetScroll = useScrollReset()
  const v = s.village
  if (!v) return null
  const hasVillagers = v.villagers > 0
  const tabs: [string, string, boolean][] = [
    ['overview', '概况', true],
    ['buildings', '建筑', true],
    ['villagers', '村民', hasVillagers],
    ['exchange', '交流', hasVillagers],
    ['automation', '红石', lineLimit(s) > 0],
    ['expeditions', '远征', !!s.flags.won],
  ]
  const cur = tabs.some(([id, , available]) => id === sub && available) ? sub : 'overview'
  const home = atHome(s)
  const control = canControl(v)
  const free = v.villagers - employed(v)
  const prod = Object.entries(production(s))
  const nextRep = v.rep >= CONTROL_REP ? MAYOR_REP : CONTROL_REP
  const reputation = `${v.rep} · ${repTier(v.rep)}`
  const raid = raidStrength(s)
  const readyDefense = villageDefense(v) + attackPower(s) + defensePower(s)

  return (
    <Tabs value={cur} onValueChange={(value) => { resetScroll(); setSub(String(value)) }}>
      <TabsList className="subtabs" aria-label="村庄页面">
        {tabs.filter(([, , available]) => available).map(([id, name]) => (
          <TabsTrigger key={id} value={id} aria-label={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      {!home && <p className="notice" style={{ marginBottom: 8 }}>你不在村中。建造、交谈与交易需要先回家。</p>}
      {!control && (
        <p className="notice" style={{ marginBottom: 8 }}>
          村民还不信任你。声望达到 {CONTROL_REP} 后，才能在此建造并安排村民的工作。
        </p>
      )}
      <TabsContent value="overview">
        <Section title="概况">
          <div className="row">
            <span className="loc-name">{s.locs[s.homeId!].name}</span>
            <span className="tag g">{villageLevel(v.villagers)}</span>
            {v.mayor && <span className="tag y">村长</span>}
          </div>
          <dl className="village-stats sm">
            <dt>村民</dt>
            <dd>{v.villagers}/{housing(v)}</dd>
            {housing(v) > v.villagers && <>
              <dt>招募</dt>
              <dd>{Math.min(s.recruitment, recruitTime(v))}/{recruitTime(v)} 秒{v.villagers >= 2 && ' · 小麦 ' + (3 + Math.floor(v.villagers / 2))}</dd>
            </>}
            <dt>防御</dt>
            <dd>{villageDefense(v)}</dd>
            <dt>储量上限</dt>
            <dd>{villageCap(v)}</dd>
            <dt>农时</dt>
            <dd>{seasonAt(s.minute).name} · 作物产出 {Math.round(seasonAt(s.minute).crops * 100)}%</dd>
            {wheatDemand(v) > 0 && <>
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
          {!v.mayor && hasVillagers && (
            <div className="actions" style={{ marginTop: 8 }}>
              <Btn
                className="primary wide"
                disabled={!home || v.rep < MAYOR_REP || v.villagers < MAYOR_POP}
                onClick={s.runMayor}
                sub={`声望 ${v.rep}/${MAYOR_REP} · 村民 ${v.villagers}/${MAYOR_POP}`}
              >
                竞选村长
              </Btn>
            </div>
          )}
          {!!v.buildings.watchtower && v.villagers >= 2 && (
            <div className="actions" style={{ marginTop: 8 }}>
              <Btn cd="raid" disabled={!home || readyDefense < raid} onClick={s.challengeRaid}
                sub={'防御 ' + readyDefense + '/' + raid + ' · 声望 +12'}>敲钟迎击袭击</Btn>
            </div>
          )}
        </Section>
        {!hasVillagers && (
          <p className="notice" style={{ marginTop: 12 }}>先建一间房屋。头两名村民会自行搬来，建好农场或伐木场后就能安排他们工作。</p>
        )}
      </TabsContent>

      <TabsContent value="buildings">
        <Section title="建筑">
          <div className="entry-grid">
            {BUILDINGS.filter((b) => !b.need || s.seen[b.need]).map((b) => {
              const cost = buildCost(v, b.id)
              const full = (v.buildings[b.id] ?? 0) >= (b.limit ?? 40)
              const locked = b.project && !monumentReady(s)
              return (
                <article key={b.id} className="content-entry">
                  <EntryHeader actions={
                    <Btn disabled={full || locked || !home || !control || !canAfford(s, cost)} onClick={() => s.build(b.id)}>{full ? '已达上限' : '建造'}</Btn>
                  }>
                    <span className="icon-text"><Texture src={b.icon} /> {b.name}</span>
                    <span className="sm dim">已建 {v.buildings[b.id] ?? 0}</span>
                  </EntryHeader>
                  <span className="sm dim">{b.desc}</span>
                  {locked && <span className="sm bad">需要成为村长、点亮信标并完成远端群岛远征。</span>}
                  <Cost cost={cost} />
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
              {JOBS.map((j) => {
                const n = v.jobs[j.id] ?? 0
                const slots = jobSlots(v, j.id)
                const out = Object.entries(j.out).map(([k, r]) => `${ITEMS[k].name} +${r}`).join(' ')
                return (
                  <article key={j.id} className="content-entry">
                    <EntryHeader actions={
                      <div className="stepper">
                        <Btn className="mini" disabled={!control || n <= 0} onClick={() => s.assign(j.id, -1)} title={`减少${j.name}`} aria-label={`减少${j.name}`}>−</Btn>
                        <b>{n}/{slots}</b>
                        <Btn className="mini" disabled={!control || free <= 0 || n >= slots} onClick={() => s.assign(j.id, 1)} title={`增加${j.name}`} aria-label={`增加${j.name}`}>+</Btn>
                      </div>
                    }>
                      <span className="icon-text"><Texture src={j.icon} /> {j.name}</span>
                    </EntryHeader>
                    <span className="sm dim">{slots === 0 ? '需要先建造对应建筑。' : `${j.desc}。${out ? `每人每秒 ${out}` : ''}`}</span>
                  </article>
                )
              })}
            </div>
          </Section>
        </TabsContent>
      )}

      {hasVillagers && (
        <TabsContent value="exchange">
          <Section title="交流">
            <div className="actions" style={{ marginBottom: 8 }}>
              <Btn cd="talk" disabled={!home} onClick={s.talk} sub={'声望 +' + (v.rep < CONTROL_REP ? 4 : 2)}>与村民交谈</Btn>
            </div>
            <div className="entry-grid">
              {TRADES.filter((t) => Object.keys(t.give).every((k) => s.seen[k]) && (!t.need || v.buildings[t.need])).map((t) => {
                const locked = (t.rep ?? 0) > v.rep
                return (
                  <article key={t.id} className="content-entry">
                    <EntryHeader actions={<>
                      <Btn disabled={!home || locked || !canAfford(s, t.give)} onClick={() => s.trade(t.id)}>交易</Btn>
                      <Btn disabled={!home || locked || !canAfford(s, t.give)} onClick={() => s.trade(t.id, 5)}>最多 5 次</Btn>
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
        </TabsContent>
      )}
      {lineLimit(s) > 0 && <TabsContent value="automation"><Automation /></TabsContent>}
      {s.flags.won && <TabsContent value="expeditions"><Expeditions /></TabsContent>}
    </Tabs>
  )
}

function Automation() {
  const s = useGame()
  const active = activeLines(s)
  const cap = lineLimit(s)
  return (
    <Section title="红石产线" extra={active + '/' + cap}>
      <p className="notice entry-list-notice">产线与村民一同运转。原料不足或产物堆满时，产线会等待。面包坊优先留出一分钟的村民口粮。</p>
      <div className="entry-grid">
        {LINES.map((line) => {
          const running = line.id in s.lines
          return (
            <article className="content-entry" key={line.id}>
              <EntryHeader actions={
                <Btn disabled={!atHome(s) || (!running && active >= cap)} onClick={() => s.setLine(line.id)}>
                  {running ? '停用' : '启用'}
                </Btn>
              }>
                <span>{line.name}</span>
                <span className="sm dim">{running ? s.lines[line.id] + '/' + line.seconds + ' 秒' : line.seconds + ' 秒/批'}</span>
              </EntryHeader>
              <div className="item-flow">{bagText(line.output)}</div>
              <Cost cost={line.input} />
            </article>
          )
        })}
      </div>
    </Section>
  )
}

function Expeditions() {
  const s = useGame()
  const trip = s.expedition
  return (
    <Section title="末地外岛">
      <p className="notice entry-list-notice">备齐物资后派出远征队。远征途中可继续经营或离线，归来时物资直接入库。</p>
      <div className="entry-grid">
        {EXPEDITIONS.map((entry) => {
          const locked = entry.flight && !s.inv.elytra
          const away = trip?.id === entry.id
          const time = away ? trip.left : entry.seconds
          return (
            <article className="content-entry" key={entry.id}>
              <EntryHeader actions={
                <Btn disabled={!atHome(s) || !!trip || locked || !canAfford(s, entry.cost)} onClick={() => s.launch(entry.id)}>
                  {away ? '远征中' : '出发'}
                </Btn>
              }>
                <span>{entry.name}</span>
                <span className="sm dim">{Math.floor(time / 60)} 分 {time % 60} 秒</span>
              </EntryHeader>
              <span className="sm dim">{entry.desc}{locked && ' 需要鞘翅。'}</span>
              <div className="item-flow">{bagText(entry.reward)}</div>
              {away && <Bar value={entry.seconds - time} max={entry.seconds} color="#8d3fbf" label="远征进度" />}
              <Cost cost={entry.cost} />
            </article>
          )
        })}
      </div>
    </Section>
  )
}
