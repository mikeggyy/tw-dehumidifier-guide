<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { AlertTriangle, RefreshCw, Home } from 'lucide-vue-next'
import { logger } from '~/utils/logger'

const props = withDefaults(defineProps<{
  /** 是否顯示詳細錯誤訊息（僅開發環境） */
  showDetails?: boolean
  /** 自訂錯誤標題 */
  title?: string
  /** 自訂錯誤描述 */
  description?: string
}>(), {
  showDetails: false,
  title: '發生錯誤',
  description: '抱歉，頁面發生了一些問題。',
})

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

// 是否為開發環境
const isDev = computed(() => process.env.NODE_ENV === 'development')

// 捕獲子組件錯誤
onErrorCaptured((err: Error, instance, info) => {
  error.value = err
  errorInfo.value = info
  logger.error('[ErrorBoundary] 捕獲到錯誤:', err)
  logger.error('[ErrorBoundary] 錯誤資訊:', info)
  // 返回 false 阻止錯誤繼續向上傳播
  return false
})

// 重試 - 重新載入頁面
const handleRetry = () => {
  error.value = null
  errorInfo.value = ''
  window.location.reload()
}

// 返回首頁
const handleGoHome = () => {
  window.location.href = '/'
}

// 清除錯誤狀態（不重新載入）
const clearError = () => {
  error.value = null
  errorInfo.value = ''
}
</script>

<template>
  <div v-if="error" class="min-h-[400px] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
      <!-- 錯誤圖示 -->
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertTriangle class="w-8 h-8 text-red-500" />
      </div>

      <!-- 錯誤標題 -->
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ title }}
      </h2>

      <!-- 錯誤描述 -->
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ description }}
      </p>

      <!-- 開發環境顯示詳細錯誤 -->
      <div
        v-if="isDev && showDetails"
        class="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left overflow-auto max-h-48"
      >
        <p class="text-sm font-mono text-red-600 dark:text-red-400 break-all">
          {{ error.message }}
        </p>
        <p v-if="errorInfo" class="text-xs font-mono text-gray-500 mt-2">
          來源: {{ errorInfo }}
        </p>
        <pre v-if="error.stack" class="text-xs font-mono text-gray-400 mt-2 whitespace-pre-wrap">{{ error.stack }}</pre>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          @click="handleRetry"
        >
          <RefreshCw :size="16" />
          重新載入
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          @click="handleGoHome"
        >
          <Home :size="16" />
          返回首頁
        </button>
      </div>
    </div>
  </div>

  <!-- 正常渲染子組件 -->
  <slot v-else />
</template>
