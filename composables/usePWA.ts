import { ref, onMounted } from 'vue'

export function usePWA() {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isOnline = ref(true)
  let deferredPrompt: any = null

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('SW registered:', registration.scope)
      } catch (error) {
        console.error('SW registration failed:', error)
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
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      isInstallable.value = true
    })

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt = null
    })

    // Track online/offline status
    isOnline.value = navigator.onLine

    window.addEventListener('online', () => {
      isOnline.value = true
    })

    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  })

  return {
    isInstallable,
    isInstalled,
    isOnline,
    promptInstall,
    registerServiceWorker,
  }
}
