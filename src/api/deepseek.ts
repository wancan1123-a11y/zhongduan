import type { Message, Memory, CustomInstruction } from '../types'

const BASE_URL = 'https://api.deepseek.com/v1'
const getKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY || ''

function buildSystem(memories: Memory[], aiName: string, custom?: CustomInstruction): string {
  let base = `你叫${aiName}，是用户温柔贴心的 AI 伴侣。你有自己的个性：温暖、体贴、偶尔俏皮。
你记得用户告诉你的事情，会自然地在对话中提及。回复亲切自然，像真正了解用户的朋友。`

  if (custom?.enabled) {
    if (custom.aboutMe) base += `\n\n【关于用户】\n${custom.aboutMe}`
    if (custom.aiStyle) base += `\n\n【回复风格要求】\n${custom.aiStyle}`
  }

  if (memories.length) {
    base += `\n\n【你记得关于用户的事】\n${memories.slice(0, 15).map(m => `- ${m.content}`).join('\n')}`
  }
  return base
}

export async function sendMessage(
  messages: Message[], memories: Memory[], aiName: string,
  onChunk: (t: string) => void,
  onThinking: (t: string) => void,
  useReasoner: boolean,
  custom?: CustomInstruction
): Promise<string> {
  const model = useReasoner ? 'deepseek-reasoner' : 'deepseek-chat'
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystem(memories, aiName, custom) },
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

export async function generateDailyCare(memories: Memory[], aiName: string): Promise<string> {
  const memStr = memories.slice(0, 8).map(m => m.content).join('；') || '（暂无记录）'
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `你叫${aiName}，根据你对用户的了解（${memStr}），写一条今天的温柔叮嘱或留言，50字以内，亲切自然。`
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
