import { HealthMeter, ArmorMeter, AirMeter, HungerMeter, ExperienceBar } from '../components/minecraft/hud'
import { TabCard } from '../components/minecraft/tabs'
import { MAX_AIR } from '../game/progression'
import { defensePower, hasConduitPower, useGame, waterBreathingLeft, xpNeed, type GameState } from '../game/store'

export function AirStatus({ state, showLabel = true }: { state: GameState; showLabel?: boolean }) {
  const remaining = waterBreathingLeft(state)
  const conduit = hasConduitPower(state)
  const label = conduit ? '潮涌能量' : remaining ? `水下呼吸 ${remaining} 秒` : `空气 ${state.air}/${MAX_AIR}`
  return (
    <div className="air-status">
      <AirMeter value={Math.ceil(state.air * 10 / MAX_AIR)} aria-label="空气" aria-valuetext={label} />
      {showLabel && <span className={state.air <= 5 && !remaining && !conduit ? 'sm bad' : 'sm dim'}>{label}</span>}
    </div>
  )
}

export function PlayerHud() {
  const s = useGame()
  const defense = defensePower(s)
  return (
    <TabCard className="player-status" aria-label="玩家状态">
      <div className="player-hud">
        <div className="hud-meters">
          <ArmorMeter value={defense} aria-label="护甲（图标上限20）" />
          <HealthMeter value={s.hp} aria-label="生命" />
          <HungerMeter value={s.hunger} aria-label="饱食度" />
          {(s.submerged || s.air < MAX_AIR) && <AirStatus state={s} showLabel={false} />}
        </div>
        <div className="hud-experience">
          <ExperienceBar value={s.xp / xpNeed(s.level)} aria-label="升级经验" aria-valuetext={`${s.xp} / ${xpNeed(s.level)}`} />
          <span className="hud-level" aria-label={`等级 ${s.level}`}>{s.level}</span>
        </div>
      </div>
    </TabCard>
  )
}
