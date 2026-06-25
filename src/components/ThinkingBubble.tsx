import { useState } from 'react'
import { ChevronDown, ChevronUp, Brain } from 'lucide-react'

interface Props {
  thinking: string
  isStreaming?: boolean
}

export default function ThinkingBubble({ thinking, isStreaming }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!thinking && !isStreaming) return null

  return (
    <div className="thinking-wrap">
      <button className="thinking-toggle" onClick={() => setExpanded(p => !p)}>
        <Brain size={13} className={isStreaming && !thinking ? 'spin-slow' : ''} />
        <span>{isStreaming && !thinking ? '思考中...' : `思维过程`}</span>
        {thinking && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
      {expanded && thinking && (
        <div className="thinking-content">
          <pre className="thinking-text">{thinking}</pre>
        </div>
      )}
    </div>
  )
}
