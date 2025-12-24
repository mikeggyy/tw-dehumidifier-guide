import { ref, watch, onMounted, onUnmounted } from 'vue'

const isDark = ref(false)

export const useDarkMode = () => {
  let mediaQuery: MediaQueryList | null = null
  let mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null

  const toggle = () => {
    isDark.value = !isDark.value
  }

  const setDark = (value: boolean) => {
    isDark.value = value
  }

  // Initialize from localStorage or system preference
  const init = () => {
    if (typeof window === 'undefined') return

    // Listen for system preference changes
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) {
      // User has explicit preference
      isDark.value = stored === 'true'
    } else {
      // No stored preference: follow system preference
      isDark.value = mediaQuery.matches
    }

    // Apply to document
    updateDOM()

    // Listen for system preference changes (only apply if no explicit user preference)
    mediaQueryHandler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('dark-mode') === null) {
        isDark.value = e.matches
        updateDOM()
      }
    }
    mediaQuery.addEventListener('change', mediaQueryHandler)
  }

  const updateDOM = () => {
    if (typeof document === 'undefined') return

    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Watch for changes
  watch(isDark, (newValue) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dark-mode', String(newValue))
      updateDOM()
    }
  })

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    if (mediaQuery && mediaQueryHandler) {
      mediaQuery.removeEventListener('change', mediaQueryHandler)
    }
  })

  // Reset to system preference
  const useSystemPreference = () => {
    if (typeof window === 'undefined') return

    localStorage.removeItem('dark-mode')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = systemPrefersDark
    updateDOM()
  }

  // Check if using system preference
  const isUsingSystemPreference = () => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('dark-mode') === null
  }

  return {
    isDark,
    toggle,
    setDark,
    init,
    useSystemPreference,
    isUsingSystemPreference,
  }
}
