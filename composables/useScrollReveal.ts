import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export const useScrollReveal = (
  elementRef: Ref<HTMLElement | null>,
  options: ScrollRevealOptions = {}
) => {
  const { threshold = 0.1, rootMargin = '0px', once = true } = options
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            if (once && observer) {
              observer.unobserve(entry.target)
            }
          } else if (!once) {
            isVisible.value = false
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return { isVisible }
}

// Directive for scroll reveal
export const vScrollReveal = {
  mounted(el: HTMLElement, binding: { value?: ScrollRevealOptions }) {
    const options = binding.value || {}
    const { threshold = 0.1, rootMargin = '0px 0px -50px 0px' } = options

    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
            observer.unobserve(el)
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
  }
}
