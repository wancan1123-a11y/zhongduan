import type { Memory } from '../types'

const BASE_URL = 'https://api.deepseek.com/v1'
const getKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const LAST_REVIEW_KEY = 'memory_last_review'

// AI 主动整理记忆：去重、归纳、标记过期
export async function reviewMemories(
  memories: Memory[],
  aiName: string
): Promise<{ keep: string[]; remove: string[]; summary: string }> {
  if (memories.length < 5) return { keep: [], remove: [], summary: '' }

  const list = memories.map((m, i) => `${i+1}. ${m.content}`).join('\n')
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `你叫${aiName}，请整理以下关于用户的记忆条目：
${list}

请用JSON格式回复：
{
  "remove_indices": [需要删除的序号，如重复/过时/不重要的],
  "summary": "对用户的整体印象总结（50字）"
}
只回复JSON，不要其他内容。`
      }],
      max_tokens: 300,
      temperature: 0,
    }),
  })
  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content || '{}'
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { keep: [], remove: [], summary: '' }

  const result = JSON.parse(match[0])
  const removeIdx: number[] = result.remove_indices || []
  const remove = memories.filter((_, i) => removeIdx.includes(i + 1)).map(m => m.id)
  const keep = memories.filter((_, i) => !removeIdx.includes(i + 1)).map(m => m.id)

  return { keep, remove, summary: result.summary || '' }
}

// 检查是否需要整理（每3天一次）
export function shouldReview(): boolean {
  const last = localStorage.getItem(LAST_REVIEW_KEY)
  if (!last) return true
  const diff = Date.now() - parseInt(last)
  return diff > 3 * 24 * 60 * 60 * 1000
}

export function markReviewed() {
  localStorage.setItem(LAST_REVIEW_KEY, Date.now().toString())
}
