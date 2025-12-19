<script setup lang="ts">
import ToastContainer from '~/components/ToastContainer.vue'
import { useDarkMode } from '~/composables/useDarkMode'

// Initialize dark mode
useDarkMode()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <NuxtPage />
    <ToastContainer />
  </div>
</template>

<style>
/* Dark mode base styles */
.dark {
  color-scheme: dark;
}

.dark body {
  background-color: #111827;
  color: #f9fafb;
}

/* Smooth transitions for dark mode */
* {
  transition-property: background-color, border-color;
  transition-duration: 200ms;
}
</style>
