<script setup lang="ts">
import { computed } from 'vue'
import { History, X, ChevronRight } from 'lucide-vue-next'
import { useRecentlyViewed } from '~/composables/useRecentlyViewed'
import { formatPrice } from '~/utils/product'

const props = withDefaults(defineProps<{
  excludeId?: string
  limit?: number
}>(), {
  limit: 5
})

const { recentlyViewed, remove, clear } = useRecentlyViewed()

const displayItems = computed(() => {
  return recentlyViewed.value
    .filter(p => p.id !== props.excludeId)
    .slice(0, props.limit)
})
</script>

<template>
  <div v-if="displayItems.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <History :size="20" class="text-blue-500" />
        最近瀏覽
      </h3>
      <button
        class="text-xs text-gray-400 hover:text-red-500 transition-colors"
        @click="clear"
      >
        清除全部
      </button>
    </div>

    <div class="space-y-3">
      <NuxtLink
        v-for="product in displayItems"
        :key="product.id"
        :to="`/${product.category_slug}/${product.slug}`"
        class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
      >
        <img
          :src="product.image_url"
          :alt="product.name"
          class="w-14 h-14 object-cover rounded-lg bg-gray-100"
          loading="lazy"
          decoding="async"
        />
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.brand }}</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
            {{ product.name }}
          </p>
          <p class="text-sm font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</p>
        </div>
        <ChevronRight :size="16" class="text-gray-300 group-hover:text-blue-500 transition-colors" />
      </NuxtLink>
    </div>
  </div>
</template>
