import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '../components/minecraft/dialog'
import { ScrollArea } from './ScrollArea'

export function GameDialog({ label, onClose, children, className = '', scrollable = true }: {
  label: string
  onClose?: () => void
  children: ReactNode
  className?: string
  scrollable?: boolean
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.() }}>
      <DialogContent className={`game-dialog ${className}`} aria-label={label}>
        {scrollable ? <ScrollArea className="dialog-scroll" tabIndex={0} role="region" aria-label={label + '内容'}>
          <div className="modal">{children}</div>
        </ScrollArea> : <div className="modal">{children}</div>}
      </DialogContent>
    </Dialog>
  )
}
