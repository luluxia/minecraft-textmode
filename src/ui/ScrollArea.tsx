import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ComponentProps } from 'react'

const ScrollReset = createContext(() => {})
export const useScrollReset = () => useContext(ScrollReset)

/** Fade only the edges with offscreen content; keep the textured frame outside. */
export function ScrollArea({ children, className = '', ...props }: ComponentProps<'div'>) {
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const reset = useCallback(() => { if (viewport.current) viewport.current.scrollTop = 0 }, [])

  useLayoutEffect(() => {
    const element = viewport.current
    const body = content.current
    if (!element || !body) return
    const update = () => {
      element.dataset.scrollAbove = String(element.scrollTop > 1)
      element.dataset.scrollBelow = String(element.scrollHeight - element.clientHeight - element.scrollTop > 1)
    }
    const resize = new ResizeObserver(update)
    resize.observe(element)
    resize.observe(body)
    const mutation = new MutationObserver(update)
    mutation.observe(body, { childList: true, subtree: true, characterData: true })
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      resize.disconnect()
      mutation.disconnect()
      element.removeEventListener('scroll', update)
    }
  }, [])

  return <div {...props} ref={viewport} className={`scroll-area ${className}`}>
    <div ref={content} className="scroll-content"><ScrollReset.Provider value={reset}>{children}</ScrollReset.Provider></div>
  </div>
}
