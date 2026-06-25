const OMBRE_URL = import.meta.env.VITE_OMBRE_URL || 'http://115.29.222.195:8000'

export async function retrieveMemories(query: string): Promise<string[]> {
  try {
    const res = await fetch(`${OMBRE_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'trace', arguments: { query, limit: 10 } }
      }),
    })
    const data = await res.json()
    const text: string = data?.result?.content?.[0]?.text || ''
    return text.split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.slice(1).trim())
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
