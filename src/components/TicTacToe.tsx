import { useState } from 'react'

const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function checkWin(b: string[], p: string) {
  return WIN.some(([a,c,d]) => b[a] === p && b[c] === p && b[d] === p)
}

function aiMove(b: string[]): number {
  // Try to win
  for (const [a,c,d] of WIN) {
    if (b[a] === 'O' && b[c] === 'O' && b[d] === '') return d
    if (b[a] === 'O' && b[d] === 'O' && b[c] === '') return c
    if (b[c] === 'O' && b[d] === 'O' && b[a] === '') return a
  }
  // Block player
  for (const [a,c,d] of WIN) {
    if (b[a] === 'X' && b[c] === 'X' && b[d] === '') return d
    if (b[a] === 'X' && b[d] === 'X' && b[c] === '') return c
    if (b[c] === 'X' && b[d] === 'X' && b[a] === '') return a
  }
  if (b[4] === '') return 4
  const empty = b.map((v, i) => v === '' ? i : -1).filter(i => i >= 0)
  return empty[Math.floor(Math.random() * empty.length)]
}

export default function TicTacToe() {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''))
  const [status, setStatus] = useState<string>('你先走（X）')
  const [over, setOver] = useState(false)

  const click = (i: number) => {
    if (board[i] || over) return
    const b = [...board]; b[i] = 'X'
    if (checkWin(b, 'X')) { setBoard(b); setStatus('🎉 你赢了！'); setOver(true); return }
    if (b.every(v => v)) { setBoard(b); setStatus('平局！'); setOver(true); return }
    const ai = aiMove(b); b[ai] = 'O'
    setBoard(b)
    if (checkWin(b, 'O')) { setStatus('😅 AI 赢了~'); setOver(true) }
    else if (b.every(v => v)) { setStatus('平局！'); setOver(true) }
    else setStatus('你的回合（X）')
  }

  const reset = () => { setBoard(Array(9).fill('')); setStatus('你先走（X）'); setOver(false) }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>{status}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 6, justifyContent: 'center' }}>
        {board.map((v, i) => (
          <button key={i} onClick={() => click(i)} style={{
            width: 64, height: 64, fontSize: 24, background: '#f5f5f5', border: '2px solid #e0e0e0',
            borderRadius: 10, cursor: v || over ? 'default' : 'pointer',
            color: v === 'X' ? '#e8956d' : '#7e8fba', fontWeight: 700,
          }}>{v}</button>
        ))}
      </div>
      {over && <button onClick={reset} style={{ marginTop: 14, padding: '8px 20px', background: '#e8956d', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 14 }}>再来一局</button>}
    </div>
  )
}
