import { ScrollArea } from './ui/ScrollArea'
import { TabCard, Tabs, TabsList, TabsTrigger, TabsContent } from './components/minecraft/tabs'
import { GameDialog } from './ui/GameDialog'
import { Card } from './components/minecraft/card'
import { Button } from './components/minecraft/button'
import { Texture } from './ui/Texture'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ITEM_CATEGORIES, ITEM_LIST, ITEMS, MOBS, itemCostText } from './game/data'
import { canBreatheUnderwater, combatInterval, dragonLanded, nextStrike, combatMaxHp, canUseItem, count, dayOf, hourOf, isNight, useGame } from './game/store'
import type { RecipeTarget } from './game/recipes'
import { Adventure } from './ui/Adventure'
import { ActionGrid } from './ui/ActionGrid'
import { PlayerHud } from './ui/PlayerHud'
import { Crafting } from './ui/Crafting'
import { Village } from './ui/Village'
import { LocationName, ActionTitle, Btn } from './ui/kit'
import { CurrentGoal, JournalModal, type GameMenu } from './ui/GameJournal'
import { MAX_AIR, WATER_BREATHING_SECONDS, seasonAt } from './game/progression'
import { DebugPanel } from './ui/DebugPanel'
import { SwipeGuide } from './ui/SwipeGuide'

const WEATHER = {
  clear: { label: '晴', icon: '/textures/minecraft/weather_clear.png' },
  rain: { label: '雨', icon: '/textures/minecraft/weather_rain.png' },
  storm: { label: '雷暴', icon: '/textures/minecraft/weather_thunderstorm.png' },
} as const

export function App() {
  const layoutRef = useRef<HTMLDivElement>(null)
  const flags = useGame((s) => s.flags)
  const villagers = useGame((s) => s.village?.villagers ?? null)
  const showAir = useGame((s) => s.submerged || s.air < MAX_AIR)
  const [tab, setTab] = useState('adventure')
  const [bookItem, setBookItem] = useState<string>()
  const [recipeTarget, setRecipeTarget] = useState<RecipeTarget>()
  const [menu, setMenu] = useState<GameMenu | 'debug' | null>(null)
  const debugActive = useGame((s) => !!s.freeResources)
  const [worldRevision, setWorldRevision] = useState(0)
  const [showSwipeGuide, setShowSwipeGuide] = useState(false)
  const closeMenu = () => setMenu(null)
  const openBook = (item?: string) => {
    setBookItem(item)
    setMenu('catalog')
  }
  const openRecipe = (target: RecipeTarget) => {
    setRecipeTarget({ ...target })
    setTab('crafting')
    closeMenu()
  }
  const showAdventure = () => {
    setTab('adventure')
    setWorldRevision((revision) => revision + 1)
    closeMenu()
  }

  useLayoutEffect(() => {
    const centerMain = () => {
      const layout = layoutRef.current
      const main = layout?.querySelector<HTMLElement>(':scope > .main')
      if (!layout || !main || document.documentElement.dataset.uiCompact !== 'true') return
      const zoom = main.getBoundingClientRect().width / main.offsetWidth
      layout.scrollLeft += (main.getBoundingClientRect().left - layout.getBoundingClientRect().left) / zoom
        - (layout.clientWidth - main.clientWidth) / 2
    }
    centerMain()
    window.addEventListener('resize', centerMain)
    return () => window.removeEventListener('resize', centerMain)
  }, [])

  useEffect(() => {
    const tick = (background: boolean) => useGame.getState().tick(background)
    const visibility = () => tick(!document.hidden || useGame.getState().submerged)
    if (!document.hidden) tick(true)
    const timer = window.setInterval(() => { if (!document.hidden) tick(false) }, 1000)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  const tabs: [string, string, boolean][] = [
    ['adventure', '冒险', true],
    ['crafting', '制造', debugActive || !!flags.inv],
    ['village', '村庄', !!flags.metVillage || villagers !== null],
  ]
  const cur = tabs.find(([id, , ok]) => id === tab && ok) ? tab : 'adventure'
  const early = !debugActive && !flags.inv && !flags.metVillage && villagers === null

  return (
    <div className="app">
      <div ref={layoutRef} className={`layout ${early ? 'early' : ''}`} tabIndex={0} aria-label="游戏区域，可左右滚动查看日志、冒险和物资">
        <div className="sidebar-column sidebar-left">
          {flags.explore && <Clock />}
          <CurrentGoal onOpenAchievements={() => setMenu('achievements')} />
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
          <Card key={worldRevision} className="panel main-panel">
            {tabs.map(([id]) => (
              <TabsContent key={id} value={id} keepMounted className="main-tab-content">
                <ScrollArea className="main-scroll" tabIndex={0} aria-label="滚动主区域">
                  {id === 'adventure' ? <Adventure onFirstChop={() => {
                    if (document.documentElement.dataset.uiCompact === 'true') setShowSwipeGuide(true)
                  }} /> : id === 'crafting' ? <Crafting target={recipeTarget} /> : <Village />}
                </ScrollArea>
              </TabsContent>
            ))}
          </Card>
        </Tabs>
        {(flags.status || showAir) && <PlayerHud />}
        </main>
        <div className="sidebar-column sidebar-right">
          <div className="toolbar" role="group" aria-label="游戏菜单">
            {import.meta.env.DEV && debugActive && (
              <Btn className="toolbar-button on" onClick={() => setMenu('debug')}>作弊模式</Btn>
            )}
            <Button className="btn toolbar-button" aria-label="配方书" title="配方书" onClick={() => openBook()}>
              <Texture src="/textures/icons-essential/Book.png" />
            </Button>
            <Button className="btn toolbar-button" aria-label="成就" title="成就" onClick={() => setMenu('achievements')}>
              <Texture src="/textures/icons-essential/Trophy.png" />
            </Button>
            <Button className="btn toolbar-button" aria-label="统计" title="统计" onClick={() => setMenu('stats')}>
              <Texture src="/textures/icons-essential/Document.png" />
            </Button>
            <Button className="btn toolbar-button" aria-label="设置" title="设置" onClick={() => setMenu('settings')}>
              <Texture src="/textures/icons-essential/Gear.png" />
            </Button>
            <Button className="btn toolbar-button" aria-label="关于" title="关于" onClick={() => setMenu('about')}>
              <Texture src="/textures/icons-essential/Info.png" />
            </Button>
          </div>
          {!early && <Sidebar />}
        </div>
      </div>

      <CombatModal />
      <WinModal />
      {showSwipeGuide && <SwipeGuide onClose={() => setShowSwipeGuide(false)} />}
      {menu && menu !== 'debug' && <JournalModal menu={menu} onClose={closeMenu} bookItem={bookItem} onRecipe={openRecipe}
        onDebug={import.meta.env.DEV ? () => setMenu('debug') : undefined} />}
      {import.meta.env.DEV && menu === 'debug' && (
        <GameDialog label="Debug" onClose={closeMenu}>
          <h2>Debug</h2>
          <DebugPanel active={debugActive} onWorldChange={showAdventure} />
          <ActionGrid><Btn onClick={closeMenu}>关闭</Btn></ActionGrid>
        </GameDialog>
      )}
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
        <span>{seasonAt(minute).name} · 第 {dayOf(minute)} 天 {String(h).padStart(2, '0')}:{String(minute % 60).padStart(2, '0')}</span>
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
          {/^(抵达|返回|撤回|你在地图上标记了)/.test(l.text) ? <LocationName name={l.text} /> : l.text}
        </p>
      ))}
      </ScrollArea>
    </Card>
  )
}

function Sidebar() {
  const s = useGame()
  return (
    <Card className="panel side fade-in" role="complementary" aria-label="背包">
      <ScrollArea className="sidebar-scroll" tabIndex={0} aria-label="滚动物资">
      <h3><span>背包</span></h3>
      {ITEM_CATEGORIES.map(([cat, name]) => {
        const items = ITEM_LIST.filter((i) => i.cat === cat && count(s, i.id) > 0)
        if (!items.length) return null
        const unique = cat === 'tool' || cat === 'gear'
        return (
          <div key={cat} className="inv-group">
            <div className="sm dim">{name}</div>
            {items.map((i) => {
              const n = count(s, i.id)
              return (
                <div key={i.id} className="inv-row" title={i.desc}>
                  <span className="icon-text inv-name"><Texture src={i.icon} /><span>{i.name}</span></span>
                  <span className="inv-values">
                    {(!unique || n > 1) && <span>{n}</span>}
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
  const food = ITEM_LIST.filter((i) => i.food && i.id !== 'rotten' && canUseItem(s, i.id)).sort((a, b) => b.food! - a.food!)[0]
  const maxHp = combatMaxHp(c)
  const mobHealth = `${Math.max(0, c.hp)} / ${maxHp}`
  const mobHp = Math.min(maxHp, Math.max(0, c.hp))
  const interval = combatInterval(s, c)
  const fireWard = (s.cds.fire_ward?.until ?? 0) > Date.now()
  return (
    <GameDialog label="战斗" className="combat-dialog" scrollable={false}>
      <div className="combat-health">
        <div className="combat-mob-health spread" role="meter" aria-label={`${m.name}生命值`}
          aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={mobHp} aria-valuetext={mobHealth}
          style={{ backgroundSize: `${mobHp / maxHp * 100}% 100%` }}>
          <div className="row"><h2>{m.name}</h2>{c.boss && <span className="tag y">首领</span>}</div>
          <span className="sm">{mobHealth}</span>
        </div>
      </div>
      <div key={c.hp} className="mob-icon shake"><Texture src={m.icon} className="combat-mob" /></div>
      {m.atk > 0 && <p className="sm dim">{c.mob === 'dragon' && dragonLanded(c.turn) ? '落地破绽 · ' : ''}{nextStrike(c)}倒计时 {interval - (c.turn % interval)} 秒</p>}
      <PlayerHud />
      <ScrollArea className="combat-lines" tabIndex={0} role="region" aria-label="战斗日志">
        {c.lines.map((l, i) => <p key={c.lines.length - i}>{l}</p>)}
      </ScrollArea>
      <ActionGrid>
        <Btn cd="attack" className="primary" onClick={c.crystals ? s.breakCrystal : s.attack}>
          {c.crystals ? <ActionTitle name="击碎末地水晶" quantity={c.crystals} /> : c.mob === 'creaking' ? c.heartLocated ? '破坏嘎枝之心' : '寻找嘎枝之心' : '攻击'}</Btn>
        {canUseItem(s, 'shield') && <Btn cd="block" onClick={s.block} sub="格挡 4 秒">举盾</Btn>}
        {food && <Btn cd="eat" disabled={s.hunger >= 20 && s.hp >= 20} onClick={() => s.eat(food.id)}
          sub={s.hp < 20 ? `生命 +${Math.ceil(food.food! / 2)}` : `饱食 +${food.food}`}><ActionTitle name={'吃' + food.name} quantity={count(s, food.id)} /></Btn>}
        {canUseItem(s, 'potion') && <Btn cd="drink" disabled={s.hp >= 20} onClick={() => s.drink()} sub="生命 +8"><ActionTitle name="治疗药水" quantity={count(s, 'potion')} /></Btn>}
        {canUseItem(s, 'splash_healing') && <Btn cd="drink" disabled={s.hp >= 20} onClick={() => s.drink('splash_healing')} sub="生命 +8"><ActionTitle name="喷溅型治疗药水" quantity={count(s, 'splash_healing')} /></Btn>}
        {canUseItem(s, 'lingering_healing') && <Btn cd="drink" disabled={s.hp >= 20} onClick={() => s.drink('lingering_healing')} sub="生命 +12"><ActionTitle name="滞留型治疗药水" quantity={count(s, 'lingering_healing')} /></Btn>}
        {['blaze', 'magma_cube', 'ghast'].includes(c.mob) && canUseItem(s, 'fire_resistance') && (
          <Btn cd="drink" disabled={fireWard} onClick={() => s.drink('fire_resistance')} sub={fireWard ? '抗火生效中' : '抗火 60 秒'}><ActionTitle name="抗火药水" quantity={count(s, 'fire_resistance')} /></Btn>
        )}
        {canUseItem(s, 'wind_charge') && <Btn cd="gust" onClick={s.gust} sub={count(s, 'mace') ? '强化下一击' : '打断敌人'}><ActionTitle name="投掷风弹" quantity={count(s, 'wind_charge')} /></Btn>}
        {c.mob === 'dragon' && canUseItem(s, 'bottle') && !c.breathTaken && (
          <Btn disabled={c.turn < 4} onClick={s.bottleBreath} sub={c.turn < 4 ? `龙息 ${c.turn}/4` : s.freeResources ? undefined : itemCostText({ bottle: 1 })}>收集龙息</Btn>
        )}
        {s.submerged && canUseItem(s, 'water_breathing') && (
          <Btn cd="drink" disabled={canBreatheUnderwater(s)} onClick={s.drinkWaterBreathing}
            sub={canBreatheUnderwater(s) ? '水下呼吸生效中' : `水下呼吸 ${WATER_BREATHING_SECONDS} 秒`}><ActionTitle name="水肺药水" quantity={count(s, 'water_breathing')} /></Btn>
        )}
        {s.submerged
          ? <Btn onClick={s.surface}>上浮撤退</Btn>
          : <Btn cd="flee" onClick={s.flee} sub={c.boss ? '重置挑战进度' : undefined}>撤退</Btn>}
      </ActionGrid>
    </GameDialog>
  )
}

function WinModal() {
  const s = useGame()
  if (!s.flags.showWin) return null
  return (
    <GameDialog label="通关" onClose={s.dismissWin}>
      <div className="mob-icon"><Texture src="/textures/minecraft/dragon_egg.png" /></div>
      <h2>解放末地</h2>
      <p className="dim">末影龙倒下了，通往末地外岛的道路已经打开。回到村庄后，你可以派出第一支远征队。</p>
      <p className="sm">
        历时 {dayOf(s.minute)} 天 · 行动 {s.stats.actions} 次 · 探索 {s.stats.explored} 处 · 击败 {s.stats.kills} 只生物 · 死亡 {s.stats.deaths} 次
      </p>
      <ActionGrid><Btn className="primary" onClick={s.dismissWin}>继续经营</Btn></ActionGrid>
    </GameDialog>
  )
}
