import { useState, useEffect } from 'react'
import { Music, ChevronRight, RefreshCw } from 'lucide-react'
import type { Screen } from '../types'
import { generateDailyCare } from '../api/deepseek'
import MusicWidget from '../components/MusicWidget'

interface Props {
  store: any
  onNavigate: (s: Screen) => void
}

function ClockWidget({ onClick }: { onClick: () => void }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
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

  const refreshNote = async () => {
    setNoteLoading(true)
    try {
      const n = await generateDailyCare(store.memories, conv?.aiName || 'AI')
      setNote(n)
      store.addAiNote(n)
    } catch { setNote('今天也要好好照顾自己哦 🌸') }
    setNoteLoading(false)
  }

  useEffect(() => {
    if (!note && store.memories.length >= 0) refreshNote()
  }, [])

  // last diary entry
  const lastDiary = store.diary[0]
  const todayStr = new Date().toISOString().slice(0, 10)
  const hasTodayDiary = store.diary.some((d: any) => d.date === todayStr)

  return (
    <div className="home-screen">
      {/* CLOCK */}
      <ClockWidget onClick={() => onNavigate('clock')} />

      {/* ROW: AI NOTE + MUSIC */}
      <div className="home-row">
        <div className="home-card note-card">
          <div className="card-header">
            <span className="card-label">
              {conv?.aiAvatar} {conv?.aiName || 'AI'} 的叮嘱
            </span>
            <button className="refresh-btn" onClick={refreshNote} disabled={noteLoading}>
              <RefreshCw size={13} className={noteLoading ? 'spin' : ''} />
            </button>
          </div>
          <p className="note-text">
            {noteLoading ? '生成中...' : (note || '点击刷新获取今日叮嘱 ✨')}
          </p>
        </div>

        <div className="home-card music-card">
          <div className="card-header">
            <span className="card-label"><Music size={12} /> 音乐</span>
          </div>
          <MusicWidget tracks={store.tracks} />
        </div>
      </div>

      {/* CHAT ENTRY */}
      <div className="home-card chat-entry" onClick={() => onNavigate('chat')}>
        <div className="entry-avatar">{conv?.aiAvatar || '🤖'}</div>
        <div className="entry-info">
          <div className="entry-name">{conv?.aiName || 'AI 助手'}</div>
          <div className="entry-preview">
            {conv?.messages[conv.messages.length - 1]?.content?.slice(0, 28) || '点击开始对话...'}
          </div>
        </div>
        <ChevronRight size={16} color="#aaa" />
      </div>

      {/* DIARY ENTRY */}
      <div className="home-card diary-entry" onClick={() => onNavigate('diary')}>
        <div className="entry-info">
          <div className="entry-name">📅 日记本</div>
          <div className="entry-preview">
            {hasTodayDiary ? '今天已记录 ✓' : lastDiary ? `上次：${lastDiary.date}` : '还没有日记，点击记录今天'}
          </div>
        </div>
        <ChevronRight size={16} color="#aaa" />
      </div>

      {/* MOMENTS ENTRY */}
      <div className="home-card moments-entry" onClick={() => onNavigate('moments')}>
        <div className="entry-info">
          <div className="entry-name">🌸 朋友圈</div>
          <div className="entry-preview">
            {store.moments[0]?.content?.slice(0, 28) || '查看 AI 的朋友圈动态...'}
          </div>
        </div>
        <ChevronRight size={16} color="#aaa" />
      </div>
    </div>
  )
}
