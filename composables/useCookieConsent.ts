import { ref, onMounted, onUnmounted } from 'vue'

export type ConsentStatus = 'pending' | 'accepted' | 'declined'

const STORAGE_KEY = 'cookie-consent'
const EXPIRY_DAYS = 365

// Global state (shared across components)
const consentStatus = ref<ConsentStatus>('pending')
const showBanner = ref(false)

export function useCookieConsent() {
  let bannerTimeoutId: ReturnType<typeof setTimeout> | null = null

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { status, timestamp } = JSON.parse(stored)
        const expiryTime = timestamp + (EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        if (Date.now() < expiryTime) {
          consentStatus.value = status
          showBanner.value = false
          return
        }
      } catch {
        // Invalid stored data, show banner
      }
    }
    // Delay showing banner to avoid affecting initial page load
    bannerTimeoutId = setTimeout(() => {
      showBanner.value = true
    }, 2000)
  })

  // 清理 timeout 防止記憶體洩漏
  onUnmounted(() => {
    if (bannerTimeoutId !== null) {
      clearTimeout(bannerTimeoutId)
      bannerTimeoutId = null
    }
  })

  const saveConsent = (status: ConsentStatus) => {
    consentStatus.value = status
    showBanner.value = false
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status,
      timestamp: Date.now()
    }))
  }

  const acceptAll = () => {
    saveConsent('accepted')
    enableAnalytics()
  }

  const declineOptional = () => {
    saveConsent('declined')
  }

  const enableAnalytics = () => {
    // Enable GA tracking if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  return {
    consentStatus,
    showBanner,
    acceptAll,
    declineOptional
  }
}
