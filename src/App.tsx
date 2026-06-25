import { useState } from 'react'
import { useStore } from './store/useStore'
import HomeScreen from './screens/HomeScreen'
import ClockScreen from './screens/ClockScreen'
import ChatScreen from './screens/ChatScreen'
import DiaryScreen from './screens/DiaryScreen'
import MomentsScreen from './screens/MomentsScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'
import type { Screen } from './types'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const store = useStore()

  const go = (s: Screen) => setScreen(s)

  return (
    <div className="app">
      <div className="screen-wrap">
        {screen === 'home' && <HomeScreen store={store} onNavigate={go} />}
        {screen === 'clock' && <ClockScreen onBack={() => go('home')} />}
        {screen === 'chat' && <ChatScreen store={store} onBack={() => go('home')} />}
        {screen === 'diary' && <DiaryScreen store={store} onBack={() => go('home')} />}
        {screen === 'moments' && <MomentsScreen store={store} onBack={() => go('home')} />}
        {screen === 'settings' && <SettingsScreen store={store} onBack={() => go('home')} />}
      </div>
      {screen === 'home' && <BottomNav onNavigate={go} />}
    </div>
  )
}
