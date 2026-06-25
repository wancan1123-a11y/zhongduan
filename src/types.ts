export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'image' | 'game'
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  aiAvatar: string
  aiName: string
  createdAt: Date
  updatedAt: Date
}

export interface DiaryEntry {
  id: string
  date: string        // YYYY-MM-DD
  content: string
  aiSummary?: string
  mood?: string
  createdAt: Date
}

export interface Memory {
  id: string
  content: string
  source: string
  createdAt: Date
}

export interface Moment {
  id: string
  content: string
  images: string[]
  author: 'user' | 'ai'
  likes: number
  liked: boolean
  comments: { id: string; author: string; text: string }[]
  createdAt: Date
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  cover?: string
}

export interface AiNote {
  id: string
  content: string
  createdAt: Date
}

export type Screen = 'home' | 'clock' | 'chat' | 'diary' | 'moments' | 'settings' | 'memory'
