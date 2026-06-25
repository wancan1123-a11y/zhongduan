import { useState, useEffect } from 'react'
import { ChevronRight, RefreshCw } from 'lucide-react'
import type { Screen } from '../types'
import { generateDailyCare } from '../api/deepseek'
import MusicWidget from '../components/MusicWidget'

interface Props {
  store: any
  onNavigate: (s: Screen) => void
}

function ClockWidget({ onClick }: { onClick: () => void }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  const h = time.getHours().toString().padStart(2, '0')
  const m = time.getMinutes().toString().padStart(2, '0')
  const week = ['周日','周一','周二','周三','周四','周五','周六'][time.getDay()]
  const date = `${time.getMonth()+1}月${time.getDate()}日 ${week}`
  return (
    <div className="clock-widget" onClick={onClick}>
      <div className="clock-time">{h}<span className="clock-colon">:</span>{m}</div>
      <div className="clock-date">{date}</div>
    </div>
  )
}

export default function HomeScreen({ store, onNavigate }: Props) {
  const [note, setNote] = useState<string>(store.aiNotes[0]?.content || '')
  const [noteLoading, setNoteLoading] = useState(false)
  const conv = store.currentConversation
  const profile = store.userProfile

  const refreshNote = async () => {
    setNoteLoading(true)
    try {
      const n = await generateDailyCare({
        memories: store.memories,
        aiName: conv?.aiName || 'AI',
        userProfile: store.userProfile,
        diary: store.diary,
        moments: store.moments,
      })
      setNote(n); store.addAiNote(n)
    } catch { setNote('今天也要好好照顾自己哦 🌸') }
    setNoteLoading(false)
  }

  useEffect(() => { if (!note) refreshNote() }, [])

  const lastDiary = store.diary.filter((d: any) => d.mood !== '🤖')[0]
  const todayStr = new Date().toISOString().slice(0, 10)
  const hasTodayDiary = store.diary.some((d: any) => d.date === todayStr && d.mood !== '🤖')
  const lastMoment = store.moments[0]

  return (
    <div className="home-screen">
      {/* TOP BAR */}
      <div className="home-topbar">
        <div className="home-greeting">终端</div>
        <button className="home-user-avatar" onClick={() => onNavigate('profile')}>
          {profile?.avatar?.startsWith('data:')
            ? <img src={profile.avatar} alt="me" className="home-user-avatar-img" />
            : <span>{profile?.avatar || '🙂'}</span>}
        </button>
      </div>

      {/* CLOCK */}
      <ClockWidget onClick={() => onNavigate('clock')} />

      {/* WEATHER BAR */}
      {store.location && (
        <div className="weather-bar">
          <span>{store.location.city}</span>
          {store.location.weather && <span className="weather-val">{store.location.weather}</span>}
        </div>
      )}

      {/* ROW 1: MUSIC + CHAT ENTRY */}
      <div className="home-row">
        <div className="home-card square-card music-card">
          <div className="card-header">
            <span className="card-label">🎵 音乐</span>
          </div>
          <MusicWidget tracks={store.tracks} />
        </div>

        <div className="home-card square-card chat-square" onClick={() => onNavigate('chat')}>
          <div className="chat-square-avatar">
            {conv?.aiAvatar?.startsWith('data:')
              ? <img src={conv.aiAvatar} alt="" className="chat-sq-img" />
              : <span>{conv?.aiAvatar || '🌸'}</span>}
          </div>
          <div className="chat-square-name">{conv?.aiName || 'AI 助手'}</div>
          <div className="chat-square-preview">
            {conv?.messages[conv.messages.length - 1]?.content?.slice(0, 20) || '点击开始聊天...'}
          </div>
        </div>
      </div>

      {/* DIARY FULL WIDTH */}
      <div className="home-card diary-entry" onClick={() => onNavigate('diary')}>
        <div className="entry-info">
          <div className="entry-name">📅 日记本</div>
          <div className="entry-preview">
            {hasTodayDiary ? '今天已记录 ✓' : lastDiary ? `上次：${lastDiary.date}` : '点击记录今天的心情'}
          </div>
        </div>
        <ChevronRight size={16} color="#aaa" />
      </div>

      {/* ROW 2: 叮嘱 + 朋友圈 */}
      <div className="home-row">
        <div className="home-card square-card note-card">
          <div className="card-header">
            <span className="card-label">{conv?.aiAvatar} 叮嘱</span>
            <button className="refresh-btn" onClick={e => { e.stopPropagation(); refreshNote() }} disabled={noteLoading}>
              <RefreshCw size={13} className={noteLoading ? 'spin' : ''} />
            </button>
          </div>
          <p className="note-text">{noteLoading ? '生成中...' : (note || '点击刷新 ✨')}</p>
        </div>

        <div className="home-card square-card moments-square" onClick={() => onNavigate('moments')}>
          <div className="card-header">
            <span className="card-label">🌸 朋友圈</span>
          </div>
          <p className="note-text">
            {lastMoment?.content?.slice(0, 40) || 'AI 还没发朋友圈，点击查看'}
          </p>
        </div>
      </div>
    </div>
  )
}
