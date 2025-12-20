<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WifiOff, Wifi } from 'lucide-vue-next'

const isOnline = ref(true)
const showReconnected = ref(false)

const updateOnlineStatus = () => {
  const wasOffline = !isOnline.value
  isOnline.value = navigator.onLine

  // Show reconnected message briefly
  if (wasOffline && isOnline.value) {
    showReconnected.value = true
    setTimeout(() => {
      showReconnected.value = false
    }, 3000)
  }
}

onMounted(() => {
  isOnline.value = navigator.onLine
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <!-- Offline indicator -->
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 py-2 px-4 z-[100] flex items-center justify-center gap-2 text-sm font-medium"
    >
      <WifiOff :size="16" />
      <span>目前離線中，部分功能可能無法使用</span>
    </div>
  </Transition>

  <!-- Reconnected message -->
  <Transition name="slide-down">
    <div
      v-if="showReconnected && isOnline"
      class="fixed top-0 left-0 right-0 bg-green-500 text-white py-2 px-4 z-[100] flex items-center justify-center gap-2 text-sm font-medium"
    >
      <Wifi :size="16" />
      <span>已重新連線</span>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
