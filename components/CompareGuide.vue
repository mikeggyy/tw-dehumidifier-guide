<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { GitCompare, X } from 'lucide-vue-next'

const props = defineProps<{
  hasCompareItems: boolean
  productCount: number
}>()

const showGuide = ref(false)
const hasSeenGuide = ref(false)

// 檢查是否看過引導
const checkGuideStatus = () => {
  if (typeof window !== 'undefined') {
    hasSeenGuide.value = localStorage.getItem('compare-guide-seen') === 'true'
  }
}

// 標記已看過引導
const dismissGuide = () => {
  showGuide.value = false
  hasSeenGuide.value = true
  if (typeof window !== 'undefined') {
    localStorage.setItem('compare-guide-seen', 'true')
  }
}

// 當用戶瀏覽超過 5 個商品但未使用比較功能時顯示引導
const viewedProducts = ref(0)

onMounted(() => {
  checkGuideStatus()
})

// 監聽商品數量變化
watch(() => props.productCount, (count) => {
  if (count > 0 && !hasSeenGuide.value && !props.hasCompareItems) {
    viewedProducts.value++
    // 看過 5 個商品後顯示引導
    if (viewedProducts.value >= 3 && !showGuide.value) {
      setTimeout(() => {
        if (!hasSeenGuide.value && !props.hasCompareItems) {
          showGuide.value = true
        }
      }, 2000)
    }
  }
}, { immediate: true })

// 當用戶添加比較項目時自動關閉引導
watch(() => props.hasCompareItems, (has) => {
  if (has) {
    dismissGuide()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="guide">
      <div
        v-if="showGuide"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[calc(100%-2rem)] mx-4"
      >
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-4 relative overflow-hidden">
          <!-- 背景裝飾 -->
          <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div class="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div class="relative flex items-start gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GitCompare :size="22" class="animate-pulse" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-sm mb-1">不知道選哪個？</p>
              <p class="text-xs text-blue-100">
                點擊商品卡片的「加入比較」，最多選 4 款一起比較規格！
              </p>
            </div>
            <button
              class="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
              @click="dismissGuide"
              aria-label="關閉提示"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- 箭頭指向下方的比較按鈕 -->
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-blue-600 to-indigo-600 rotate-45" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.guide-enter-active {
  animation: guide-in 0.4s ease-out;
}

.guide-leave-active {
  animation: guide-out 0.3s ease-in forwards;
}

@keyframes guide-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes guide-out {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.9);
  }
}
</style>
