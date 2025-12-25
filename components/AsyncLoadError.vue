<script setup lang="ts">
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

const handleRetry = () => {
  window.location.reload()
}
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <div class="w-12 h-12 mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
      <AlertTriangle class="w-6 h-6 text-amber-500" />
    </div>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      組件載入失敗，請重新整理頁面
    </p>
    <button
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
      @click="handleRetry"
    >
      <RefreshCw :size="16" />
      重新整理
    </button>
  </div>
</template>
