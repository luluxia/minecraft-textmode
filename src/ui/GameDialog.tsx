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
          <h2>{label}</h2>
          {onClose && <Btn className="game-dialog-close" aria-label={`关闭${label}`} onClick={onClose}>关闭</Btn>}
        </header>}
        {scrollable ? <ScrollArea className="dialog-scroll" tabIndex={0} role="region" aria-label={label + '内容'}>
          <div className="modal">{children}</div>
        </ScrollArea> : <div className="modal">{children}</div>}
      </DialogContent>
    </Dialog>
  )
}
