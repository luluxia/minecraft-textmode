import {
  DEBUG_SCENARIOS, clearDebugCooldowns, exitDebug, loadDebugScenario, refreshDebugSupplies,
  simulateDebugOffline, startDebug,
} from '../game/debug'
import { curLoc, dayOf, useGame } from '../game/store'
import { Btn, Section } from './kit'

export function DebugPanel({ active, onChange, onWorldChange }: {
  active: boolean
  onChange: (active: boolean) => void
  onWorldChange: () => void
}) {
  const s = useGame()
  return (
    <>
      <p className="notice">{active
        ? '当前使用临时调试存档。退出 Debug 或刷新页面会返回正常存档。'
        : '启动后可载入预设场景、清除冷却，并通过正式结算逻辑模拟离线。正常存档会保留。'}</p>
      <Section title="调试场景">
        <div className="actions">
          {DEBUG_SCENARIOS.map((entry) => (
            <Btn key={entry.id} sub={entry.detail} onClick={() => {
              startDebug()
              loadDebugScenario(entry.id)
              onChange(true)
              onWorldChange()
            }}>{entry.label}</Btn>
          ))}
        </div>
      </Section>
      {active && <>
        <Section title="当前状态" extra={'第 ' + dayOf(s.minute) + ' 天'}>
          <dl className="village-stats sm">
            <dt>位置</dt><dd>{curLoc(s).name}</dd>
            <dt>生命与饱食</dt><dd>{Math.ceil(s.hp)} / {Math.ceil(s.hunger)}</dd>
            <dt>冷却中的行动</dt><dd>{Object.values(s.cds).filter((cd) => cd.until > Date.now()).length}</dd>
            <dt>村民</dt><dd>{s.village?.villagers ?? 0}</dd>
            <dt>熔炼队列</dt><dd>{s.furnace.job?.left ?? 0}</dd>
            <dt>运行产线</dt><dd>{Object.keys(s.lines).length}</dd>
            <dt>远征剩余</dt><dd>{s.expedition ? s.expedition.left + ' 秒' : '无'}</dd>
          </dl>
        </Section>
        <Section title="调试操作">
          <div className="actions">
            <Btn onClick={refreshDebugSupplies}>补充物资与体力</Btn>
            <Btn onClick={clearDebugCooldowns}>清除冷却</Btn>
            <Btn onClick={() => { simulateDebugOffline(300); onWorldChange() }}>模拟离线 5 分钟</Btn>
            <Btn onClick={() => { simulateDebugOffline(3600); onWorldChange() }}>模拟离线 1 小时</Btn>
            <Btn onClick={() => { simulateDebugOffline(9 * 3600); onWorldChange() }} sub="核对 8 小时上限">模拟离线 9 小时</Btn>
          </div>
        </Section>
        <Btn onClick={() => { exitDebug(); onChange(false); onWorldChange() }}>退出 Debug</Btn>
      </>}
    </>
  )
}
