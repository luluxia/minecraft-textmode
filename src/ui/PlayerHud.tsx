import { HealthMeter, ArmorMeter, AirMeter, HungerMeter, ExperienceBar } from '../components/minecraft/hud'
import { Card } from '../components/minecraft/card'
import { defensePower, useGame, xpNeed } from '../game/store'

export function PlayerHud() {
  const s = useGame()
  const defense = defensePower(s)
  return (
    <Card className="panel player-status" role="region" aria-label="玩家状态">
      <div className="player-hud">
      <div className="hud-meters">
        <ArmorMeter value={defense} aria-label="护甲（图标上限20）" />
        {/* Air stays full until the game implements underwater breathing. */}
        <AirMeter value={10} aria-label="空气" />
        <HealthMeter value={s.hp} aria-label="生命" />
        <HungerMeter value={s.hunger} aria-label="饱食度" />
      </div>
      <div className="hud-experience">
        <ExperienceBar value={s.xp / xpNeed(s.level)} aria-label="升级经验" aria-valuetext={`${s.xp} / ${xpNeed(s.level)}`} />
        <span className="hud-level" aria-label={`等级 ${s.level}`}>{s.level}</span>
      </div>
      </div>
    </Card>
  )
}
