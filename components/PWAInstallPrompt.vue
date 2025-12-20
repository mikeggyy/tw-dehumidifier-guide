<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download, X, Smartphone } from 'lucide-vue-next'
import { usePWA } from '~/composables/usePWA'

const { isInstallable, isInstalled, promptInstall } = usePWA()

const showBanner = ref(false)
const dismissed = ref(false)
const isMobile = ref(false)

const handleInstall = async () => {
  const installed = await promptInstall()
  if (installed) {
    showBanner.value = false
  }
}

const dismiss = () => {
  dismissed.value = true
  showBanner.value = false
  // Remember dismissal for 7 days
  localStorage.setItem('pwa-install-dismissed', String(Date.now()))
}

onMounted(() => {
  // Only show on mobile devices (screen width <= 768px)
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
  if (!isMobile.value) return

  // Check if user dismissed recently
  const dismissedAt = localStorage.getItem('pwa-install-dismissed')
  if (dismissedAt) {
    const daysSinceDismissed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
    if (daysSinceDismissed < 7) {
      dismissed.value = true
      return
    }
  }

  // Show banner after a delay if installable
  setTimeout(() => {
    if (isInstallable.value && !isInstalled.value && !dismissed.value) {
      showBanner.value = true
    }
  }, 5000)
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner && !dismissed"
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-4 z-50"
    >
      <button
        class="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        @click="dismiss"
      >
        <X :size="18" />
      </button>

      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Smartphone :size="24" />
        </div>

        <div class="flex-1 pr-4">
          <h3 class="font-bold mb-1">安裝比比看</h3>
          <p class="text-sm text-blue-100 mb-3">
            安裝到手機桌面，隨時查看家電比較！
          </p>

          <div class="flex items-center gap-2">
            <button
              class="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              @click="handleInstall"
            >
              <Download :size="16" />
              安裝
            </button>
            <button
              class="px-4 py-2 text-sm text-blue-100 hover:text-white transition-colors"
              @click="dismiss"
            >
              稍後再說
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
