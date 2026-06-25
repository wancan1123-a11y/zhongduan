import { useState, useRef } from 'react'
import { ArrowLeft, Heart, MessageCircle, Plus, RefreshCw, Camera } from 'lucide-react'
import type { Moment } from '../types'
import { generateMoment } from '../api/deepseek'

interface Props { store: any; onBack: () => void }

export default function MomentsScreen({ store, onBack }: Props) {
  const [commenting, setCommenting] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [myText, setMyText] = useState('')
  const [myImages, setMyImages] = useState<string[]>([])
  const [coverImg, setCoverImg] = useState<string>(() => localStorage.getItem('momentsCover') || '')
  const coverRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const conv = store.currentConversation
  const profile = store.userProfile

  const genAiPost = async () => {
    setAiLoading(true)
    try {
      const text = await generateMoment(store.memories, conv?.aiName || 'AI')
      store.addMoment({ id: Date.now().toString(), content: text, images: [], author: 'ai', likes: 0, liked: false, comments: [], createdAt: new Date() })
    } catch {}
    setAiLoading(false)
  }

  const postMine = () => {
    if (!myText.trim() && myImages.length === 0) return
    store.addMoment({ id: Date.now().toString(), content: myText.trim(), images: myImages, author: 'user', likes: 0, liked: false, comments: [], createdAt: new Date() })
    setMyText(''); setMyImages([]); setPosting(false)
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const r = new FileReader()
      r.onload = ev => setMyImages(prev => [...prev, ev.target?.result as string].slice(0, 9))
      r.readAsDataURL(file)
    })
  }

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => { const url = ev.target?.result as string; setCoverImg(url); localStorage.setItem('momentsCover', url) }
    r.readAsDataURL(file)
  }

  const submitComment = (id: string) => {
    if (!commentText.trim()) return
    store.addComment(id, commentText.trim())
    setCommentText(''); setCommenting(null)
  }

  function timeStr(d: Date) {
    const now = new Date(), diff = now.getTime() - new Date(d).getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`
    return new Date(d).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }

  return (
    <div className="moments-screen">
      <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleCover} />
      <input ref={photoRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handlePhoto} />

      {/* COVER */}
      <div className="moments-cover" style={{ backgroundImage: coverImg ? `url(${coverImg})` : undefined }}>
        <button className="back-btn-light" onClick={onBack}><ArrowLeft size={22} /></button>
        <button className="cover-camera-btn" onClick={() => coverRef.current?.click()}><Camera size={16} /></button>
        <div className="moments-cover-info">
          <div className="moments-cover-name">{profile?.name || '我'}</div>
          <div className="moments-cover-avatar">
            {profile?.avatar?.startsWith('data:')
              ? <img src={profile.avatar} alt="" className="moments-avatar-img" />
              : <span className="moments-avatar-emoji">{profile?.avatar || '🙂'}</span>}
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="moments-action-bar">
        <button className="moments-action-btn" onClick={genAiPost} disabled={aiLoading}>
          <RefreshCw size={16} className={aiLoading ? 'spin' : ''} />
          <span>让 AI 发动态</span>
        </button>
        <button className="moments-action-btn primary" onClick={() => setPosting(p => !p)}>
          <Plus size={16} /><span>发朋友圈</span>
        </button>
      </div>

      {/* POST EDITOR */}
      {posting && (
        <div className="moment-editor">
          <textarea className="moment-editor-ta" placeholder="这一刻的想法..." value={myText}
            onChange={e => setMyText(e.target.value)} rows={3} autoFocus />
          {myImages.length > 0 && (
            <div className="moment-img-grid">
              {myImages.map((img, i) => <img key={i} src={img} className="moment-img-thumb" alt="" />)}
            </div>
          )}
          <div className="moment-editor-tools">
            <button className="me-tool-btn" onClick={() => photoRef.current?.click()}><Camera size={18} /></button>
            <div style={{ flex:1 }} />
            <button className="btn-ghost" onClick={() => { setPosting(false); setMyText(''); setMyImages([]) }}>取消</button>
            <button className="btn-primary" onClick={postMine}>发布</button>
          </div>
        </div>
      )}

      {/* FEED */}
      <div className="moments-feed">
        {store.moments.length === 0 && !posting && (
          <div className="empty-page" style={{ paddingTop:40 }}>
            <div style={{ fontSize:48 }}>🌸</div>
            <p>还没有动态</p>
            <p className="empty-sub">点击让 AI 发一条</p>
          </div>
        )}
        {store.moments.map((m: Moment) => {
          const isMe = m.author === 'user'
          const name = isMe ? (profile?.name || '我') : (conv?.aiName || 'AI')
          const avatar = isMe ? (profile?.avatar || '🙂') : (conv?.aiAvatar || '🌸')
          return (
            <div key={m.id} className="moment-item">
              <div className="moment-item-avatar">
                {avatar?.startsWith('data:')
                  ? <img src={avatar} alt="" className="moment-item-avatar-img" />
                  : <span className="moment-item-avatar-emoji">{avatar}</span>}
              </div>
              <div className="moment-item-body">
                <div className="moment-item-name">{name}</div>
                {m.content && <p className="moment-item-text">{m.content}</p>}
                {m.images?.length > 0 && (
                  <div className={`moment-photo-grid cols-${Math.min(m.images.length, 3)}`}>
                    {m.images.map((img, i) => <img key={i} src={img} className="moment-photo" alt="" />)}
                  </div>
                )}
                <div className="moment-item-footer">
                  <span className="moment-item-time">{timeStr(m.createdAt)}</span>
                  <div className="moment-item-actions">
                    <button className={`m-action ${m.liked ? 'liked' : ''}`} onClick={() => store.toggleLike(m.id)}>
                      <Heart size={13} fill={m.liked ? '#e8956d' : 'none'} strokeWidth={1.5} />
                      {m.likes > 0 && <span>{m.likes}</span>}
                    </button>
                    <button className="m-action" onClick={() => setCommenting(m.id === commenting ? null : m.id)}>
                      <MessageCircle size={13} strokeWidth={1.5} />
                      {m.comments.length > 0 && <span>{m.comments.length}</span>}
                    </button>
                  </div>
                </div>
                {m.comments.length > 0 && (
                  <div className="moment-comments-box">
                    {m.comments.map(c => (
                      <div key={c.id} className="moment-comment">
                        <span className="moment-comment-author">{c.author}：</span>{c.text}
                      </div>
                    ))}
                  </div>
                )}
                {commenting === m.id && (
                  <div className="moment-comment-input-row">
                    <input className="moment-comment-input" placeholder="发表评论..." value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitComment(m.id)} autoFocus />
                    <button className="moment-comment-send" onClick={() => submitComment(m.id)}>发送</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
