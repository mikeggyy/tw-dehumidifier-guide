<script setup lang="ts">
import { ArrowRight, MapPin } from 'lucide-vue-next'
import type { BrandInfo } from '~/composables/useBrandConfig'

defineProps<{
  brand: BrandInfo
  productCount?: number
}>()
</script>

<template>
  <NuxtLink
    :to="`/brand/${brand.slug}`"
    class="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all"
  >
    <div class="p-5">
      <!-- Brand Name -->
      <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
        {{ brand.name }}
      </h3>

      <!-- Country -->
      <div v-if="brand.country" class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
        <MapPin :size="14" />
        <span>{{ brand.country }}</span>
      </div>

      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {{ brand.description }}
      </p>

      <!-- Features -->
      <div v-if="brand.features && brand.features.length > 0" class="flex flex-wrap gap-1.5 mb-4">
        <span
          v-for="feature in brand.features.slice(0, 3)"
          :key="feature"
          class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-full"
        >
          {{ feature }}
        </span>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between">
        <span v-if="productCount" class="text-sm text-gray-500 dark:text-gray-400">
          {{ productCount }} 款商品
        </span>
        <ArrowRight
          :size="18"
          class="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
        />
      </div>
    </div>
  </NuxtLink>
</template>
