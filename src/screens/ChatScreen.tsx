import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Smile, Plus, Image, Camera, Gamepad2, FileText, Edit3 } from 'lucide-react'
import type { Message } from '../types'
import { sendMessage, extractMemories } from '../api/deepseek'
import EmojiPicker from '../components/EmojiPicker'
import TicTacToe from '../components/TicTacToe'

const AVATARS = ['🌸','🌙','⭐','🦊','🐱','🌈','💫','🍀','🎀','🤖','🦋','🌺']
const AI_NAMES = ['小语','晴晴','星星','小鹿','暖暖','云朵','小月','糖糖']

interface Props { store: any; onBack: () => void }

export default function ChatScreen({ store, onBack }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const conv = store.currentConversation

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conv?.messages?.length])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !conv) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    store.addMessage(conv.id, userMsg)
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setLoading(true)
    const asstMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: '', timestamp: new Date() }
    store.addMessage(conv.id, asstMsg)
    try {
      const allMsgs = [...conv.messages, userMsg]
      let acc = ''
      await sendMessage(allMsgs, store.memories, conv.aiName, chunk => {
        acc += chunk; store.updateLastMessage(conv.id, acc)
      })
      extractMemories(text, acc).then((facts: string[]) => facts.forEach((f: string) => store.addMemory(f, conv.id)))
    } catch (e: any) { store.updateLastMessage(conv.id, `❌ ${e.message}`) }
    setLoading(false)
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
  }

  return (
    <div className="chat-screen" onClick={() => { setShowEmoji(false); setShowToolbar(false) }}>
      {/* TOPBAR */}
      <div className="topbar" onClick={e => e.stopPropagation()}>
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <button className="avatar-btn" onClick={() => setShowAvatarPicker(p => !p)}>
          <span className="chat-avatar-emoji">{conv?.aiAvatar}</span>
        </button>
        <div className="topbar-info">
          <div className="topbar-name">{conv?.aiName}</div>
          <div className="topbar-sub">在线 · 点击头像换形象</div>
        </div>
      </div>

      {/* AVATAR PICKER */}
      {showAvatarPicker && (
        <div className="avatar-picker" onClick={e => e.stopPropagation()}>
          <div className="ap-section">
            <div className="ap-label">选择头像</div>
            <div className="ap-grid">
              {AVATARS.map(a => (
                <button key={a} className={`ap-item ${conv?.aiAvatar === a ? 'selected' : ''}`}
                  onClick={() => store.updateConvSettings(conv.id, a, conv.aiName)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="ap-section">
            <div className="ap-label">选择名字</div>
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
            <div style={{ fontSize: 56 }}>{conv?.aiAvatar}</div>
            <p>你好呀，我是{conv?.aiName} ✨</p>
            <p className="empty-sub">有什么想聊的？</p>
          </div>
        )}
        {conv?.messages?.map((msg: Message) => (
          <div key={msg.id} className={`msg-row ${msg.role}`}>
            {msg.role === 'assistant' && <div className="msg-av">{conv.aiAvatar}</div>}
            <div className="msg-bubble">
              {msg.content || (msg.role === 'assistant' && loading ? <span className="typing">···</span> : null)}
            </div>
            {msg.role === 'user' && <div className="msg-av user-av">我</div>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input-wrap" onClick={e => e.stopPropagation()}>
        {showEmoji && <div className="emoji-float"><EmojiPicker onSelect={e => setInput(p => p + e)} /></div>}

        {showToolbar && (
          <div className="extra-toolbar">
            <button className="extra-btn" onClick={() => {/* TODO: image */}}>
              <div className="extra-icon"><Image size={22} /></div><span>相册</span>
            </button>
            <button className="extra-btn" onClick={() => {/* TODO: camera */}}>
              <div className="extra-icon"><Camera size={22} /></div><span>拍摄</span>
            </button>
            <button className="extra-btn" onClick={() => {/* TODO: file */}}>
              <div className="extra-icon"><FileText size={22} /></div><span>文件</span>
            </button>
            <button className="extra-btn" onClick={() => { setShowGame(true); setShowToolbar(false) }}>
              <div className="extra-icon"><Gamepad2 size={22} /></div><span>游戏</span>
            </button>
            <button className="extra-btn" onClick={() => {/* TODO: note */}}>
              <div className="extra-icon"><Edit3 size={22} /></div><span>便签</span>
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
            ? <button className="send-btn" onClick={handleSend} disabled={loading}><Send size={18} /></button>
            : <button className="tool-icon plus-btn" onClick={() => { setShowToolbar(p => !p); setShowEmoji(false) }}>
                <Plus size={22} />
              </button>
          }
        </div>
      </div>
    </div>
  )
}
