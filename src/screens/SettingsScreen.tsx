import { ArrowLeft, Trash2, Plus, Bell, BellOff } from 'lucide-react'
import type { Memory, MusicTrack } from '../types'
import { useState } from 'react'
import { requestPushPermission, isPushEnabled } from '../api/push'

interface Props { store: any; onBack: () => void }

export default function SettingsScreen({ store, onBack }: Props) {
  const [newTrackTitle, setNewTrackTitle] = useState('')
  const [newTrackArtist, setNewTrackArtist] = useState('')
  const [newTrackUrl, setNewTrackUrl] = useState('')
  const [pushEnabled, setPushEnabled] = useState(isPushEnabled)
  const [pushLoading, setPushLoading] = useState(false)

  const addTrack = () => {
    if (!newTrackTitle.trim() || !newTrackUrl.trim()) return
    store.addTrack({ id: Date.now().toString(), title: newTrackTitle, artist: newTrackArtist, url: newTrackUrl })
    setNewTrackTitle(''); setNewTrackArtist(''); setNewTrackUrl('')
  }

  return (
    <div className="settings-screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="topbar-title">设置</span>
      </div>

      <div className="settings-body">
        {/* 推送通知 */}
        <div className="settings-section">
          <div className="settings-title">🔔 推送通知</div>
          <div className="settings-item">
            <div style={{ flex:1 }}>
              <div className="settings-item-text">AI 主动推送消息</div>
              <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>
                {pushEnabled ? '已开启 · 每天早8点和晚9点收到AI消息' : '开启后无需打开app，AI会主动找你'}
              </div>
            </div>
            <button
              style={{ background: pushEnabled ? '#07c160' : '#ddd', border:'none', borderRadius:20, padding:'6px 14px', color:'#fff', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:4 }}
              disabled={pushLoading}
              onClick={async () => {
                if (pushEnabled) return
                setPushLoading(true)
                const sub = await requestPushPermission()
                setPushEnabled(!!sub)
                setPushLoading(false)
                if (!sub) alert('推送开启失败，请确认浏览器允许了通知权限')
              }}
            >
              {pushEnabled ? <><Bell size={14}/> 已开启</> : pushLoading ? '开启中...' : <><BellOff size={14}/> 开启推送</>}
            </button>
          </div>
        </div>
        <div className="settings-section">
          <div className="settings-title">🧠 记忆库（{store.memories.length} 条）</div>
          {store.memories.length === 0 && <p className="settings-empty">还没有记忆，和 AI 聊天后会自动生成</p>}
          {store.memories.map((m: Memory) => (
            <div key={m.id} className="settings-item">
              <span className="settings-item-text">{m.content}</span>
              <button className="del-btn-s" onClick={() => store.deleteMemory(m.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <div className="settings-title">🎵 音乐列表</div>
          {store.tracks.map((t: MusicTrack) => (
            <div key={t.id} className="settings-item">
              <div>
                <div className="settings-item-text">{t.title}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{t.artist}</div>
              </div>
            </div>
          ))}
          <div className="add-track-form">
            <input className="form-input" placeholder="歌曲名" value={newTrackTitle} onChange={e => setNewTrackTitle(e.target.value)} />
            <input className="form-input" placeholder="艺术家" value={newTrackArtist} onChange={e => setNewTrackArtist(e.target.value)} />
            <input className="form-input" placeholder="音频 URL（mp3 直链）" value={newTrackUrl} onChange={e => setNewTrackUrl(e.target.value)} />
            <button className="btn-primary" onClick={addTrack}><Plus size={14} /> 添加</button>
          </div>
        </div>
      </div>
    </div>
  )
}
