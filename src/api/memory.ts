const OMBRE_URL = import.meta.env.VITE_OMBRE_URL || 'http://115.29.222.195:8000'
const PUSH_URL = OMBRE_URL.replace(':8000', ':8001')

function cleanMemory(raw: string): string {
  return raw
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // 去掉 [[王灿灿]] → 王灿灿
    .replace(/#+\s*/g, '')               // 去掉 markdown 标题 ##
    .replace(/\*\*/g, '')                // 去掉 **加粗**
    .replace(/\n{3,}/g, '\n')            // 多余空行
    .trim()
}

export async function retrieveMemories(query: string): Promise<string[]> {
  try {
    const res = await fetch(`${PUSH_URL}/search-memory?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    return ((data.results || []) as string[]).map(cleanMemory).filter(s => s.length > 10)
  } catch { return [] }
}

export async function saveMemory(content: string, emotion: string = 'neutral'): Promise<void> {
  try {
    await fetch(`${OMBRE_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 2, method: 'tools/call',
        params: { name: 'hold', arguments: { content, emotion_tag: emotion } }
      }),
    })
  } catch {}
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OMBRE_URL}/health`)
    const data = await res.json()
    return data.status === 'ok'
  } catch { return false }
}
