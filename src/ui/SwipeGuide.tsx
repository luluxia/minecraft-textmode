import { useEffect } from 'react'
import { GameDialog } from './GameDialog'
import { Btn } from './kit'

export function SwipeGuide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnDesktop = () => {
      if (document.documentElement.dataset.uiCompact !== 'true') onClose()
    }
    window.addEventListener('resize', closeOnDesktop)
    return () => window.removeEventListener('resize', closeOnDesktop)
  }, [onClose])

  return (
    <GameDialog label="左右滑动指引" className="swipe-guide" onClose={onClose} scrollable={false}>
      <div className="swipe-guide-content">
        <p className="gold sm">获得了第一份木头！</p>
        <h2>左右滑动，查看更多</h2>
        <p className="dim">冒险区域的两侧，还有其他内容。</p>
        <div className="swipe-guide-map" aria-hidden="true">
          <span>日志<br />目标</span>
          <span className="swipe-guide-current">冒险<br /><small>当前位置</small></span>
          <span>物资<br />菜单</span>
        </div>
        <div className="swipe-guide-directions">
          <p><span aria-hidden="true">→ </span>向右滑，查看日志和目标</p>
          <p><span aria-hidden="true">← </span>向左滑，查看物资和菜单</p>
        </div>
        <p className="dim sm">滑回中间，继续你的冒险。</p>
        <Btn className="primary" onClick={onClose}>知道了</Btn>
      </div>
    </GameDialog>
  )
}
