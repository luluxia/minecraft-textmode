import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/minecraft/tabs'
import { Button } from '../components/minecraft/button'
import { AdventureImage } from '../components/minecraft/minecraft-adventure-image'
import { Texture } from './Texture'
import { useEffect, useState } from 'react'
import { ActionGrid } from './ActionGrid'
import { ENCHANTS, FUELS, ITEM_CATEGORIES, ITEMS, ITEM_LIST, RECIPES, SMELTS, type Cat } from '../game/data'
import { PACK_LIMIT, carriesLimit, itemFamily, materialOptions, materialQuantity, whole } from '../game/inventory'
import { available, canAfford, count, enchantCost, furnaceOutputBlocked, outputRoom, recipeStationReady, useGame } from '../game/store'
import { recipeOptions, type RecipeTarget } from '../game/recipes'
import { Btn, Cost, EntryHeader, ItemName, Section } from './kit'
import { useScrollReset } from './ScrollArea'

const CAT_NAMES: [Cat, string][] = [['tool', '工具'], ['gear', '装备'], ['food', '食物'], ['material', '材料'], ['special', '奇物']]

export function Crafting({ target }: { target?: RecipeTarget }) {
  const s = useGame()
  const [sub, setSub] = useState('craft')
  const resetScroll = useScrollReset()
  const [currentTarget, setCurrentTarget] = useState(target)
  useEffect(() => {
    if (!target) return
    setSub(target.kind === 'smelt' ? 'furnace' : 'craft')
    setCurrentTarget(target)
  }, [target])
  const tabs: [string, string, boolean][] = [
    ['craft', count(s, 'table') > 0 ? '工作台' : '徒手合成', true],
    ['furnace', '熔炉', !!s.flags.furnace],
    ['enchant', '附魔', !!s.flags.enchant],
    ['bag', '背包', true],
  ]
  const cur = tabs.find(([id, , ok]) => id === sub && ok) ? sub : 'craft'

  return (
    <div>
      <Tabs value={cur} onValueChange={(value) => { resetScroll(); setSub(String(value)); setCurrentTarget(undefined) }}><TabsList className="subtabs" aria-label="制造页面">
        {tabs.filter(([, , ok]) => ok).map(([id, name]) => (
          <TabsTrigger key={id} value={id} aria-label={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="craft"><CraftList focusId={currentTarget?.kind === 'craft' ? currentTarget.id : undefined} /></TabsContent>
      <TabsContent value="furnace"><Furnace focusId={currentTarget?.kind === 'smelt' ? currentTarget.id : undefined} /></TabsContent>
      <TabsContent value="enchant"><Enchant /></TabsContent>
      <TabsContent value="bag"><Bag /></TabsContent></Tabs>
    </div>
  )
}

function CraftList({ focusId }: { focusId?: string }) {
  const s = useGame()
  const [category, setCategory] = useState<Cat | 'all'>('all')
  const hasTable = count(s, 'table') > 0
  const unlocked = RECIPES.filter((recipe) => recipe.id === focusId || (recipeStationReady(s, recipe.station) &&
    recipeOptions(s, recipe.out).some((step) => step.kind === 'craft' && step.id === recipe.id)))
  const showFilters = unlocked.length > 18
  const filtered = showFilters && category !== 'all' ? unlocked.filter((recipe) => ITEMS[recipe.out].cat === category) : unlocked
  const focused = focusId ? unlocked.find((recipe) => recipe.id === focusId) : undefined
  const list = focused ? [focused, ...filtered.filter((recipe) => recipe.id !== focusId)] : filtered
  return (
    <>
      {!hasTable && <p className="notice">双手能做的东西有限。先做一张工作台吧。</p>}
      {showFilters && (
        <div className="row recipe-filters" role="group" aria-label="配方分类">
          {([['all', '全部'], ...ITEM_CATEGORIES] as const).map(([id, name]) => (
            <Button key={id} className={`btn mini ${category === id ? 'on' : ''}`} aria-pressed={category === id} onClick={() => setCategory(id)}>
              {name}
            </Button>
          ))}
        </div>
      )}
      {list.length === 0 && <p className="notice">还没有发现这类配方。</p>}
      <div className="entry-grid">
        {list.map((r) => {
          const def = ITEMS[r.out]
          const unique = def.cat === 'tool' || def.cat === 'gear'
          const owned = unique && count(s, r.out) > 0
          const full = outputRoom(s, r.out) < r.n
          const ok = !s.combat && !s.submerged && !full && recipeStationReady(s, r.station) && canAfford(s, r.cost)
          return (
            <article key={r.id} className={r.id === focusId ? 'content-entry recipe-focus' : 'content-entry fade-in'}>
              <EntryHeader actions={<>
                {owned
                  ? <span className="tag g">已拥有</span>
                  : <Btn disabled={!ok} onClick={() => s.craft(r.id)}>{r.station === 'brewing' ? '酿造' : r.station === 'smithing' ? '升级' : '合成'}</Btn>}
                {!unique && <Btn disabled={!ok} onClick={() => s.craft(r.id, 10)}>×10</Btn>}
              </>}>
                <span className="icon-text"><Texture src={def.icon} /> {def.name}{r.n > 1 ? ` ×${r.n}` : ''}</span>
                {!unique && <span className="sm dim">持有 {count(s, r.out)}</span>}
              </EntryHeader>
              {(def.desc || r.station === 'brewing' || r.station === 'smithing') && (
                <span className="sm dim">{r.station === 'brewing' ? '酿造台 ' : r.station === 'smithing' ? '锻造台 ' : ''}{def.desc}</span>
              )}
              {full && <span className="bad">储存空间不足</span>}
              <Cost cost={r.cost} />
            </article>
          )
        })}
      </div>
    </>
  )
}

function Furnace({ focusId }: { focusId?: string }) {
  const s = useGame()
  const job = s.furnace.job
  const jobDef = job && SMELTS.find((x) => x.id === job.r)
  const hasFuel = s.furnace.fuel >= 1
  const outputIssue = furnaceOutputBlocked(s)
  const away = job?.locId !== undefined && job.locId !== s.locId
  const fuels = Object.keys(FUELS).filter((k) => s.seen[k])
  const smelts = SMELTS.filter((recipe) => recipe.id === focusId || s.seen[recipe.from])
  const focused = focusId && smelts.find((recipe) => recipe.id === focusId)
  const list = focused ? [focused, ...smelts.filter((recipe) => recipe.id !== focusId)] : smelts
  return (
    <>
      <Section title="炉膛" extra={`燃料 ${s.furnace.fuel}`}>
        <div className="furnace-workspace">
          {job && jobDef ? (
            <>
              <div className="spread furnace-job" data-paused={!hasFuel || !!outputIssue}
                style={{ backgroundSize: `${job.prog / jobDef.time * 100}% 100%` }}>
                <SmeltItems from={jobDef.from} to={jobDef.out} />
                <span className="sm dim" role="progressbar" aria-label="熔炼进度"
                  aria-valuemin={0} aria-valuemax={jobDef.time} aria-valuenow={job.prog}
                  aria-valuetext={`${job.prog}/${jobDef.time} 秒，剩余 ${job.left} 件`}>
                  剩余 {job.left}
                </span>
              </div>
              {away && <span className="sm dim">{s.locs[job.locId!]?.name}</span>}
              {!hasFuel && <span className="bad">燃料耗尽</span>}
              {outputIssue && <span className="bad">{outputIssue}</span>}
            </>
          ) : (
            <span className="dim sm">炉膛是空的。每熔炼一件物品消耗 1 点燃料。</span>
          )}
          {(job || fuels.length > 0) && <ActionGrid>
            {job && <Btn disabled={away} onClick={s.cancelSmelt}>取出原料</Btn>}
            {fuels.map((k) => (
              <Btn key={k} disabled={!!s.combat || s.submerged || available(s, k) < 1} onClick={() => s.addFuel(k)}>
                添加{ITEMS[k].name}（+{FUELS[k]}）
              </Btn>
            ))}
          </ActionGrid>}
        </div>
      </Section>
      <Section title="熔炼">
        <div className="entry-grid">
          {list.map((r) => {
            const have = available(s, r.from)
            const blocked = !!s.combat || s.submerged || (!!job && (job.r !== r.id || away))
            return (
              <article key={r.id} className={r.id === focusId ? 'content-entry recipe-focus' : 'content-entry'}>
                <div className="spread">
                  <SmeltItems from={r.from} to={r.out} />
                  <span className="sm dim">{r.time} 秒</span>
                </div>
                <div className="smelt-footer">
                  <span className="tag material-tag">持有原料 {have}</span>
                  <div className="entry-actions">
                    <Btn disabled={blocked || have < 1} onClick={() => s.smelt(r.id, 1)}>×1</Btn>
                    <Btn disabled={blocked || have < 1} onClick={() => s.smelt(r.id, 8)}>×8</Btn>
                    <Btn disabled={blocked || have < 1} onClick={() => s.smelt(r.id, have)}>全部</Btn>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </Section>
    </>
  )
}

function SmeltItems({ from, to }: { from: string; to: string }) {
  return (
    <span className="item-flow">
      <ItemName id={from} />
      <AdventureImage texture="gui/sprites/container/villager/trade_arrow" scale={2} alt="熔炼为" />
      <ItemName id={to} />
    </span>
  )
}

function Enchant() {
  const s = useGame()
  return (
    <Section title="附魔" extra={
      <span className="row">
        <span>等级 {s.level}</span>
        <span className="icon-text"><ItemName id="lapis" /> {available(s, 'lapis')}</span>
      </span>
    }>
      <p className="notice">
        消耗经验等级与青金石，为你的装备刻下永久的符文。{s.village?.buildings.library ? '（图书馆：青金石消耗减半）' : ''}
      </p>
      <div className="entry-grid">
        {ENCHANTS.map((e) => {
          const lvl = s.ench[e.id] ?? 0
          const cost = enchantCost(s, e.id)
          const maxed = lvl >= e.max
          const ok = !maxed && s.level >= cost.levels && available(s, 'lapis') >= cost.lapis
          return (
            <article key={e.id} className="content-entry">
              <EntryHeader actions={
                <Btn disabled={!ok} onClick={() => s.enchant(e.id)}>{maxed ? '已满级' : '附魔'}</Btn>
              }>
                <span>{e.name}</span>
                <span className="sm dim">{lvl}/{e.max} 级</span>
              </EntryHeader>
              <span className="sm dim">{e.desc}</span>
              {!maxed && (
                <div className="cost">
                  <span className={`tag material-tag${s.level >= cost.levels ? '' : ' bad'}`}>等级 {s.level}/{cost.levels}</span>
                  <Cost cost={{ lapis: cost.lapis }} />
                </div>
              )}
            </article>
          )
        })}
      </div>
    </Section>
  )
}

function Bag() {
  const s = useGame()
  return (
    <>
      {CAT_NAMES.map(([cat, name]) => {
        const items = ITEM_LIST.filter((i) => i.cat === cat && count(s, i.id) > 0)
        if (!items.length) return null
        return (
          <Section key={cat} title={name}>
            <div className="entry-grid inventory-grid">
              {items.map((i) => {
                const family = itemFamily(i.id)
                const shared = materialOptions(family).length > 1
                const amount = count(s, i.id)
                return <article key={i.id} className="content-entry">
                  <div className="spread">
                    <span className="icon-text"><Texture src={i.icon} /> {i.name}</span>
                    {carriesLimit(i.id) && !shared
                      ? <span>{amount}/{PACK_LIMIT}</span>
                      : (amount > 1 || (cat !== 'tool' && cat !== 'gear')) && <span>×{amount}</span>}
                  </div>
                  {shared && <span className="dim">同类合计 {whole(materialQuantity(s.inv, family))}/{PACK_LIMIT}</span>}
                  {(i.desc || i.food) && (
                    <span className="sm dim">{i.food ? `饱食 +${i.food}。` : ''}{i.desc ?? ''}</span>
                  )}
                </article>
              })}
            </div>
          </Section>
        )
      })}
    </>
  )
}
