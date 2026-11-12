import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/minecraft/tabs'
import { Texture } from './Texture'
import {
  BUILDINGS, CONTROL_REP, ITEMS, JOBS, MAYOR_POP, MAYOR_REP, TRADES, repTier, villageLevel,
} from '../game/data'
import {
  atHome, buildCost, canAfford, canControl, employed, housing, jobSlots, production, useGame, villageCap,
  villageDefense,
} from '../game/store'
import { Bar, Btn, Cost, Section, bagText } from './kit'

export function Village() {
  const s = useGame()
  const [sub, setSub] = useState('overview')
  const v = s.village
  if (!v) return null
  const hasVillagers = v.villagers > 0
  const tabs: [string, string, boolean][] = [
    ['overview', '概况', true],
    ['buildings', '建筑', true],
    ['villagers', '村民', hasVillagers],
    ['exchange', '交流', hasVillagers],
  ]
  const cur = tabs.some(([id, , available]) => id === sub && available) ? sub : 'overview'
  const home = atHome(s)
  const control = canControl(v)
  const free = v.villagers - employed(v)
  const prod = Object.entries(production(v))
  const nextRep = v.rep >= MAYOR_REP ? MAYOR_REP : v.rep >= CONTROL_REP ? MAYOR_REP : v.rep >= 20 ? CONTROL_REP : 20
  const reputation = `${v.rep} · ${repTier(v.rep)}`

  return (
    <Tabs value={cur} onValueChange={(value) => setSub(String(value))}>
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
            <dt>防御</dt>
            <dd>{villageDefense(v)}</dd>
            <dt>储量上限</dt>
            <dd>{villageCap(v)}</dd>
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
                <dt>每秒产出</dt>
                <dd className="good">{prod.map(([k, r]) => `${ITEMS[k].name} +${r.toFixed(2)}`).join('，')}</dd>
              </>
            )}
          </dl>
          {!v.mayor && hasVillagers && (
            <div className="actions" style={{ marginTop: 8 }}>
              <Btn
                className="primary wide"
                disabled={v.rep < MAYOR_REP || v.villagers < MAYOR_POP}
                onClick={s.runMayor}
                sub={`声望 ${v.rep}/${MAYOR_REP} · 村民 ${v.villagers}/${MAYOR_POP}`}
              >
                竞选村长
              </Btn>
            </div>
          )}
        </Section>
        {!hasVillagers && (
          <p className="notice" style={{ marginTop: 12 }}>这里只有你一个人。盖几间房屋，空房子总会等来住客。</p>
        )}
      </TabsContent>

      <TabsContent value="buildings">
        <Section title="建筑">
          <div className="entry-grid">
            {BUILDINGS.filter((b) => !b.need || s.seen[b.need]).map((b) => {
              const cost = buildCost(v, b.id)
              return (
                <article key={b.id} className="content-entry">
                  <div className="spread">
                    <span className="icon-text"><Texture src={b.icon} /> {b.name}</span>
                    <span className="dim">{v.buildings[b.id] ?? 0}</span>
                  </div>
                  <span className="sm dim">{b.desc}</span>
                  <div className="entry-foot">
                    <Cost cost={cost} />
                    <div className="entry-actions">
                      <Btn disabled={!home || !control || !canAfford(s, cost)} onClick={() => s.build(b.id)}>建造</Btn>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </Section>
      </TabsContent>

      {hasVillagers && (
        <TabsContent value="villagers">
          <Section title="村民" extra={`空闲 ${free}`}>
            <div className="entry-grid jobs-grid">
              {JOBS.map((j) => {
                const n = v.jobs[j.id] ?? 0
                const slots = jobSlots(v, j.id)
                const out = Object.entries(j.out).map(([k, r]) => `${ITEMS[k].name} +${r}`).join(' ')
                return (
                  <article key={j.id} className="content-entry">
                    <div className="spread">
                      <span className="icon-text"><Texture src={j.icon} /> {j.name}</span>
                      <div className="stepper">
                        <Btn className="mini" disabled={!control || n <= 0} onClick={() => s.assign(j.id, -1)} title={`减少${j.name}`}>减少</Btn>
                        <b>{n}/{slots}</b>
                        <Btn className="mini" disabled={!control || free <= 0 || n >= slots} onClick={() => s.assign(j.id, 1)} title={`增加${j.name}`}>增加</Btn>
                      </div>
                    </div>
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
              <Btn cd="talk" disabled={!home} onClick={s.talk} sub="声望 +1">与村民交谈</Btn>
            </div>
            <div className="entry-grid">
              {TRADES.filter((t) => Object.keys(t.give).every((k) => s.seen[k]) && (!t.need || v.buildings[t.need])).map((t) => {
                const locked = (t.rep ?? 0) > v.rep
                return (
                  <article key={t.id} className="content-entry">
                    <span className="item-flow">{bagText(t.get)}</span>
                    {locked && <span className="sm bad">需要声望 {t.rep}</span>}
                    <div className="entry-foot">
                      <Cost cost={t.give} />
                      <div className="entry-actions">
                        <Btn disabled={!home || locked || !canAfford(s, t.give)} onClick={() => s.trade(t.id)}>交易</Btn>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </Section>
        </TabsContent>
      )}
    </Tabs>
  )
}
