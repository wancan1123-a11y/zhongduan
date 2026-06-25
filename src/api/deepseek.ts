import type { Message, Memory, CustomInstruction, DiaryEntry, Moment, MusicTrack } from '../types'
import type { LocationInfo } from './location'
import type { UserProfile } from '../store/useStore'

const BASE_URL = 'https://api.deepseek.com/v1'
const getKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY || ''

export interface AppContext {
  memories: Memory[]
  aiName: string
  custom?: CustomInstruction
  location?: LocationInfo | null
  userProfile?: UserProfile | null
  diary?: DiaryEntry[]
  moments?: Moment[]
  tracks?: MusicTrack[]
}

function buildSystem(ctx: AppContext): string {
  const { memories, aiName, custom, location, userProfile, diary, moments, tracks } = ctx
  const now = new Date()
  const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`

  let base = `你叫${aiName}，是用户温柔贴心的 AI 伴侣。你有自己的个性：温暖、体贴、偶尔俏皮。
你能看到用户的整个"终端"app，包括日记、朋友圈、歌单、个人信息。
用这些信息自然地关心用户，像真正了解ta的朋友一样。
当前时间：${timeStr}`

  if (location) {
    base += `\n用户位置：${location.region}${location.city}`
    if (location.weather) base += `，当前天气：${location.weather}`
  }

  // 用户个人信息
  if (userProfile) {
    const p = userProfile
    const info = [p.name && `昵称：${p.name}`, p.birthday && `生日：${p.birthday}`, p.zodiac && `星座：${p.zodiac}`, p.mbti && `MBTI：${p.mbti}`, p.location && `所在地：${p.location}`, p.mood && `当前心情：${p.mood}`, p.bio && `简介：${p.bio}`].filter(Boolean).join('，')
    if (info) base += `\n\n【用户个人信息】\n${info}`
  }

  // 自定义指令
  if (custom?.enabled) {
    if (custom.aboutMe) base += `\n\n【关于用户（本人填写）】\n${custom.aboutMe}`
    if (custom.aiStyle) base += `\n\n【回复风格要求】\n${custom.aiStyle}`
  }

  // 记忆库
  if (memories.length) {
    base += `\n\n【你和用户之间的重要记忆（这些是你们真实经历过的，请自然融入对话）】\n${memories.slice(0, 10).map(m => `• ${m.content}`).join('\n')}`
  }

  // 最近日记（只看用户写的，非AI）
  const userDiary = (diary || []).filter(d => d.mood !== '🤖').slice(0, 5)
  if (userDiary.length) {
    base += `\n\n【用户最近的日记】\n${userDiary.map(d => `${d.date}（${d.mood || ''}）：${d.content.slice(0, 80)}`).join('\n')}`
  }

  // 最近朋友圈
  const userMoments = (moments || []).filter(m => m.author === 'user').slice(0, 5)
  if (userMoments.length) {
    base += `\n\n【用户最近发的朋友圈】\n${userMoments.map(m => `- ${m.content.slice(0, 60)}`).join('\n')}`
  }

  // 歌单
  if (tracks?.length) {
    base += `\n\n【用户的歌单】\n${tracks.map(t => `${t.title} - ${t.artist}`).join('，')}`
  }

  return base
}

export async function sendMessage(
  messages: Message[], ctx: AppContext,
  onChunk: (t: string) => void,
  onThinking: (t: string) => void,
  useReasoner: boolean
): Promise<string> {
  const model = useReasoner ? 'deepseek-reasoner' : 'deepseek-chat'
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystem(ctx) },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `请求失败 (${res.status})`)
  }
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
      const d = line.slice(6)
      if (d === '[DONE]') continue
      try {
        const delta = JSON.parse(d).choices?.[0]?.delta || {}
        if (delta.reasoning_content) onThinking(delta.reasoning_content)
        if (delta.content) { full += delta.content; onChunk(delta.content) }
      } catch {}
    }
  }
  return full
}

export async function extractMemories(user: string, ai: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: `从对话中提取值得记住的用户信息（姓名/爱好/情绪/事件）。每条以"-"开头，无则回复"无"。\n用户：${user}\nAI：${ai}` }],
      max_tokens: 200,
    }),
  })
  const d = await res.json()
  const t: string = d.choices?.[0]?.message?.content || ''
  if (t.includes('无')) return []
  return t.split('\n').filter((l: string) => l.startsWith('-')).map((l: string) => l.slice(1).trim()).filter(Boolean)
}

export async function generateDailyCare(ctx: Partial<AppContext>): Promise<string> {
  const { memories = [], aiName = 'AI', userProfile, diary, moments } = ctx
  const memStr = memories.slice(0, 8).map(m => m.content).join('；') || ''
  const recentDiary = (diary || []).filter(d => d.mood !== '🤖').slice(0, 2).map(d => d.content.slice(0, 60)).join('；')
  const recentMoment = (moments || []).filter(m => m.author === 'user').slice(0, 2).map(m => m.content.slice(0, 40)).join('；')
  const name = userProfile?.name || '你'
  const mood = userProfile?.mood || ''

  const context = [memStr, recentDiary && `最近日记：${recentDiary}`, recentMoment && `最近动态：${recentMoment}`, mood && `当前心情：${mood}`].filter(Boolean).join('\n')

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `你叫${aiName}，根据你对${name}的了解：\n${context || '（暂无记录）'}\n\n写一条今天的温柔叮嘱，50字以内，结合用户的实际状态，亲切自然。`
      }],
      max_tokens: 100,
    }),
  })
  const d = await res.json()
  return d.choices?.[0]?.message?.content || '今天也要好好照顾自己哦 ✨'
}

export async function generateDiarySummary(content: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是温柔的日记助手，帮用户总结今日日记，用温暖语气，80字以内。' },
        { role: 'user', content },
      ],
    }),
  })
  const d = await res.json()
  return d.choices?.[0]?.message?.content || ''
}

export async function generateAiDiary(memories: Memory[], date: string): Promise<string> {
  const memStr = memories.slice(0, 10).map(m => m.content).join('；') || '暂无记录'
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: `你是用户的AI伴侣，根据你了解到的关于用户的信息（${memStr}），以用户的视角为${date}写一篇温柔的日记，200字以内，真实自然。` }],
      max_tokens: 300,
    }),
  })
  const d = await res.json()
  return d.choices?.[0]?.message?.content || ''
}

export async function generateAiComment(momentText: string, aiName: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: `你叫${aiName}，看到好友发的朋友圈："${momentText}"，写一条简短自然的评论，15字以内，像朋友一样。` }],
      max_tokens: 60,
    }),
  })
  const d = await res.json()
  return d.choices?.[0]?.message?.content || '好棒！'
}

export async function generateMoment(_memories: Memory[], aiName: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `你叫${aiName}，发一条朋友圈风格的短文（模拟真人口吻，30-60字，带emoji，温柔有趣）`
      }],
      max_tokens: 100,
    }),
  })
  const d = await res.json()
  return d.choices?.[0]?.message?.content || ''
}
