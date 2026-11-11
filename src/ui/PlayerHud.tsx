import { HealthMeter, ArmorMeter, HungerMeter, ExperienceBar } from '../components/minecraft/hud'
import { attackPower, defensePower, pickTier, useGame, xpNeed } from '../game/store'
import { PICK_NAMES } from '../game/data'

export function PlayerHud() {
  const s = useGame()
  const defense = defensePower(s)
  const tier = pickTier(s)
  return (
    <div className="player-hud" aria-label="玩家状态">
      <div className="hud-meters">
        <div className="hud-stat"><div className="spread sm"><span>生命</span><span>{Math.ceil(s.hp)} / 20</span></div><HealthMeter value={s.hp} aria-label="生命" /></div>
        <div className="hud-stat"><div className="spread sm"><span>饱食度</span><span>{Math.ceil(s.hunger)} / 20</span></div><HungerMeter value={s.hunger} aria-label="饱食度" /></div>
        <div className="hud-stat"><div className="spread sm"><span>防御</span><span>{defense}</span></div><ArmorMeter value={defense} aria-label="防御（图标上限20）" /></div>
      </div>
      <div className="hud-experience">
        <span className="good">{s.level} 级</span>
        <ExperienceBar scale={1} value={s.xp / xpNeed(s.level)} aria-label="升级经验" aria-valuetext={`${s.xp} / ${xpNeed(s.level)}`} />
        <span className="sm dim">{s.xp} / {xpNeed(s.level)}</span>
      </div>
      <div className="row sm dim"><span>攻击 {attackPower(s)}</span>{tier > 0 && <span>工具 · {PICK_NAMES[tier]}</span>}</div>
    </div>
  )
}
