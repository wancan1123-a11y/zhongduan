import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, ExternalLink } from 'lucide-react'
import type { MusicTrack } from '../types'

const NETEASE_URL = 'https://music.163.com'

export default function MusicWidget({ tracks }: { tracks: MusicTrack[] }) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const track = tracks[idx] || { title: '点击跳转网易云', artist: '添加音乐', url: '' }

  useEffect(() => {
    if (!audioRef.current || !track.url) return
    audioRef.current.src = track.url
    if (playing) audioRef.current.play().catch(() => setPlaying(false))
  }, [idx, track.url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
    const ended = () => { setIdx(i => (i + 1) % Math.max(tracks.length, 1)); setPlaying(true) }
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('ended', ended)
    return () => { audio.removeEventListener('timeupdate', update); audio.removeEventListener('ended', ended) }
  }, [tracks.length])

  const toggle = () => {
    if (!track.url) { window.open(NETEASE_URL, '_blank'); return }
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().catch(() => {}); setPlaying(true) }
  }

  const prev = () => setIdx(i => (i - 1 + Math.max(tracks.length, 1)) % Math.max(tracks.length, 1))
  const next = () => setIdx(i => (i + 1) % Math.max(tracks.length, 1))

  return (
    <div className="music-widget">
      <audio ref={audioRef} />
      <div className="music-info">
        <div className="music-title">{track.title}</div>
        <div className="music-artist">{track.artist}</div>
      </div>
      <div className="music-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <div className="music-controls">
        <button className="mc-btn" onClick={prev}><SkipBack size={14} /></button>
        <button className="mc-btn play" onClick={toggle}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="mc-btn" onClick={next}><SkipForward size={14} /></button>
        <button className="mc-btn" onClick={() => window.open(NETEASE_URL, '_blank')} title="打开网易云">
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  )
}
