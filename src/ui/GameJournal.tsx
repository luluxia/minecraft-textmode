import { useRef, useState, type ChangeEvent } from 'react'
import { Card } from '../components/minecraft/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/minecraft/select'
import { Switch } from '../components/minecraft/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/minecraft/tabs'
import { GameDialog } from './GameDialog'
import { useScrollReset } from './ScrollArea'
import { ITEM_CATEGORIES, ITEM_LIST } from '../game/data'
import { EXPEDITIONS } from '../game/progression'
import { EXPLORATION, PROJECTS, STORY, TUTORIAL, getAchievement, getCompletedAchievements, type GoalHint, type GoalTerm } from '../game/advancements'
import { dayOf, useGame } from '../game/store'
import { Texture } from './Texture'
import { Bar, Btn, EntryHeader, ItemName, Section } from './kit'
import { UI_SCALES, useInterfaceSettings } from './interfaceSettings'

const JOURNAL_TITLES = { catalog: '图鉴', achievements: '成就', stats: '统计', settings: '设置' } as const
export type GameMenu = keyof typeof JOURNAL_TITLES

const ACHIEVEMENT_TABS = [
  { id: 'story', label: '生存与维度', steps: STORY },
  { id: 'projects', label: '村庄与末地', steps: PROJECTS },
  { id: 'exploration', label: '遗迹与远航', steps: EXPLORATION },
]
const ACHIEVEMENT_COUNT = ACHIEVEMENT_TABS.reduce((total, { steps }) => total + steps.length, 0)

export function CurrentGoal({ onOpenAchievements }: { onOpenAchievements: () => void }) {
  const tracked = useGame((s) => {
    if (!s.trackedAchievement && s.homeId === null) return undefined
    const completed = getCompletedAchievements(s)
    if (completed.size === ACHIEVEMENT_COUNT) return 'all-complete'
    const entry = s.trackedAchievement ? getAchievement(s.trackedAchievement) : undefined
    if (!entry || completed.has(entry.id) || entry.requires?.some((id) => !completed.has(id))) return undefined
    return entry
  })
  const tutorial = useGame((s) => s.homeId === null ? TUTORIAL.find((entry) => !entry.complete(s)) : undefined)
  const allComplete = tracked === 'all-complete'
  const goal = allComplete ? undefined : tracked ?? tutorial

  return (
    <Card className="panel current-goal" role="region" aria-label={goal ? '当前目标' : '自由探索'}>
      {goal ? <>
        <h3>当前目标</h3>
        <p><GoalLabel term={goal.icon} label={goal.title} /></p>
        <p className="sm dim"><GoalText hint={goal.hint} /></p>
      </> : <>
        <p className="sm dim">{allComplete ? '已完成当前版本所有成就，请自由探索' : '接下来可以自由探索，也可以在成就菜单追踪目标。'}</p>
      </>}
      {!allComplete && (tracked || !goal) && <Btn className="mini" onClick={onOpenAchievements}>打开成就</Btn>}
    </Card>
  )
}

function GoalLabel({ term, label = term.name }: { term: GoalTerm; label?: string }) {
  return (
    <span className="goal-term" data-tone={term.tone}>
      <Texture src={term.icon} />
      {label}
    </span>
  )
}

function GoalText({ hint }: { hint: GoalHint }) {
  return hint.map((part, index) => typeof part === 'string' ? part : <GoalLabel key={index} term={part} />)
}

export function JournalModal({ menu, onClose, onDebug }: {
  menu: GameMenu
  onClose: () => void
  onDebug?: () => void
}) {
  const s = useGame()
  const title = JOURNAL_TITLES[menu]
  const dialogClass = menu === 'stats' ? undefined : `${menu}-dialog`
  return (
    <GameDialog label={title} onClose={onClose} className={dialogClass}>
      <h2>{title}</h2>
      {menu === 'catalog' && <ItemCatalog />}
      {menu === 'settings' && <SaveSettings onClose={onClose} onDebug={onDebug} />}
      {menu === 'achievements' && <Achievements />}
      {menu === 'stats' && <dl className="village-stats">
        <dt>世界天数</dt><dd>{dayOf(s.minute)}</dd>
        <dt>采集与狩猎行动</dt><dd>{s.stats.actions}</dd>
        <dt>探索地点次数</dt><dd>{s.stats.explored}</dd>
        <dt>击败生物</dt><dd>{s.stats.kills}</dd>
        <dt>死亡次数</dt><dd>{s.stats.deaths}</dd>
        <dt>击退袭击</dt><dd>{s.expeditions.raid ?? 0}</dd>
        {([['ocean', '海洋远征'], ['end', '末地远征']] as const).map(([region, label]) => (
          <div key={region} className="stat-row">
            <dt>{label}</dt><dd>{EXPEDITIONS.reduce((n, entry) => n + (entry.region === region ? s.expeditions[entry.id] ?? 0 : 0), 0)}</dd>
          </div>
        ))}
      </dl>}
      <div className="actions"><Btn onClick={onClose}>关闭</Btn></div>
    </GameDialog>
  )
}

function ItemCatalog() {
  const seen = useGame((s) => s.seen)
  const resetScroll = useScrollReset()
  const discovered = ITEM_LIST.filter((item) => seen[item.id])

  return (
    <>
      <p className="sm dim">已收录 {discovered.length}/{ITEM_LIST.length} 种物资</p>
      {!discovered.length && <p className="notice">获得第一件物资后，图鉴会自动收录。</p>}
      {discovered.length > 0 && (
        <Tabs defaultValue={discovered[0].cat} onValueChange={() => resetScroll()}>
          <TabsList className="subtabs" aria-label="图鉴分类">
            {ITEM_CATEGORIES.map(([category, name]) => (
              <TabsTrigger key={category} value={category} aria-label={name}>{name}</TabsTrigger>
            ))}
          </TabsList>
          {ITEM_CATEGORIES.map(([category, name]) => {
            const items = discovered.filter((item) => item.cat === category)
            const total = ITEM_LIST.filter((item) => item.cat === category).length
            return (
              <TabsContent key={category} value={category}>
                <Section title={name} extra={items.length + '/' + total}>
                  {items.length === 0 && <p className="notice">还未收录此类物资。</p>}
                  {items.length > 0 && (
                    <ul className="entry-grid catalog-grid">
                      {items.map((item) => (
                        <li key={item.id} className="content-entry">
                          <ItemName id={item.id} />
                          {(item.food !== undefined || item.desc) && (
                            <p className="sm dim">{item.food !== undefined && '饱食 +' + item.food + '。'}{item.desc}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </>
  )
}

function Achievements() {
  const s = useGame()
  const resetScroll = useScrollReset()
  const completed = getCompletedAchievements(s)
  const tracked = s.trackedAchievement ? getAchievement(s.trackedAchievement) : undefined
  const [initialTab] = useState(() =>
    ACHIEVEMENT_TABS.find(({ steps }) => steps.some((entry) => entry.id === tracked?.id))?.id ?? 'story',
  )
  const trackedDone = tracked ? completed.has(tracked.id) : false

  return (
    <Tabs defaultValue={initialTab} onValueChange={() => resetScroll()}>
      {tracked && (
        <section className="content-entry achievement-tracking" aria-label="追踪目标">
          <EntryHeader actions={<Btn className="mini" onClick={() => s.trackAchievement(null)}>取消追踪</Btn>}>
            <h3 className="icon-text"><Texture src={tracked.icon.icon} />{tracked.title}</h3>
            <span className={`sm ${trackedDone ? 'good' : 'gold'}`}>{trackedDone ? '已完成' : '追踪中'}</span>
          </EntryHeader>
          <p className="sm dim"><GoalText hint={tracked.hint} /></p>
        </section>
      )}
      <TabsList className="subtabs" aria-label="成就分类">
        {ACHIEVEMENT_TABS.map(({ id, label }) => (
          <TabsTrigger key={id} value={id} aria-label={label}>{label}</TabsTrigger>
        ))}
      </TabsList>
      {ACHIEVEMENT_TABS.map(({ id, label, steps }) => {
        const count = steps.filter((entry) => completed.has(entry.id)).length
        return (
          <TabsContent key={id} value={id}>
            <div className="achievement-progress">
              <Bar value={count} max={steps.length} color="#6fae3a" label={label + '成就进度'}
                valueText={`已完成 ${count}/${steps.length}`} />
              <span className="sm dim" aria-hidden="true">{count}/{steps.length}</span>
            </div>
            <ul className="achievement-list">
              {steps.map((entry) => {
                const done = completed.has(entry.id)
                const pending = entry.requires?.filter((id) => !completed.has(id)) ?? []
                const locked = pending.length > 0
                const isTracked = tracked?.id === entry.id
                const canTrack = !done && !locked && !isTracked
                return (
                  <li key={entry.id} className="content-entry">
                    <EntryHeader
                      actions={canTrack ? (
                        <Btn className="mini" aria-label={`追踪${entry.title}`}
                          onClick={() => { s.trackAchievement(entry.id); resetScroll() }}>
                          追踪
                        </Btn>
                      ) : (
                        <span className={`tag${done ? ' g' : isTracked ? ' y' : ''}`}>
                          {done ? '已完成' : locked ? '未解锁' : '追踪中'}
                        </span>
                      )}
                    >
                      <h3 className="icon-text"><Texture src={entry.icon.icon} />{entry.title}</h3>
                    </EntryHeader>
                    <p className="sm dim"><GoalText hint={entry.hint} /></p>
                    {locked && (
                      <p className="sm dim">需先完成{pending.map((id) => `「${getAchievement(id)?.title}」`).join('、')}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function SaveSettings({ onClose, onDebug }: { onClose: () => void; onDebug?: () => void }) {
  const scale = useInterfaceSettings((s) => s.scale)
  const setScale = useInterfaceSettings((s) => s.setScale)
  const componentSound = useInterfaceSettings((s) => s.componentSound)
  const setComponentSound = useInterfaceSettings((s) => s.setComponentSound)
  const backup = useGame((s) => s.backup)
  const restore = useGame((s) => s.restore)
  const reset = useGame((s) => s.reset)
  const fileInput = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<{ name: string; raw: string } | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [status, setStatus] = useState('')
  const exportSave = () => {
    const url = URL.createObjectURL(new Blob([backup()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'block-idle-save.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setStatus('已导出当前进度。')
  }
  const chooseSave = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setSelected(null)
    setConfirm(false)
    if (file.size > 2_000_000) { setStatus('存档文件过大。'); return }
    try {
      setSelected({ name: file.name, raw: await file.text() })
      setStatus('')
    } catch {
      setStatus('无法读取文件。')
    }
  }
  const importSave = () => {
    if (!selected) return
    const error = restore(selected.raw)
    setSelected(null)
    if (error) { setStatus(error); return }
    useGame.getState().tick(true)
    onClose()
  }
  return (
    <>
      <section className="settings-group">
        <h3 id="settings-scale">界面缩放</h3>
        <div className="settings-controls">
          <Select<number> value={scale} onValueChange={(value) => { if (value !== null) setScale(value) }}>
            <SelectTrigger className="btn" aria-labelledby="settings-scale">
              <SelectValue>{`${scale}%`}</SelectValue>
            </SelectTrigger>
            <SelectContent className="settings-scale-options" alignItemWithTrigger={false} sideOffset={4}>
              {UI_SCALES.map((value) => <SelectItem key={value} value={value}>{`${value}%`}</SelectItem>)}
            </SelectContent>
          </Select>
          <Btn disabled={scale === 100} onClick={() => setScale(100)}>恢复默认</Btn>
        </div>
      </section>
      <section className="settings-group">
        <h3 id="settings-component-sound">组件音效</h3>
        <div className="settings-controls">
          <Switch className="btn" aria-labelledby="settings-component-sound" checked={componentSound} onCheckedChange={setComponentSound} />
        </div>
      </section>
      <section className="settings-group">
        <h3>存档</h3>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={chooseSave} />
        <div className="settings-controls">
          <Btn onClick={exportSave}>导出存档</Btn>
          <Btn onClick={() => fileInput.current?.click()}>载入存档</Btn>
          <Btn className="danger" onClick={() => { setConfirm(true); setSelected(null) }}>重置存档</Btn>
          {onDebug && <Btn onClick={onDebug}>Debug</Btn>}
        </div>
        {selected && <Card className="settings-confirmation">
          <p>用「{selected.name}」覆盖当前进度？</p>
          <div className="settings-controls">
            <Btn className="danger" onClick={importSave}>确认载入</Btn>
            <Btn onClick={() => setSelected(null)}>取消</Btn>
          </div>
        </Card>}
        {confirm && <Card className="settings-confirmation">
          <p>清除当前进度，从初生森林重新开始？</p>
          <div className="settings-controls">
            <Btn className="danger" onClick={() => { reset(); onClose() }}>确认重置</Btn>
            <Btn onClick={() => setConfirm(false)}>取消</Btn>
          </div>
        </Card>}
        {status && <p className="sm" role="status">{status}</p>}
      </section>
    </>
  )
}
