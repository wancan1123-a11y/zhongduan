// TTS - AI 朗读
export function speak(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/[#*`>~\[\]]/g, '').slice(0, 500)
  const utt = new SpeechSynthesisUtterance(clean)
  utt.lang = 'zh-CN'
  utt.rate = 0.95
  utt.pitch = 1.05
  // 优先选中文女声
  const voices = window.speechSynthesis.getVoices()
  const zhVoice = voices.find(v => v.lang.includes('zh') && v.name.includes('Female'))
    || voices.find(v => v.lang.includes('zh'))
  if (zhVoice) utt.voice = zhVoice
  if (onEnd) utt.onend = onEnd
  window.speechSynthesis.speak(utt)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking || false
}

// STT - 语音识别
export function startRecognition(
  onResult: (text: string) => void,
  onEnd: () => void
): (() => void) | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = 'zh-CN'
  rec.continuous = false
  rec.interimResults = true
  rec.onresult = (e: any) => {
    const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('')
    if (e.results[0]?.isFinal) onResult(transcript)
  }
  rec.onend = onEnd
  rec.start()
  return () => rec.stop()
}
