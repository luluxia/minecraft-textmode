import {
  DEBUG_SCENARIOS, clearDebugCooldowns, exitDebug, loadDebugScenario, refreshDebugSupplies,
  simulateDebugOffline, startDebug,
} from '../game/debug'
import { curLoc, dayOf, useGame } from '../game/store'
import { MOBS } from '../game/data'
import { EXPEDITIONS, MAX_AIR } from '../game/progression'
import { companionIds } from '../game/wildlife'
import { ActionGrid } from './ActionGrid'
import { Btn, Section } from './kit'

export function DebugPanel({ active, onWorldChange }: {
  active: boolean
  onWorldChange: () => void
}) {
  const s = useGame()
  return (
    <>
      <p className="notice">{active
        ? '作弊模式已开启。采集、探索和战斗可连续操作，行动和制作免材料消耗。退出 Debug 或刷新页面会返回正常存档。'
        : '在当前进度的临时副本或预设场景中，跳过行动冷却和材料消耗。地点和剧情条件仍然生效。'}</p>
      {!active && <Btn onClick={() => { startDebug(); onWorldChange() }}>在当前进度开启作弊模式</Btn>}
      <Section title="调试场景">
        <ActionGrid>
          {DEBUG_SCENARIOS.map((entry) => (
            <Btn key={entry.id} sub={entry.detail} onClick={() => {
              startDebug()
              loadDebugScenario(entry.id)
              onWorldChange()
            }}>{entry.label}</Btn>
          ))}
        </ActionGrid>
      </Section>
      {active && <>
        <Section title="当前状态" extra={'第 ' + dayOf(s.minute) + ' 天'}>
          <dl className="village-stats sm">
            <dt>位置</dt><dd>{curLoc(s).name}</dd>
            <dt>生命与饱食</dt><dd>{Math.ceil(s.hp)} / {Math.ceil(s.hunger)}</dd>
            <dt>潜水与空气</dt><dd>{s.submerged ? '水下' : '未潜水'} · {s.air} / {MAX_AIR}</dd>
            <dt>当前战斗</dt><dd>{s.combat ? MOBS[s.combat.mob].name + ' · 生命 ' + s.combat.hp : '无'}</dd>
            <dt>已结识伙伴</dt><dd>{companionIds.filter((id) => s.flags['wildlife_' + id]).length} / {companionIds.length}</dd>
            <dt>行动冷却</dt><dd>已跳过</dd>
            <dt>村民</dt><dd>{s.village?.villagers ?? 0}</dd>
            <dt>熔炼队列</dt><dd>{s.furnace.job?.left ?? 0}</dd>
            <dt>运行产线</dt><dd>{Object.keys(s.lines).length}</dd>
            <dt>当前远征</dt><dd>{s.expedition ? EXPEDITIONS.find((entry) => entry.id === s.expedition?.id)?.name + ' · 剩余 ' + s.expedition.left + ' 秒' : '无'}</dd>
          </dl>
        </Section>
        <Section title="调试操作">
          <ActionGrid>
            <Btn onClick={refreshDebugSupplies}>补充物资与体力</Btn>
            <Btn onClick={clearDebugCooldowns}>清除持续效果</Btn>
            <Btn onClick={() => { simulateDebugOffline(300); onWorldChange() }}>模拟离线 5 分钟</Btn>
            <Btn onClick={() => { simulateDebugOffline(3600); onWorldChange() }}>模拟离线 1 小时</Btn>
            <Btn onClick={() => { simulateDebugOffline(9 * 3600); onWorldChange() }} sub="核对 8 小时上限">模拟离线 9 小时</Btn>
            <Btn onClick={() => { exitDebug(); onWorldChange() }}>退出 Debug</Btn>
          </ActionGrid>
        </Section>
      </>}
    </>
  )
}
