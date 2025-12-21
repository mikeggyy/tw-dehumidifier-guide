<script setup lang="ts">
import { Clock, ArrowRight } from 'lucide-vue-next'
import type { Guide } from '~/composables/useGuideConfig'

defineProps<{
  guide: Guide
}>()

const getCategoryIcon = (slug: string): string => {
  const icons: Record<string, string> = {
    'dehumidifier': '💧',
    'air-purifier': '🌬️',
    'air-conditioner': '❄️',
    'heater': '🔥',
    'fan': '🌀'
  }
  return icons[slug] || '📖'
}

const getCategoryName = (slug: string): string => {
  const names: Record<string, string> = {
    'dehumidifier': '除濕機',
    'air-purifier': '空氣清淨機',
    'air-conditioner': '冷氣',
    'heater': '電暖器',
    'fan': '電風扇'
  }
  return names[slug] || '家電'
}
</script>

<template>
  <NuxtLink
    :to="`/guide/${guide.slug}`"
    class="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all"
  >
    <!-- Category Badge -->
    <div class="px-4 pt-4">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
        <span>{{ getCategoryIcon(guide.categorySlug) }}</span>
        {{ getCategoryName(guide.categorySlug) }}
      </span>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
        {{ guide.title }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {{ guide.seoDescription }}
      </p>

      <!-- Meta -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock :size="14" />
          <span>{{ guide.readingTime }} 分鐘閱讀</span>
        </div>
        <ArrowRight
          :size="18"
          class="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
        />
      </div>
    </div>
  </NuxtLink>
</template>
