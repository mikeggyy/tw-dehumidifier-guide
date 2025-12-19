<script setup lang="ts">
import { Home } from 'lucide-vue-next'
import { clearError } from '#imports'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage: string
  }
}>()

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-300 mb-4">{{ error.statusCode }}</h1>
      <p class="text-xl text-gray-600 mb-8">
        {{ error.statusCode === 404 ? '找不到此頁面' : error.statusMessage }}
      </p>
      <button
        @click="handleError"
        class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Home :size="20" />
        返回首頁
      </button>
    </div>
  </div>
</template>
