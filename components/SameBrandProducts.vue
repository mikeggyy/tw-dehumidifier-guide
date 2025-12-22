<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Building2 } from 'lucide-vue-next'
import { useProducts } from '~/composables/useProducts'
import { formatPrice, getDisplayBrand } from '~/utils/product'

const props = defineProps<{
  currentProduct: any
  categorySlug: string
  limit?: number
}>()

const { allProducts, getProductSlug } = useProducts()

// 取得同品牌的其他商品
const sameBrandProducts = computed(() => {
  if (!props.currentProduct) return []

  const currentBrand = props.currentProduct.brand

  return allProducts.value
    .filter(p => {
      // Same category
      if ((p as any).category_slug !== props.categorySlug) return false
      // Same brand
      if (p.brand !== currentBrand) return false
      // Not the same product
      if (p.id === props.currentProduct.id) return false
      return true
    })
    .sort((a, b) => {
      // Sort by price
      return a.price - b.price
    })
    .slice(0, props.limit || 4)
})

const displayBrand = computed(() => getDisplayBrand(props.currentProduct))
</script>

<template>
  <div v-if="sameBrandProducts.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <Building2 :size="20" class="text-indigo-500" />
      {{ displayBrand }} 其他商品
    </h3>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <NuxtLink
        v-for="product in sameBrandProducts"
        :key="product.id"
        :to="`/${categorySlug}/${getProductSlug(product)}`"
        class="group"
      >
        <div class="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
          <div class="aspect-square relative overflow-hidden">
            <img
              :src="product.image_url"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div class="p-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ product.model }}</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[40px]">
              {{ product.name }}
            </p>
            <p class="text-sm font-bold text-blue-600 mt-2">
              NT$ {{ formatPrice(product.price) }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <NuxtLink
      :to="`/${categorySlug}?brands=${encodeURIComponent(currentProduct.brand)}`"
      class="mt-4 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
    >
      查看 {{ displayBrand }} 全部商品
      <ChevronRight :size="16" />
    </NuxtLink>
  </div>
</template>
