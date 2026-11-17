import { useState, type ReactNode } from 'react'
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
import { Btn, IngredientName, ItemName } from './kit'
import { Texture } from './Texture'

interface RecipeBookProps {
  initialItem?: string
  onMake?: (target: RecipeTarget) => void
}

const CATEGORY_NAMES = Object.fromEntries(ITEM_CATEGORIES) as Record<Cat, string>

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
  const places = [
    ...Object.values(BIOMES).filter((place) => s.seenPlaces[place.id]).map((place) => [place.id, place.name] as const),
    ...Object.entries(VARIANT_NAMES).filter(([id]) => s.flags['variant_' + id]),
  ]
  const sites = Object.entries(SITES).filter(([id]) => s.flags['site_' + id]).map(([id, site]) => [id, site.name] as const)
  const animals = Object.entries(WILDLIFE).filter(([id]) => s.flags['wildlife_' + id]).map(([id, animal]) => [id, animal.name] as const)
  const groups = [['到访地点', places], ['附近发现', sites], ['生物', animals]] as const
  return (
    <div className="book-browser">
      {groups.map(([title, entries]) => (
        <BookBlock key={title} title={title} extra={<span className="book-count">{entries.length}</span>}>
          {entries.length > 0
            ? <ul className="book-chips">{entries.map(([id, name]) => <li key={id} className="book-chip">{name}</li>)}</ul>
            : <p className="notice">尚无记录。</p>}
        </BookBlock>
      ))}
    </div>
  )
}

function ItemsBook({ initialItem, onMake }: RecipeBookProps) {
  const s = useGame()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Cat | 'all'>('all')
  const [selected, setSelected] = useState(initialItem ?? '')
  const search = query.trim()
  const known = ITEM_LIST.filter((item) => itemKnown(s, item.id) || recipeOptions(s, item.id).length > 0)
  const items = known.filter((item) => search ? item.name.includes(search) : category === 'all' || item.cat === category)

  if (selected && ITEMS[selected]) {
    return <ItemDetail item={selected} onBack={() => setSelected('')} onSelect={setSelected} onMake={onMake} />
  }

  // 全部分类且未搜索时按分类分组，其余情况为单一列表。
  const groups = !search && category === 'all'
    ? ITEM_CATEGORIES.map(([cat, label]) => [label, items.filter((item) => item.cat === cat)] as const)
      .filter(([, list]) => list.length > 0)
    : [[null, items] as const]

  return (
    <div className="book-browser">
      <div className="book-toolbar">
        <Input className="book-search-input" type="search" value={query} placeholder="搜索物品"
          aria-label="搜索物品" onChange={(event) => setQuery(event.target.value)} />
        <div className="book-filters recipe-filters" role="group" aria-label="物品分类">
          {([['all', '全部'], ...ITEM_CATEGORIES] as const).map(([id, label]) =>
            <Btn key={id} className={'mini' + (!search && category === id ? ' on' : '')} disabled={!!search}
              aria-pressed={!search && category === id} onClick={() => setCategory(id)}>{label}</Btn>)}
        </div>
      </div>
      {items.length === 0 && <p className="notice">没有匹配的已知物品。</p>}
      {groups.map(([label, list], index) => (
        <section key={label ?? index} className="book-group">
          {label && <h4 className="book-group-title"><span>{label}</span><span className="book-count">{list.length}</span></h4>}
          <ItemGrid ids={list.map((item) => item.id)} onSelect={setSelected} />
        </section>
      ))}
      {items.some((item) => !s.seen[item.id]) && <p className="book-legend">未收录：已知配方但尚未获得</p>}
    </div>
  )
}

function ItemGrid({ ids, onSelect }: { ids: string[]; onSelect: (id: string) => void }) {
  const s = useGame()
  return (
    <ul className="book-grid">
      {ids.map((id) => (
        <li key={id}>
          <button type="button" className="book-cell" data-unseen={!s.seen[id] || undefined}
            title={s.seen[id] ? ITEMS[id].name : `${ITEMS[id].name}（未收录）`} onClick={() => onSelect(id)}>
            <Texture src={ITEMS[id].icon} />
            <span className="book-cell-name">{ITEMS[id].name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function ItemDetail({ item, onBack, onSelect, onMake }: {
  item: string
  onBack: () => void
  onSelect: (id: string) => void
  onMake?: (target: RecipeTarget) => void
}) {
  const s = useGame()
  const def = ITEMS[item]
  const uses = recipeUses(s, item)
  const hasRecipe = recipeOptions(s, item).length > 0
  return (
    <div className="book-detail fade-in" key={item}>
      <Btn className="mini book-back" onClick={onBack}>‹ 返回列表</Btn>
      <header className="book-hero">
        <span className="book-hero-icon"><Texture src={def.icon} /></span>
        <div className="book-hero-text">
          <h3 className="book-hero-name">{def.name}</h3>
          <div className="book-hero-tags">
            <span className="tag">{CATEGORY_NAMES[def.cat]}</span>
            {s.seen[item] ? <span className="tag g">已收录</span> : <span className="tag">未收录</span>}
            {!!def.food && <span className="tag y">饱食 +{def.food}</span>}
            {available(s, item) > 0 && <span className="tag">持有 {available(s, item)}</span>}
          </div>
        </div>
      </header>
      {def.desc && <p className="book-desc">{def.desc}</p>}
      <BookBlock title={hasRecipe ? '配方' : '来源'}>
        <RecipeDetails item={item} needed={1} ancestors={[]} onMake={onMake} />
      </BookBlock>
      {uses.length > 0 && <BookBlock title="用途" extra={<span className="book-count">{uses.length}</span>}>
        <ItemGrid ids={uses} onSelect={onSelect} />
      </BookBlock>}
    </div>
  )
}

function BookBlock({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="book-block">
      <h4 className="book-group-title"><span>{title}</span>{extra}</h4>
      {children}
    </section>
  )
}

function RecipeDetails({ item, needed, ancestors, onMake }: {
  item: string
  needed: number
  ancestors: string[]
  onMake?: (target: RecipeTarget) => void
}) {
  const s = useGame()
  const step = recipeOptions(s, item).find((entry) =>
    !Object.keys(entry.cost).some((id) => id === item || ancestors.includes(id)))
  const source = itemSources(s, item)
  const batches = step ? Math.ceil(needed / step.amount) : 0
  const cost = step ? Object.fromEntries(Object.entries(step.cost).map(([id, n]) => [id, n * batches])) : {}
  const stationReady = step ? canUseStation(s, step.station) : false
  const canMake = step && !s.combat && !s.submerged && stationReady &&
    canAfford(s, cost, step.alternatives) && outputRoom(s, step.out) >= step.amount
  const sources = [
    ['库存', source.stored],
    ['采集', source.locations],
  ] as const

  return (
    <div className="recipe-details">
      {step && (
        <>
          <div className="recipe-station">
            <span className="recipe-station-info">
              <span className={stationReady ? undefined : 'bad'}>{STATION_NAMES[step.station]}</span>
              <span className="dim">产出 ×{batches * step.amount}</span>
              {!stationReady && <span className="bad">（缺少工作站）</span>}
            </span>
            {canMake && onMake && <Btn className="mini primary" onClick={() => onMake(step)}>前往制造</Btn>}
          </div>
          <ul className="recipe-ingredients">
            {Object.entries(cost).map(([id, n]) => {
              const have = available(s, id, step.alternatives)
              return <li key={id}><Ingredient item={id} needed={n} have={have}
                choices={step.alternatives?.[id]} ancestors={[...ancestors, item]} onMake={onMake} /></li>
            })}
          </ul>
        </>
      )}
      {sources.some(([, list]) => list.length > 0) && (
        <dl className="recipe-sources">
          {sources.filter(([, list]) => list.length > 0).map(([label, list]) => (
            <div key={label} className="recipe-source-row"><dt>{label}</dt><dd>{list.join('、')}</dd></div>
          ))}
        </dl>
      )}
      {source.hint && <p className="dim sm">{source.hint}</p>}
      {!step && !source.locations.length && !source.hint && <p className="dim sm">尚未发现来源。</p>}
    </div>
  )
}

function Ingredient({ item, needed, have, choices, ancestors, onMake }: {
  item: string
  needed: number
  have: number
  choices?: readonly string[]
  ancestors: string[]
  onMake?: (target: RecipeTarget) => void
}) {
  const missing = Math.max(0, needed - have)
  return (
    <Collapsible className="recipe-ingredient">
      <CollapsibleTrigger className="btn recipe-ingredient-trigger">
        <IngredientName id={item} choices={choices} />
        <span className={'recipe-count ' + (missing ? 'bad' : 'good')}>{Math.min(needed, have)}/{needed}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="recipe-ingredient-content">
        {choices ? choices.map((id) => (
          <div key={id} className="recipe-choice">
            <span className="recipe-choice-name"><ItemName id={id} /></span>
            <RecipeDetails item={id} needed={missing || needed} ancestors={ancestors} onMake={onMake} />
          </div>
        )) : <RecipeDetails item={item} needed={missing || needed} ancestors={ancestors} onMake={onMake} />}
      </CollapsibleContent>
    </Collapsible>
  )
}
