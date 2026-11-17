import { useState } from 'react'
import { BIOMES, ITEMS, ITEM_CATEGORIES, ITEM_LIST, type Cat } from '../game/data'
import {
  STATION_NAMES, canUseStation, itemKnown, itemSources, recipeOptions, recipeUses, type RecipeTarget,
} from '../game/recipes'
import { SITES, VARIANT_NAMES } from '../game/exploration'
import { WILDLIFE } from '../game/wildlife'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/minecraft/collapsible'
import { Input } from '../components/minecraft/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/minecraft/tabs'
import { available, canAfford, outputRoom, useGame } from '../game/store'
import { Btn, EntryHeader, ItemName, Section } from './kit'

interface RecipeBookProps {
  initialItem?: string
  onMake?: (target: RecipeTarget) => void
}

export function RecipeBook(props: RecipeBookProps) {
  return (
    <Tabs defaultValue="items">
      <TabsList className="subtabs" aria-label="配方书页面">
        <TabsTrigger value="items">物品</TabsTrigger>
        <TabsTrigger value="discoveries">发现</TabsTrigger>
      </TabsList>
      <TabsContent value="items" keepMounted><ItemsBook {...props} /></TabsContent>
      <TabsContent value="discoveries"><Discoveries /></TabsContent>
    </Tabs>
  )
}

function Discoveries() {
  const s = useGame()
  const places = Object.values(BIOMES).filter((place) => s.seenPlaces[place.id])
  const sites = Object.entries(SITES).filter(([id]) => s.flags['site_' + id])
  const animals = Object.entries(WILDLIFE).filter(([id]) => s.flags['wildlife_' + id])
  return (
    <>
      <Section title="到访地点"><div className="row">
        {places.map((place) => <span key={place.id} className="tag">{place.name}</span>)}
        {Object.entries(VARIANT_NAMES).filter(([id]) => s.flags['variant_' + id])
          .map(([id, name]) => <span key={id} className="tag">{name}</span>)}
      </div></Section>
      {sites.length > 0 && <Section title="附近发现"><div className="row">
        {sites.map(([id, site]) => <span key={id} className="tag">{site.name}</span>)}
      </div></Section>}
      {animals.length > 0 && <Section title="生物"><div className="row">
        {animals.map(([id, animal]) => <span key={id} className="tag">{animal.name}</span>)}
      </div></Section>}
    </>
  )
}

function ItemsBook({ initialItem, onMake }: RecipeBookProps) {
  const s = useGame()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Cat | 'all'>('all')
  const [selected, setSelected] = useState(initialItem ?? '')
  const items = ITEM_LIST.filter((item) => (itemKnown(s, item.id) || recipeOptions(s, item.id).length > 0) &&
    (category === 'all' || query.trim() || item.cat === category) && item.name.includes(query.trim()))

  if (selected && ITEMS[selected]) {
    const uses = recipeUses(s, selected)
    return (
      <>
        <div className="actions book-toolbar"><Btn className="mini" onClick={() => setSelected('')}>返回列表</Btn></div>
        <Section title={<ItemName id={selected} />} extra={s.seen[selected] ? '已收录' : undefined}>
          {!!ITEMS[selected].food && <p>饱食 +{ITEMS[selected].food}</p>}
          {ITEMS[selected].desc && <p className="dim">{ITEMS[selected].desc}</p>}
          <RecipeDetails key={selected} item={selected} needed={1} ancestors={[]} onMake={onMake} />
          {uses.length > 0 && <div className="recipe-uses">
            <h4>用途</h4>
            <div className="actions">{uses.map((id) =>
              <Btn key={id} className="mini" onClick={() => setSelected(id)}><ItemName id={id} /></Btn>)}</div>
          </div>}
        </Section>
      </>
    )
  }

  return (
    <>
      <label className="book-search">
        <span>搜索物品</span>
        <Input className="book-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!query.trim() && <div className="actions book-toolbar" role="group" aria-label="物品分类">
        {([['all', '全部'], ...ITEM_CATEGORIES] as const).map(([id, label]) =>
          <Btn key={id} className={'mini' + (category === id ? ' on' : '')} aria-pressed={category === id}
            onClick={() => setCategory(id)}>{label}</Btn>)}
      </div>}
      {items.length === 0 && <p className="notice">没有匹配的已知物品。</p>}
      <div className="entry-grid catalog-grid">
        {items.map((item) => <Btn key={item.id} onClick={() => setSelected(item.id)}
          sub={s.seen[item.id] ? undefined : '未收录'}><ItemName id={item.id} /></Btn>)}
      </div>
    </>
  )
}

function RecipeDetails({ item, needed, ancestors, onMake }: {
  item: string
  needed: number
  ancestors: string[]
  onMake?: (target: RecipeTarget) => void
}) {
  const s = useGame()
  const [option, setOption] = useState(0)
  const options = recipeOptions(s, item).filter((entry) =>
    !Object.keys(entry.cost).some((id) => id === item || ancestors.includes(id)))
  const step = options[option] ?? options[0]
  const source = itemSources(s, item)
  const batches = step ? Math.ceil(needed / step.amount) : 0
  const cost = step ? Object.fromEntries(Object.entries(step.cost).map(([id, n]) => [id, n * batches])) : {}
  const canMake = step && !s.combat && !s.submerged && canUseStation(s, step.station) &&
    canAfford(s, cost) && outputRoom(s, step.out) >= step.amount

  return (
    <div className="recipe-details">
      {step && (
        <>
          {options.length > 1 && <div className="actions" role="group" aria-label="配方选项">
            {options.map((entry, index) => <Btn key={entry.kind + entry.id} className={'mini' + (step === entry ? ' on' : '')}
              aria-pressed={step === entry} onClick={() => setOption(index)}>
              {STATION_NAMES[entry.station]} · {Object.keys(entry.cost).map((id) => ITEMS[id].name).join('、')}
            </Btn>)}
          </div>}
          <EntryHeader actions={canMake && onMake ? <Btn onClick={() => onMake(step)}>前往制造</Btn> : undefined}>
            <span>{STATION_NAMES[step.station]} · 产出 {batches * step.amount}</span>
            {!canUseStation(s, step.station) && <span className="bad">缺少{STATION_NAMES[step.station]}</span>}
          </EntryHeader>
          <ul className="recipe-ingredients">
            {Object.entries(cost).map(([id, n]) => {
              const have = available(s, id)
              return <li key={id}><Ingredient item={id} needed={n} have={have}
                ancestors={[...ancestors, item]} onMake={onMake} /></li>
            })}
          </ul>
        </>
      )}
      {source.stored.length > 0 && <p>库存 · {source.stored.join('、')}</p>}
      {source.locations.length > 0 && <p>采集地点 · {source.locations.join('、')}</p>}
      {source.hint && <p className="dim">{source.hint}</p>}
      {!step && !source.locations.length && !source.hint && <p className="dim">尚未发现来源。</p>}
    </div>
  )
}

function Ingredient({ item, needed, have, ancestors, onMake }: {
  item: string
  needed: number
  have: number
  ancestors: string[]
  onMake?: (target: RecipeTarget) => void
}) {
  const missing = Math.max(0, needed - have)
  return (
    <Collapsible className="recipe-ingredient">
      <CollapsibleTrigger className="btn recipe-ingredient-trigger">
        <ItemName id={item} /> <span className={missing ? 'bad' : 'good'}>{Math.min(needed, have)}/{needed}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="recipe-ingredient-content">
        <RecipeDetails item={item} needed={missing || needed} ancestors={ancestors} onMake={onMake} />
      </CollapsibleContent>
    </Collapsible>
  )
}
