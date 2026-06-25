import { ArrowLeft, Trash2, Plus } from 'lucide-react'
import type { Memory, MusicTrack } from '../types'
import { useState } from 'react'

interface Props { store: any; onBack: () => void }

export default function SettingsScreen({ store, onBack }: Props) {
  const [newTrackTitle, setNewTrackTitle] = useState('')
  const [newTrackArtist, setNewTrackArtist] = useState('')
  const [newTrackUrl, setNewTrackUrl] = useState('')

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
