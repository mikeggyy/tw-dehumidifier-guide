import { ref, onMounted, onUnmounted } from 'vue'
import { pwaLogger as logger } from '~/utils/logger'

export function usePWA() {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isOnline = ref(true)
  let deferredPrompt: any = null

  // Store event handlers for cleanup
  let beforeInstallHandler: ((e: Event) => void) | null = null
  let appInstalledHandler: (() => void) | null = null
  let onlineHandler: (() => void) | null = null
  let offlineHandler: (() => void) | null = null

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        logger.log('SW registered:', registration.scope)
      } catch (error) {
        logger.error('SW registration failed:', error)
      }
    }
  }

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      isInstalled.value = true
    }

    deferredPrompt = null
    isInstallable.value = false

    return outcome === 'accepted'
  }

  const checkInstalled = () => {
    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return true
    }

    // Check iOS standalone mode
    if ((navigator as any).standalone === true) {
      isInstalled.value = true
      return true
    }

    return false
  }

  onMounted(() => {
    // Register service worker
    registerServiceWorker()

    // Check if already installed
    checkInstalled()

    // Listen for install prompt
    beforeInstallHandler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      isInstallable.value = true
    }
    window.addEventListener('beforeinstallprompt', beforeInstallHandler)

    // Listen for app installed
    appInstalledHandler = () => {
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt = null
    }
    window.addEventListener('appinstalled', appInstalledHandler)

    // Track online/offline status
    isOnline.value = navigator.onLine

    onlineHandler = () => {
      isOnline.value = true
    }
    window.addEventListener('online', onlineHandler)

    offlineHandler = () => {
      isOnline.value = false
    }
    window.addEventListener('offline', offlineHandler)
  })

  onUnmounted(() => {
    if (beforeInstallHandler) {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler)
    }
    if (appInstalledHandler) {
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler)
    }
    if (offlineHandler) {
      window.removeEventListener('offline', offlineHandler)
    }
  })

  return {
    isInstallable,
    isInstalled,
    isOnline,
    promptInstall,
    registerServiceWorker,
  }
}
