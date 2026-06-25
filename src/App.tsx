import { useState } from 'react'
import { useStore } from './store/useStore'
import HomeScreen from './screens/HomeScreen'
import ClockScreen from './screens/ClockScreen'
import ChatScreen from './screens/ChatScreen'
import DiaryScreen from './screens/DiaryScreen'
import MomentsScreen from './screens/MomentsScreen'
import SettingsScreen from './screens/SettingsScreen'
import MemoryScreen from './screens/MemoryScreen'
import ProfileScreen from './screens/ProfileScreen'
import CustomInstructionScreen from './screens/CustomInstructionScreen'
import BottomNav from './components/BottomNav'
import type { Screen } from './types'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const store = useStore()
  const conv = store.currentConversation

  const go = (s: Screen) => setScreen(s)

  return (
    <div className="app">
      <div className="screen-wrap">
        {screen === 'home' && <HomeScreen store={store} onNavigate={go} />}
        {screen === 'clock' && <ClockScreen onBack={() => go('home')} />}
        {screen === 'chat' && <ChatScreen store={store} onBack={() => go('home')} onViewProfile={() => go('ai-profile')} onCustomInstruction={() => go('custom-instruction')} />}
        {screen === 'diary' && <DiaryScreen store={store} onBack={() => go('home')} />}
        {screen === 'moments' && <MomentsScreen store={store} onBack={() => go('home')} />}
        {screen === 'settings' && <SettingsScreen store={store} onBack={() => go('home')} />}
        {screen === 'memory' && <MemoryScreen store={store} onBack={() => go('home')} />}
        {screen === 'custom-instruction' && (
          <CustomInstructionScreen
            instruction={store.customInstruction}
            useReasoner={store.useReasoner}
            onUpdate={store.updateCustomInstruction}
            onSetReasoner={store.setUseReasoner}
            onBack={() => go('chat')}
          />
        )}
        {screen === 'profile' && (
          <ProfileScreen
            userProfile={store.userProfile}
            onUpdateProfile={store.updateUserProfile}
            onBack={() => go('home')}
            onViewMoments={() => go('moments')}
            onViewDiary={() => go('diary')}
          />
        )}
        {screen === 'ai-profile' && (
          <ProfileScreen
            isAi
            aiName={conv?.aiName}
            aiAvatar={conv?.aiAvatar}
            userProfile={store.userProfile}
            onUpdateProfile={store.updateUserProfile}
            onBack={() => go('chat')}
            onViewMoments={() => go('moments')}
            onViewDiary={() => go('diary')}
            memories={store.memories}
          />
        )}
      </div>
      {screen === 'home' && <BottomNav onNavigate={go} />}
    </div>
  )
}
