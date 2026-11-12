import { ScrollArea } from './ui/ScrollArea'
import { TabCard, Tabs, TabsList, TabsTrigger, TabsContent } from './components/minecraft/tabs'
import { Dialog, DialogContent } from './components/minecraft/dialog'
import { Card } from './components/minecraft/card'
import { Button } from './components/minecraft/button'
import { AdventureImage } from './components/minecraft/minecraft-adventure-image'
import { Texture } from './ui/Texture'
import { useEffect, useState } from 'react'
import { ITEM_LIST, MOBS, villageLevel, type Cat } from './game/data'
import { count, dayOf, hourOf, isNight, production, useGame, villageCap } from './game/store'
import { Adventure } from './ui/Adventure'
import { PlayerHud } from './ui/PlayerHud'
import { Crafting } from './ui/Crafting'
import { Village } from './ui/Village'
import { Bar, Btn } from './ui/kit'

const WEATHER = {
  clear: { label: '晴', icon: '/textures/minecraft/weather_clear.png' },
  rain: { label: '雨', icon: '/textures/minecraft/weather_rain.png' },
  storm: { label: '雷暴', icon: '/textures/minecraft/weather_thunderstorm.png' },
} as const

export function App() {
  const flags = useGame((s) => s.flags)
  const villagers = useGame((s) => s.village?.villagers ?? null)
  const [tab, setTab] = useState('adventure')
  const [settings, setSettings] = useState(false)

  useEffect(() => {
    const t = setInterval(() => useGame.getState().tick(), 1000)
    return () => clearInterval(t)
  }, [])

  const tabs: [string, string, boolean][] = [
    ['adventure', '冒险', true],
    ['crafting', '制造', !!flags.inv],
    ['village', villagers === null ? '村庄' : villageLevel(villagers), villagers !== null],
  ]
  const cur = tabs.find(([id, , ok]) => id === tab && ok) ? tab : 'adventure'
  const early = !flags.inv

  return (
    <div className="app">
      <div className={`layout ${early ? 'early' : ''}`}>
        <div className="sidebar-column sidebar-left">
          {flags.explore && <Clock />}
          <LogPanel />
        </div>
        <main className="main"><Tabs value={cur} onValueChange={(value) => setTab(String(value))}>
          {!early && (
            <TabsList className="tabs" aria-label="游戏页面">
              {tabs.filter(([, , ok]) => ok).map(([id, name]) => (
                <TabsTrigger key={id} value={id} aria-label={name}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          <Card className="panel main-panel">
            <ScrollArea key={cur} className="main-scroll" tabIndex={0} aria-label="滚动主区域">
            <TabsContent value="adventure"><Adventure /></TabsContent>
            <TabsContent value="crafting"><Crafting /></TabsContent>
            <TabsContent value="village"><Village /></TabsContent>
            </ScrollArea>
          </Card>
        </Tabs>
        {flags.status && <PlayerHud />}
        </main>
        <div className="sidebar-column sidebar-right">
          <div className="toolbar" role="group" aria-label="游戏菜单">
            <Button className="btn toolbar-button" aria-label="成就" title="成就" disabled>
              <Texture src="/textures/minecraft/challenge_frame_obtained.png" />
            </Button>
            <Button className="btn toolbar-button" aria-label="统计" title="统计" disabled>
              <Texture src="/textures/minecraft/writable_book.png" />
            </Button>
            <Button className="btn toolbar-button" aria-label="设置" title="设置" onClick={() => setSettings(true)}>
              <Texture src="/textures/minecraft/icon_setting.png" />
            </Button>
          </div>
          {!early && <Sidebar />}
        </div>
      </div>

      <CombatModal />
      <WinModal />
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  )
}

function Clock() {
  const minute = useGame((s) => s.minute)
  const weather = useGame((s) => s.weather)
  const { label, icon } = WEATHER[weather]
  const h = hourOf(minute)
  const night = isNight(minute)
  const pos = night ? ((h + 4) % 24) / 10 : (h - 6) / 14
  const bg = night
    ? 'linear-gradient(90deg,#0d1026,#1a1f4a,#0d1026)'
    : h < 8 || h >= 18
      ? 'linear-gradient(90deg,#d9793a,#e9b46a,#7fb2d9)'
      : weather === 'clear' ? 'linear-gradient(90deg,#6fb3e8,#a6d4f5,#6fb3e8)' : 'linear-gradient(90deg,#59636e,#7d8791,#59636e)'
  return (
    <TabCard className="clock" aria-label="日期、时间和天气">
      <div className="spread">
        <span>第 {dayOf(minute)} 天 {String(h).padStart(2, '0')}:{String(minute % 60).padStart(2, '0')}</span>
        <span className="icon-text"><Texture src={icon} />{label}</span>
      </div>
      <div className="sky" style={{ background: bg }} aria-hidden>
        <span className="sky-marker" data-night={night} style={{ left: `${Math.min(96, Math.max(4, pos * 100))}%` }} />
      </div>
    </TabCard>
  )
}

function LogPanel() {
  const log = useGame((s) => s.log)
  return (
    <Card className="panel log" role="complementary" aria-label="冒险日志" aria-live="polite">
      <ScrollArea className="sidebar-scroll log-scroll" tabIndex={0} aria-label="滚动冒险日志">
      {log.slice(0, 40).map((l, i) => (
        <p key={l.id} className={l.kind === 'info' ? '' : l.kind} style={{ opacity: Math.max(0.25, 1 - i * 0.045) }}>
          {l.text}
        </p>
      ))}
      </ScrollArea>
    </Card>
  )
}

const SIDE_CATS: [Cat, string][] = [['material', '材料'], ['food', '食物'], ['special', '奇物'], ['tool', '工具'], ['gear', '装备']]

function Sidebar() {
  const s = useGame()
  const prod = s.village ? production(s.village) : {}
  const cap = s.village ? villageCap(s.village) : 0
  return (
    <Card className="panel side fade-in" role="complementary" aria-label="物资">
      <ScrollArea className="sidebar-scroll" tabIndex={0} aria-label="滚动物资">
      <h3><span>物资</span></h3>
      {SIDE_CATS.map(([cat, name]) => {
        const items = ITEM_LIST.filter((i) => i.cat === cat && (count(s, i.id) > 0 || prod[i.id]))
        if (!items.length) return null
        const unique = cat === 'tool' || cat === 'gear'
        return (
          <div key={cat} className="inv-group">
            <div className="sm dim">{name}</div>
            {items.map((i) => {
              const n = count(s, i.id)
              const full = !!prod[i.id] && n >= cap
              return (
                <div key={i.id} className="inv-row" title={i.desc}>
                  <span className="icon-text inv-name"><Texture src={i.icon} /><span>{i.name}</span></span>
                  <span className="inv-values">
                    {!unique && <span className={full ? 'gold' : ''}>{n}</span>}
                    {prod[i.id] && <span className="rate">{full ? '已满' : `+${prod[i.id].toFixed(2)}/秒`}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
      </ScrollArea>
    </Card>
  )
}

function CombatModal() {
  const s = useGame()
  const c = s.combat
  if (!c) return null
  const m = MOBS[c.mob]
  const food = ITEM_LIST.filter((i) => i.food && i.id !== 'rotten' && count(s, i.id) > 0).sort((a, b) => b.food! - a.food!)[0]
  const mobHealth = `${Math.max(0, c.hp)} / ${m.hp}`
  const playerHealth = `${Math.ceil(s.hp)} / 20`
  return (
    <Dialog open><DialogContent className="game-dialog" aria-label="战斗">
      <div className="modal">
        <div key={c.hp} className="mob-icon shake"><Texture src={m.icon} className="combat-mob" /></div>
        <div className="combat-health">
          <div className="spread">
            <div className="row"><h2>{m.name}</h2>{c.boss && <span className="tag y">首领</span>}</div>
            <span className="sm">{mobHealth}</span>
          </div>
          <Bar value={c.hp} max={m.hp} color="#8d3fbf" label={`${m.name}生命值`} valueText={mobHealth} />
        </div>
        <div className="combat-health">
          <div className="spread sm">
            <span className="icon-text"><AdventureImage texture="gui/sprites/hud/heart/full" scale={2} /> 你</span>
            <span>{playerHealth}</span>
          </div>
          <Bar value={s.hp} max={20} color="#c8402f" label="玩家生命值" valueText={playerHealth} />
        </div>
        <div className="combat-lines">{c.lines.map((l, i) => <p key={c.lines.length - i}>{l}</p>)}</div>
        <div className="actions">
          <Btn cd="attack" className="primary" onClick={s.attack}>攻击</Btn>
          {food && <Btn cd="eat" disabled={s.hunger >= 20} onClick={() => s.eat(food.id)} sub={`余 ${count(s, food.id)}`}>吃{food.name}</Btn>}
          <Btn cd="flee" disabled={c.boss} onClick={s.flee} sub={c.boss ? '无路可退' : undefined}>逃跑</Btn>
        </div>
      </div>
    </DialogContent></Dialog>
  )
}

function WinModal() {
  const s = useGame()
  if (!s.flags.showWin) return null
  return (
    <Dialog open onOpenChange={(open) => { if (!open) s.dismissWin() }}><DialogContent className="game-dialog" aria-label="通关">
      <div className="modal">
        <div className="mob-icon"><Texture src="/textures/minecraft/dragon_egg.png" /></div>
        <h2>一周目通关</h2>
        <p className="dim">末影龙倒下了。从一棵树开始，你走到了世界的尽头。</p>
        <p className="sm">
          历时 {dayOf(s.minute)} 天 · 行动 {s.stats.actions} 次 · 探索 {s.stats.explored} 处 · 击败 {s.stats.kills} 只生物 · 死亡 {s.stats.deaths} 次
        </p>
        <div className="actions"><Btn className="primary" onClick={s.dismissWin}>继续经营</Btn></div>
      </div>
    </DialogContent></Dialog>
  )
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useGame()
  const [confirm, setConfirm] = useState(false)
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="game-dialog" aria-label="设置">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>设置</h2>
        <p className="sm dim">进度会自动保存在本机浏览器中。</p>
        <div className="actions">
          <Btn onClick={() => { s.devUnlock(); onClose() }} sub="预览全部界面">开发者：发放物资</Btn>
          <Btn className="danger" onClick={() => (confirm ? (s.reset(), onClose()) : setConfirm(true))}>
            {confirm ? '确定删除存档？' : '重置存档'}
          </Btn>
          <Btn onClick={onClose}>关闭</Btn>
        </div>
      </div>
    </DialogContent></Dialog>
  )
}
