import { useGame } from '../game/store'
import { companionIds, WILDLIFE } from '../game/wildlife'
import { Section } from './kit'
import { Texture } from './Texture'

export function Companions() {
  const flags = useGame((s) => s.flags)
  return (
    <>
      <Section title="已结伴的动物">
        <p className="notice">伙伴会在擅长的场合自动帮忙。</p>
        <div className="entry-grid">
          {companionIds.filter((id) => flags['wildlife_' + id]).map((id) => (
            <article key={id} className="content-entry">
              <span className="icon-text"><Texture src={'/textures/minecraft/mob_' + id + '.png'} /> {WILDLIFE[id].name}</span>
              <p className="sm dim">{WILDLIFE[id].companion}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section title="野外重逢">
        <p className="notice">在另一处栖息地遇见同类时，跟随它探路可发现附近地点。当地已探尽时获得 2 点经验。每处地点的每种动物可探路一次。</p>
      </Section>
    </>
  )
}
