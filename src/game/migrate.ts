// Only migrate display text; inventory IDs and all progression values remain unchanged.
const LEGACY_NAMES: Record<string, string> = {
  '虚空珍珠': '末影珍珠', '虚空之眼': '末影之眼', '虚空祭坛': '要塞传送门房间',
  '虚空巨龙': '末影龙', '炽焰棒': '烈焰棒', '炽焰粉': '烈焰粉', '炽焰灵': '烈焰人',
  '影行者': '末影人', '赤晶粉': '红石粉', '赤晶': '红石', '野猪': '猪', '野牛': '牛',
  '绵羊': '羊', '守卫石像': '铁傀儡', '熔岩裂谷': '下界要塞',
}
export const minecraftText = (text: string) => Object.entries(LEGACY_NAMES).reduce(
  (result, [oldName, name]) => result.replaceAll(oldName, name), text,
)
export function migrateMinecraftNames<T extends {
  locs: Record<number, { name: string }>
  log: { text: string }[]
  combat: { lines: string[] } | null
}>(state: T): T {
  for (const loc of Object.values(state.locs)) loc.name = minecraftText(loc.name)
  for (const entry of state.log) entry.text = minecraftText(entry.text)
  if (state.combat) state.combat.lines = state.combat.lines.map(minecraftText)
  return state
}
