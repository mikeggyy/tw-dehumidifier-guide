<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { X, ExternalLink, Trophy } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import {
  formatPrice,
  getDiscountPercent as getDiscount,
  getValueScore as getValueScoreUtil,
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  getSavingsAmount,
} from '~/utils/product'

const props = defineProps<{
  products: Dehumidifier[]
}>()

// Mobile card swipe state
const activeCardIndex = ref(0)

// Touch/Mouse drag state
const isDragging = ref(false)
const startX = ref(0)
const currentX = ref(0)
const dragThreshold = 50 // 最小拖動距離才會切換

const handleDragStart = (e: TouchEvent | MouseEvent) => {
  isDragging.value = true
  startX.value = 'touches' in e ? e.touches[0].clientX : e.clientX
  currentX.value = startX.value
}

const handleDragMove = (e: TouchEvent | MouseEvent) => {
  if (!isDragging.value) return
  currentX.value = 'touches' in e ? e.touches[0].clientX : e.clientX
}

const handleDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false

  const diff = startX.value - currentX.value

  // 只有拖動超過門檻才切換，且每次只切換一張
  if (Math.abs(diff) > dragThreshold) {
    if (diff > 0 && activeCardIndex.value < props.products.length - 1) {
      // 向左滑 -> 下一張
      activeCardIndex.value++
    } else if (diff < 0 && activeCardIndex.value > 0) {
      // 向右滑 -> 上一張
      activeCardIndex.value--
    }
  }
}

// 卡片容器 ref
const cardContainerRef = ref<HTMLElement | null>(null)

// 計算容器寬度 (用於正確的滑動偏移)
const containerWidth = ref(0)

// 更新容器寬度
const updateContainerWidth = () => {
  if (cardContainerRef.value) {
    containerWidth.value = cardContainerRef.value.offsetWidth
  }
}

// 計算滑動偏移量 (使用像素值確保精確)
const cardTransform = computed(() => {
  if (containerWidth.value === 0) {
    // 備用：使用百分比計算
    return `translateX(-${activeCardIndex.value * 100}%)`
  }
  return `translateX(-${activeCardIndex.value * containerWidth.value}px)`
})

// 每張卡片的寬度樣式
const cardWidthStyle = computed(() => {
  if (containerWidth.value === 0) {
    return { width: '100%' }
  }
  return { width: `${containerWidth.value}px` }
})

// 監聽視窗大小變化
onMounted(() => {
  nextTick(() => {
    updateContainerWidth()
  })
  window.addEventListener('resize', updateContainerWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
})

// 監聽 products 變化，重新計算寬度
watch(() => props.products.length, () => {
  nextTick(() => {
    updateContainerWidth()
  })
})

const emit = defineEmits<{
  close: []
  remove: [id: string]
}>()

const getDiscountPercent = (product: Dehumidifier): number | null => getDiscount(product)

const getValueScoreNum = (product: Dehumidifier): number | null => {
  const capacity = product.daily_capacity ?? 0
  if (capacity === 0) return null
  return Math.round(product.price / capacity)
}

const getValueScore = (product: Dehumidifier): string => {
  const score = getValueScoreNum(product)
  if (score === null) return '-'
  return `$${formatPrice(score)} 元/1L除濕力`
}

// 找出各項目的最佳值
const bestValues = computed(() => {
  const products = props.products
  if (products.length === 0) return {}

  const prices = products.map(p => p.price)
  const capacities = products.map(p => p.daily_capacity ?? 0).filter(c => c > 0)
  const noises = products.map(p => p.noise_level ?? 99).filter(n => n < 99)
  const discounts = products.map(p => getDiscountPercent(p) ?? 0).filter(d => d > 0)
  const cpValues = products.map(p => getValueScoreNum(p)).filter(v => v !== null) as number[]

  return {
    lowestPrice: Math.min(...prices),
    highestCapacity: capacities.length > 0 ? Math.max(...capacities) : null,
    lowestNoise: noises.length > 0 ? Math.min(...noises) : null,
    highestDiscount: discounts.length > 0 ? Math.max(...discounts) : null,
    lowestCpValue: cpValues.length > 0 ? Math.min(...cpValues) : null
  }
})

// 檢查某個規格是否有任何商品有資料
const hasAnyData = (key: string): boolean => {
  return props.products.some(p => {
    switch (key) {
      case 'price': return true
      case 'original_price': return p.original_price && p.original_price > p.price
      case 'discount': return getDiscountPercent(p) !== null
      case 'daily_capacity': return p.daily_capacity !== null
      case 'value': return p.daily_capacity !== null
      case 'tank_capacity': return p.tank_capacity !== null
      case 'noise_level': return p.noise_level !== null
      case 'power_consumption': return p.power_consumption !== null
      case 'energy_efficiency': return p.energy_efficiency !== null
      default: return false
    }
  })
}

const allSpecs = [
  { key: 'price', label: '促銷價', format: (p: Dehumidifier) => `NT$ ${formatPrice(p.price)}` },
  { key: 'original_price', label: '市售價', format: (p: Dehumidifier) => p.original_price ? `NT$ ${formatPrice(p.original_price)}` : '-' },
  { key: 'discount', label: '折扣', format: (p: Dehumidifier) => { const d = getDiscountPercent(p); return d ? `-${d}%` : '-' } },
  { key: 'daily_capacity', label: '日除濕量', format: (p: Dehumidifier) => p.daily_capacity ? `${p.daily_capacity} L` : '-' },
  { key: 'value', label: 'CP值（越低越划算）', format: getValueScore },
  { key: 'tank_capacity', label: '水箱容量', format: (p: Dehumidifier) => p.tank_capacity ? `${p.tank_capacity} L` : '-' },
  { key: 'noise_level', label: '噪音值', format: (p: Dehumidifier) => p.noise_level ? `${p.noise_level} dB` : '-' },
  { key: 'power_consumption', label: '消耗功率', format: (p: Dehumidifier) => p.power_consumption ? `${p.power_consumption} W` : '-' },
  { key: 'energy_efficiency', label: '能源效率', format: (p: Dehumidifier) => {
    const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
    return p.energy_efficiency ? labels[p.energy_efficiency] : '-'
  }}
]

// 過濾掉沒有任何資料的規格
const specs = computed(() => allSpecs.filter(spec => hasAnyData(spec.key)))

const isBestValue = (product: Dehumidifier, key: string): boolean => {
  const bv = bestValues.value
  if (key === 'price') return product.price === bv.lowestPrice
  if (key === 'daily_capacity') return bv.highestCapacity !== null && (product.daily_capacity ?? 0) === bv.highestCapacity
  if (key === 'noise_level') return bv.lowestNoise !== null && (product.noise_level ?? 99) === bv.lowestNoise
  if (key === 'discount') return bv.highestDiscount !== null && getDiscountPercent(product) === bv.highestDiscount
  if (key === 'value') return bv.lowestCpValue !== null && getValueScoreNum(product) === bv.lowestCpValue
  return false
}

// Display brand - hide "Other", try to extract from name
const getDisplayBrand = (product: Dehumidifier): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="compare-modal-title"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50"
      aria-hidden="true"
      @click="emit('close')"
    />

    <!-- Modal -->
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-500">
        <h2 id="compare-modal-title" class="text-base sm:text-lg font-semibold text-white">
          商品比較 ({{ products.length }}/4)
        </h2>
        <button
          @click="emit('close')"
          class="text-white/80 hover:text-white p-1"
          aria-label="關閉比較視窗"
        >
          <X :size="24" aria-hidden="true" />
        </button>
      </div>

      <!-- Mobile: Card-based swipeable view -->
      <div class="md:hidden flex-1 overflow-hidden flex flex-col">
        <!-- Card indicators -->
        <div class="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="(product, index) in products"
            :key="product.id"
            :class="[
              'w-2.5 h-2.5 rounded-full transition-all',
              activeCardIndex === index
                ? 'bg-blue-600 w-6'
                : 'bg-gray-300 dark:bg-gray-600'
            ]"
            @click="activeCardIndex = index"
          />
        </div>

        <!-- Swipeable cards container -->
        <div
          ref="cardContainerRef"
          class="flex-1 overflow-hidden select-none"
          @touchstart="handleDragStart"
          @touchmove="handleDragMove"
          @touchend="handleDragEnd"
          @mousedown="handleDragStart"
          @mousemove="handleDragMove"
          @mouseup="handleDragEnd"
          @mouseleave="handleDragEnd"
        >
          <div
            class="flex h-full transition-transform duration-300 ease-out"
            :style="{ transform: cardTransform }"
          >
            <div
              v-for="(product, index) in products"
              :key="product.id"
              class="flex-shrink-0 overflow-y-auto p-4"
              :style="cardWidthStyle"
            >
              <!-- Product Card -->
              <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <!-- Product Header -->
                <div class="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <img
                    :src="product.image_url"
                    :alt="product.name"
                    class="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                  <div class="flex-1 min-w-0">
                    <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {{ getDisplayBrand(product) }}
                    </p>
                    <p class="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                      {{ product.name }}
                    </p>
                    <button
                      class="mt-2 text-xs text-red-500 hover:text-red-600"
                      @click="emit('remove', product.id)"
                    >
                      移除比較
                    </button>
                  </div>
                </div>

                <!-- Specs List -->
                <div class="space-y-3">
                  <div
                    v-for="spec in specs"
                    :key="spec.key"
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ spec.label }}</span>
                    <span
                      :class="[
                        'text-sm font-medium flex items-center gap-1',
                        isBestValue(product, spec.key)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      ]"
                    >
                      <Trophy v-if="isBestValue(product, spec.key)" :size="14" class="text-yellow-500" />
                      {{ spec.format(product) }}
                    </span>
                  </div>
                </div>

                <!-- CTA Button -->
                <a
                  :href="getTrackedAffiliateUrl(product.affiliate_url, 'comparison', product.id)"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  :class="[
                    'mt-4 flex items-center justify-center gap-2 w-full py-3 text-white font-medium rounded-lg transition-colors',
                    getOptimizedCtaText(getDiscount(product), getSavingsAmount(product)).urgent
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  ]"
                >
                  {{ getOptimizedCtaText(getDiscount(product), getSavingsAmount(product)).text }}
                  <ExternalLink :size="16" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Swipe hint -->
        <div class="py-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <span class="flex items-center justify-center gap-2">
            <Trophy :size="12" class="text-yellow-500" />
            最佳值 · 左右滑動比較商品
          </span>
        </div>
      </div>

      <!-- Desktop: Table view -->
      <div class="hidden md:flex flex-1 overflow-auto flex-col">
        <div class="flex-1 overflow-auto">
          <table class="w-full">
            <!-- Product Headers -->
            <thead class="sticky top-0 bg-white dark:bg-gray-800 z-10">
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="p-4 text-left w-32 bg-gray-50 dark:bg-gray-900">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">規格項目</span>
                </th>
                <th
                  v-for="product in products"
                  :key="product.id"
                  class="p-4 text-center min-w-[180px]"
                >
                  <div class="relative">
                    <button
                      class="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      @click="emit('remove', product.id)"
                    >
                      <X :size="16" />
                    </button>
                    <img
                      :src="product.image_url"
                      :alt="product.name"
                      class="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                      loading="lazy"
                      decoding="async"
                    />
                    <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ getDisplayBrand(product) }}</p>
                    <p class="font-medium text-gray-900 dark:text-white text-xs line-clamp-2 leading-tight" :title="product.name">
                      {{ product.name }}
                    </p>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Specs Rows -->
            <tbody>
              <tr
                v-for="spec in specs"
                :key="spec.key"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                  {{ spec.label }}
                </td>
                <td
                  v-for="product in products"
                  :key="product.id"
                  class="p-4 text-center"
                >
                  <span
                    :class="[
                      'inline-flex items-center gap-1',
                      isBestValue(product, spec.key)
                        ? 'text-green-600 dark:text-green-400 font-semibold'
                        : 'text-gray-900 dark:text-white'
                    ]"
                  >
                    <Trophy v-if="isBestValue(product, spec.key)" :size="14" class="text-yellow-500" />
                    {{ spec.format(product) }}
                  </span>
                </td>
              </tr>
            </tbody>

            <!-- CTA Row -->
            <tfoot class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <tr>
                <td class="p-4 bg-gray-50 dark:bg-gray-900"></td>
                <td
                  v-for="product in products"
                  :key="product.id"
                  class="p-4 text-center"
                >
                  <a
                    :href="getTrackedAffiliateUrl(product.affiliate_url, 'comparison', product.id)"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    :class="[
                      'inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors',
                      getOptimizedCtaText(getDiscount(product), getSavingsAmount(product)).urgent
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                    ]"
                  >
                    {{ getOptimizedCtaText(getDiscount(product), getSavingsAmount(product)).text }}
                    <ExternalLink :size="14" />
                  </a>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Legend -->
        <div class="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1">
              <Trophy :size="12" class="text-yellow-500" />
              表示該項目為最佳值
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

