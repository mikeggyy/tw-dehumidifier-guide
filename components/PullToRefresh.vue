<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const emit = defineEmits<{
  refresh: []
}>()

const pullDistance = ref(0)
const isRefreshing = ref(false)
const isPulling = ref(false)
const THRESHOLD = 80

let startY = 0
let currentY = 0

const handleTouchStart = (e: TouchEvent) => {
  if (window.scrollY === 0) {
    startY = e.touches[0].clientY
    isPulling.value = true
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isPulling.value || isRefreshing.value) return
  if (window.scrollY > 0) {
    isPulling.value = false
    pullDistance.value = 0
    return
  }

  currentY = e.touches[0].clientY
  const diff = currentY - startY

  if (diff > 0) {
    // Apply resistance
    pullDistance.value = Math.min(diff * 0.5, THRESHOLD * 1.5)
    if (diff > 10) {
      e.preventDefault()
    }
  }
}

const handleTouchEnd = async () => {
  if (!isPulling.value) return

  if (pullDistance.value >= THRESHOLD && !isRefreshing.value) {
    isRefreshing.value = true
    pullDistance.value = THRESHOLD

    emit('refresh')

    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    isRefreshing.value = false
  }

  pullDistance.value = 0
  isPulling.value = false
}

onMounted(() => {
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div
    class="fixed top-0 left-0 right-0 z-50 flex justify-center transition-transform duration-200 pointer-events-none"
    :style="{ transform: `translateY(${pullDistance - 60}px)` }"
  >
    <div
      class="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg"
      :class="{ 'animate-pulse': isRefreshing }"
    >
      <RefreshCw
        :size="24"
        class="text-blue-600 transition-transform duration-200"
        :class="{
          'animate-spin': isRefreshing,
        }"
        :style="{
          transform: isRefreshing ? '' : `rotate(${pullDistance * 3}deg)`,
          opacity: Math.min(pullDistance / THRESHOLD, 1)
        }"
      />
    </div>
  </div>

  <!-- Pull hint text -->
  <Transition name="fade">
    <div
      v-if="pullDistance > 20 && !isRefreshing"
      class="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <span class="text-xs text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow">
        {{ pullDistance >= THRESHOLD ? '放開以刷新' : '下拉刷新' }}
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
