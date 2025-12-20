<script setup lang="ts">
const skipToMain = () => {
  const main = document.querySelector('main') || document.querySelector('[role="main"]')
  if (main) {
    (main as HTMLElement).tabIndex = -1
    main.focus()
    main.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
    @click.prevent="skipToMain"
  >
    跳到主要內容
  </a>
</template>
