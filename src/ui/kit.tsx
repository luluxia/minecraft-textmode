import { Progress } from '../components/minecraft/progress'
import { Button } from '../components/minecraft/button'
import { Texture } from './Texture'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ITEMS, type Bag, type IngredientAlternatives } from '../game/data'
import { available, gameTimer, useGame } from '../game/store'

export function LocationName({ name }: { name: string }) {
  const suffix = / #?([2-9]|[1-9]\d+)(。?)$/.exec(name)
  if (!suffix) return name
  return <span>{name.slice(0, suffix.index)}<small className="location-number">{'\u00a0#' + suffix[1]}</small>{suffix[2]}</span>
}

interface BtnProps {
  cd?: string
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  sub?: ReactNode
  title?: string
  'aria-label'?: string
  'aria-pressed'?: boolean
  className?: string
}

/** 带冷却遮罩的按钮：cd 为 store 中的冷却键 */
export function Btn({ cd, onClick, disabled, children, sub, title, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, className = '' }: BtnProps) {
  const info = useGame((s) => (cd ? gameTimer(s, cd) : undefined))
  const mask = useRef<HTMLSpanElement>(null)
  const [, refresh] = useState(0)
  const cooling = info !== undefined && info.until > Date.now()

  useLayoutEffect(() => {
    const element = mask.current
    if (!info || !element) return

    // Set the elapsed time once, including when a tab mounts during a cooldown.
    const elapsed = Math.min(info.dur, Math.max(0, info.dur - (info.until - Date.now())))
    element.style.animationDelay = `${-elapsed}ms`

    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = () => {
      const remaining = info.until - Date.now()
      if (remaining > 0) {
        timer = setTimeout(finish, Math.ceil(remaining))
      } else {
        refresh((version) => version + 1)
      }
    }
    finish()
    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [info])

  return (
    <Button
      className={`btn ${className}`}
      disabled={disabled || cooling}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      overlay={cooling && (
        <span ref={mask} key={info.until} className="btn-cd" aria-hidden="true" style={{ animationDuration: `${info.dur}ms` }} />
      )}
    >
      <span className="btn-label">
        <span className="btn-title icon-text">{children}</span>
        {sub && <span className="btn-sub">{sub}</span>}
      </span>
    </Button>
  )
}

export function ActionTitle({ name, quantity }: { name: string; quantity?: number }) {
  return <span>{name}{quantity !== undefined && <span className="action-quantity">({quantity})</span>}</span>
}

export function Bar({ value, max, color, label, valueText }: { value: number; max: number; color: string; label: string; valueText?: string }) {
  const safeMax = Math.max(1, max)
  const safeValue = Math.max(0, Math.min(safeMax, value))
  const tone = color === '#c8402f' ? 'red' : color === '#8d3fbf' ? 'purple' : color === '#3f8fbf' ? 'blue' : color === '#6fae3a' ? 'green' : 'yellow'
  return (
    <div className="bar">
      <Progress value={safeValue} max={safeMax} color={tone} aria-label={label} aria-valuetext={valueText} />
    </div>
  )
}

export function Cost({ cost, alternatives }: { cost: Bag; alternatives?: IngredientAlternatives }) {
  const s = useGame()
  if (s.freeResources) return <span className="tag g">免材料</span>
  return (
    <div className="cost">
      {Object.entries(cost).map(([k, n]) => {
        const have = available(s, k, alternatives)
        return (
          <span key={k} className={`tag material-tag icon-text${have >= n ? '' : ' bad'}`}>
            <IngredientName id={k} choices={alternatives?.[k]} /> {have}/{n}
          </span>
        )
      })}
    </div>
  )
}

export const ItemName = ({ id }: { id: string }) => <span className="icon-text"><Texture src={ITEMS[id].icon} /> {ITEMS[id].name}</span>
export function IngredientName({ id, choices }: { id: string; choices?: readonly string[] }) {
  const name = choices?.map((item) => ITEMS[item].name).join('或') ??
    (id === 'wood' ? '原木' : id === 'plank' ? '木板' : ITEMS[id].name)
  return <span className="icon-text"><Texture src={ITEMS[id].icon} /> {name}</span>
}

export const bagText = (bag: Bag) => Object.entries(bag).map(([k, n]) => <span className="icon-text" key={k}><ItemName id={k} /> ×{n} </span>)

export function EntryHeader({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <div className="entry-header">
      <div className="entry-heading">{children}</div>
      <div className="entry-actions">{actions}</div>
    </div>
  )
}

export function Section({ title, extra, children }: { title: ReactNode; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="section fade-in">
      <h3><span>{title}</span>{extra && <span>{extra}</span>}</h3>
      {children}
    </div>
  )
}
