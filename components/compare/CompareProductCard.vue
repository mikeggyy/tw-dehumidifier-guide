<script setup lang="ts">
import { computed } from 'vue'
import { X, ExternalLink, Trophy } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { formatPrice, getTrackedAffiliateUrl, getOptimizedCtaText, getDiscountPercent, getSavingsAmount } from '~/utils/product'
import { useProductImage } from '~/composables/useProductImage'

const props = defineProps<{
  product: Dehumidifier
  rank?: number
  isWinner?: boolean
  categorySlug?: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

// Discount & CTA
const discountPercent = computed(() => getDiscountPercent(props.product))
const savingsAmount = computed(() => getSavingsAmount(props.product))
const ctaInfo = computed(() => getOptimizedCtaText(discountPercent.value, savingsAmount.value))

// Tracked affiliate URL
const trackedAffiliateUrl = computed(() =>
  getTrackedAffiliateUrl(props.product.affiliate_url, 'comparison', props.product.id)
)

// 使用 useProductImage 處理圖片載入和 fallback
const { imageError, handleImageError, fallbackImage } = useProductImage(props.product.brand)
</script>

<template>
  <div
    :class="[
      'relative bg-white dark:bg-gray-700 rounded-xl p-4 transition-all',
      isWinner ? 'ring-2 ring-yellow-400 shadow-lg' : 'border border-gray-200 dark:border-gray-600'
    ]"
    role="article"
    :aria-label="`${product.brand} ${product.name}`"
  >
    <!-- Winner Badge -->
    <div
      v-if="isWinner"
      class="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md"
      role="status"
      aria-label="推薦選擇"
    >
      <Trophy :size="12" aria-hidden="true" />
      推薦
    </div>

    <!-- Remove Button -->
    <button
      class="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
      aria-label="從比較清單中移除此商品"
      @click="emit('remove', product.id)"
    >
      <X :size="16" aria-hidden="true" />
    </button>

    <!-- Product Image -->
    <div class="aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-600 mb-3">
      <img
        :src="imageError ? fallbackImage : product.image_url"
        :alt="`${product.brand} ${product.name} 商品圖片`"
        class="w-full h-full object-cover"
        loading="lazy"
        @error="handleImageError"
      />
    </div>

    <!-- Product Info -->
    <div class="space-y-2">
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.brand }}</p>
      <h3 class="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 min-h-[40px]">
        {{ product.name }}
      </h3>

      <!-- Price -->
      <div class="space-y-1">
        <div v-if="product.original_price && product.original_price > product.price" class="flex items-center gap-2">
          <span class="text-xs text-gray-400 line-through">NT$ {{ formatPrice(product.original_price) }}</span>
          <span v-if="discountPercent" class="text-xs font-bold text-red-500">-{{ discountPercent }}%</span>
        </div>
        <p class="text-lg font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</p>
      </div>

      <!-- CTA Button -->
      <a
        :href="trackedAffiliateUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        :class="[
          'block w-full text-center py-2 px-3 text-sm font-medium rounded-lg transition-all',
          ctaInfo.urgent
            ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
        ]"
        :aria-label="`前往購買 ${product.name}`"
      >
        <span class="flex items-center justify-center gap-1">
          {{ ctaInfo.text }}
          <ExternalLink :size="14" aria-hidden="true" />
        </span>
      </a>
    </div>
  </div>
</template>
