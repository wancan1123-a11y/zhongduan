import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { MusicTrack } from '../types'

export default function MusicWidget({ tracks }: { tracks: MusicTrack[] }) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const track = tracks[idx] || { title: '暂无音乐', artist: '添加音乐URL', url: '' }

  useEffect(() => {
    if (!audioRef.current || !track.url) return
    audioRef.current.src = track.url
    if (playing) audioRef.current.play().catch(() => setPlaying(false))
  }, [idx, track.url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
    const ended = () => { setIdx(i => (i + 1) % tracks.length); setPlaying(true) }
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('ended', ended)
    return () => { audio.removeEventListener('timeupdate', update); audio.removeEventListener('ended', ended) }
  }, [tracks.length])

  const toggle = () => {
    if (!track.url) return
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().catch(() => {}); setPlaying(true) }
  }

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
        <button className="mc-btn" onClick={() => setIdx(i => (i - 1 + tracks.length) % tracks.length)}>
          <SkipBack size={14} />
        </button>
        <button className="mc-btn play" onClick={toggle}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="mc-btn" onClick={() => setIdx(i => (i + 1) % tracks.length)}>
          <SkipForward size={14} />
        </button>
      </div>
    </div>
  )
}
