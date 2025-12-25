<script setup lang="ts">
import { Sun, Moon, Book, Building2 } from 'lucide-vue-next'
import { useDarkMode } from '~/composables/useDarkMode'

const { isDark, toggle: toggleDarkMode } = useDarkMode()
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/favicon.svg" alt="比比看" class="w-8 h-8" />
          <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">比比看</span>
        </NuxtLink>

        <div class="flex items-center gap-1">
          <!-- Navigation Links -->
          <nav class="hidden sm:flex items-center gap-1 mr-2">
            <NuxtLink
              to="/guide"
              class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Book :size="16" />
              選購指南
            </NuxtLink>
            <NuxtLink
              to="/brand"
              class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Building2 :size="16" />
              品牌
            </NuxtLink>
          </nav>

          <!-- Dark Mode Toggle -->
          <button
            class="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="toggleDarkMode"
            :title="isDark ? '切換淺色模式' : '切換深色模式'"
            aria-label="切換日夜間模式"
          >
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>
          <!-- Slot for page-specific actions -->
          <slot />
        </div>
      </div>
    </div>
  </header>
</template>
