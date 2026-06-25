const BASE_URL = 'https://api.deepseek.com/v1'
const getKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY || ''

export async function analyzeImage(base64: string, aiName: string): Promise<string> {
  // DeepSeek vision via multimodal message
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: base64 } },
          { type: 'text', text: `你叫${aiName}，用温柔亲切的语气描述这张图片，并表达你的感受或联想，50-100字。` }
        ]
      }],
      max_tokens: 200,
    }),
  })
  if (!res.ok) throw new Error('视觉分析失败')
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
