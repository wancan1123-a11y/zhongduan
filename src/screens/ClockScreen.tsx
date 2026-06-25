import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function ClockScreen({ onBack }: { onBack: () => void }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const h = time.getHours(), m = time.getMinutes(), s = time.getSeconds()
  const hDeg = (h % 12) * 30 + m * 0.5
  const mDeg = m * 6 + s * 0.1
  const sDeg = s * 6

  const weekDays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
  const dateStr = `${time.getFullYear()}年${time.getMonth()+1}月${time.getDate()}日 ${weekDays[time.getDay()]}`

  return (
    <div className="clock-screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="topbar-title">时钟</span>
      </div>

      <div className="clock-face">
        <div className="analog-clock">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="tick" style={{ transform: `rotate(${i * 30}deg) translateX(-50%)` }}>
              <div className={`tick-mark ${i % 3 === 0 ? 'major' : ''}`} />
            </div>
          ))}
          <div className="hand hour-hand" style={{ transform: `translateX(-50%) rotate(${hDeg}deg)` }} />
          <div className="hand min-hand" style={{ transform: `translateX(-50%) rotate(${mDeg}deg)` }} />
          <div className="hand sec-hand" style={{ transform: `translateX(-50%) rotate(${sDeg}deg)` }} />
          <div className="clock-center" />
        </div>
      </div>

      <div className="digital-time">
        {h.toString().padStart(2,'0')}:{m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}
      </div>
      <div className="clock-date-full">{dateStr}</div>
    </div>
  )
}
