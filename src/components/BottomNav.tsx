import { Settings, Palette, Info } from 'lucide-react'
import type { Screen } from '../types'

export default function BottomNav({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <nav className="bottom-nav">
      <button className="nav-btn" onClick={() => onNavigate('settings')}>
        <Settings size={20} strokeWidth={1.5} /><span>设置</span>
      </button>
      <button className="nav-btn" onClick={() => onNavigate('moments')}>
        <Palette size={20} strokeWidth={1.5} /><span>朋友圈</span>
      </button>
      <button className="nav-btn" onClick={() => onNavigate('moments')}>
        <Info size={20} strokeWidth={1.5} /><span>信息</span>
      </button>
    </nav>
  )
}
