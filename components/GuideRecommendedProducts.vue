<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, ArrowRight } from 'lucide-vue-next'
import { useProducts } from '~/composables/useProducts'
import { formatPrice } from '~/utils/product'

const props = defineProps<{
  categorySlug: string
  limit?: number
}>()

const { allProducts, getProductSlug } = useProducts()

// 取得該品類的熱門商品（依價格排序，取中間價位的商品）
const recommendedProducts = computed(() => {
  const categoryProducts = allProducts.value
    .filter(p => (p as any).category_slug === props.categorySlug)
    .sort((a, b) => a.price - b.price)

  if (categoryProducts.length === 0) return []

  // 取中間價位的商品（避免只推薦最便宜或最貴的）
  const midIndex = Math.floor(categoryProducts.length / 3)
  const selected = categoryProducts.slice(midIndex, midIndex + (props.limit || 4))

  return selected
})

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
  <div v-if="recommendedProducts.length > 0" class="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Sparkles :size="20" class="text-yellow-500" />
        熱門{{ getCategoryName(categorySlug) }}推薦
      </h3>
      <NuxtLink
        :to="`/${categorySlug}`"
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        查看全部
        <ArrowRight :size="14" />
      </NuxtLink>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <NuxtLink
        v-for="product in recommendedProducts"
        :key="product.id"
        :to="`/${categorySlug}/${getProductSlug(product)}`"
        class="group"
      >
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden transition-all hover:shadow-md">
          <div class="aspect-square relative overflow-hidden">
            <img
              :src="product.image_url"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              width="200"
              height="200"
            />
          </div>
          <div class="p-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ product.brand }}</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[40px]">
              {{ product.name }}
            </p>
            <p class="text-sm font-bold text-blue-600 dark:text-blue-400 mt-2">
              NT$ {{ formatPrice(product.price) }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
