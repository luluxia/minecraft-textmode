import type { ReactNode } from 'react'
import { Dialog, DialogContent } from '../components/minecraft/dialog'
import { ScrollArea } from './ScrollArea'

export function GameDialog({ label, onClose, children }: {
  label: string
  onClose?: () => void
  children: ReactNode
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose?.() }}>
      <DialogContent className="game-dialog" aria-label={label}>
        <ScrollArea className="dialog-scroll" tabIndex={0} role="region" aria-label={label + '内容'}>
          <div className="modal">{children}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
