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

    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) {
      isDark.value = stored === 'true'
    } else {
      // Check system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // Apply to document
    updateDOM()

    // Listen for system preference changes
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryHandler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('dark-mode') === null) {
        isDark.value = e.matches
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

  return {
    isDark,
    toggle,
    setDark,
    init,
  }
}
