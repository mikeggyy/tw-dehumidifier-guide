<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, GitCompare, Heart, Eye } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { useProducts } from '~/composables/useProducts'
import ProductQuickPreview from '~/components/ProductQuickPreview.vue'

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

const emit = defineEmits<{
  toggleCompare: []
  toggleFavorite: []
}>()

const { getProductSlug } = useProducts()

const slug = computed(() => getProductSlug(props.product))

// 產品連結（支援品類路由）
const productUrl = computed(() => `/${props.categorySlug}/${slug.value}`)

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

const energyLabel = computed(() => {
  const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
  const efficiency = props.product.energy_efficiency
  if (efficiency === null || efficiency === undefined) return ''
  return labels[efficiency] || ''
})

const energyColor = computed(() => {
  const colors: Record<number, string> = {
    1: 'bg-green-500',
    2: 'bg-lime-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500'
  }
  const efficiency = props.product.energy_efficiency
  if (efficiency === null || efficiency === undefined) return 'bg-gray-500'
  return colors[efficiency] || 'bg-gray-500'
})

const discountPercent = computed(() => {
  const original = props.product.original_price
  const current = props.product.price
  if (!original || original <= current) return null
  const discount = Math.round((1 - current / original) * 100)
  return discount >= 5 ? discount : null
})

// Calculate savings amount
const savingsAmount = computed(() => {
  const original = props.product.original_price
  if (!original || original <= props.product.price) return null
  return original - props.product.price
})

// CTA text based on discount
const ctaText = computed(() => {
  if (savingsAmount.value && savingsAmount.value >= 500) {
    return `現省 $${formatPrice(savingsAmount.value)}`
  }
  return '查看優惠價'
})

// Value score for badge
const valueScore = computed(() => {
  const capacity = props.product.daily_capacity ?? 0
  if (capacity === 0) return Infinity
  return props.product.price / capacity
})

// Display brand - hide "Other", try to extract from name
const displayBrand = computed(() => {
  const brand = props.product.brand
  if (brand && brand !== 'Other') return brand
  // Try to extract from 【】in product name
  const match = props.product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
})

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
      'bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-200 group/card relative',
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

    <!-- Image -->
    <NuxtLink :to="productUrl" class="block overflow-hidden">
      <div class="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          :src="imageError ? fallbackImage : product.image_url"
          :alt="`${product.brand} ${product.model}`"
          class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
          loading="lazy"
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
        <p v-if="displayBrand" class="text-sm text-gray-500 mb-1" v-html="highlightedBrand" />
        <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[48px]" v-html="highlightedName" />
      </NuxtLink>

      <!-- Price -->
      <div class="mt-2 mb-3">
        <div v-if="product.original_price && product.original_price > product.price" class="mb-1">
          <span class="text-xs text-gray-500">市售價 </span>
          <span class="text-sm text-gray-400 line-through">NT$ {{ formatPrice(product.original_price) }}</span>
        </div>
        <div>
          <span class="text-xs text-gray-500">促銷價 </span>
          <span class="text-2xl font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</span>
        </div>
      </div>

      <!-- CTA Button -->
      <a
        :href="product.affiliate_url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        :class="[
          'mt-3 block w-full text-center py-3 px-4 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow',
          savingsAmount && savingsAmount >= 500
            ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
        ]"
        @click.stop
      >
        {{ ctaText }}
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
