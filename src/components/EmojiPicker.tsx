const EMOJI_GROUPS = [
  { label: '常用', emojis: ['😊','😂','🥰','😍','🤩','😎','🥳','😉','😅','🤣','😭','😢','😤','😡','🤔','🤗','😴','🤯','😈','👻'] },
  { label: '手势', emojis: ['👍','👎','👏','🙌','🤝','🙏','💪','👀','🫡','🫶','✌️','🤞','👌','🤙','👋','🫂','❤️','🔥','✨','💯'] },
  { label: '动物', emojis: ['🐶','🐱','🐼','🐸','🦊','🐯','🦁','🐮','🐷','🐧','🦋','🌸','🌹','🍀','🌙','⭐','🌈','☁️','🌊','🍃'] },
  { label: '食物', emojis: ['🍎','🍕','🍔','🍜','🍣','🍰','🎂','☕','🧋','🍺','🍓','🍑','🥑','🍩','🍦','🧁','🥐','🍫','🍬','🍭'] },
  { label: '活动', emojis: ['🎉','🎊','🎈','🎁','🎵','🎶','🎮','🎯','🏆','🥇','💃','🕺','🎭','🎨','📸','💌','📱','💻','🎒','✈️'] },
]

interface Props {
  onSelect: (emoji: string) => void
}

export default function EmojiPicker({ onSelect }: Props) {
  return (
    <div className="emoji-picker-wrap">
      <div className="emoji-scroll">
        {EMOJI_GROUPS.map(group => (
          <div key={group.label} className="emoji-group">
            <div className="emoji-group-label">{group.label}</div>
            <div className="emoji-grid">
              {group.emojis.map(e => (
                <button key={e} className="emoji-btn" onClick={() => onSelect(e)}>{e}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
