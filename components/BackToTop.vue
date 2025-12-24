<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronUp } from 'lucide-vue-next'
import { useRoute } from '#imports'
import { useCookieConsent } from '~/composables/useCookieConsent'

const route = useRoute()
const isVisible = ref(false)
const isScrolling = ref(false)

const { showBanner: showCookieBanner } = useCookieConsent()

// 首頁和分類頁面有自己的返回頂部按鈕，這裡不顯示
const hasOwnBackToTop = computed(() => {
  return route.path === '/' || route.path.match(/^\/(dehumidifier|air-purifier|air-conditioner|heater|fan)\/?$/)
})

// 動態計算位置 class
const positionClass = computed(() => {
  if (showCookieBanner.value) {
    return 'bottom-[80px] right-6'
  }
  return 'bottom-6 right-6'
})

const handleScroll = () => {
  isVisible.value = window.scrollY > 400
}

const scrollToTop = () => {
  isScrolling.value = true
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
  // 動畫結束後重置狀態
  setTimeout(() => {
    isScrolling.value = false
  }, 500)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="back-to-top">
      <button
        v-if="isVisible && !hasOwnBackToTop"
        class="fixed z-40 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        :class="[positionClass, { 'animate-bounce-up': isScrolling }]"
        aria-label="返回頂部"
        @click="scrollToTop"
      >
        <ChevronUp
          :size="24"
          class="text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
        />
      </button>
    </Transition>
  </Teleport>
</template>

<style scoped>
.back-to-top-enter-active {
  animation: slide-up 0.3s ease-out;
}

.back-to-top-leave-active {
  animation: slide-down 0.2s ease-in forwards;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

.animate-bounce-up {
  animation: bounce-up 0.5s ease-out;
}

@keyframes bounce-up {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
