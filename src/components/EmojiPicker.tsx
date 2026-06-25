const EMOJIS = [
  '😀','😂','🥰','😍','🤩','😎','🥳','😊','🙂','😉',
  '😅','🤣','😭','😢','😤','😡','🤔','🤗','😴','🤯',
  '👍','👎','👏','🙌','🤝','❤️','🔥','✨','🎉','🎊',
  '🌟','💯','🙏','💪','👀','🫡','🫶','💀','😈','👻',
  '🐶','🐱','🐼','🐸','🦊','🐯','🦁','🐮','🐷','🐧',
  '🍎','🍕','🍔','🍜','🍣','🍰','🎂','☕','🧋','🍺',
]

interface Props {
  onSelect: (emoji: string) => void
}

export default function EmojiPicker({ onSelect }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(10, 1fr)',
      gap: '4px',
      padding: '12px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      width: '320px',
    }}>
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            lineHeight: 1,
          }}
          onMouseEnter={(ev) => (ev.currentTarget.style.background = '#f0f0f0')}
          onMouseLeave={(ev) => (ev.currentTarget.style.background = 'none')}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
