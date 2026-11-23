import { useRef, useState, type ChangeEvent } from 'react'
import { ActionGrid } from './ActionGrid'
import { Card } from '../components/minecraft/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/minecraft/select'
import { Switch } from '../components/minecraft/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/minecraft/tabs'
import { GameDialog } from './GameDialog'
import { useScrollReset } from './ScrollArea'
import { EXPEDITIONS } from '../game/progression'
import { EXPLORATION, PROJECTS, STORY, TUTORIAL, achievementVisible, getAchievement, getCompletedAchievements, type GoalHint, type GoalTerm } from '../game/advancements'
import { dayOf, useGame } from '../game/store'
import type { RecipeTarget } from '../game/recipes'
import { RecipeBook } from './RecipeBook'
import { Texture } from './Texture'
import { Bar, Btn, EntryHeader } from './kit'
import { UI_SCALES, useInterfaceSettings } from './interfaceSettings'

const JOURNAL_TITLES = { catalog: '配方书', achievements: '成就', stats: '统计', settings: '设置', about: '关于' } as const
export type GameMenu = keyof typeof JOURNAL_TITLES

const ACHIEVEMENT_TABS = [
  { id: 'story', label: '生存与维度', steps: STORY },
  { id: 'projects', label: '村庄与末地', steps: PROJECTS },
  { id: 'exploration', label: '遗迹与远航', steps: EXPLORATION },
]

export function CurrentGoal({ onOpenAchievements }: { onOpenAchievements: () => void }) {
  const s = useGame()
  const completed = getCompletedAchievements(s)
  const tracked = s.trackedAchievement ? getAchievement(s.trackedAchievement) : undefined
  const goal = tracked && achievementVisible(tracked, s) && !completed.has(tracked.id) && !tracked.requires?.some((id) => !completed.has(id)) ? tracked : undefined
  const suggestions = TUTORIAL.filter((entry) => !completed.has(entry.id) &&
    !entry.requires?.some((id) => !completed.has(id)) &&
    (entry.id !== 'cook-food' && entry.id !== 'nearby-discovery' || s.flags.explore)).slice(0, 3)
  const allComplete = ACHIEVEMENT_TABS.every(({ steps }) => steps.every((entry) =>
    completed.has(entry.id) || !achievementVisible(entry, s)))
  return (
    <Card className="panel current-goal" role="region" aria-label={goal ? '当前目标' : '自由探索'}>
      {goal ? <>
        <h3>当前目标</h3>
        <p><GoalLabel term={goal.icon} label={goal.title} /></p>
        <p className="sm dim"><GoalText hint={goal.hint} /></p>
      </> : !allComplete && suggestions.length > 0 ? <>
        <h3>可选目标</h3>
        {suggestions.map((entry) => <p key={entry.id}><GoalLabel term={entry.icon} label={entry.title} /></p>)}
      </> : <p className="sm dim">{allComplete ? '已完成当前版本所有成就，请自由探索' : '接下来可以自由探索，也可以在成就菜单追踪目标。'}</p>}
      {!allComplete && <Btn className="mini" onClick={onOpenAchievements}>打开成就</Btn>}
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

export function JournalModal({ menu, onClose, onDebug, bookItem, onRecipe }: {
  menu: GameMenu
  onClose: () => void
  onDebug?: () => void
  bookItem?: string
  onRecipe?: (target: RecipeTarget) => void
}) {
  const s = useGame()
  const title = JOURNAL_TITLES[menu]
  return (
    <GameDialog label={title} onClose={onClose} className={menu === 'about' ? 'about-dialog' : `journal-dialog ${menu}-dialog`} showHeader>
      {menu === 'about' && <>
        <img className="about-logo" src="/logo/minecraft-text-mode.png" width="2006" height="397" alt="我的世界：文字模式" />
        <p>从初生森林出发，采集、合成，建起自己的村庄。在这款文字放置游戏里，你还可以穿过下界，前往末地挑战末影龙。</p>
        <a className="about-source" href="https://github.com/luluxia/minecraft-textmode" target="_blank" rel="noopener noreferrer">GitHub 源码 · luluxia/minecraft-textmode</a>
      </>}
      {menu === 'catalog' && <RecipeBook key={bookItem} initialItem={bookItem} onMake={onRecipe} />}
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
    </GameDialog>
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
        const visible = steps.filter((entry) => achievementVisible(entry, s))
        const count = visible.filter((entry) => completed.has(entry.id)).length
        return (
          <TabsContent key={id} value={id}>
            <div className="achievement-progress">
              <Bar value={count} max={visible.length} color="#6fae3a" label={label + '成就进度'}
                valueText={`已完成 ${count}/${visible.length}`} />
              <span className="sm dim" aria-hidden="true">{count}/{visible.length}</span>
            </div>
            <ul className="achievement-list">
              {visible.map((entry) => {
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
        <ActionGrid>
          <Btn onClick={exportSave}>导出存档</Btn>
          <Btn onClick={() => fileInput.current?.click()}>载入存档</Btn>
          <Btn className="danger" onClick={() => { setConfirm(true); setSelected(null) }}>重置存档</Btn>
          {onDebug && <Btn onClick={onDebug}>Debug</Btn>}
        </ActionGrid>
        {selected && <Card className="settings-confirmation">
          <p>用「{selected.name}」覆盖当前进度？</p>
          <ActionGrid>
            <Btn className="danger" onClick={importSave}>确认载入</Btn>
            <Btn onClick={() => setSelected(null)}>取消</Btn>
          </ActionGrid>
        </Card>}
        {confirm && <Card className="settings-confirmation">
          <p>清除当前进度，从初生森林重新开始？</p>
          <ActionGrid>
            <Btn className="danger" onClick={() => { reset(); onClose() }}>确认重置</Btn>
            <Btn onClick={() => setConfirm(false)}>取消</Btn>
          </ActionGrid>
        </Card>}
        {status && <p className="sm" role="status">{status}</p>}
      </section>
    </>
  )
}
