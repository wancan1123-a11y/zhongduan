import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Smile, Plus, Image, Camera, Gamepad2, Palette } from 'lucide-react'
import type { Message } from '../types'
import { sendMessage, extractMemories } from '../api/deepseek'
import { retrieveMemories, saveMemory } from '../api/memory'
import EmojiPicker from '../components/EmojiPicker'
import TicTacToe from '../components/TicTacToe'

const EMOJI_AVATARS = ['🌸','🌙','⭐','🦊','🐱','🌈','💫','🍀','🎀','🤖','🦋','🌺']
const AI_NAMES = ['小语','晴晴','星星','小鹿','暖暖','云朵','小月','糖糖']
const BG_OPTIONS = [
  { label: '默认', value: '' },
  { label: '波点', value: 'dots' },
  { label: '粉色', value: 'pink' },
  { label: '薄荷', value: 'mint' },
  { label: '星空', value: 'stars' },
  { label: '纸张', value: 'paper' },
]

interface Props { store: any; onBack: () => void }

export default function ChatScreen({ store, onBack }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [chatBg, setChatBg] = useState(() => localStorage.getItem('chatBg') || '')
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const aiPhotoRef = useRef<HTMLInputElement>(null)
  const conv = store.currentConversation

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conv?.messages?.length])

  const handleSend = async (text?: string) => {
    const t = (text || input).trim()
    if (!t || loading || !conv) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: t, timestamp: new Date() }
    store.addMessage(conv.id, userMsg)
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setLoading(true)
    const asstMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: '', timestamp: new Date() }
    store.addMessage(conv.id, asstMsg)
    try {
      const ombreMemories = await retrieveMemories(t)
      const allMemories = [...store.memories, ...ombreMemories.map((m: string) => ({ id: '', content: m, source: 'ombre', createdAt: new Date() }))]
      const allMsgs = [...conv.messages, userMsg]
      let acc = ''
      await sendMessage(allMsgs, allMemories, conv.aiName, chunk => {
        acc += chunk; store.updateLastMessage(conv.id, acc)
      })
      extractMemories(t, acc).then((facts: string[]) => {
        facts.forEach((f: string) => { store.addMemory(f, conv.id); saveMemory(f) })
      })
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
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const imgMsg: Message = { id: Date.now().toString(), role: 'user', content: `[图片]\n${dataUrl}`, timestamp: new Date() }
      store.addMessage(conv.id, imgMsg)
    }
    reader.readAsDataURL(file)
  }

  const handleAiPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      store.updateConvSettings(conv.id, ev.target?.result as string, conv.aiName)
    }
    reader.readAsDataURL(file)
  }

  const setBg = (v: string) => { setChatBg(v); localStorage.setItem('chatBg', v) }

  const bgClass = chatBg ? `chat-bg-${chatBg}` : ''

  const isImgMsg = (content: string) => content.startsWith('[图片]\n')
  const getImgSrc = (content: string) => content.slice(5).trim()

  return (
    <div className={`chat-screen ${bgClass}`} onClick={() => { setShowEmoji(false); setShowToolbar(false) }}>
      {/* hidden file inputs */}
      <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
        onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
      <input ref={aiPhotoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAiPhoto} />

      {/* TOPBAR */}
      <div className="topbar" onClick={e => e.stopPropagation()}>
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <button className="avatar-btn" onClick={() => setShowAvatarPicker(p => !p)}>
          {conv?.aiAvatar?.startsWith('data:')
            ? <img src={conv.aiAvatar} className="chat-avatar-img" alt="avatar" />
            : <span className="chat-avatar-emoji">{conv?.aiAvatar}</span>}
        </button>
        <div className="topbar-info">
          <div className="topbar-name">{conv?.aiName}</div>
          <div className="topbar-sub">在线 · 点击头像换形象</div>
        </div>
        <button className="tool-icon" style={{ marginLeft:'auto' }} onClick={() => {
          const next = BG_OPTIONS[(BG_OPTIONS.findIndex(b => b.value === chatBg) + 1) % BG_OPTIONS.length]
          setBg(next.value)
        }} title="换背景">
          <Palette size={18} />
        </button>
      </div>

      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div className="avatar-picker" onClick={e => e.stopPropagation()}>
          <div className="ap-section">
            <div className="ap-label">选择头像</div>
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

      {/* GAME */}
      {showGame && (
        <div className="game-modal" onClick={() => setShowGame(false)}>
          <div className="game-inner" onClick={e => e.stopPropagation()}>
            <div className="game-title">井字棋 <button onClick={() => setShowGame(false)}>✕</button></div>
            <TicTacToe />
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="chat-messages" onClick={() => { setShowEmoji(false); setShowToolbar(false) }}>
        {!conv?.messages?.length && (
          <div className="empty-chat">
            <div className="empty-chat-avatar">
              {conv?.aiAvatar?.startsWith('data:')
                ? <img src={conv.aiAvatar} style={{ width:64, height:64, borderRadius:16, objectFit:'cover' }} alt="" />
                : <span style={{ fontSize:56 }}>{conv?.aiAvatar}</span>}
            </div>
            <p>你好呀，我是{conv?.aiName} ✨</p>
            <p className="empty-sub">有什么想聊的？</p>
          </div>
        )}
        {conv?.messages?.map((msg: Message) => (
          <div key={msg.id} className={`msg-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-av">
                {conv.aiAvatar?.startsWith('data:')
                  ? <img src={conv.aiAvatar} style={{ width:34, height:34, borderRadius:10, objectFit:'cover' }} alt="" />
                  : conv.aiAvatar}
              </div>
            )}
            <div className={`msg-bubble ${isImgMsg(msg.content) ? 'img-bubble' : ''}`}>
              {isImgMsg(msg.content)
                ? <img src={getImgSrc(msg.content)} className="chat-img" alt="图片" />
                : msg.content || (msg.role === 'assistant' && loading ? <span className="typing">···</span> : null)}
            </div>
            {msg.role === 'user' && (
              <div className="msg-av user-av">我</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input-wrap" onClick={e => e.stopPropagation()}>
        {showEmoji && (
          <div className="emoji-float">
            <EmojiPicker onSelect={e => { setInput(p => p + e) }} />
          </div>
        )}

        {showToolbar && (
          <div className="extra-toolbar">
            <button className="extra-btn" onClick={() => { photoRef.current?.click(); setShowToolbar(false) }}>
              <div className="extra-icon"><Image size={22} /></div><span>相册</span>
            </button>
            <button className="extra-btn" onClick={() => { cameraRef.current?.click(); setShowToolbar(false) }}>
              <div className="extra-icon"><Camera size={22} /></div><span>拍摄</span>
            </button>
            <button className="extra-btn" onClick={() => { setShowGame(true); setShowToolbar(false) }}>
              <div className="extra-icon"><Gamepad2 size={22} /></div><span>游戏</span>
            </button>
            <button className="extra-btn" onClick={() => {
              handleSend('给我讲个笑话或者说一句今天的暖心话 🌸')
              setShowToolbar(false)
            }}>
              <div className="extra-icon">💌</div><span>随机惊喜</span>
            </button>
          </div>
        )}

        <div className="input-row">
          <button className="tool-icon" onClick={() => { setShowEmoji(p => !p); setShowToolbar(false) }}>
            <Smile size={22} />
          </button>
          <textarea ref={taRef} className="msg-input" value={input} onChange={onInput} onKeyDown={onKey}
            placeholder="说点什么..." rows={1} />
          {input.trim()
            ? <button className="send-btn" onClick={() => handleSend()} disabled={loading}><Send size={18} /></button>
            : <button className="tool-icon plus-btn" onClick={() => { setShowToolbar(p => !p); setShowEmoji(false) }}>
                <Plus size={22} />
              </button>
          }
        </div>
      </div>
    </div>
  )
}
