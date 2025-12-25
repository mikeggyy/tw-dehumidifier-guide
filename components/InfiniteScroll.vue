<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  hasMore: boolean
  remainingCount?: number
  /** 載入完成後的防抖延遲（毫秒），設為 0 可由父組件控制 */
  debounceMs?: number
}>(), {
  debounceMs: 300
})

const emit = defineEmits<{
  loadMore: []
}>()

const sentinel = ref<HTMLElement | null>(null)
const isLoading = ref(false)
let observer: IntersectionObserver | null = null

// 暴露方法讓父組件通知載入完成
const setLoaded = () => {
  isLoading.value = false
}

const handleIntersection = (entries: IntersectionObserverEntry[]) => {
  const entry = entries[0]
  if (entry.isIntersecting && props.hasMore && !isLoading.value) {
    isLoading.value = true
    emit('loadMore')
    // 可設定的防抖延遲，設為 0 時由父組件控制
    if (props.debounceMs > 0) {
      setTimeout(() => {
        isLoading.value = false
      }, props.debounceMs)
    }
  }
}

defineExpose({ setLoaded })

onMounted(() => {
  if (sentinel.value) {
    observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '200px', // 提前 200px 觸發載入
      threshold: 0,
    })
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// 當 hasMore 改變時重新觀察
watch(() => props.hasMore, () => {
  if (observer && sentinel.value && props.hasMore) {
    observer.observe(sentinel.value)
  }
})
</script>

<template>
  <div ref="sentinel" class="w-full py-8">
    <div v-if="hasMore" class="flex flex-col items-center gap-2">
      <div class="flex items-center gap-2 text-gray-500 dark:text-gray-300">
        <Loader2 :size="20" class="animate-spin" />
        <span class="text-sm">載入更多...</span>
      </div>
      <span v-if="remainingCount" class="text-xs text-gray-400 dark:text-gray-400">
        剩餘 {{ remainingCount }} 項
      </span>
    </div>
    <div v-else class="text-center text-sm text-gray-400 dark:text-gray-400">
      已顯示全部商品
    </div>
  </div>
</template>
