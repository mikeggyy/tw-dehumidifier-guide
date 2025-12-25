<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHead } from '#imports'
import { useShareableCompare } from '~/composables/useShareableCompare'
import { useProductsSSR, useProducts } from '~/composables/useProducts'
import { useCategoryConfig } from '~/composables/useCategoryConfig'
import { useCompareAnalysis, defaultWeights, type WeightConfig } from '~/composables/useCompareAnalysis'
import { Trophy, ExternalLink, ArrowLeft, Eye, EyeOff, SlidersHorizontal, Camera, Download, Sparkles, Lightbulb, ChevronDown, ChevronUp } from 'lucide-vue-next'
import ShareCompareButton from '~/components/ShareCompareButton.vue'
import DecisionHelper from '~/components/DecisionHelper.vue'
import type { ComparableProduct } from '~/types'
import { getProductSpec } from '~/types'
import {
  formatPrice,
  getDiscountPercent,
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  getSavingsAmount,
  getDisplayBrand,
} from '~/utils/product'
import { logger } from '~/utils/logger'

// SSR data loading
await useProductsSSR()

const { loadSharedCompare, categoryFromUrl } = useShareableCompare()
const { getCategoryConfig } = useCategoryConfig()

const compareProducts = ref<ComparableProduct[]>([])
const categorySlug = ref('dehumidifier')

// New feature states
const showOnlyDifferences = ref(false)
const showWeightPanel = ref(false)
const showDecisionHelper = ref(false)
const showConclusion = ref(true)
const isCapturing = ref(false)
const weights = ref<WeightConfig>({ ...defaultWeights })
const compareContentRef = ref<HTMLElement | null>(null)

onMounted(() => {
  compareProducts.value = loadSharedCompare() as ComparableProduct[]
  categorySlug.value = categoryFromUrl.value
})

// Compare Analysis
const { conclusions, specsWithDifference, rankedProducts } = useCompareAnalysis(
  () => compareProducts.value,
  () => weights.value
)

const categoryConfig = computed(() => getCategoryConfig(categorySlug.value))

// SEO - noindex for share pages
useHead({
  title: '商品比較 | 比比看家電',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: '比較您選擇的家電商品規格與價格' }
  ]
})

// Value score calculation (dynamic based on category)
const getValueScoreNum = (product: ComparableProduct): number | null => {
  const cpKey = categoryConfig.value?.cpValueSpec
  if (!cpKey) return null
  const value = getProductSpec<number>(product, cpKey)
  if (!value || value === 0) return null
  return Math.round(product.price / value)
}

const getValueScore = (product: ComparableProduct): string => {
  const config = categoryConfig.value
  const cpKey = config?.cpValueSpec
  if (!cpKey) return '-'

  const cpValue = getProductSpec<number>(product, cpKey)
  if (!cpValue || cpValue === 0) return '-'

  const score = Math.round(product.price / cpValue)
  const cpLabel = config?.specs.find(s => s.key === cpKey)?.label || cpKey
  return `$${formatPrice(score)} / ${cpLabel.replace(/值|量|力$/, '')}`
}

// Find best values (dynamic based on category config)
const bestValues = computed(() => {
  const products = compareProducts.value
  const config = categoryConfig.value
  if (products.length === 0) return {}

  const result: Record<string, number | null> = {}

  // 基本比較值
  const prices = products.map(p => p.price)
  result.lowestPrice = Math.min(...prices)

  // CP值
  const cpKey = config?.cpValueSpec
  if (cpKey) {
    const cpValues = products.map(p => {
      const value = getProductSpec<number>(p, cpKey)
      if (!value || value === 0) return null
      return Math.round(p.price / value)
    }).filter(v => v !== null) as number[]
    result.lowestCpValue = cpValues.length > 0 ? Math.min(...cpValues) : null
  }

  // 根據品類規格動態計算最佳值
  if (config) {
    for (const spec of config.specs) {
      if (!spec.showInCompare) continue

      const values = products
        .map(p => getProductSpec<number>(p, spec.key))
        .filter(v => v !== null && v !== undefined && typeof v === 'number') as number[]

      if (values.length === 0) continue

      // 根據 compareDirection 決定最佳值
      if (spec.compareDirection === 'higher') {
        result[`best_${spec.key}`] = Math.max(...values)
      } else if (spec.compareDirection === 'lower') {
        result[`best_${spec.key}`] = Math.min(...values)
      }
    }
  }

  return result
})

// Check if spec has any data (dynamic for any category)
const hasAnyData = (key: string): boolean => {
  if (key === 'price') return true
  if (key === 'original_price') {
    return compareProducts.value.some(p => p.original_price && p.original_price > p.price)
  }
  if (key === 'discount') {
    return compareProducts.value.some(p => getDiscountPercent(p) !== null)
  }
  if (key === 'value') {
    const cpKey = categoryConfig.value?.cpValueSpec
    if (!cpKey) return false
    return compareProducts.value.some(p => getProductSpec(p, cpKey) !== null)
  }
  // Check if any product has the spec key with a value
  return compareProducts.value.some(p => {
    const value = getProductSpec(p, key)
    return value !== null && value !== undefined
  })
}

// Dynamic specs based on category config
const allSpecs = computed(() => {
  const config = categoryConfig.value
  const slug = categorySlug.value

  // 基本規格 (所有品類共用)
  const baseSpecs = [
    { key: 'price', label: '促銷價', format: (p: ComparableProduct) => `NT$ ${formatPrice(p.price)}` },
  ]

  // 從品類設定取得比較規格
  const categorySpecs = config?.specs
    .filter(spec => spec.showInCompare)
    .map(spec => ({
      key: spec.key,
      label: spec.label,
      format: (p: ComparableProduct) => {
        const value = getProductSpec(p, spec.key)
        if (value === null || value === undefined) return '-'

        // 特殊格式化
        if (spec.formatValue) {
          return spec.formatValue(value)
        }

        // 布林值
        if (typeof value === 'boolean') {
          return value ? '有' : '無'
        }

        // 帶單位
        if (spec.unit) {
          return `${value} ${spec.unit}`
        }

        return String(value)
      }
    })) || []

  // CP值規格 (如果品類有定義)
  const cpValueSpecs = config?.cpValueSpec ? [{
    key: 'value',
    label: 'CP值（越低越划算）',
    format: (p: ComparableProduct) => {
      const cpKey = config.cpValueSpec!
      const cpValue = getProductSpec<number>(p, cpKey)
      if (!cpValue || cpValue === 0) return '-'
      const score = Math.round(p.price / cpValue)
      const cpLabel = config.specs.find(s => s.key === cpKey)?.label || cpKey
      return `$${formatPrice(score)} / ${cpLabel.replace(/值|量|力$/, '')}`
    }
  }] : []

  return [...baseSpecs, ...categorySpecs, ...cpValueSpecs]
})

const specs = computed(() => {
  let filtered = allSpecs.value.filter(spec => hasAnyData(spec.key))

  if (showOnlyDifferences.value) {
    const diffKeys = specsWithDifference.value
    filtered = filtered.filter(spec => diffKeys.includes(spec.key))
  }

  return filtered
})

const isBestValue = (product: ComparableProduct, key: string): boolean => {
  const bv = bestValues.value as Record<string, number | null>

  // 價格: 越低越好
  if (key === 'price') return product.price === bv.lowestPrice

  // CP值: 越低越好
  if (key === 'value') {
    const cpKey = categoryConfig.value?.cpValueSpec
    if (!cpKey) return false
    const cpValue = getProductSpec<number>(product, cpKey)
    if (!cpValue || cpValue === 0) return false
    const score = Math.round(product.price / cpValue)
    return bv.lowestCpValue !== null && score === bv.lowestCpValue
  }

  // 動態規格: 檢查 best_${key}
  const bestKey = `best_${key}`
  if (bestKey in bv) {
    const value = getProductSpec(product, key)
    return bv[bestKey] !== null && value === bv[bestKey]
  }

  return false
}

const productIds = computed(() => compareProducts.value.map(p => p.id))

// Screenshot
const captureScreenshot = async () => {
  if (!compareContentRef.value) return

  isCapturing.value = true

  try {
    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(compareContentRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    })

    const link = document.createElement('a')
    link.download = `比比看-商品比較-${new Date().toLocaleDateString('zh-TW')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    logger.error('Screenshot failed:', error)
    alert('截圖失敗，請稍後再試')
  } finally {
    isCapturing.value = false
  }
}

const resetWeights = () => {
  weights.value = { ...defaultWeights }
}

const handleRecommendation = (product: ComparableProduct) => {
  showDecisionHelper.value = false
  // Scroll to the product in the table
  const element = document.getElementById(`product-${product.id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('ring-2', 'ring-purple-500')
    setTimeout(() => {
      element.classList.remove('ring-2', 'ring-purple-500')
    }, 3000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-600 to-blue-500 text-white sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft :size="20" />
            <span class="hidden sm:inline">返回首頁</span>
          </NuxtLink>
          <h1 class="text-lg sm:text-xl font-semibold">
            商品比較
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="compareProducts.length > 0"
            @click="captureScreenshot"
            :disabled="isCapturing"
            class="hidden sm:flex items-center gap-1 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors disabled:opacity-50"
            title="下載比較圖"
          >
            <Camera :size="16" />
            <span>{{ isCapturing ? '處理中...' : '截圖' }}</span>
          </button>
          <ShareCompareButton
            v-if="compareProducts.length > 0"
            :product-ids="productIds"
            :category-slug="categorySlug"
          />
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Empty State -->
      <div
        v-if="compareProducts.length === 0"
        class="text-center py-16"
      >
        <div class="text-6xl mb-4">🔍</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          找不到比較商品
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          可能連結已過期或商品已下架
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft :size="18" />
          返回首頁選購
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <button
            @click="showOnlyDifferences = !showOnlyDifferences"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              showOnlyDifferences
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            ]"
          >
            <component :is="showOnlyDifferences ? Eye : EyeOff" :size="14" />
            {{ showOnlyDifferences ? '只看差異' : '顯示全部' }}
          </button>

          <button
            @click="showWeightPanel = !showWeightPanel"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              showWeightPanel
                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            ]"
          >
            <SlidersHorizontal :size="14" />
            權重設定
          </button>

          <button
            @click="showDecisionHelper = !showDecisionHelper"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              showDecisionHelper
                ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            ]"
          >
            <Sparkles :size="14" />
            幫我決定
          </button>

          <button
            @click="captureScreenshot"
            :disabled="isCapturing"
            class="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
          >
            <Download :size="14" />
            {{ isCapturing ? '處理中' : '下載圖片' }}
          </button>
        </div>

        <!-- Weight Panel -->
        <Transition name="slide">
          <div v-if="showWeightPanel" class="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">我最在意...</h3>
              <button
                @click="resetWeights"
                class="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                重置
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">💰 價格</label>
                <input v-model.number="weights.price" type="range" min="0" max="100" class="w-full accent-purple-500" />
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.price }}%</span>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">💧 除濕力</label>
                <input v-model.number="weights.capacity" type="range" min="0" max="100" class="w-full accent-purple-500" />
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.capacity }}%</span>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 安靜度</label>
                <input v-model.number="weights.noise" type="range" min="0" max="100" class="w-full accent-purple-500" />
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.noise }}%</span>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">⚡ 能效</label>
                <input v-model.number="weights.efficiency" type="range" min="0" max="100" class="w-full accent-purple-500" />
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.efficiency }}%</span>
              </div>
            </div>

            <div v-if="rankedProducts.length > 0" class="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">依您的偏好排序：</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(item, idx) in rankedProducts"
                  :key="item.product.id"
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                    idx === 0
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  <span v-if="idx === 0">🥇</span>
                  <span v-else-if="idx === 1">🥈</span>
                  <span v-else-if="idx === 2">🥉</span>
                  <span v-else>{{ idx + 1 }}.</span>
                  {{ item.product.brand }} {{ item.product.model }}
                  <span class="text-gray-400 dark:text-gray-500">({{ Math.round(item.score) }}分)</span>
                </span>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Decision Helper -->
        <Transition name="slide">
          <div v-if="showDecisionHelper" class="mb-4">
            <DecisionHelper
              :products="compareProducts"
              @recommend="handleRecommendation"
            />
          </div>
        </Transition>

        <!-- Conclusion Panel -->
        <div v-if="conclusions.summary && compareProducts.length >= 2" class="mb-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
          <button
            @click="showConclusion = !showConclusion"
            class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors"
          >
            <div class="flex items-center gap-2">
              <Lightbulb :size="18" class="text-amber-500" />
              <span class="font-medium text-gray-800 dark:text-gray-200">比較結論</span>
            </div>
            <component :is="showConclusion ? ChevronUp : ChevronDown" :size="18" class="text-gray-400" />
          </button>

          <Transition name="slide">
            <div v-if="showConclusion" class="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">{{ conclusions.summary }}</p>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div v-if="conclusions.recommendations.budget" class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💰 省錢首選</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ conclusions.recommendations.budget.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ conclusions.recommendations.budget.reason }}</p>
                </div>
                <div v-if="conclusions.recommendations.quiet" class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 最安靜</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ conclusions.recommendations.quiet.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ conclusions.recommendations.quiet.reason }}</p>
                </div>
                <div v-if="conclusions.recommendations.powerful" class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💪 最強力</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ conclusions.recommendations.powerful.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ conclusions.recommendations.powerful.reason }}</p>
                </div>
                <div v-if="conclusions.recommendations.value" class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">⭐ CP值王</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ conclusions.recommendations.value.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ conclusions.recommendations.value.reason }}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Compare Table -->
        <div
          ref="compareContentRef"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full">
              <!-- Product Headers -->
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="p-4 text-left w-40">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">規格項目</span>
                  </th>
                  <th
                    v-for="product in compareProducts"
                    :key="product.id"
                    :id="`product-${product.id}`"
                    class="p-4 text-center min-w-[200px] transition-all"
                  >
                    <NuxtLink :to="`/${categorySlug}/${product.id}`" class="block group">
                      <img
                        :src="product.image_url"
                        :alt="product.name"
                        class="w-24 h-24 object-cover rounded-lg mx-auto mb-3 group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {{ getDisplayBrand(product) }}
                      </p>
                      <p class="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {{ product.name }}
                      </p>
                    </NuxtLink>
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
                    v-for="product in compareProducts"
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
              <tfoot class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <tr>
                  <td class="p-4"></td>
                  <td
                    v-for="product in compareProducts"
                    :key="product.id"
                    class="p-4 text-center"
                  >
                    <a
                      :href="getTrackedAffiliateUrl(product.affiliate_url, 'shared_compare', product.id)"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      :class="[
                        'inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-colors',
                        getOptimizedCtaText(getDiscountPercent(product), getSavingsAmount(product)).urgent
                          ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
                          : 'bg-blue-600 hover:bg-blue-700'
                      ]"
                    >
                      {{ getOptimizedCtaText(getDiscountPercent(product), getSavingsAmount(product)).text }}
                      <ExternalLink :size="14" />
                    </a>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Legend -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <Trophy :size="12" class="text-yellow-500" />
                表示該項目為最佳值
              </span>
              <span v-if="showOnlyDifferences" class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Eye :size="12" />
                目前只顯示有差異的規格
              </span>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
