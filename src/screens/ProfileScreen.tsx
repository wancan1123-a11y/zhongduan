import { useState, useRef } from 'react'
import { ArrowLeft, Edit3, Camera, MapPin, Heart, BookOpen, Music2 } from 'lucide-react'

interface Profile {
  avatar: string
  name: string
  bio: string
  location: string
  birthday: string
  zodiac: string
  mbti: string
  mood: string
}

interface Props {
  isAi?: boolean
  aiName?: string
  aiAvatar?: string
  userProfile: Profile
  onUpdateProfile: (p: Profile) => void
  onBack: () => void
  onViewMoments: () => void
  onViewDiary: () => void
  memories?: any[]
}

const FIELDS = [
  { key: 'name', label: '昵称', icon: '✏️' },
  { key: 'bio', label: '个人简介', icon: '💭' },
  { key: 'location', label: '所在地', icon: '📍' },
  { key: 'birthday', label: '生日', icon: '🎂' },
  { key: 'zodiac', label: '星座', icon: '✨' },
  { key: 'mbti', label: 'MBTI', icon: '🧠' },
  { key: 'mood', label: '当前心情', icon: '🌸' },
] as const

export default function ProfileScreen({ isAi, aiName, aiAvatar, userProfile, onUpdateProfile, onBack, onViewMoments, onViewDiary }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  const profile = isAi
    ? { avatar: aiAvatar || '🌸', name: aiName || 'AI', bio: '你的专属 AI 伴侣，记得你说过的每一句话。', location: '云端', birthday: '2024-01-01', zodiac: '摩羯座', mbti: 'INFJ', mood: '陪在你身边 💫' }
    : userProfile

  const startEdit = (key: string) => {
    setEditing(key)
    setEditVal((profile as any)[key] || '')
  }

  const saveEdit = () => {
    if (!editing || isAi) return
    onUpdateProfile({ ...userProfile, [editing]: editVal })
    setEditing(null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAi) return
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpdateProfile({ ...userProfile, avatar: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div className="profile-screen">
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

      {/* HEADER COVER */}
      <div className="profile-cover">
        <button className="back-btn-light" onClick={onBack} style={{ zIndex:10, position:'absolute', top:14, left:14 }}>
          <ArrowLeft size={22} />
        </button>
        <div className="profile-cover-blur" />
      </div>

      {/* AVATAR */}
      <div className="profile-avatar-wrap">
        <div className="profile-avatar" onClick={() => !isAi && photoRef.current?.click()}>
          {profile.avatar?.startsWith('data:') || profile.avatar?.startsWith('http')
            ? <img src={profile.avatar} alt="avatar" className="profile-avatar-img" />
            : <span className="profile-avatar-emoji">{profile.avatar}</span>}
          {!isAi && <div className="profile-avatar-edit"><Camera size={14} /></div>}
        </div>
        <div className="profile-name">{profile.name}</div>
        <div className="profile-bio">{profile.bio}</div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="profile-actions">
        <button className="profile-action-btn" onClick={onViewMoments}>
          <BookOpen size={16} /><span>朋友圈</span>
        </button>
        <button className="profile-action-btn" onClick={onViewDiary}>
          <Music2 size={16} /><span>{isAi ? 'AI 日记' : '我的日记'}</span>
        </button>
      </div>

      {/* INFO LIST */}
      <div className="profile-info-list">
        {FIELDS.map(f => (
          <div key={f.key} className="profile-info-item">
            <span className="profile-info-icon">{f.icon}</span>
            <div className="profile-info-content">
              <div className="profile-info-label">{f.label}</div>
              {editing === f.key && !isAi ? (
                <div className="profile-edit-row">
                  <input className="profile-edit-input" value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                  <button className="profile-save-btn" onClick={saveEdit}>保存</button>
                </div>
              ) : (
                <div className="profile-info-value">{(profile as any)[f.key] || '未填写'}</div>
              )}
            </div>
            {!isAi && <button className="profile-edit-btn" onClick={() => editing === f.key ? setEditing(null) : startEdit(f.key)}>
              <Edit3 size={14} />
            </button>}
          </div>
        ))}

        {profile.location && (
          <div className="profile-location-tag">
            <MapPin size={12} />{profile.location}
          </div>
        )}
        {isAi && (
          <div className="profile-ai-note">
            <Heart size={12} /> AI 伴侣会随着你们的对话不断成长，记住你的点点滴滴
          </div>
        )}
      </div>
    </div>
  )
}
