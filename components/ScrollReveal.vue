<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  delay?: number
  duration?: number
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  once?: boolean
  threshold?: number
}>(), {
  delay: 0,
  duration: 600,
  distance: 20,
  direction: 'up',
  once: true,
  threshold: 0.1
})

const elementRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const getTransform = () => {
  switch (props.direction) {
    case 'up': return `translateY(${props.distance}px)`
    case 'down': return `translateY(-${props.distance}px)`
    case 'left': return `translateX(${props.distance}px)`
    case 'right': return `translateX(-${props.distance}px)`
    default: return `translateY(${props.distance}px)`
  }
}

onMounted(() => {
  if (!elementRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            isVisible.value = true
          }, props.delay)
          if (props.once && observer) {
            observer.unobserve(entry.target)
          }
        } else if (!props.once) {
          isVisible.value = false
        }
      })
    },
    { threshold: props.threshold, rootMargin: '0px 0px -30px 0px' }
  )

  observer.observe(elementRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div
    ref="elementRef"
    :style="{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translate(0, 0)' : getTransform(),
      transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      transitionDelay: `${delay}ms`
    }"
  >
    <slot />
  </div>
</template>
