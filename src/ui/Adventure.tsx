import { PlayerHud } from './PlayerHud'
import { Button } from '../components/minecraft/button'
import { Texture } from './Texture'
import { ACTIONS, BIOMES, EYES_NEEDED, ITEM_LIST, PICK_NAMES, RES_NAMES, ITEMS } from '../game/data'
import {
  SHELTER_COST, atHome, canAfford, count, curLoc, isNight, pickTier, useGame,
} from '../game/store'
import { Btn, Cost, Section } from './kit'

export function Adventure() {
  const s = useGame()
  const loc = curLoc(s)
  const biome = BIOMES[loc.biome]
  const tier = pickTier(s)
  const night = isNight(s.minute)
  const busy = !!s.combat

  const actions = biome.actions.filter((id) => s.flags.explore || id === 'chop' || (s.flags.inv && id === 'grass'))
  const foods = ITEM_LIST.filter((i) => i.food && count(s, i.id) > 0)
  const places = Object.values(s.locs).filter((l) => l.id !== s.locId)
  const resLeft = Object.entries(loc.res)

  return (
    <div>
      {s.flags.status && (
        <Section title="状态">
          <PlayerHud />
        </Section>
      )}

      {s.flags.explore && (
        <Section title="当前位置">
          <div className="row">
            <span className="loc-name"><Texture src={biome.icon} /> {loc.name}</span>
            {loc.shelter && <span className="tag g">家</span>}
            {loc.saved && <span className="tag y">已记录</span>}
            {night && <span className="tag">夜晚 · 危险</span>}
          </div>
          <p className="dim sm" style={{ marginTop: 4 }}>{biome.desc}</p>
          {resLeft.length > 0 && (
            <div className="row sm" style={{ marginTop: 6 }}>
              {resLeft.map(([k, n]) => (
                <span key={k} className={`tag ${n > 0 ? '' : 'bad'}`}>{RES_NAMES[k] ?? k} 剩余 {n}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="行动">
        <div className="actions">
          {actions.map((id) => {
            const a = ACTIONS[id]
            let lock = ''
            if (a.pick && tier < a.pick) lock = `需要${PICK_NAMES[a.pick]}`
            else if (a.tool && count(s, a.tool) < 1) lock = `需要${ITEMS[a.tool].name}`
            else if (a.finite && (loc.res[a.finite] ?? 0) <= 0) lock = '已枯竭'
            return (
              <Btn key={id} cd={id} disabled={busy || !!lock} onClick={() => s.act(id)} sub={lock || undefined}>
                {a.name}
              </Btn>
            )
          })}
        </div>
      </Section>

      {s.flags.explore && (
        <Section title="移动">
          <div className="actions">
            <Btn cd="move" disabled={busy} onClick={s.explore} sub={!loc.saved && !loc.shelter ? '将丢失当前地点' : '随机前往新地点'}>
              探索
            </Btn>
            {s.flags.waypoint && !loc.saved && (
              <Btn onClick={s.saveLoc} sub="写入地图">记录地点</Btn>
            )}
            {places.map((l) => (
              <Btn key={l.id} cd="move" disabled={busy} onClick={() => s.travel(l.id)} sub={l.shelter ? '回家' : BIOMES[l.biome].name}>
                <Texture src={BIOMES[l.biome].icon} /> {l.name}
              </Btn>
            ))}
          </div>
          {!s.flags.waypoint && (
            <p className="notice" style={{ marginTop: 8 }}>
              没有地图与指南针，离开后将无法回到未建立庇护所的地点。
            </p>
          )}
          {s.flags.waypoint && loc.saved && !loc.shelter && loc.biome !== 'altar' && (
            <div style={{ marginTop: 8 }}>
              <Btn className="mini" onClick={() => s.forgetLoc(loc.id)}>从地图上抹去此地</Btn>
            </div>
          )}
        </Section>
      )}

      {s.flags.status && (
        <Section
          title="生存"
          extra={
            <Button className={`btn mini ${s.autoEat ? 'on' : ''}`} onClick={s.toggleAutoEat} aria-pressed={s.autoEat}>
              自动进食：{s.autoEat ? '开' : '关'}
            </Button>
          }
        >
          <div className="actions">
            {foods.length === 0 && <span className="dim sm">没有可以吃的东西。</span>}
            {foods.map((f) => (
              <Btn key={f.id} cd="eat" disabled={s.hunger >= 20} onClick={() => s.eat(f.id)} sub={`饱食 +${f.food} · 余 ${count(s, f.id)}`}>
                吃{f.name}
              </Btn>
            ))}
            {atHome(s) && count(s, 'bed') > 0 && (
              <Btn disabled={busy || !night} onClick={s.sleep} sub={night ? '跳过夜晚' : '只能在夜晚入睡'}>睡觉</Btn>
            )}
          </div>
        </Section>
      )}

      {s.flags.explore && s.homeId === null && loc.biome !== 'altar' && (
        <Section title="安家">
          {loc.biome === 'village' ? (
            <div className="actions">
              <Btn className="primary" disabled={busy} onClick={s.settle} sub="与村民为邻">定居于此</Btn>
            </div>
          ) : (
            <article className="content-entry shelter-entry">
              <span><Texture src="/textures/minecraft/white_bed.png" /> 庇护所</span>
              <span className="sm dim">在当前区域安家：永久记住此地，并解锁建筑与自动化。</span>
              <Cost cost={SHELTER_COST} />
              <div className="entry-actions">
                <Btn className="primary" disabled={busy || !canAfford(s, SHELTER_COST)} onClick={s.buildShelter}>建立庇护所</Btn>
              </div>
            </article>
          )}
        </Section>
      )}

      {(s.flags.eye || loc.biome === 'altar') && (
        <Section title="末地">
          <div className="actions">
            {!s.flags.altar && (
              <Btn cd="eye" disabled={busy || count(s, 'eye') < 1} onClick={s.throwEye} sub={`已追踪 ${s.eyesThrown}/3`}>投掷末影之眼</Btn>
            )}
            {loc.biome === 'altar' && !s.flags.portal && (
              <Btn disabled={count(s, 'eye') < 1} onClick={s.insertEyes} sub={`${s.altarEyes}/${EYES_NEEDED}`}>嵌入末影之眼</Btn>
            )}
            {loc.biome === 'altar' && s.flags.portal && (
              <Btn className="danger" disabled={busy} onClick={s.enterPortal} sub="做好万全准备">踏入传送门</Btn>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}
