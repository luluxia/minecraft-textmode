import { Children, isValidElement, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

function sizeActionColumns(group: HTMLDivElement) {
  const availableWidth = group.clientWidth
  if (!availableWidth) return null

  const styles = getComputedStyle(group)
  const gap = Number.parseFloat(styles.columnGap) || 0
  const columns = Number(styles.getPropertyValue('--action-columns')) || 4
  group.dataset.measuring = 'true'
  const buttons = Array.from(group.querySelectorAll<HTMLElement>(':scope > [data-action-key]'), (item) => ({
    key: item.dataset.actionKey!,
    index: Number(item.dataset.actionIndex),
    width: item.offsetWidth + 1,
  })).sort((a, b) => a.index - b.index)
  delete group.dataset.measuring

  const longest = Math.max(0, ...buttons.map(({ width }) => width))
  const minimumColumn = Math.max(0, Math.ceil((longest - gap) / 2))
  const fittedColumn = (availableWidth - (columns - 1) * gap) / columns
  const columnWidth = Math.max(minimumColumn, fittedColumn)
  group.style.setProperty('--action-column-min-width', minimumColumn + 'px')
  if (minimumColumn > fittedColumn) group.tabIndex = 0
  else group.removeAttribute('tabindex')

  return new Set(buttons.filter(({ width }) => width > columnWidth).map(({ key }) => key))
}

export function ActionGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const lastContent = useRef<string | undefined>(undefined)
  const [wide, setWide] = useState<Set<string>>(() => new Set())
  const actions = Children.toArray(children).map((child, index) => ({
    child, index, key: isValidElement(child) && child.key !== null ? String(child.key) : String(index),
  }))

  const measure = useCallback((force = false) => {
    const group = ref.current
    if (!group) return

    const content = Array.from(group.querySelectorAll<HTMLElement>(':scope > .action-grid-item'))
      .sort((a, b) => Number(a.dataset.actionIndex) - Number(b.dataset.actionIndex))
      .map((action) => [action.dataset.actionKey, action.querySelector('.btn-label')?.innerHTML])
    const signature = JSON.stringify(content)
    if (!force && signature === lastContent.current) return

    const next = sizeActionColumns(group)
    if (!next) return
    lastContent.current = signature
    setWide((previous) => next.size === previous.size && [...next].every((key) => previous.has(key)) ? previous : next)
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [children, measure])

  useLayoutEffect(() => {
    const group = ref.current
    if (!group) return

    let frame = 0
    let width = group.clientWidth
    let connected = true
    const schedule = () => {
      if (!connected || frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        measure(true)
      })
    }
    const resize = new ResizeObserver(() => {
      if (group.clientWidth === width) return
      width = group.clientWidth
      schedule()
    })
    const content = new MutationObserver(() => measure())

    resize.observe(group)
    content.observe(group, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'src', 'width', 'height'],
    })
    window.addEventListener('resize', schedule)
    document.fonts.addEventListener('loadingdone', schedule)
    document.fonts.ready.then(schedule)

    return () => {
      connected = false
      cancelAnimationFrame(frame)
      resize.disconnect()
      content.disconnect()
      window.removeEventListener('resize', schedule)
      document.fonts.removeEventListener('loadingdone', schedule)
    }
  }, [measure])

  return <div ref={ref} className={`actions action-grid ${className}`}>
    {actions.sort((a, b) => Number(wide.has(a.key)) - Number(wide.has(b.key))).map(({ child, index, key }) =>
      <div key={key} className="action-grid-item" data-action-key={key} data-action-index={index}
        data-action-wide={wide.has(key) || undefined}>{child}</div>
    )}
  </div>
}
