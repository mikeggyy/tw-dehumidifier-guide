<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { Check, GitCompare, Heart, Eye } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { useProducts } from '~/composables/useProducts'
import ProductQuickPreview from '~/components/ProductQuickPreview.vue'
import {
  formatPrice,
  getDiscountPercent,
  getSavingsAmount,
  getDisplayBrand,
  getEnergyLabel,
  getEnergyColor,
  getValueScore,
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  formatRelativeTime,
} from '~/utils/product'

const props = withDefaults(defineProps<{
  product: Dehumidifier
  showCompare?: boolean
  isInCompare?: boolean
  isFavorite?: boolean
  searchQuery?: string
  categorySlug?: string
}>(), {
  showCompare: false,
  isInCompare: false,
  isFavorite: false,
  searchQuery: '',
  categorySlug: 'dehumidifier'
})

// Quick preview hover state
const showPreview = ref(false)
const previewTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Image fallback
const imageError = ref(false)
const handleImageError = () => {
  imageError.value = true
}
const fallbackImage = computed(() => {
  // 使用品牌名稱生成 placeholder
  const brandName = props.product.brand || 'Product'
  return `https://placehold.co/300x300/e2e8f0/64748b?text=${encodeURIComponent(brandName)}`
})

const handleMouseEnter = () => {
  previewTimer.value = setTimeout(() => {
    showPreview.value = true
  }, 500) // Show after 500ms hover
}

const handleMouseLeave = () => {
  if (previewTimer.value) {
    clearTimeout(previewTimer.value)
    previewTimer.value = null
  }
  showPreview.value = false
}

// Cleanup timer on unmount
onUnmounted(() => {
  if (previewTimer.value) {
    clearTimeout(previewTimer.value)
  }
})

const emit = defineEmits<{
  toggleCompare: []
  toggleFavorite: []
}>()

const { getProductSlug } = useProducts()

const slug = computed(() => getProductSlug(props.product))

// 產品連結（支援品類路由）
const productUrl = computed(() => `/${props.categorySlug}/${slug.value}`)

// 使用集中的 utility 函數
const energyLabel = computed(() => getEnergyLabel(props.product.energy_efficiency))
const energyColor = computed(() => getEnergyColor(props.product.energy_efficiency))
const discountPercent = computed(() => getDiscountPercent(props.product))
const savingsAmount = computed(() => getSavingsAmount(props.product))

// CTA text based on discount (optimized for conversion)
const ctaInfo = computed(() => getOptimizedCtaText(discountPercent.value, savingsAmount.value))

// Tracked affiliate URL with UTM parameters
const trackedAffiliateUrl = computed(() =>
  getTrackedAffiliateUrl(props.product.affiliate_url, 'product_card', props.product.id)
)

// Price update time
const priceUpdateTime = computed(() => {
  const product = props.product as any
  return formatRelativeTime(product.updated_at)
})

// Value score for badge
const valueScore = computed(() => getValueScore(props.product.price, props.product.daily_capacity))

// Display brand - hide "Other", try to extract from name
const displayBrand = computed(() => getDisplayBrand(props.product))

// Search highlighting
const highlightText = (text: string): string => {
  if (!props.searchQuery || props.searchQuery.length < 2) return text
  const query = props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900 px-0.5 rounded">$1</mark>')
}

const highlightedName = computed(() => highlightText(props.product.name))
const highlightedBrand = computed(() => highlightText(displayBrand.value))
</script>

<template>
  <div
    :class="[
      'bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-200 dark:hover:border-blue-400 group/card relative',
      isInCompare ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Quick Preview Tooltip -->
    <Transition name="preview">
      <div
        v-if="showPreview"
        class="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-30"
      >
        <ProductQuickPreview :product="product" :category-slug="categorySlug" />
        <div class="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
      </div>
    </Transition>

    <!-- Image with explicit dimensions for CLS prevention -->
    <NuxtLink :to="productUrl" class="block overflow-hidden">
      <div class="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          :src="imageError ? fallbackImage : product.image_url"
          :alt="`${product.brand} ${product.model} - ${product.name}`"
          width="300"
          height="300"
          class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
          loading="lazy"
          decoding="async"
          @error="handleImageError"
        />
        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
        <!-- Energy Badge -->
        <span
          v-if="product.energy_efficiency"
          :class="[energyColor, 'absolute top-3 left-3 text-white text-xs font-medium px-2 py-1 rounded-full']"
        >
          {{ energyLabel }}
        </span>
        <!-- Discount Badge -->
        <span
          v-if="discountPercent"
          class="absolute top-3 right-12 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
        >
          -{{ discountPercent }}%
        </span>
        <!-- Favorite Button -->
        <button
          class="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition-all duration-200"
          :class="isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'"
          @click.prevent="emit('toggleFavorite')"
        >
          <Heart :size="18" :fill="isFavorite ? 'currentColor' : 'none'" />
        </button>
        <!-- Compare Badge (when selected) -->
        <div
          v-if="isInCompare"
          class="absolute bottom-3 left-3 right-3 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center justify-center gap-1"
        >
          <Check :size="14" />
          已加入比較
        </div>
      </div>
    </NuxtLink>

    <!-- Content -->
    <div class="p-4">
      <!-- Brand & Name -->
      <NuxtLink :to="productUrl" class="block group">
        <p v-if="displayBrand" class="text-sm text-gray-500 dark:text-gray-400 mb-1" v-html="highlightedBrand" />
        <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[48px]" v-html="highlightedName" />
      </NuxtLink>

      <!-- Price -->
      <div class="mt-2 mb-3">
        <div v-if="product.original_price && product.original_price > product.price" class="mb-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">市售價 </span>
          <span class="text-sm text-gray-400 dark:text-gray-500 line-through">NT$ {{ formatPrice(product.original_price) }}</span>
        </div>
        <div class="flex items-baseline gap-2">
          <div>
            <span class="text-xs text-gray-500 dark:text-gray-400">促銷價 </span>
            <span class="text-2xl font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</span>
          </div>
        </div>
        <!-- Price update time -->
        <p v-if="priceUpdateTime" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ priceUpdateTime }}
        </p>
      </div>

      <!-- CTA Button -->
      <a
        :href="trackedAffiliateUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        :class="[
          'mt-3 block w-full text-center py-3 px-4 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow',
          ctaInfo.urgent
            ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white animate-pulse-subtle'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
        ]"
        @click.stop
      >
        {{ ctaInfo.text }}
      </a>

      <!-- Compare Button -->
      <button
        v-if="showCompare"
        :class="[
          'mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-lg border-2 transition-all duration-200',
          isInCompare
            ? 'border-blue-500 bg-blue-50 text-blue-600'
            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
        ]"
        @click="emit('toggleCompare')"
      >
        <GitCompare :size="16" />
        {{ isInCompare ? '取消比較' : '加入比較' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Subtle pulse animation for urgent CTA */
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.02);
  }
}

.preview-enter-active {
  animation: preview-in 0.2s ease-out;
}

.preview-leave-active {
  animation: preview-out 0.15s ease-in forwards;
}

@keyframes preview-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(calc(-100% + 10px)) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(-100%) scale(1);
  }
}

@keyframes preview-out {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(-100%) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(calc(-100% + 10px)) scale(0.95);
  }
}
</style>
