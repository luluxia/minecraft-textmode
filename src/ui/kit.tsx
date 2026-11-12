import { Progress } from '../components/minecraft/progress'
import { Button } from '../components/minecraft/button'
import { Texture } from './Texture'
import { useEffect, useState, type ReactNode } from 'react'
import { ITEMS, type Bag } from '../game/data'
import { useGame } from '../game/store'

interface BtnProps {
  cd?: string
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  sub?: ReactNode
  title?: string
  className?: string
}

/** 带冷却遮罩的按钮：cd 为 store 中的冷却键 */
export function Btn({ cd, onClick, disabled, children, sub, title, className = '' }: BtnProps) {
  const info = useGame((s) => (cd ? s.cds[cd] : undefined))
  const [, force] = useState(0)
  const remaining = info ? info.until - Date.now() : 0
  useEffect(() => {
    if (!info) return
    const left = info.until - Date.now()
    if (left <= 0) return
    const t = setTimeout(() => force((x) => x + 1), left + 30)
    return () => clearTimeout(t)
  }, [info])
  const cooling = remaining > 0
  return (
    <Button className={`btn ${className}`} disabled={disabled || cooling} onClick={onClick} title={title}>
      {cooling && info && (
        <span
          key={info.until}
          className="btn-cd"
          style={{ animationDuration: `${info.dur}ms`, animationDelay: `-${info.dur - remaining}ms` }}
        />
      )}
      <span className="btn-label">
        <span className="btn-title icon-text">{children}</span>
        {sub && <span className="btn-sub">{sub}</span>}
      </span>
    </Button>
  )
}

export function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const safeMax = Math.max(1, max)
  const safeValue = Math.max(0, Math.min(safeMax, value))
  const tone = color === '#c8402f' ? 'red' : color === '#8d3fbf' ? 'purple' : color === '#3f8fbf' ? 'blue' : color === '#6fae3a' ? 'green' : 'yellow'
  return (
    <div className="bar">
      <Progress value={safeValue} max={safeMax} color={tone} aria-label={label || '进度'} />
      {label && <span className="bar-label">{label}</span>}
    </div>
  )
}

export function Cost({ cost }: { cost: Bag }) {
  const inv = useGame((s) => s.inv)
  return (
    <div className="cost">
      {Object.entries(cost).map(([k, n]) => {
        const have = Math.floor(inv[k] ?? 0)
        return (
          <span key={k} className={`tag material-tag icon-text${have >= n ? '' : ' bad'}`}>
            <Texture src={ITEMS[k].icon} /> {ITEMS[k].name} {have}/{n}
          </span>
        )
      })}
    </div>
  )
}

export const itemLabel = (id: string) => ITEMS[id].name
export const ItemName = ({ id }: { id: string }) => <span className="icon-text"><Texture src={ITEMS[id].icon} /> {ITEMS[id].name}</span>
export const bagText = (bag: Bag) => Object.entries(bag).map(([k, n]) => <span className="icon-text" key={k}><ItemName id={k} /> ×{n} </span>)

export function Section({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="section fade-in">
      <h3><span>{title}</span>{extra && <span>{extra}</span>}</h3>
      {children}
    </div>
  )
}
