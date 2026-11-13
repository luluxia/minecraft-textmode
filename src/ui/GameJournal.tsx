import { useRef, useState, type ChangeEvent } from 'react'
import { Card } from '../components/minecraft/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/minecraft/select'
import { Switch } from '../components/minecraft/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/minecraft/tabs'
import { GameDialog } from './GameDialog'
import { useScrollReset } from './ScrollArea'
import { ITEM_CATEGORIES, ITEM_LIST, ITEMS } from '../game/data'
import { EXPEDITIONS } from '../game/progression'
import { COMPLETED_MONUMENT, EXPLORATION, MONUMENT_GOAL, PROJECTS, STORY, type GoalHint, type GoalTerm } from '../game/advancements'
import { dayOf, useGame } from '../game/store'
import { Texture } from './Texture'
import { Btn, ItemName, Section } from './kit'
import { UI_SCALES, useInterfaceSettings } from './interfaceSettings'

const JOURNAL_TITLES = { catalog: '图鉴', achievements: '成就', stats: '统计', settings: '设置' } as const
export type GameMenu = keyof typeof JOURNAL_TITLES

const ACHIEVEMENT_TABS = [
  { id: 'story', label: '生存与探索', steps: STORY },
  { id: 'projects', label: '村庄与远征', steps: PROJECTS },
  { id: 'exploration', label: '遗迹与远航', steps: EXPLORATION },
]

export function CurrentGoal() {
  const s = useGame()
  const step = STORY.find((entry) => !entry.complete(s))
  const goal = s.village?.buildings.monument
    ? COMPLETED_MONUMENT
    : s.flags.won
      ? MONUMENT_GOAL
      : step
  if (!s.flags.inv || !goal) return null

  return (
    <Card className="panel current-goal" role="region" aria-labelledby="current-goal-heading">
      <div>
        <h3 id="current-goal-heading">当前目标</h3>
        <p><GoalLabel term={goal.icon} label={goal.title} /></p>
        <p className="sm dim"><GoalText hint={goal.hint} /></p>
      </div>
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

export function OfflineReport() {
  const report = useGame((s) => s.offline)
  const dismiss = useGame((s) => s.dismissOffline)
  if (!report) return null
  const changes = Object.entries(report.items).filter(([, n]) => n)
  const trip = EXPEDITIONS.find((entry) => entry.id === report.expedition)
  const hours = Math.floor(report.seconds / 3600)
  const minutes = Math.floor((report.seconds % 3600) / 60)
  const seconds = report.seconds % 60
  const duration = [hours && hours + ' 小时', minutes && minutes + ' 分钟', seconds && seconds + ' 秒'].filter(Boolean).join(' ')
  return (
    <aside className="notice offline-report" aria-label="离线结算">
      <div className="spread">
        <strong>离线结算 · {duration}</strong>
        <Btn className="mini" onClick={dismiss}>收起</Btn>
      </div>
      {changes.length > 0 && <p>{changes.map(([id, n]) => ITEMS[id].name + ' ' + (n > 0 ? '+' : '') + n).join('，')}</p>}
      {report.villagers > 0 && <p>新搬入的村民 +{report.villagers}</p>}
      {trip && <p>{trip.region === 'camp' ? '孵化完成' : '远征归来'} · {trip.name}</p>}
      {!changes.length && !report.villagers && !trip && <p>这段时间没有物资变化。</p>}
    </aside>
  )
}

export function JournalModal({ menu, onClose, onDebug }: {
  menu: GameMenu
  onClose: () => void
  onDebug?: () => void
}) {
  const s = useGame()
  const title = JOURNAL_TITLES[menu]
  const dialogClass = menu === 'catalog' || menu === 'settings' ? `${menu}-dialog` : undefined
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

  return (
    <Tabs defaultValue="story" onValueChange={() => resetScroll()}>
      <TabsList className="subtabs" aria-label="成就分类">
        {ACHIEVEMENT_TABS.map(({ id, label }) => (
          <TabsTrigger key={id} value={id} aria-label={label}>{label}</TabsTrigger>
        ))}
      </TabsList>
      {ACHIEVEMENT_TABS.map(({ id, steps }) => {
        const entries = steps.map((entry) => ({ ...entry, done: entry.complete(s) }))
        return (
          <TabsContent key={id} value={id}>
            <p className="achievement-progress sm dim">已完成 {entries.filter((entry) => entry.done).length}/{entries.length}</p>
            <ul className="achievement-list">
              {entries.map(({ title, icon, hint, done }) => (
                <li key={title}>
                  <strong>
                    <span className="achievement-status" data-complete={done} role="img" aria-label={done ? '已完成' : '未完成'} />
                    <GoalLabel term={icon} label={title} />
                  </strong>
                  {!done && <span className="dim"><GoalText hint={hint} /></span>}
                </li>
              ))}
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
