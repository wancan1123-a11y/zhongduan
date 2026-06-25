import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Smile, Plus, Image, Camera, Gamepad2, Mic, Settings2 } from 'lucide-react'
import type { Message } from '../types'
import { sendMessage, extractMemories, generateMoment, generateAiDiary } from '../api/deepseek'
import { retrieveMemories, saveMemory } from '../api/memory'
import EmojiPicker from '../components/EmojiPicker'
import TicTacToe from '../components/TicTacToe'
import ThinkingBubble from '../components/ThinkingBubble'
import { shouldSearch, tavilySearch, formatSearchContext } from '../api/search'

const EMOJI_AVATARS = ['🌸','🌙','⭐','🦊','🐱','🌈','💫','🍀','🎀','🤖','🦋','🌺']
const AI_NAMES = ['小语','晴晴','星星','小鹿','暖暖','云朵','小月','糖糖']

const BUBBLE_COLORS = [
  { label: '薄荷绿', value: 'rgba(149,236,105,0.55)' },
  { label: '天空蓝', value: 'rgba(120,190,255,0.55)' },
  { label: '樱花粉', value: 'rgba(255,182,193,0.55)' },
  { label: '薰衣草', value: 'rgba(200,170,230,0.55)' },
  { label: '暖橙色', value: 'rgba(255,200,120,0.55)' },
  { label: '珊瑚红', value: 'rgba(255,140,130,0.55)' },
  { label: '奶茶色', value: 'rgba(220,190,160,0.55)' },
  { label: '烟灰色', value: 'rgba(180,180,195,0.55)' },
]

interface Props { store: any; onBack: () => void; onViewProfile?: () => void; onCustomInstruction?: () => void }

function shouldShowTime(msgs: Message[], idx: number): string {
  const d = new Date(msgs[idx].timestamp)
  const fmt = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  if (idx === 0) return fmt
  const prev = new Date(msgs[idx-1].timestamp).getTime()
  const cur = d.getTime()
  if (cur - prev > 5 * 60 * 1000) return fmt
  return ''
}

export default function ChatScreen({ store, onBack, onViewProfile, onCustomInstruction }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [bubbleColor, setBubbleColor] = useState(() => localStorage.getItem('bubbleColor') || 'rgba(149,236,105,0.55)')
  const [thinkingMap, setThinkingMap] = useState<Record<string, string>>({})
  const [searchStatus, setSearchStatus] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const aiPhotoRef = useRef<HTMLInputElement>(null)
  const conv = store.currentConversation

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages?.length])

  // AI 自主判断：让 AI 自己决定是否发朋友圈或写日记
  const aiAutonomousAction = async (userText: string, aiReply: string) => {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{
            role: 'user',
            content: `根据这段对话，以JSON格式回答（不要其他内容）：
用户说：${userText}
你回复：${aiReply}

回答格式：{"post_moment": true/false, "write_diary": true/false}
post_moment=true 表示你想发一条朋友圈分享此刻的心情
write_diary=true 表示你想写今天的日记`
          }],
          max_tokens: 50,
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || '{}'
      const match = text.match(/\{.*\}/)
      if (!match) return
      const decision = JSON.parse(match[0])
      if (decision.post_moment) {
        const momentText = await generateMoment(store.memories, conv?.aiName || 'AI')
        store.addMoment({ id: Date.now().toString(), content: momentText, images: [], author: 'ai', likes: 0, liked: false, comments: [], createdAt: new Date() })
      }
      if (decision.write_diary) {
        const today = new Date().toISOString().slice(0,10)
        const alreadyWrote = store.diary.some((d: any) => d.date === today && d.mood === '🤖')
        if (!alreadyWrote) {
          const diaryContent = await generateAiDiary(store.memories, today)
          store.addDiary({ id: Date.now().toString(), date: today, content: diaryContent, mood: '🤖', createdAt: new Date() })
        }
      }
    } catch {}
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

      // DeepSeek 自主判断是否需要搜索
      let searchContext = ''
      setSearchStatus('🔍 判断是否需要搜索...')
      const { needed, query } = await shouldSearch(t)
      if (needed) {
        setSearchStatus(`🌐 搜索中："${query}"`)
        try {
          const results = await tavilySearch(query)
          searchContext = formatSearchContext(results, query)
          setSearchStatus(`✅ 找到 ${results.length} 条结果`)
        } catch {
          setSearchStatus('⚠️ 搜索失败，直接回复')
        }
      } else {
        setSearchStatus('')
      }

      const allMsgs = [...conv.messages, userMsg]
      // 把搜索结果附加到最后一条用户消息
      const msgsWithSearch = searchContext
        ? [...allMsgs.slice(0, -1), { ...userMsg, content: userMsg.content + searchContext }]
        : allMsgs

      let acc = ''
      let thinkAcc = ''
      await sendMessage(
        msgsWithSearch, allMems, conv.aiName,
        chunk => { acc += chunk; store.updateLastMessage(conv.id, acc) },
        thinkChunk => {
          thinkAcc += thinkChunk
          setThinkingMap(prev => ({ ...prev, [asstMsg.id]: thinkAcc }))
        },
        store.useReasoner,
        store.customInstruction
      )
      setSearchStatus('')
      extractMemories(t, acc).then((facts: string[]) => facts.forEach((f: string) => { store.addMemory(f, conv.id); saveMemory(f) }))
      aiAutonomousAction(t, acc) // non-blocking
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
    <div className="wechat-chat" style={{ '--user-bubble-color': bubbleColor } as React.CSSProperties}
      onClick={() => { setShowEmoji(false); setShowToolbar(false); setShowColorPicker(false) }}>
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
        <button className="wc-color-dot" onClick={e => { e.stopPropagation(); setShowColorPicker(p => !p) }}
          style={{ background: bubbleColor, border:'2px solid rgba(255,255,255,0.8)' }} title="气泡颜色" />
        <button className="wc-ci-btn" onClick={() => onCustomInstruction?.()} title="自定义指令">
          <Settings2 size={18} color={store.customInstruction?.enabled ? '#7b68ee' : '#888'} />
        </button>
        <button className="wc-more">···</button>
      </div>

      {/* BUBBLE COLOR PICKER */}
      {showColorPicker && (
        <div className="wc-color-picker" onClick={e => e.stopPropagation()}>
          <div className="wc-color-title">选择气泡颜色</div>
          <div className="wc-color-grid">
            {BUBBLE_COLORS.map(c => (
              <button key={c.value} className={`wc-color-item ${bubbleColor === c.value ? 'selected' : ''}`}
                onClick={() => { setBubbleColor(c.value); localStorage.setItem('bubbleColor', c.value); setShowColorPicker(false) }}>
                <div className="wc-color-swatch" style={{ background: c.value }} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
              {/* Thinking bubble row (above AI bubble) */}
              {msg.role === 'assistant' && (thinkingMap[msg.id] || (loading && !msg.content && store.useReasoner)) && (
                <div className="wc-thinking-row">
                  <div style={{ width:38, flexShrink:0 }} />
                  <ThinkingBubble
                    thinking={thinkingMap[msg.id] || ''}
                    isStreaming={loading && !msg.content}
                  />
                </div>
              )}
              <div className={`wc-msg-row ${msg.role}`}>
                {/* AI: avatar first then bubble (normal order) */}
                {msg.role === 'assistant' && (
                  <div className="wc-av ai" onClick={onViewProfile}>
                    {conv?.aiAvatar?.startsWith('data:')
                      ? <img src={conv.aiAvatar} className="wc-av-img" alt="" />
                      : conv?.aiAvatar}
                  </div>
                )}
                {/* User: avatar first, then bubble — row-reverse makes bubble appear LEFT of avatar */}
                {msg.role === 'user' && (
                  <div className="wc-av user">
                    {store.userProfile?.avatar?.startsWith('data:')
                      ? <img src={store.userProfile.avatar} className="wc-av-img" alt="" />
                      : (store.userProfile?.avatar || '我')}
                  </div>
                )}
                <div className={`wc-bubble ${msg.role}`}>
                  {isImgMsg(msg.content)
                    ? <img src={getImgSrc(msg.content)} className="wc-chat-img" alt="" />
                    : msg.content || (msg.role === 'assistant' && loading ? <span className="typing">···</span> : null)}
                </div>
              </div>
            </div>
          )
        })}
        {searchStatus && (
          <div className="search-status-bar">
            <span>{searchStatus}</span>
          </div>
        )}
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
