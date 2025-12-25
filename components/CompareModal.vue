<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { X, ExternalLink, Trophy, Camera, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-vue-next'
import type { ComparableProduct } from '~/types'
import { getProductSpec } from '~/types'
import {
  formatPrice,
  getDiscountPercent as getDiscount,
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  getSavingsAmount,
} from '~/utils/product'
import { useAccessibility } from '~/composables/useAccessibility'
import { useCompareAnalysis, defaultWeights, type WeightConfig } from '~/composables/useCompareAnalysis'
import { useCategoryConfig } from '~/composables/useCategoryConfig'
import { useProductImage } from '~/composables/useProductImage'
import { logger } from '~/utils/logger'
import ShareCompareButton from '~/components/ShareCompareButton.vue'
import DecisionHelper from '~/components/DecisionHelper.vue'
import CompareToolbar from '~/components/compare/CompareToolbar.vue'
import CompareWeightPanel from '~/components/compare/CompareWeightPanel.vue'
import CompareConclusionPanel from '~/components/compare/CompareConclusionPanel.vue'

const props = defineProps<{
  products: ComparableProduct[]
  categorySlug?: string
}>()

// Computed product IDs for sharing
const productIds = computed(() => props.products.map(p => p.id))

// Category config for dynamic specs
const { getCategoryConfig, formatSpecValue } = useCategoryConfig()
const categoryConfig = computed(() => getCategoryConfig(props.categorySlug || 'dehumidifier'))

// 取得品類主要能力的標籤 (用於權重面板)
const primarySpecLabel = computed(() => {
  const cpKey = categoryConfig.value?.cpValueSpec
  if (!cpKey) return '能力'
  const spec = categoryConfig.value?.specs.find(s => s.key === cpKey)
  return spec?.label || '能力'
})

// Focus trap for accessibility
const { trapFocus, focusFirst } = useAccessibility()
const modalRef = ref<HTMLElement | null>(null)
const compareContentRef = ref<HTMLElement | null>(null)
let cleanupFocusTrap: (() => void) | null = null
let previousActiveElement: HTMLElement | null = null

// ========== 新功能狀態 ==========
// 差異高亮模式
const showOnlyDifferences = ref(false)

// 規格權重
const showWeightPanel = ref(false)
const weights = ref<WeightConfig>({ ...defaultWeights })

// 決策助手
const showDecisionHelper = ref(false)

// 結論面板
const showConclusion = ref(true)

// 截圖功能
const isCapturing = ref(false)

// Compare Analysis
const { conclusions, specsWithDifference, rankedProducts } = useCompareAnalysis(
  () => props.products,
  () => weights.value
)

// Mobile card swipe state
const activeCardIndex = ref(0)

// Touch/Mouse drag state
const isDragging = ref(false)
const startX = ref(0)
const currentX = ref(0)
const dragThreshold = 50 // 最小拖動距離才會切換

// 追蹤 Y 軸移動來區分水平/垂直滑動
const startY = ref(0)
const isHorizontalSwipe = ref(false)
const swipeDirectionDecided = ref(false)

const handleDragStart = (e: TouchEvent | MouseEvent) => {
  isDragging.value = true
  swipeDirectionDecided.value = false
  isHorizontalSwipe.value = false

  if ('touches' in e) {
    startX.value = e.touches[0].clientX
    startY.value = e.touches[0].clientY
  } else {
    startX.value = e.clientX
    startY.value = e.clientY
  }
  currentX.value = startX.value
}

const handleDragMove = (e: TouchEvent | MouseEvent) => {
  if (!isDragging.value) return

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  // 決定滑動方向（只判斷一次）
  if (!swipeDirectionDecided.value) {
    const diffX = Math.abs(clientX - startX.value)
    const diffY = Math.abs(clientY - startY.value)

    // 需要移動超過 10px 才判定方向
    if (diffX > 10 || diffY > 10) {
      swipeDirectionDecided.value = true
      isHorizontalSwipe.value = diffX > diffY
    }
  }

  // 只有水平滑動時才更新 currentX 並阻止默認行為（防止頁面滾動）
  if (isHorizontalSwipe.value) {
    e.preventDefault()
    currentX.value = clientX
  }
  // 垂直滑動時不做任何處理，讓瀏覽器原生滾動生效
}

const handleDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false

  // 只有水平滑動時才處理卡片切換
  if (!isHorizontalSwipe.value) {
    swipeDirectionDecided.value = false
    return
  }

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

  swipeDirectionDecided.value = false
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

// 監聯視窗大小變化
onMounted(() => {
  nextTick(() => {
    updateContainerWidth()

    // 手動綁定 touch 事件，設置 passive: false 以允許 preventDefault()
    if (cardContainerRef.value) {
      cardContainerRef.value.addEventListener('touchstart', handleDragStart, { passive: true })
      cardContainerRef.value.addEventListener('touchmove', handleDragMove, { passive: false })
      cardContainerRef.value.addEventListener('touchend', handleDragEnd, { passive: true })
    }
  })
  window.addEventListener('resize', updateContainerWidth)

  // Focus trap setup
  previousActiveElement = document.activeElement as HTMLElement
  if (modalRef.value) {
    cleanupFocusTrap = trapFocus(modalRef.value)
    focusFirst(modalRef.value)
  }

  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)

  // 清理 touch 事件
  if (cardContainerRef.value) {
    cardContainerRef.value.removeEventListener('touchstart', handleDragStart)
    cardContainerRef.value.removeEventListener('touchmove', handleDragMove)
    cardContainerRef.value.removeEventListener('touchend', handleDragEnd)
  }

  // Cleanup focus trap
  if (cleanupFocusTrap) {
    cleanupFocusTrap()
  }

  // Restore focus to previous element
  if (previousActiveElement) {
    previousActiveElement.focus()
  }

  // Restore body scroll
  document.body.style.overflow = ''
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

const getDiscountPercent = (product: ComparableProduct): number | null => getDiscount(product)

const getValueScoreNum = (product: ComparableProduct): number | null => {
  const cpKey = categoryConfig.value?.cpValueSpec
  if (!cpKey) return null
  const cpValue = getProductSpec<number>(product, cpKey) ?? 0
  if (cpValue === 0) return null
  return Math.round(product.price / cpValue)
}

const getValueScore = (product: ComparableProduct): string => {
  const score = getValueScoreNum(product)
  if (score === null) return '-'
  const cpKey = categoryConfig.value?.cpValueSpec
  const cpLabel = categoryConfig.value?.specs.find(s => s.key === cpKey)?.label || ''
  return `$${formatPrice(score)} / ${cpLabel.replace(/值|量|力$/, '')}`
}

// 找出各項目的最佳值 (動態根據品類規格)
const bestValues = computed(() => {
  const products = props.products
  if (products.length === 0) return {}

  const config = categoryConfig.value
  const result: Record<string, number | null> = {}

  // 價格: 越低越好
  const prices = products.map(p => p.price)
  result.lowestPrice = Math.min(...prices)

  // CP值: 越低越好
  const cpValues = products.map(p => getValueScoreNum(p)).filter(v => v !== null) as number[]
  result.lowestCpValue = cpValues.length > 0 ? Math.min(...cpValues) : null

  // 折扣: 越高越好
  const discounts = products.map(p => getDiscountPercent(p) ?? 0).filter(d => d > 0)
  result.highestDiscount = discounts.length > 0 ? Math.max(...discounts) : null

  // 動態取得每個規格的最佳值
  if (config) {
    for (const spec of config.specs) {
      if (!spec.showInCompare) continue

      const values = products
        .map(p => getProductSpec<number>(p, spec.key))
        .filter((v): v is number => v !== null && v !== undefined && typeof v === 'number')

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

// 檢查某個規格是否有任何商品有資料
const hasAnyData = (key: string): boolean => {
  return props.products.some(p => {
    // 基本規格特殊處理
    if (key === 'price') return true
    if (key === 'original_price') return p.original_price && p.original_price > p.price
    if (key === 'discount') return getDiscountPercent(p) !== null

    // CP值特殊處理
    if (key === 'value') {
      const cpKey = categoryConfig.value?.cpValueSpec
      if (!cpKey) return false
      const cpValue = getProductSpec<number>(p, cpKey)
      return cpValue !== null && cpValue !== undefined && cpValue !== 0
    }

    // 通用處理：檢查該 key 是否有值
    const value = getProductSpec(p, key)
    return value !== null && value !== undefined && value !== ''
  })
}

// 動態生成比較規格 - 根據品類設定
const allSpecs = computed(() => {
  const config = categoryConfig.value
  const slug = props.categorySlug || 'dehumidifier'

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

// 過濾掉沒有任何資料的規格，並根據差異模式篩選
const specs = computed(() => {
  let filtered = allSpecs.value.filter(spec => hasAnyData(spec.key))

  // 差異高亮模式：只顯示有差異的規格
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

  // 折扣: 越高越好
  if (key === 'discount') return bv.highestDiscount !== null && getDiscountPercent(product) === bv.highestDiscount

  // CP值: 越低越好
  if (key === 'value') return bv.lowestCpValue !== null && getValueScoreNum(product) === bv.lowestCpValue

  // 動態規格: 檢查 best_${key}
  const bestKey = `best_${key}`
  if (bv[bestKey] !== null && bv[bestKey] !== undefined) {
    const productValue = getProductSpec<number>(product, key)
    return productValue === bv[bestKey]
  }

  return false
}

// Display brand - hide "Other", try to extract from name
const getDisplayBrand = (product: ComparableProduct): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}

// 截圖功能
const captureScreenshot = async () => {
  if (!compareContentRef.value) return

  isCapturing.value = true

  try {
    // 動態載入 html2canvas
    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(compareContentRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    })

    // 下載圖片
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

// 匯出 CSV
const exportToCSV = () => {
  const products = props.products
  if (products.length === 0) return

  // 建立 CSV 標題行
  const headers = ['規格項目', ...products.map(p => `${p.brand} ${p.model}`)]

  // 建立資料行
  const rows = specs.value.map(spec => {
    return [spec.label, ...products.map(p => spec.format(p))]
  })

  // 組合 CSV 內容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // 加入 BOM 以支援中文
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 下載
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `商品比較-${new Date().toLocaleDateString('zh-TW')}.csv`
  link.click()

  URL.revokeObjectURL(link.href)
}

// 重置權重
const resetWeights = () => {
  weights.value = { ...defaultWeights }
}

// 處理決策助手推薦
const handleRecommendation = (product: ComparableProduct) => {
  // 滾動到該商品
  const index = props.products.findIndex(p => p.id === product.id)
  if (index !== -1) {
    activeCardIndex.value = index
    showDecisionHelper.value = false
  }
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
    <div
      ref="modalRef"
      class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
      @keydown.esc="emit('close')"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-500">
        <h2 id="compare-modal-title" class="text-base sm:text-lg font-semibold text-white">
          商品比較 ({{ products.length }}/4)
        </h2>
        <div class="flex items-center gap-1 sm:gap-2">
          <!-- 截圖按鈕 -->
          <button
            @click="captureScreenshot"
            :disabled="isCapturing"
            class="hidden sm:flex items-center gap-1 px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors disabled:opacity-50"
            title="下載比較圖"
          >
            <Camera :size="16" />
            <span class="hidden md:inline">{{ isCapturing ? '處理中...' : '截圖' }}</span>
          </button>

          <ShareCompareButton
            :product-ids="productIds"
            :category-slug="categorySlug || 'dehumidifier'"
          />
          <button
            @click="emit('close')"
            class="text-white/80 hover:text-white p-1"
            aria-label="關閉比較視窗"
          >
            <X :size="24" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex items-center gap-2 p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        <!-- 差異模式切換 -->
        <button
          @click="showOnlyDifferences = !showOnlyDifferences"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
            showOnlyDifferences
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          <component :is="showOnlyDifferences ? Eye : EyeOff" :size="14" />
          {{ showOnlyDifferences ? '只看差異' : '顯示全部' }}
        </button>

        <!-- 權重設定 -->
        <button
          @click="showWeightPanel = !showWeightPanel"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
            showWeightPanel
              ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          <SlidersHorizontal :size="14" />
          權重設定
        </button>

        <!-- 幫我決定 -->
        <button
          @click="showDecisionHelper = !showDecisionHelper"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
            showDecisionHelper
              ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          <Sparkles :size="14" />
          幫我決定
        </button>

        <!-- CSV 匯出按鈕 -->
        <button
          @click="exportToCSV"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet :size="14" />
          <span class="hidden sm:inline">匯出 CSV</span>
          <span class="sm:hidden">CSV</span>
        </button>

        <!-- 手機截圖按鈕 -->
        <button
          @click="captureScreenshot"
          :disabled="isCapturing"
          class="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap disabled:opacity-50"
        >
          <Download :size="14" />
          {{ isCapturing ? '處理中' : '圖片' }}
        </button>
      </div>

      <!-- Weight Panel -->
      <Transition name="slide">
        <div v-if="showWeightPanel" class="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">我最在意...</h3>
            <button
              @click="resetWeights"
              class="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              重置
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">💰 價格</label>
              <input
                v-model.number="weights.price"
                type="range"
                min="0"
                max="100"
                class="w-full accent-purple-500"
              />
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.price }}%</span>
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">💪 {{ primarySpecLabel }}</label>
              <input
                v-model.number="weights.capacity"
                type="range"
                min="0"
                max="100"
                class="w-full accent-purple-500"
              />
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.capacity }}%</span>
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 安靜度</label>
              <input
                v-model.number="weights.noise"
                type="range"
                min="0"
                max="100"
                class="w-full accent-purple-500"
              />
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.noise }}%</span>
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">⚡ 能效</label>
              <input
                v-model.number="weights.efficiency"
                type="range"
                min="0"
                max="100"
                class="w-full accent-purple-500"
              />
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.efficiency }}%</span>
            </div>
          </div>

          <!-- 加權排名結果 -->
          <div v-if="rankedProducts.length > 0" class="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">依您的偏好排序：</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(item, idx) in rankedProducts"
                :key="item.product.id"
                :class="[
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                  idx === 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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

      <!-- Decision Helper Panel -->
      <Transition name="slide">
        <div v-if="showDecisionHelper" class="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <DecisionHelper
            :products="products"
            @recommend="handleRecommendation"
          />
        </div>
      </Transition>

      <!-- Content for Screenshot -->
      <div ref="compareContentRef" class="flex-1 min-h-0 overflow-hidden flex flex-col bg-white dark:bg-gray-800">
        <!-- Mobile: Scrollable content area -->
        <div class="md:hidden flex-1 min-h-0 flex flex-col">
          <!-- Conclusion Panel (Mobile - collapsible) -->
          <div v-if="conclusions.summary && products.length >= 2" class="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              @click="showConclusion = !showConclusion"
              class="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors"
            >
              <div class="flex items-center gap-2">
                <Lightbulb :size="18" class="text-amber-500" />
                <span class="font-medium text-gray-800 dark:text-gray-200 text-sm">比較結論</span>
              </div>
              <component :is="showConclusion ? ChevronUp : ChevronDown" :size="18" class="text-gray-400" />
            </button>

            <div v-if="showConclusion" class="p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 max-h-48 overflow-y-auto">
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ conclusions.summary }}</p>

              <div class="grid grid-cols-2 gap-2">
                <div v-if="conclusions.recommendations.budget" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💰 省錢首選</p>
                  <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.budget.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.budget.reason }}</p>
                </div>
                <div v-if="conclusions.recommendations.powerful" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💪 最強力</p>
                  <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.powerful.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.powerful.reason }}</p>
                </div>
                <div v-if="conclusions.recommendations.value" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">⭐ CP值王</p>
                  <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.value.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.value.reason }}</p>
                </div>
                <div v-if="conclusions.recommendations.quiet" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 最安靜</p>
                  <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.quiet.product.brand }}</p>
                  <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.quiet.reason }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Card indicators -->
          <div class="flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
            class="flex-1 min-h-0 overflow-x-hidden overflow-y-auto select-none overscroll-contain"
            @mousedown="handleDragStart"
            @mousemove="handleDragMove"
            @mouseup="handleDragEnd"
            @mouseleave="handleDragEnd"
          >
            <div
              class="flex transition-transform duration-300 ease-out"
              :style="{ transform: cardTransform }"
            >
              <div
                v-for="(product, index) in products"
                :key="product.id"
                class="flex-shrink-0 p-4"
                :style="cardWidthStyle"
              >
                <!-- Product Card -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 pb-6">
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
          <div class="flex-shrink-0 py-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <span class="flex items-center justify-center gap-2">
              <Trophy :size="12" class="text-yellow-500" />
              最佳值 · 左右滑動比較商品
            </span>
          </div>
        </div>

        <!-- Desktop: Table view -->
        <div class="hidden md:flex flex-1 overflow-auto flex-col">
          <!-- Conclusion Panel (Desktop) -->
          <div v-if="conclusions.summary && products.length >= 2" class="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              @click="showConclusion = !showConclusion"
              class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors"
            >
              <div class="flex items-center gap-2">
                <Lightbulb :size="18" class="text-amber-500" />
                <span class="font-medium text-gray-800 dark:text-gray-200 text-sm">比較結論</span>
              </div>
              <component :is="showConclusion ? ChevronUp : ChevronDown" :size="18" class="text-gray-400" />
            </button>

            <Transition name="slide">
              <div v-if="showConclusion" class="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ conclusions.summary }}</p>

                <div class="grid grid-cols-4 gap-2">
                  <div v-if="conclusions.recommendations.budget" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💰 省錢首選</p>
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.budget.product.brand }}</p>
                    <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.budget.reason }}</p>
                  </div>
                  <div v-if="conclusions.recommendations.powerful" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💪 最強力</p>
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.powerful.product.brand }}</p>
                    <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.powerful.reason }}</p>
                  </div>
                  <div v-if="conclusions.recommendations.value" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">⭐ CP值王</p>
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.value.product.brand }}</p>
                    <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.value.reason }}</p>
                  </div>
                  <div v-if="conclusions.recommendations.quiet" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 最安靜</p>
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.quiet.product.brand }}</p>
                    <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.quiet.reason }}</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

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
              <span v-if="showOnlyDifferences" class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Eye :size="12" />
                目前只顯示有差異的規格
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  padding-top: 0;
  padding-bottom: 0;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
