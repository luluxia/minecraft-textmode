import { ITEMS } from '../game/data'
import { ActionGrid } from './ActionGrid'
import { CHEST_COST, room, whole } from '../game/inventory'
import { atHome, canAfford, canCampHere, carryRoom, count, curLoc, locationCap, useGame } from '../game/store'
import { Btn, ItemName, Section } from './kit'

export function LocationStorage({ onOpenMap }: { onOpenMap: () => void }) {
  const s = useGame()
  const loc = curLoc(s)
  const cap = locationCap(s, loc)
  const pending = Object.keys(loc.pending ?? {}).filter((id) => whole(loc.pending?.[id] ?? 0) > 0)
  const items = Object.values(ITEMS).filter((item) =>
    whole(loc.stock?.[item.id] ?? 0) > 0 ||
    (count(s, item.id) > 0 && item.cat !== 'tool' && item.cat !== 'gear'))
  const disabled = !!s.combat
  const canCamp = canCampHere(loc)
  const canPlace = !cap && loc.saved && canCamp && !!s.flags.explore
  const hasChest = canAfford(s, CHEST_COST)

  if (s.submerged) {
    return <Section title="当前地点"><ActionGrid><Btn onClick={s.surface}>上浮换气</Btn></ActionGrid></Section>
  }

  if (!cap && !pending.length && !canPlace) {
    return <Section title="当前地点" extra={loc.name}>
      <p className="notice">{!canCamp ? '这里无法放置箱子。' : s.flags.waypoint
        ? '记录此地后可放置箱子。' : '制作地图并记录此地后可放置箱子。'}</p>
      {canCamp && s.flags.waypoint && <ActionGrid>
        <Btn onClick={onOpenMap}>前往地图</Btn>
      </ActionGrid>}
    </Section>
  }

  return (
    <>
      {canPlace && <Section title="箱子" extra={loc.name}>
        <ActionGrid>
          <Btn disabled={disabled || !hasChest} onClick={s.placeChest} sub={hasChest ? undefined : '需要箱子'}>放置箱子</Btn>
        </ActionGrid>
      </Section>}
      {!!cap && <Section title={loc.id === s.homeId && s.village ? '村庄仓库' : '箱子'} extra={'单种物品上限 ' + cap}>
        <ActionGrid className="storage-header">
          <Btn disabled={disabled || !items.some((item) => item.cat === 'material' && count(s, item.id) > 0 && room(loc.stock, item.id, cap) >= 1)}
            onClick={() => s.deposit()}>存入材料</Btn>
          {atHome(s) && count(s, 'copper_golem') > 0 &&
            <Btn disabled={disabled} aria-pressed={!!s.flags.copperSorting} onClick={s.toggleSorting}>
              铜傀儡整理 {s.flags.copperSorting ? '开启' : '关闭'}
            </Btn>}
        </ActionGrid>
        <div className="entry-grid inventory-grid">
          {items.map((item) => {
            const inPack = count(s, item.id)
            const stored = whole(loc.stock?.[item.id] ?? 0)
            const left = whole(room(loc.stock, item.id, cap))
            return (
              <article className="content-entry storage-entry" key={item.id}>
                <ItemName id={item.id} />
                <span className="storage-count sm dim">背包 {inPack} · 库存 {stored}</span>
                <div className="entry-actions">
                  <Btn className="mini" disabled={disabled || !inPack || !left || ['tool', 'gear'].includes(item.cat)}
                    aria-label={'存入' + item.name} onClick={() => s.deposit(item.id)}>存入</Btn>
                  <Btn className="mini" disabled={disabled || !stored || carryRoom(s, item.id) < 1}
                    aria-label={'取出' + item.name} onClick={() => s.withdraw(item.id)}>取出</Btn>
                </div>
              </article>
            )
          })}
        </div>
      </Section>}
      {pending.length > 0 && <Section title="待领取">
        <div className="entry-grid inventory-grid">
          {pending.map((id) => (
            <article className="content-entry storage-entry" key={id}>
              <ItemName id={id} />
              <span className="storage-count sm dim">背包 {count(s, id)} · 库存 {whole(loc.stock?.[id] ?? 0)}</span>
              <span className="storage-count sm dim">待领取 {whole(loc.pending?.[id] ?? 0)}</span>
              <div className="entry-actions">
                <Btn className="mini" disabled={disabled || (carryRoom(s, id) < 1 && room(loc.stock, id, cap) < 1)}
                  aria-label={'领取' + ITEMS[id].name} onClick={() => s.claim(id)}>领取</Btn>
              </div>
            </article>
          ))}
        </div>
      </Section>}
    </>
  )
}
