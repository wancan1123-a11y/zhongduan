import { useState } from 'react'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Sparkles, Bot } from 'lucide-react'
import type { DiaryEntry } from '../types'
import { generateDiarySummary, generateAiDiary } from '../api/deepseek'

const MOODS = ['😊','😌','😔','😤','🥰','😴','🤔','😂']

interface Props { store: any; onBack: () => void }

export default function DiaryScreen({ store, onBack }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('😊')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiWriting, setAiWriting] = useState(false)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const diaryMap: Record<string, DiaryEntry> = {}
  store.diary.forEach((d: DiaryEntry) => { diaryMap[d.date] = d })

  const dateStr = (d: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const selectedEntry = selected ? diaryMap[selected] : null

  const aiWriteDiary = async () => {
    if (!selected) return
    setAiWriting(true)
    try {
      const aiContent = await generateAiDiary(store.memories, selected)
      store.addDiary({ id: Date.now().toString(), date: selected, content: aiContent, mood: '🤖', createdAt: new Date() })
    } catch {}
    setAiWriting(false)
  }

  const save = () => {
    if (!content.trim() || !selected) return
    store.addDiary({ id: Date.now().toString(), date: selected, content: content.trim(), mood, createdAt: new Date() })
    setContent(''); setWriting(false)
  }

  const summarize = async (entry: DiaryEntry) => {
    setAiLoading(true)
    try { store.updateDiary(entry.id, { aiSummary: await generateDiarySummary(entry.content) }) }
    catch { store.updateDiary(entry.id, { aiSummary: '生成失败，请稍后重试' }) }
    setAiLoading(false)
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  return (
    <div className="diary-screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="topbar-title">日记</span>
        <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <button className="icon-btn-secondary" onClick={aiWriteDiary} disabled={!selected || aiWriting} title="让AI写今天的日记">
            <Bot size={18} />
          </button>
          <button className="icon-btn-primary" onClick={() => setWriting(true)}><Plus size={20} /></button>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="calendar-wrap">
        <div className="cal-header">
          <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <span className="cal-month">{year}年{month+1}月</span>
          <button className="cal-nav" onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
        <div className="cal-weekdays">
          {['日','一','二','三','四','五','六'].map(d => <div key={d} className="cal-wd">{d}</div>)}
        </div>
        <div className="cal-grid">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1
            const ds = dateStr(d)
            const isToday = ds === todayStr
            const hasDiary = !!diaryMap[ds]
            const isSelected = ds === selected
            return (
              <div key={d} className={`cal-day ${isToday ? 'today' : ''} ${hasDiary ? 'has-diary' : ''} ${isSelected ? 'sel' : ''}`}
                onClick={() => { setSelected(ds); setWriting(false) }}>
                <span>{d}</span>
                {hasDiary && <div className="diary-dot">{diaryMap[ds].mood || '📝'}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* SELECTED DAY */}
      {selected && (
        <div className="diary-panel">
          {selectedEntry ? (
            <div className="diary-view-entry">
              <div className="diary-entry-header">
                <span className="diary-entry-date">{selected} {selectedEntry.mood}</span>
              </div>
              <p className="diary-entry-text">{selectedEntry.content}</p>
              {selectedEntry.aiSummary
                ? <div className="ai-summary-box"><span className="ai-s-label">✨ AI 感悟</span><p>{selectedEntry.aiSummary}</p></div>
                : <button className="ai-sum-btn" onClick={() => summarize(selectedEntry)} disabled={aiLoading}>
                    <Sparkles size={13} />{aiLoading ? '生成中...' : 'AI 总结'}
                  </button>
              }
            </div>
          ) : (
            <div>
              {!writing ? (
                <div className="diary-empty-day">
                  <p>{selected} 还没有日记</p>
                  <button className="write-btn" onClick={() => setWriting(true)}><Plus size={14} /> 写今天的日记</button>
                </div>
              ) : (
                <div className="diary-editor">
                  <div className="mood-row">
                    {MOODS.map(m => <button key={m} className={`mood-btn ${mood===m?'sel':''}`} onClick={() => setMood(m)}>{m}</button>)}
                  </div>
                  <textarea className="diary-ta" placeholder={`${selected} 发生了什么...`} value={content}
                    onChange={e => setContent(e.target.value)} rows={5} autoFocus />
                  <div className="diary-btns">
                    <button className="btn-ghost" onClick={() => setWriting(false)}>取消</button>
                    <button className="btn-primary" onClick={save} disabled={!content.trim()}>保存</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
