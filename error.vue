<script setup lang="ts">
import { Home, ArrowLeft, Search, RefreshCw } from 'lucide-vue-next'
import { useRouter } from '#imports'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const router = useRouter()

const errorMessages: Record<number, { title: string; description: string; emoji: string }> = {
  404: {
    title: '找不到頁面',
    description: '您要找的頁面可能已被移除、名稱已變更，或暫時無法使用。',
    emoji: '🔍'
  },
  500: {
    title: '伺服器錯誤',
    description: '抱歉，伺服器發生了一些問題。請稍後再試。',
    emoji: '⚠️'
  },
  403: {
    title: '沒有權限',
    description: '您沒有權限存取此頁面。',
    emoji: '🔒'
  }
}

const errorInfo = errorMessages[props.error.statusCode] || {
  title: '發生錯誤',
  description: props.error.message || '抱歉，發生了未知錯誤。',
  emoji: '😕'
}

const handleClearError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="fixed inset-0 w-screen min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 overflow-auto">
    <div class="max-w-md w-full text-center mx-auto">
      <!-- Error Animation -->
      <div class="mb-8">
        <div class="relative inline-block">
          <span class="text-8xl animate-bounce">{{ errorInfo.emoji }}</span>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/10 dark:bg-white/10 rounded-full blur-sm animate-pulse" />
        </div>
      </div>

      <!-- Error Code -->
      <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-2">
        {{ error.statusCode }}
      </h1>

      <!-- Error Title -->
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {{ errorInfo.title }}
      </h2>

      <!-- Error Description -->
      <p class="text-gray-600 dark:text-gray-300 mb-8">
        {{ errorInfo.description }}
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
          @click="handleClearError"
        >
          <Home :size="20" />
          回到首頁
        </button>

        <button
          class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
          @click="router.back()"
        >
          <ArrowLeft :size="20" />
          返回上頁
        </button>
      </div>

      <!-- Search Suggestion -->
      <div class="mt-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">或許您可以試試：</p>
        <div class="flex flex-wrap justify-center gap-2">
          <NuxtLink
            to="/dehumidifier"
            class="flex items-center gap-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            除濕機
          </NuxtLink>
          <NuxtLink
            to="/air-purifier"
            class="flex items-center gap-1 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            空氣清淨機
          </NuxtLink>
        </div>
      </div>

      <!-- Fun Animation -->
      <div class="mt-8 text-gray-400 dark:text-gray-500 text-sm">
        <RefreshCw :size="16" class="inline-block animate-spin mr-2" />
        別擔心，我們正在努力解決問題
      </div>
    </div>
  </div>
</template>
