<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUp, Filter, GitCompare, Heart, Home } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  showFilter?: boolean
  showCompare?: boolean
  compareCount?: number
  favoriteCount?: number
}>(), {
  showFilter: true,
  showCompare: true,
  compareCount: 0,
  favoriteCount: 0,
})

const emit = defineEmits<{
  openFilter: []
  openCompare: []
  openFavorites: []
}>()

const showNav = ref(false)
const lastScrollY = ref(0)

const handleScroll = () => {
  const currentScrollY = window.scrollY
  // Show nav when scrolled down more than 200px
  showNav.value = currentScrollY > 200
  lastScrollY.value = currentScrollY
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="showNav"
      class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 md:hidden safe-area-bottom"
    >
      <div class="flex items-center justify-around py-2 px-4">
        <!-- Home -->
        <NuxtLink
          to="/"
          class="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Home :size="22" />
          <span class="text-xs">首頁</span>
        </NuxtLink>

        <!-- Filter -->
        <button
          v-if="showFilter"
          class="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
          @click="emit('openFilter')"
        >
          <Filter :size="22" />
          <span class="text-xs">篩選</span>
        </button>

        <!-- Scroll to top -->
        <button
          class="flex items-center justify-center w-12 h-12 -mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
          @click="scrollToTop"
        >
          <ArrowUp :size="24" />
        </button>

        <!-- Compare -->
        <button
          v-if="showCompare"
          class="relative flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
          @click="emit('openCompare')"
        >
          <GitCompare :size="22" />
          <span class="text-xs">比較</span>
          <span
            v-if="compareCount > 0"
            class="absolute -top-1 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {{ compareCount }}
          </span>
        </button>

        <!-- Favorites -->
        <button
          class="relative flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
          @click="emit('openFavorites')"
        >
          <Heart :size="22" />
          <span class="text-xs">收藏</span>
          <span
            v-if="favoriteCount > 0"
            class="absolute -top-1 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {{ favoriteCount }}
          </span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.slide-up-enter-active {
  animation: slide-up-in 0.3s ease-out;
}

.slide-up-leave-active {
  animation: slide-up-out 0.2s ease-in forwards;
}

@keyframes slide-up-in {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>
