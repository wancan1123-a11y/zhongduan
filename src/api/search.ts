const TAVILY_KEY = import.meta.env.VITE_TAVILY_KEY || ''
const DS_URL = 'https://api.deepseek.com/v1/chat/completions'
const getKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY || ''

export interface SearchResult {
  title: string
  url: string
  content: string
}

// 让 DeepSeek 判断是否需要搜索，以及搜索词
export async function shouldSearch(message: string): Promise<{ needed: boolean; query: string }> {
  try {
    const res = await fetch(DS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `判断这条消息是否需要搜索互联网才能准确回答（实时信息、新闻、天气、价格、近期事件等）。
只回答JSON，格式：{"needed": true/false, "query": "搜索关键词（英文或中文，简洁）"}
消息：${message}`
        }],
        max_tokens: 80,
        temperature: 0,
      }),
    })
    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content || '{}'
    const match = text.match(/\{.*\}/s)
    if (!match) return { needed: false, query: '' }
    const result = JSON.parse(match[0])
    return { needed: !!result.needed, query: result.query || message }
  } catch {
    return { needed: false, query: '' }
  }
}

// 调用 Tavily 搜索
export async function tavilySearch(query: string): Promise<SearchResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: 'basic',
      max_results: 4,
      include_answer: true,
    }),
  })
  if (!res.ok) throw new Error('搜索失败')
  const data = await res.json()
  return (data.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content?.slice(0, 300) || '',
  }))
}

// 把搜索结果格式化注入给 AI
export function formatSearchContext(results: SearchResult[], query: string): string {
  if (!results.length) return ''
  const items = results.map((r, i) => `[${i+1}] ${r.title}\n${r.content}`).join('\n\n')
  return `\n\n【网络搜索结果 - 查询："${query}"】\n${items}\n\n请基于以上搜索结果回答，可以在回复末尾注明参考来源。`
}
