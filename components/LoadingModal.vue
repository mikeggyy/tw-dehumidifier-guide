<script setup lang="ts">
// Loading modal shown while async components are loading
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl">
      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-700 dark:text-gray-200 font-medium">載入中...</p>
    </div>
  </div>
</template>
