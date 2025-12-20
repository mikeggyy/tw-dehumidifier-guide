import { onMounted, onUnmounted } from 'vue'

const STORAGE_KEY = 'scroll-positions'
const MAX_STORED = 20

interface ScrollPosition {
  path: string
  position: number
  timestamp: number
}

export const useScrollPosition = () => {
  const getStoredPositions = (): ScrollPosition[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const savePosition = (path: string) => {
    if (typeof window === 'undefined') return

    const positions = getStoredPositions()
    const existingIndex = positions.findIndex(p => p.path === path)

    const newPosition: ScrollPosition = {
      path,
      position: window.scrollY,
      timestamp: Date.now()
    }

    if (existingIndex >= 0) {
      positions[existingIndex] = newPosition
    } else {
      positions.unshift(newPosition)
    }

    // Keep only recent positions
    const trimmed = positions.slice(0, MAX_STORED)

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // Storage full, clear and try again
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const restorePosition = (path: string): boolean => {
    if (typeof window === 'undefined') return false

    const positions = getStoredPositions()
    const stored = positions.find(p => p.path === path)

    if (stored && Date.now() - stored.timestamp < 30 * 60 * 1000) { // 30 minutes
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: stored.position,
          behavior: 'instant'
        })
      })
      return true
    }

    return false
  }

  const clearPosition = (path: string) => {
    if (typeof window === 'undefined') return

    const positions = getStoredPositions().filter(p => p.path !== path)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  }

  return {
    savePosition,
    restorePosition,
    clearPosition,
  }
}

// Auto-save scroll position when leaving page
export const useAutoSaveScroll = (path?: string) => {
  let currentPath = path

  const { savePosition } = useScrollPosition()

  const handleBeforeUnload = () => {
    if (currentPath) {
      savePosition(currentPath)
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      currentPath = path || window.location.pathname
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
  })

  onUnmounted(() => {
    if (currentPath) {
      savePosition(currentPath)
    }
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  return { savePosition }
}
