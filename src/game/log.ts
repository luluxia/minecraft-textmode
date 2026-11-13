import { ITEMS, type Bag } from './data'
import { EXPEDITIONS } from './progression'

export const LOG_LIMIT = 80
export const LOG_TEXT_LIMIT = 600

export type LogKind = 'info' | 'good' | 'bad' | 'event'
export interface LogEntry { id: number; text: string; kind: LogKind }

interface OfflineSettlement {
  seconds: number
  items: Bag
  villagers: number
  expedition: string | null
}

type LogState = { log: LogEntry[]; logId: number }

export function pushLog(s: LogState, text: string, kind: LogKind = 'info') {
  s.log.unshift({ id: s.logId++, text, kind })
  if (s.log.length > LOG_LIMIT) s.log.length = LOG_LIMIT
}

export function logOfflineSettlement(s: LogState, report: OfflineSettlement) {
  const changes = Object.entries(report.items)
    .filter(([, amount]) => amount !== 0)
    .map(([id, amount]) => `${ITEMS[id].name} ${amount > 0 ? '+' : ''}${amount}`)
  if (!changes.length) return

  const hours = Math.floor(report.seconds / 3600)
  const minutes = Math.floor(report.seconds % 3600 / 60)
  const seconds = report.seconds % 60
  const duration = [hours && `${hours} 小时`, minutes && `${minutes} 分钟`, seconds && `${seconds} 秒`]
    .filter(Boolean).join(' ')
  const title = duration ? `离线结算（${duration}）` : '离线结算'
  if (report.villagers > 0) changes.push(`新搬入的村民 +${report.villagers}`)
  const trip = EXPEDITIONS.find((entry) => entry.id === report.expedition)
  if (trip) changes.push(`${trip.region === 'camp' ? '孵化完成' : '远征归来'} · ${trip.name}`)

  const entries: string[] = []
  let text = title
  for (const change of changes) {
    if (text.length + change.length + 1 > LOG_TEXT_LIMIT) {
      entries.push(text)
      text = title
    }
    text += (text === title ? '：' : '，') + change
  }
  entries.push(text)
  for (const entry of entries.reverse()) pushLog(s, entry, 'event')
}
