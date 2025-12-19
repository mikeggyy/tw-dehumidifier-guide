import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface SwipeOptions {
  threshold?: number  // Minimum distance to trigger swipe (px)
  timeout?: number    // Maximum time for swipe gesture (ms)
}

export const useSwipe = (
  elementRef: Ref<HTMLElement | null>,
  options: SwipeOptions = {}
) => {
  const { threshold = 50, timeout = 300 } = options

  const direction = ref<'left' | 'right' | 'up' | 'down' | null>(null)
  const isSwiping = ref(false)

  let startX = 0
  let startY = 0
  let startTime = 0

  const onTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    startTime = Date.now()
    isSwiping.value = true
    direction.value = null
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!isSwiping.value) return

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const elapsedTime = Date.now() - startTime

    if (elapsedTime > timeout) {
      isSwiping.value = false
      return
    }

    const diffX = endX - startX
    const diffY = endY - startY

    // Determine if horizontal or vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) >= threshold) {
        direction.value = diffX > 0 ? 'right' : 'left'
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) >= threshold) {
        direction.value = diffY > 0 ? 'down' : 'up'
      }
    }

    isSwiping.value = false
  }

  const onTouchCancel = () => {
    isSwiping.value = false
    direction.value = null
  }

  onMounted(() => {
    const element = elementRef.value
    if (!element) return

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchend', onTouchEnd, { passive: true })
    element.addEventListener('touchcancel', onTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    const element = elementRef.value
    if (!element) return

    element.removeEventListener('touchstart', onTouchStart)
    element.removeEventListener('touchend', onTouchEnd)
    element.removeEventListener('touchcancel', onTouchCancel)
  })

  return {
    direction,
    isSwiping,
  }
}
