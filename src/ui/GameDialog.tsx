import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '../components/minecraft/dialog'
import { ScrollArea } from './ScrollArea'
import { Btn } from './kit'

export function GameDialog({ label, onClose, children, className = '', scrollable = true, showHeader = false }: {
  label: string
  onClose?: () => void
  children: ReactNode
  className?: string
  scrollable?: boolean
  showHeader?: boolean
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.() }}>
      <DialogContent className={`game-dialog ${className}`} aria-label={label}>
        {showHeader && <header className="game-dialog-header">
          <h2 className="text-base">{label}</h2>
          {onClose && <Btn className="game-dialog-close" aria-label={`关闭${label}`} title={`关闭${label}`} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </Btn>}
        </header>}
        {scrollable ? <ScrollArea className="dialog-scroll" tabIndex={0} role="region" aria-label={label + '内容'}>
          <div className="modal">{children}</div>
        </ScrollArea> : <div className="modal">{children}</div>}
      </DialogContent>
    </Dialog>
  )
}
