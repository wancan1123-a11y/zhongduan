import { useState, useCallback } from 'react'
import type { Conversation, Message, DiaryEntry, Memory, Moment, MusicTrack, AiNote, CustomInstruction } from '../types'

export interface UserProfile {
  avatar: string
  name: string
  bio: string
  location: string
  birthday: string
  zodiac: string
  mbti: string
  mood: string
}

const DEFAULT_PROFILE: UserProfile = {
  avatar: '🙂', name: '我', bio: '点击编辑个人简介...', location: '', birthday: '', zodiac: '', mbti: '', mood: ''
}

const DEFAULT_TRACKS: MusicTrack[] = [
  { id: '1', title: 'Clair de Lune', artist: 'Debussy', url: '' },
  { id: '2', title: 'River Flows in You', artist: 'Yiruma', url: '' },
]

function ld<T>(key: string, def: T[] = [], parse?: (v: any) => T): T[] {
  try {
    const r = localStorage.getItem(key)
    if (!r) return def
    return JSON.parse(r).map(parse || ((v: any) => v))
  } catch { return def }
}

function sv<T>(key: string, data: T[]): T[] {
  localStorage.setItem(key, JSON.stringify(data))
  return data
}

const pc = (c: any): Conversation => ({
  ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
  messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
  aiAvatar: c.aiAvatar || '🤖', aiName: c.aiName || 'AI',
})

const defaultConv = (): Conversation => ({
  id: '1', title: '和 AI 的对话', aiAvatar: '🌸', aiName: '小语',
  messages: [], createdAt: new Date(), updatedAt: new Date(),
})

export function useStore() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const c = ld('t_convs', [], pc)
    return c.length ? c : [defaultConv()]
  })
  const [currentConvId, setCurrentConvId] = useState<string>('1')
  const [diary, setDiary] = useState<DiaryEntry[]>(() => ld('t_diary', [], (d: any) => ({ ...d, createdAt: new Date(d.createdAt) })))
  const [memories, setMemories] = useState<Memory[]>(() => ld('t_memories', [], (m: any) => ({ ...m, createdAt: new Date(m.createdAt) })))
  const [moments, setMoments] = useState<Moment[]>(() => ld('t_moments', [], (m: any) => ({ ...m, createdAt: new Date(m.createdAt) })))
  const [tracks, setTracks] = useState<MusicTrack[]>(() => ld('t_tracks', DEFAULT_TRACKS))
  const [aiNotes, setAiNotes] = useState<AiNote[]>(() => ld('t_ainotes', [], (n: any) => ({ ...n, createdAt: new Date(n.createdAt) })))
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try { return JSON.parse(localStorage.getItem('t_profile') || 'null') || DEFAULT_PROFILE } catch { return DEFAULT_PROFILE }
  })
  const [customInstruction, setCustomInstruction] = useState<CustomInstruction>(() => {
    try { return JSON.parse(localStorage.getItem('t_custom') || 'null') || { aboutMe: '', aiStyle: '', enabled: false } } catch { return { aboutMe: '', aiStyle: '', enabled: false } }
  })
  const [useReasoner, setUseReasonerState] = useState<boolean>(() => localStorage.getItem('t_reasoner') === 'true')

  const currentConversation = conversations.find(c => c.id === currentConvId) || conversations[0]

  const updateConv = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => sv('t_convs', prev.map(c => c.id === id ? updater(c) : c)) as Conversation[])
  }, [])

  const addMessage = useCallback((convId: string, msg: Message) => {
    updateConv(convId, c => {
      const msgs = [...c.messages, msg]
      const title = c.messages.length === 0 && msg.role === 'user' ? msg.content.slice(0, 18) : c.title
      return { ...c, messages: msgs, title, updatedAt: new Date() }
    })
  }, [updateConv])

  const updateLastMessage = useCallback((convId: string, content: string) => {
    updateConv(convId, c => {
      const msgs = [...c.messages]
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
      return { ...c, messages: msgs }
    })
  }, [updateConv])

  const updateConvSettings = useCallback((id: string, aiAvatar: string, aiName: string) => {
    updateConv(id, c => ({ ...c, aiAvatar, aiName }))
  }, [updateConv])

  const addMemory = useCallback((content: string, source: string) => {
    const mem: Memory = { id: Date.now().toString(), content, source, createdAt: new Date() }
    setMemories(prev => sv('t_memories', [mem, ...prev].slice(0, 60)) as Memory[])
  }, [])

  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => sv('t_memories', prev.filter(m => m.id !== id)) as Memory[])
  }, [])

  const addDiary = useCallback((entry: DiaryEntry) => {
    setDiary(prev => sv('t_diary', [entry, ...prev]) as DiaryEntry[])
  }, [])

  const updateDiary = useCallback((id: string, updates: Partial<DiaryEntry>) => {
    setDiary(prev => sv('t_diary', prev.map(d => d.id === id ? { ...d, ...updates } : d)) as DiaryEntry[])
  }, [])

  const addMoment = useCallback((moment: Moment) => {
    setMoments(prev => sv('t_moments', [moment, ...prev]) as Moment[])
  }, [])

  const toggleLike = useCallback((id: string) => {
    setMoments(prev => sv('t_moments', prev.map(m =>
      m.id === id ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1 } : m
    )) as Moment[])
  }, [])

  const addComment = useCallback((momentId: string, text: string) => {
    setMoments(prev => sv('t_moments', prev.map(m =>
      m.id === momentId ? { ...m, comments: [...m.comments, { id: Date.now().toString(), author: '我', text }] } : m
    )) as Moment[])
  }, [])

  const addTrack = useCallback((track: MusicTrack) => {
    setTracks(prev => sv('t_tracks', [...prev, track]) as MusicTrack[])
  }, [])

  const addAiNote = useCallback((content: string) => {
    const note: AiNote = { id: Date.now().toString(), content, createdAt: new Date() }
    setAiNotes(prev => sv('t_ainotes', [note, ...prev].slice(0, 10)) as AiNote[])
  }, [])

  const updateUserProfile = useCallback((p: UserProfile) => {
    setUserProfile(p); localStorage.setItem('t_profile', JSON.stringify(p))
  }, [])

  const updateCustomInstruction = useCallback((c: CustomInstruction) => {
    setCustomInstruction(c); localStorage.setItem('t_custom', JSON.stringify(c))
  }, [])

  const setUseReasoner = useCallback((v: boolean) => {
    setUseReasonerState(v); localStorage.setItem('t_reasoner', String(v))
  }, [])


  return {
    conversations, currentConvId, currentConversation,
    diary, memories, moments, tracks, aiNotes, userProfile,
    customInstruction, useReasoner,
    updateUserProfile, updateCustomInstruction, setUseReasoner,
    setCurrentConvId, addMessage, updateLastMessage, updateConvSettings,
    addMemory, deleteMemory, addDiary, updateDiary,
    addMoment, toggleLike, addComment, addTrack, addAiNote,
  }
}
