import { APP_VERSION } from '../config/appVersion'

const CHECK_INTERVAL_MS = 60_000
const RELOAD_KEY_PREFIX = 'giproy_release_reload:'

export const checkForNewRelease = async () => {
  try {
    const response = await fetch(`/version.json?check=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return false

    const manifest = await response.json()
    const availableVersion = String(manifest?.version || '').trim()
    if (!availableVersion || availableVersion === APP_VERSION) return false

    const reloadKey = `${RELOAD_KEY_PREFIX}${availableVersion}`
    if (sessionStorage.getItem(reloadKey) === '1') return false
    sessionStorage.setItem(reloadKey, '1')

    const target = new URL(window.location.href)
    target.searchParams.set('release', availableVersion)
    window.location.replace(target.toString())
    return true
  } catch {
    return false
  }
}

export const startReleaseVersionMonitor = () => {
  void checkForNewRelease()
  const intervalId = window.setInterval(() => void checkForNewRelease(), CHECK_INTERVAL_MS)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') void checkForNewRelease()
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    window.clearInterval(intervalId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
