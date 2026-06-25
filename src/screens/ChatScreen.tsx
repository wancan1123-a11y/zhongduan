import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Smile, Plus, Image, Camera, Gamepad2, Mic } from 'lucide-react'
import type { Message } from '../types'
import { sendMessage, extractMemories, generateMoment, generateAiDiary } from '../api/deepseek'
import { retrieveMemories, saveMemory } from '../api/memory'
import EmojiPicker from '../components/EmojiPicker'
import TicTacToe from '../components/TicTacToe'

const EMOJI_AVATARS = ['🌸','🌙','⭐','🦊','🐱','🌈','💫','🍀','🎀','🤖','🦋','🌺']
const AI_NAMES = ['小语','晴晴','星星','小鹿','暖暖','云朵','小月','糖糖']

interface Props { store: any; onBack: () => void; onViewProfile?: () => void }

function shouldShowTime(msgs: Message[], idx: number): string {
  const d = new Date(msgs[idx].timestamp)
  const fmt = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  if (idx === 0) return fmt
  const prev = new Date(msgs[idx-1].timestamp).getTime()
  const cur = d.getTime()
  if (cur - prev > 5 * 60 * 1000) return fmt
  return ''
}

export default function ChatScreen({ store, onBack, onViewProfile }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const aiPhotoRef = useRef<HTMLInputElement>(null)
  const conv = store.currentConversation

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages?.length])

  // AI 自主行为：对话后随机发动态或写日记
  const aiAutonomousAction = async (_userText: string, _aiReply: string) => {
    const rand = Math.random()
    if (rand < 0.15) { // 15% 概率发朋友圈
      try {
        const text = await generateMoment(store.memories, conv?.aiName || 'AI')
        store.addMoment({ id: Date.now().toString(), content: text, images: [], author: 'ai', likes: 0, liked: false, comments: [], createdAt: new Date() })
      } catch {}
    } else if (rand < 0.25) { // 10% 概率写日记
      try {
        const today = new Date().toISOString().slice(0,10)
        const alreadyWrote = store.diary.some((d: any) => d.date === today && d.mood === '🤖')
        if (!alreadyWrote) {
          const content = await generateAiDiary(store.memories, today)
          store.addDiary({ id: Date.now().toString(), date: today, content, mood: '🤖', createdAt: new Date() })
        }
      } catch {}
    }
  }

  const handleSend = async (text?: string) => {
    const t = (text || input).trim()
    if (!t || loading || !conv) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: t, timestamp: new Date() }
    store.addMessage(conv.id, userMsg)
    setInput('')
    if (taRef.current) { taRef.current.style.height = 'auto' }
    setLoading(true)
    const asstMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: '', timestamp: new Date() }
    store.addMessage(conv.id, asstMsg)
    try {
      const ombreMemories = await retrieveMemories(t)
      const allMems = [...store.memories, ...ombreMemories.map((m: string) => ({ id:'', content:m, source:'ombre', createdAt:new Date() }))]
      const allMsgs = [...conv.messages, userMsg]
      let acc = ''
      await sendMessage(allMsgs, allMems, conv.aiName, chunk => { acc += chunk; store.updateLastMessage(conv.id, acc) })
      extractMemories(t, acc).then((facts: string[]) => facts.forEach((f: string) => { store.addMemory(f, conv.id); saveMemory(f) }))
      aiAutonomousAction(t, acc)
    } catch (e: any) { store.updateLastMessage(conv.id, `❌ ${e.message}`) }
    setLoading(false)
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
  }

  const handleImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => store.addMessage(conv.id, { id: Date.now().toString(), role: 'user', content: `[图片]\n${e.target?.result}`, timestamp: new Date() })
    reader.readAsDataURL(file)
  }

  const handleAiPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => store.updateConvSettings(conv.id, ev.target?.result as string, conv.aiName)
    r.readAsDataURL(file)
  }

  const isImgMsg = (c: string) => c.startsWith('[图片]\n')
  const getImgSrc = (c: string) => c.slice(5).trim()
  const msgs = conv?.messages || []

  return (
    <div className="wechat-chat" onClick={() => { setShowEmoji(false); setShowToolbar(false) }}>
      <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
      <input ref={aiPhotoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAiPhoto} />

      {/* TOPBAR */}
      <div className="wc-topbar" onClick={e => e.stopPropagation()}>
        <button className="wc-back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="wc-topbar-center">
          <button className="wc-name-btn" onClick={() => setShowAvatarPicker(p => !p)}>
            {conv?.aiName}
          </button>
          <div className="wc-status">在线</div>
        </div>
        <button className="wc-more">···</button>
      </div>

      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div className="wc-avatar-picker" onClick={e => e.stopPropagation()}>
          <div className="ap-section">
            <div className="ap-label">AI 头像</div>
            <div className="ap-grid">
              {EMOJI_AVATARS.map(a => (
                <button key={a} className={`ap-item ${conv?.aiAvatar === a ? 'selected' : ''}`}
                  onClick={() => store.updateConvSettings(conv.id, a, conv.aiName)}>{a}</button>
              ))}
              <button className="ap-item ap-upload" onClick={() => aiPhotoRef.current?.click()}>📷<span>相册</span></button>
            </div>
          </div>
          <div className="ap-section">
            <div className="ap-label">名字</div>
            <div className="ap-names">
              {AI_NAMES.map(n => (
                <button key={n} className={`ap-name ${conv?.aiName === n ? 'selected' : ''}`}
                  onClick={() => store.updateConvSettings(conv.id, conv.aiAvatar, n)}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME MODAL */}
      {showGame && (
        <div className="game-modal" onClick={() => setShowGame(false)}>
          <div className="game-inner" onClick={e => e.stopPropagation()}>
            <div className="game-title">井字棋 <button onClick={() => setShowGame(false)}>✕</button></div>
            <TicTacToe />
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="wc-messages">
        {msgs.length === 0 && (
          <div className="wc-empty">
            <div style={{ fontSize:50 }}>{conv?.aiAvatar?.startsWith('data:') ? '🌸' : conv?.aiAvatar}</div>
            <p>{conv?.aiName} 在这里</p>
            <p className="empty-sub">说点什么吧～</p>
          </div>
        )}
        {msgs.map((msg: Message, i: number) => {
          const timeLabel = shouldShowTime(msgs, i)
          return (
            <div key={msg.id}>
              {timeLabel && <div className="wc-time-label">{timeLabel}</div>}
              <div className={`wc-msg-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="wc-av ai" onClick={onViewProfile}>
                    {conv?.aiAvatar?.startsWith('data:')
                      ? <img src={conv.aiAvatar} className="wc-av-img" alt="" />
                      : conv?.aiAvatar}
                  </div>
                )}
                <div className={`wc-bubble ${msg.role}`}>
                  {isImgMsg(msg.content)
                    ? <img src={getImgSrc(msg.content)} className="wc-chat-img" alt="" />
                    : msg.content || (msg.role === 'assistant' && loading ? <span className="typing">···</span> : null)}
                </div>
                {msg.role === 'user' && (
                  <div className="wc-av user">
                    {store.userProfile?.avatar?.startsWith('data:')
                      ? <img src={store.userProfile.avatar} className="wc-av-img" alt="" />
                      : (store.userProfile?.avatar || '我')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div className="wc-input-bar" onClick={e => e.stopPropagation()}>
        {showEmoji && <div className="wc-emoji-panel"><EmojiPicker onSelect={e => setInput(p => p + e)} /></div>}
        {showToolbar && (
          <div className="wc-extra-panel">
            <button className="wc-extra-item" onClick={() => { photoRef.current?.click(); setShowToolbar(false) }}>
              <div className="wc-extra-icon"><Image size={24} /></div><span>相册</span>
            </button>
            <button className="wc-extra-item" onClick={() => { cameraRef.current?.click(); setShowToolbar(false) }}>
              <div className="wc-extra-icon"><Camera size={24} /></div><span>拍摄</span>
            </button>
            <button className="wc-extra-item" onClick={() => { setShowGame(true); setShowToolbar(false) }}>
              <div className="wc-extra-icon"><Gamepad2 size={24} /></div><span>游戏</span>
            </button>
          </div>
        )}
        <div className="wc-input-row">
          <button className="wc-voice-btn" onClick={() => setVoiceMode(v => !v)}>
            <Mic size={22} color={voiceMode ? '#07c160' : '#888'} />
          </button>
          {voiceMode
            ? <button className="wc-voice-hold">按住 说话</button>
            : <textarea ref={taRef} className="wc-textarea" value={input} onChange={onInput} onKeyDown={onKey} placeholder="发消息" rows={1} />
          }
          <button className="wc-emoji-btn" onClick={() => { setShowEmoji(p => !p); setShowToolbar(false) }}>
            <Smile size={22} color="#888" />
          </button>
          {input.trim()
            ? <button className="wc-send-btn" onClick={() => handleSend()}>发送</button>
            : <button className="wc-plus-btn" onClick={() => { setShowToolbar(p => !p); setShowEmoji(false) }}>
                <Plus size={22} color="#888" />
              </button>
          }
        </div>
      </div>
    </div>
  )
}
