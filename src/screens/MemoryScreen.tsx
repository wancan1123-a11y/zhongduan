import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import type { Memory } from '../types'
import { checkHealth } from '../api/memory'

interface Props { store: any; onBack: () => void }

const OMBRE_URL = import.meta.env.VITE_OMBRE_URL || 'http://115.29.222.195:8000'

export default function MemoryScreen({ store, onBack }: Props) {
  const [ombreOnline, setOmbreOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkHealth().then(setOmbreOnline)
  }, [])

  return (
    <div className="screen-inner" style={{ background: 'var(--dot-bg)', backgroundImage: 'radial-gradient(circle, var(--dot-color) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}>
      <div className="page-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <h1 className="page-title">🧠 记忆库</h1>
        <span className={`ombre-status ${ombreOnline ? 'online' : 'offline'}`}>
          {ombreOnline === null ? '检测中...' : ombreOnline ? '● Ombre 在线' : '● Ombre 离线'}
        </span>
      </div>

      {/* Ombre-Brain 面板入口 */}
      <div className="memory-ombre-card" onClick={() => window.open(`${OMBRE_URL}/dashboard`, '_blank')}>
        <div className="memory-ombre-icon">🗂️</div>
        <div className="memory-ombre-info">
          <div className="memory-ombre-title">Ombre-Brain 完整记忆库</div>
          <div className="memory-ombre-sub">查看所有 .md 记忆文件、搜索、可视化</div>
        </div>
        <ExternalLink size={16} color="#aaa" />
      </div>

      {/* 本地记忆 */}
      <div className="memory-section-title">
        本次会话提取 · {store.memories.length} 条
        <button className="refresh-btn" style={{ marginLeft: 8 }} onClick={() => checkHealth().then(setOmbreOnline)}>
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="list-body">
        {store.memories.length === 0 ? (
          <div className="empty-page">
            <div style={{ fontSize: 48 }}>🧠</div>
            <p>还没有记忆</p>
            <p className="empty-sub">和 AI 聊天后会自动提取重要信息</p>
          </div>
        ) : (
          store.memories.map((m: Memory) => (
            <div key={m.id} className="memory-card">
              <div className="memory-dot" />
              <div className="memory-content">
                <p className="memory-text">{m.content}</p>
                <span className="memory-time">
                  {new Date(m.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
              <button className="del-btn" onClick={() => store.deleteMemory(m.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
