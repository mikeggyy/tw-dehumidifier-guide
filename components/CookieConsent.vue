<script setup lang="ts">
import { useCookieConsent } from '~/composables/useCookieConsent'
import { Cookie, Shield } from 'lucide-vue-next'

const { showBanner, acceptAll, declineOptional } = useCookieConsent()
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner"
      class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <Cookie :size="24" class="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              我們使用 Cookie 來改善您的瀏覽體驗並分析網站流量。繼續使用本網站即表示您同意我們使用 Cookie。
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <button
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            @click="declineOptional"
          >
            僅必要
          </button>
          <button
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            @click="acceptAll"
          >
            全部接受
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
