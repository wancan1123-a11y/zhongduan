import { useState } from 'react'
import { ArrowLeft, ToggleLeft, ToggleRight, Brain } from 'lucide-react'
import type { CustomInstruction } from '../types'

interface Props {
  instruction: CustomInstruction
  useReasoner: boolean
  onUpdate: (c: CustomInstruction) => void
  onSetReasoner: (v: boolean) => void
  onBack: () => void
}

export default function CustomInstructionScreen({ instruction, useReasoner, onUpdate, onSetReasoner, onBack }: Props) {
  const [form, setForm] = useState<CustomInstruction>(instruction)

  const save = () => { onUpdate(form); onBack() }

  return (
    <div className="ci-screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
        <span className="topbar-title">自定义指令</span>
        <button className="ci-save-btn" onClick={save}>保存</button>
      </div>

      <div className="ci-body">
        {/* 总开关 */}
        <div className="ci-card">
          <div className="ci-row">
            <div className="ci-row-info">
              <div className="ci-row-title">启用自定义指令</div>
              <div className="ci-row-sub">开启后，以下设置会在每次对话中生效</div>
            </div>
            <button className="ci-toggle" onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}>
              {form.enabled
                ? <ToggleRight size={32} color="#07c160" />
                : <ToggleLeft size={32} color="#ccc" />}
            </button>
          </div>
        </div>

        {/* 关于我 */}
        <div className="ci-card">
          <div className="ci-label">
            <span>关于我</span>
            <span className="ci-hint">帮助 AI 更了解你</span>
          </div>
          <textarea className="ci-textarea" rows={5} placeholder={`例如：
我叫小月，21岁，大学生。
喜欢听音乐、看小说、打羽毛球。
最近在准备考研，有点压力。
希望 AI 能像朋友一样陪我聊天。`}
            value={form.aboutMe}
            onChange={e => setForm(f => ({ ...f, aboutMe: e.target.value }))}
          />
        </div>

        {/* 回复风格 */}
        <div className="ci-card">
          <div className="ci-label">
            <span>回复风格</span>
            <span className="ci-hint">告诉 AI 你希望它怎样回复</span>
          </div>
          <textarea className="ci-textarea" rows={5} placeholder={`例如：
回复要简短温柔，不要太正式。
可以用可爱的颜文字和 emoji。
遇到我说负面情绪时，先共情再建议。
偶尔主动问我今天过得怎么样。`}
            value={form.aiStyle}
            onChange={e => setForm(f => ({ ...f, aiStyle: e.target.value }))}
          />
        </div>

        {/* 思考模式 */}
        <div className="ci-card">
          <div className="ci-row">
            <div className="ci-row-info">
              <div className="ci-row-title" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Brain size={16} color="#7b68ee" /> 深度思考模式
              </div>
              <div className="ci-row-sub">开启后 AI 会展示思维过程（使用 deepseek-reasoner，回复稍慢）</div>
            </div>
            <button className="ci-toggle" onClick={() => onSetReasoner(!useReasoner)}>
              {useReasoner
                ? <ToggleRight size={32} color="#7b68ee" />
                : <ToggleLeft size={32} color="#ccc" />}
            </button>
          </div>
          {useReasoner && (
            <div className="ci-tip">
              💡 开启后，AI 的每条回复上方会出现可折叠的「思维过程」，展示它的推理步骤
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
