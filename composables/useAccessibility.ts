import { ref, onMounted, onUnmounted } from 'vue'

// Announce messages to screen readers
const announcements = ref<string[]>([])

export const useAccessibility = () => {
  // Announce a message to screen readers
  // priority 參數保留供未來 ARIA live region 使用
  const announce = (message: string, _priority: 'polite' | 'assertive' = 'polite') => {
    announcements.value.push(message)

    // Clean up after announcement (短時間 timeout 不需要追蹤清理)
    setTimeout(() => {
      const idx = announcements.value.indexOf(message)
      if (idx > -1) {
        announcements.value.splice(idx, 1)
      }
    }, 1000)
  }

  // Focus management
  const focusFirst = (container: HTMLElement) => {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus()
    }
  }

  const trapFocus = (container: HTMLElement) => {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    // 如果沒有可聚焦元素，直接返回空清理函數
    if (focusable.length === 0) {
      return () => {}
    }

    const first = focusable[0] as HTMLElement
    const last = focusable[focusable.length - 1] as HTMLElement

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeydown)
    return () => container.removeEventListener('keydown', handleKeydown)
  }

  return {
    announcements,
    announce,
    focusFirst,
    trapFocus,
  }
}

// Skip link component helper
export const useSkipLink = () => {
  const skipToMain = () => {
    const main = document.querySelector('main') || document.querySelector('[role="main"]')
    if (main) {
      (main as HTMLElement).tabIndex = -1
      main.focus()
      main.scrollIntoView()
    }
  }

  return { skipToMain }
}

// Reduced motion preference
export const useReducedMotion = () => {
  const prefersReducedMotion = ref(false)
  let mediaQuery: MediaQueryList | null = null
  let handler: ((e: MediaQueryListEvent) => void) | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return

    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches

    handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.value = e.matches
    }

    mediaQuery.addEventListener('change', handler)
  })

  onUnmounted(() => {
    if (mediaQuery && handler) {
      mediaQuery.removeEventListener('change', handler)
    }
  })

  return { prefersReducedMotion }
}

// High contrast preference
export const useHighContrast = () => {
  const prefersHighContrast = ref(false)
  let mediaQuery: MediaQueryList | null = null
  let handler: ((e: MediaQueryListEvent) => void) | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return

    mediaQuery = window.matchMedia('(prefers-contrast: more)')
    prefersHighContrast.value = mediaQuery.matches

    handler = (e: MediaQueryListEvent) => {
      prefersHighContrast.value = e.matches
    }

    mediaQuery.addEventListener('change', handler)
  })

  onUnmounted(() => {
    if (mediaQuery && handler) {
      mediaQuery.removeEventListener('change', handler)
    }
  })

  return { prefersHighContrast }
}
