import { useState } from 'react'
import { ArrowLeft, Heart, MessageCircle, Plus, RefreshCw } from 'lucide-react'
import type { Moment } from '../types'
import { generateMoment } from '../api/deepseek'

interface Props { store: any; onBack: () => void }

export default function MomentsScreen({ store, onBack }: Props) {
  const [commenting, setCommenting] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [myText, setMyText] = useState('')
  const conv = store.currentConversation

  const genAiPost = async () => {
    setAiLoading(true)
    try {
      const text = await generateMoment(store.memories, conv?.aiName || 'AI')
      const m: Moment = {
        id: Date.now().toString(), content: text, images: [],
        author: 'ai', likes: 0, liked: false, comments: [], createdAt: new Date(),
      }
      store.addMoment(m)
    } catch {}
    setAiLoading(false)
  }

  const postMine = () => {
    if (!myText.trim()) return
    const m: Moment = {
      id: Date.now().toString(), content: myText.trim(), images: [],
      author: 'user', likes: 0, liked: false, comments: [], createdAt: new Date(),
    }
    store.addMoment(m); setMyText(''); setPosting(false)
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
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="topbar-title">朋友圈</span>
        <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <button className="top-action-btn" onClick={genAiPost} disabled={aiLoading} title="让AI发朋友圈">
            <RefreshCw size={18} className={aiLoading ? 'spin' : ''} />
          </button>
          <button className="top-action-btn" onClick={() => setPosting(p => !p)} title="我来发">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {posting && (
        <div className="post-editor">
          <textarea className="post-ta" placeholder="分享此刻的心情..." value={myText}
            onChange={e => setMyText(e.target.value)} rows={3} autoFocus />
          <div className="diary-btns">
            <button className="btn-ghost" onClick={() => setPosting(false)}>取消</button>
            <button className="btn-primary" onClick={postMine} disabled={!myText.trim()}>发布</button>
          </div>
        </div>
      )}

      <div className="moments-list">
        {store.moments.length === 0 && (
          <div className="empty-page" style={{ paddingTop: 60 }}>
            <div style={{ fontSize: 48 }}>🌸</div>
            <p>还没有动态</p>
            <p className="empty-sub">点击右上角让 AI 发一条</p>
          </div>
        )}
        {store.moments.map((m: Moment) => (
          <div key={m.id} className="moment-card">
            <div className="moment-avatar">
              {m.author === 'ai' ? (conv?.aiAvatar || '🤖') : '我'}
            </div>
            <div className="moment-body">
              <div className="moment-name">{m.author === 'ai' ? (conv?.aiName || 'AI') : '我'}</div>
              <p className="moment-text">{m.content}</p>
              <div className="moment-footer">
                <span className="moment-time">{timeStr(m.createdAt)}</span>
                <div className="moment-actions">
                  <button className={`action-btn ${m.liked ? 'liked' : ''}`} onClick={() => store.toggleLike(m.id)}>
                    <Heart size={14} fill={m.liked ? '#e8956d' : 'none'} /> {m.likes > 0 && m.likes}
                  </button>
                  <button className="action-btn" onClick={() => setCommenting(m.id === commenting ? null : m.id)}>
                    <MessageCircle size={14} /> {m.comments.length > 0 && m.comments.length}
                  </button>
                </div>
              </div>
              {m.comments.length > 0 && (
                <div className="moment-comments">
                  {m.comments.map(c => (
                    <div key={c.id} className="comment-item">
                      <span className="comment-author">{c.author}：</span>{c.text}
                    </div>
                  ))}
                </div>
              )}
              {commenting === m.id && (
                <div className="comment-input-row">
                  <input className="comment-input" placeholder="留个评论..." value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitComment(m.id)} autoFocus />
                  <button className="comment-send" onClick={() => submitComment(m.id)}>发送</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
