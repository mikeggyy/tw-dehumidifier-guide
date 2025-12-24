<script setup lang="ts">
import { SearchX, RotateCcw, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  type?: 'no-results' | 'no-favorites' | 'empty'
  searchQuery?: string
  filterCount?: number
}>()

const emit = defineEmits<{
  reset: []
  clearSearch: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
      <SearchX v-if="type === 'no-results'" :size="40" class="text-gray-400" />
      <Sparkles v-else :size="40" class="text-gray-400" />
    </div>

    <!-- Message -->
    <div v-if="type === 'no-results'">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        找不到符合條件的商品
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        <template v-if="searchQuery">
          找不到「{{ searchQuery }}」相關商品
        </template>
        <template v-else-if="filterCount && filterCount > 0">
          目前的篩選條件沒有符合的商品，試試放寬條件吧
        </template>
        <template v-else>
          沒有找到相關商品，試試其他關鍵字
        </template>
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button
          v-if="searchQuery"
          class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          @click="emit('clearSearch')"
        >
          <RotateCcw :size="18" />
          清除搜尋
        </button>
        <button
          v-if="filterCount && filterCount > 0"
          class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors"
          @click="emit('reset')"
        >
          <RotateCcw :size="18" />
          重設篩選條件
        </button>
      </div>
    </div>

    <!-- Empty favorites -->
    <div v-else-if="type === 'no-favorites'">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        還沒有收藏商品
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-md">
        點擊商品卡片右上角的愛心圖示即可收藏
      </p>
    </div>

    <!-- Generic empty -->
    <div v-else>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        暫無商品
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        請稍後再試
      </p>
    </div>
  </div>
</template>
