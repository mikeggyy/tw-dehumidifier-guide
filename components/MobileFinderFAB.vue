<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Sparkles, X } from 'lucide-vue-next'

const props = defineProps<{
  categoryName?: string
  hasCompareBar?: boolean
  hasCookieBanner?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const isVisible = ref(false)
const isExpanded = ref(false)
const hasInteracted = ref(false)

// 滾動超過 300px 後顯示 FAB
const handleScroll = () => {
  isVisible.value = window.scrollY > 300
}

// 記住用戶已互動過
const handleClick = () => {
  hasInteracted.value = true
  isExpanded.value = false
  emit('click')
}

// 關閉展開提示
const dismissExpanded = () => {
  isExpanded.value = false
  hasInteracted.value = true
  // 記錄到 localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('fab-interacted', 'true')
  }
}

// 計算底部位置
const bottomPosition = computed(() => {
  let base = 24 // 預設 bottom-6
  if (props.hasCompareBar) base += 80 // 比較欄高度
  if (props.hasCookieBanner) base += 60 // Cookie 橫幅高度
  return `${base}px`
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 初始檢查

  // 檢查是否已互動過
  if (typeof window !== 'undefined') {
    hasInteracted.value = localStorage.getItem('fab-interacted') === 'true'
  }

  // 3 秒後展開提示（如果尚未互動）
  if (!hasInteracted.value) {
    setTimeout(() => {
      if (!hasInteracted.value && isVisible.value) {
        isExpanded.value = true
      }
    }, 3000)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fab">
      <div
        v-if="isVisible"
        class="fixed left-4 z-40 md:hidden"
        :style="{ bottom: bottomPosition }"
      >
        <!-- 展開提示 -->
        <Transition name="tooltip">
          <div
            v-if="isExpanded && !hasInteracted"
            class="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2"
          >
            <span>不知道怎麼選？試試這個</span>
            <button
              class="p-0.5 hover:bg-white/20 rounded"
              @click.stop="dismissExpanded"
            >
              <X :size="14" />
            </button>
            <!-- 箭頭 -->
            <div class="absolute top-full left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
          </div>
        </Transition>

        <!-- FAB 按鈕 -->
        <button
          class="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
          :class="{ 'animate-bounce-gentle': isExpanded && !hasInteracted }"
          @click="handleClick"
        >
          <Sparkles :size="20" class="animate-sparkle" />
          <span>幫我選</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fab-enter-active {
  animation: fab-in 0.3s ease-out;
}

.fab-leave-active {
  animation: fab-out 0.2s ease-in forwards;
}

@keyframes fab-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fab-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
}

.tooltip-enter-active {
  animation: tooltip-in 0.2s ease-out;
}

.tooltip-leave-active {
  animation: tooltip-out 0.15s ease-in forwards;
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tooltip-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(5px);
  }
}

.animate-bounce-gentle {
  animation: bounce-gentle 2s ease-in-out infinite;
}

@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-sparkle {
  animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
