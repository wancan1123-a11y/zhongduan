export interface LocationInfo {
  lat: number
  lon: number
  city: string
  region: string
  country: string
  weather?: string
  updatedAt: Date
}

export async function requestLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 10000 }
    )
  })
}

// 用坐标反查城市（免费 API，无需 key）
export async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; region: string; country: string }> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`)
  const data = await res.json()
  const addr = data.address || {}
  const city = addr.city || addr.county || addr.town || addr.village || '未知城市'
  const region = addr.state || addr.province || ''
  const country = addr.country || ''
  return { city, region, country }
}

// 用坐标获取天气（Open-Meteo，完全免费无需 key）
export async function getWeather(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
  )
  const data = await res.json()
  const temp = Math.round(data.current?.temperature_2m ?? 0)
  const code = data.current?.weather_code ?? 0
  const desc = weatherDesc(code)
  return `${desc} ${temp}°C`
}

function weatherDesc(code: number): string {
  if (code === 0) return '☀️ 晴天'
  if (code <= 3) return '⛅ 多云'
  if (code <= 9) return '🌫️ 有雾'
  if (code <= 19) return '🌦️ 小雨'
  if (code <= 29) return '🌨️ 小雪'
  if (code <= 39) return '🌫️ 扬沙'
  if (code <= 49) return '🌫️ 大雾'
  if (code <= 59) return '🌧️ 毛毛雨'
  if (code <= 69) return '🌧️ 雨'
  if (code <= 79) return '❄️ 雪'
  if (code <= 84) return '🌦️ 阵雨'
  if (code <= 94) return '⛈️ 雷雨'
  return '⛈️ 雷暴'
}

export async function getFullLocation(): Promise<LocationInfo | null> {
  const coords = await requestLocation()
  if (!coords) return null
  try {
    const [geo, weather] = await Promise.all([
      reverseGeocode(coords.lat, coords.lon),
      getWeather(coords.lat, coords.lon),
    ])
    return { ...coords, ...geo, weather, updatedAt: new Date() }
  } catch {
    return { ...coords, city: '未知', region: '', country: '', updatedAt: new Date() }
  }
}
