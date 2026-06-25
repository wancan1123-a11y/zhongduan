const PUSH_SERVER = import.meta.env.VITE_OMBRE_URL?.replace(':8000', ':8001') || 'http://115.29.222.195:8001'
const SUB_KEY = 'push_subscription'

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch { return null }
}

export async function requestPushPermission(): Promise<PushSubscription | null> {
  const reg = await registerSW()
  if (!reg) return null
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return null

  try {
    // 从服务器获取 VAPID 公钥
    const keyRes = await fetch(`${PUSH_SERVER}/vapid-key`)
    const { publicKey } = await keyRes.json()

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })

    // 发送订阅到服务器
    await fetch(`${PUSH_SERVER}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })

    localStorage.setItem(SUB_KEY, JSON.stringify(sub))
    return sub
  } catch { return null }
}

export function isPushEnabled(): boolean {
  return !!localStorage.getItem(SUB_KEY) && Notification.permission === 'granted'
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}
