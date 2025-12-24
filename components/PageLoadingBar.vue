<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from '#imports'

const router = useRouter()
const isLoading = ref(false)
const progress = ref(0)
let progressInterval: ReturnType<typeof setInterval> | null = null

const startLoading = () => {
  isLoading.value = true
  progress.value = 0

  // 模擬進度
  progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10
    }
  }, 100)
}

const finishLoading = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }

  progress.value = 100

  setTimeout(() => {
    isLoading.value = false
    progress.value = 0
  }, 300)
}

onMounted(() => {
  router.beforeEach(() => {
    startLoading()
  })

  router.afterEach(() => {
    finishLoading()
  })
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="loading-bar">
      <div
        v-if="isLoading"
        class="fixed top-0 left-0 right-0 z-[9999] h-1"
      >
        <div
          class="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 transition-all duration-200 ease-out"
          :style="{ width: `${progress}%` }"
        >
          <!-- 發光效果 -->
          <div class="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loading-bar-enter-active {
  transition: opacity 0.1s ease;
}

.loading-bar-leave-active {
  transition: opacity 0.3s ease;
}

.loading-bar-enter-from,
.loading-bar-leave-to {
  opacity: 0;
}
</style>
