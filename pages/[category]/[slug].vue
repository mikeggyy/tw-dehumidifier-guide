<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import {
  ExternalLink,
  Share2,
  Droplets,
  Wind,
  Snowflake,
  Flame,
  Fan,
  Home,
  ChevronRight,
  ChevronLeft,
  Star,
  Shield,
  Zap,
  Volume2,
  Box,
  Check,
  Info,
  TrendingUp,
  Award,
  BedDouble,
  Sofa,
  CircleDollarSign,
  Lightbulb,
  Moon,
  Sun,
} from 'lucide-vue-next'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useCategoryConfig } from '~/composables/useCategoryConfig'
import { useRoute, useHead, createError, useRouter, navigateTo } from '#imports'
import { useToast } from '~/composables/useToast'
import { useDarkMode } from '~/composables/useDarkMode'
import { useSwipe } from '~/composables/useSwipe'
import { useRecentlyViewed } from '~/composables/useRecentlyViewed'
import { useProductDetailShortcuts } from '~/composables/useKeyboardShortcuts'
import ScrollProgress from '~/components/ScrollProgress.vue'
import SocialShare from '~/components/SocialShare.vue'
import RecentlyViewed from '~/components/RecentlyViewed.vue'
import ImageZoom from '~/components/ImageZoom.vue'
import SimilarProducts from '~/components/SimilarProducts.vue'
import { useStructuredData } from '~/composables/useStructuredData'

// SSR 資料預載
await useProductsSSR()

const route = useRoute()
const router = useRouter()
const { success } = useToast()
const { isDark, toggle: toggleDarkMode } = useDarkMode()

const categorySlug = computed(() => route.params.category as string)
const productSlug = computed(() => route.params.slug as string)

const { getProductBySlug, allProducts, getProductSlug } = useProducts()
const { getCategoryConfig, formatSpecValue } = useCategoryConfig()

const product = computed(() => getProductBySlug(productSlug.value))
const categoryConfig = computed(() => getCategoryConfig(categorySlug.value))

// 相關商品導航（同品類）
const categoryProducts = computed(() => {
  return allProducts.value.filter(p => (p as any).category_slug === categorySlug.value)
})

const currentIndex = computed(() => {
  return categoryProducts.value.findIndex(p => getProductSlug(p) === productSlug.value)
})

const prevProduct = computed(() => {
  if (currentIndex.value <= 0) return null
  return categoryProducts.value[currentIndex.value - 1]
})

const nextProduct = computed(() => {
  if (currentIndex.value >= categoryProducts.value.length - 1) return null
  return categoryProducts.value[currentIndex.value + 1]
})

// 手勢滑動支援
const pageRef = ref<HTMLElement | null>(null)
const { direction } = useSwipe(pageRef)

watch(direction, (dir) => {
  if (dir === 'left' && nextProduct.value) {
    navigateTo(`/${categorySlug.value}/${getProductSlug(nextProduct.value)}`)
  } else if (dir === 'right' && prevProduct.value) {
    navigateTo(`/${categorySlug.value}/${getProductSlug(prevProduct.value)}`)
  }
})

// 最近瀏覽紀錄
const { add: addToRecentlyViewed } = useRecentlyViewed()

// 鍵盤快捷鍵
const goToPrev = () => {
  if (prevProduct.value) {
    navigateTo(`/${categorySlug.value}/${getProductSlug(prevProduct.value)}`)
  }
}

const goToNext = () => {
  if (nextProduct.value) {
    navigateTo(`/${categorySlug.value}/${getProductSlug(nextProduct.value)}`)
  }
}

useProductDetailShortcuts({
  onPrev: goToPrev,
  onNext: goToNext,
  onShare: () => shareProduct(),
  onBack: () => router.back(),
})

// 如果商品不存在，顯示 404
if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '找不到此商品',
    fatal: true,
  })
}

// 格式化價格
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

// 折扣百分比
const discountPercent = computed(() => {
  if (!product.value) return null
  const original = product.value.original_price
  const current = product.value.price
  if (!original || original <= current) return null
  const discount = Math.round((1 - current / original) * 100)
  return discount >= 5 ? discount : null
})

// 省多少錢
const savingsAmount = computed(() => {
  if (!product.value) return null
  const original = product.value.original_price
  if (!original || original <= product.value.price) return null
  return original - product.value.price
})

// Display brand
const displayBrand = computed(() => {
  if (!product.value) return ''
  const brand = product.value.brand
  if (brand && brand !== 'Other') return brand
  const match = product.value.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
})

// 分享功能
const shareProduct = async () => {
  if (!product.value) return

  const shareData = {
    title: product.value.name,
    text: `${product.value.name} - NT$ ${formatPrice(product.value.price)}`,
    url: window.location.href
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      success('分享成功！')
    } catch (err) {
      // 用戶取消分享
    }
  } else {
    await navigator.clipboard.writeText(window.location.href)
    success('已複製連結！')
  }
}

// 追蹤最近瀏覽
onMounted(() => {
  if (product.value) {
    addToRecentlyViewed({
      id: product.value.id,
      slug: productSlug.value,
      name: product.value.name,
      brand: product.value.brand || '',
      price: product.value.price,
      image_url: product.value.image_url,
      category_slug: categorySlug.value,
    })
  }
})

// 取得要顯示的規格（根據品類設定）
const displaySpecs = computed(() => {
  if (!categoryConfig.value || !product.value) return []

  return categoryConfig.value.specs
    .filter(spec => spec.showInDetail)
    .map(spec => {
      const value = (product.value as any).specs?.[spec.key] ?? (product.value as any)[spec.key]
      return {
        ...spec,
        value,
        formattedValue: formatSpecValue(categorySlug.value, spec.key, value),
      }
    })
    .filter(spec => spec.value !== null && spec.value !== undefined)
})

// 主要亮點規格（前 4 個有值的）
const highlightSpecs = computed(() => {
  return displaySpecs.value.slice(0, 4)
})

// 圖標對應
const specIcons: Record<string, any> = {
  daily_capacity: Droplets,
  cadr: Wind,
  noise_level: Volume2,
  power_consumption: Zap,
  tank_capacity: Box,
  coverage: Home,
  energy_efficiency: Award,
  filter_type: Shield,
  default: Star,
}

const getSpecIcon = (key: string) => {
  return specIcons[key] || specIcons.default
}

// 規格顏色對應
const specColors: Record<string, { bg: string; text: string; border: string }> = {
  daily_capacity: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  cadr: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  noise_level: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  power_consumption: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  tank_capacity: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  coverage: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  energy_efficiency: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  default: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
}

const getSpecColor = (key: string) => {
  return specColors[key] || specColors.default
}

// 產品特色（從 features 或自動生成）
const productFeatures = computed(() => {
  if (!product.value) return []

  // 如果有 features 欄位，直接使用
  if (product.value.features && product.value.features.length > 0) {
    return product.value.features.slice(0, 6)
  }

  // 否則根據規格自動生成亮點
  const features: string[] = []
  const p = product.value as any

  if (categorySlug.value === 'dehumidifier') {
    if (p.daily_capacity >= 16) features.push('大除濕量設計')
    if (p.noise_level && p.noise_level <= 40) features.push('超靜音運轉')
    if (p.energy_efficiency === 1) features.push('一級能效省電')
    if (p.tank_capacity >= 4) features.push('大容量水箱')
  } else if (categorySlug.value === 'air-purifier') {
    if (p.specs?.cadr >= 400) features.push('高效淨化')
    if (p.specs?.coverage >= 15) features.push('大坪數適用')
    if (p.specs?.filter_type?.includes('HEPA')) features.push('HEPA 濾網')
  }

  if (discountPercent.value && discountPercent.value >= 20) {
    features.push('限時優惠中')
  }

  return features
})

// SEO - 完整 Meta Tags
const siteUrl = 'https://bibikan.tw'
const pageUrl = `${siteUrl}/${categorySlug.value}/${productSlug.value}`
const pageTitle = `${product.value?.name || ''} | 比比看`
const pageDescription = `${product.value?.name} - NT$ ${formatPrice(product.value?.price || 0)}，查看詳細規格與最新優惠價格。`

useHead({
  title: pageTitle,
  meta: [
    // Basic meta
    { name: 'description', content: pageDescription },
    // Open Graph
    { property: 'og:type', content: 'product' },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: product.value?.image_url || '' },
    { property: 'og:image:alt', content: product.value?.name || '' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: product.value?.image_url || '' },
    // Product specific
    { property: 'product:price:amount', content: String(product.value?.price || 0) },
    { property: 'product:price:currency', content: 'TWD' },
  ],
  link: [
    { rel: 'canonical', href: pageUrl },
  ],
})

// JSON-LD 結構化資料
const { setProductStructuredData, setBreadcrumbStructuredData } = useStructuredData()

if (product.value) {
  setProductStructuredData({
    name: product.value.name,
    description: `${product.value.name} - 查看詳細規格、比較價格`,
    image: product.value.image_url,
    brand: displayBrand.value,
    model: product.value.model,
    price: product.value.price,
    originalPrice: product.value.original_price || undefined,
    url: typeof window !== 'undefined' ? window.location.href : '',
    category: categoryConfig.value?.name,
  })

  setBreadcrumbStructuredData([
    { name: '首頁', url: 'https://bibikan.tw/' },
    { name: categoryConfig.value?.name || '', url: `https://bibikan.tw/${categorySlug.value}` },
    { name: product.value.name, url: `https://bibikan.tw/${categorySlug.value}/${productSlug.value}` },
  ])
}

// 品類圖示對應
const categoryIcons: Record<string, any> = {
  dehumidifier: Droplets,
  'air-purifier': Wind,
  'air-conditioner': Snowflake,
  heater: Flame,
  fan: Fan,
}

const CategoryIcon = computed(() => categoryIcons[categorySlug.value] || Droplets)

// ============ 視覺化區塊 computed ============

// 除濕量視覺化 (500ml 礦泉水瓶數)
const waterBottles = computed(() => {
  const p = product.value as any
  const capacity = p?.daily_capacity ?? p?.specs?.daily_capacity
  if (!capacity) return 0
  return Math.round(capacity * 2) // 1L = 2 瓶 500ml
})

// 噪音比較參考
const noiseComparison = computed(() => {
  const p = product.value as any
  const level = p?.noise_level ?? p?.specs?.noise_level
  if (!level) return null
  if (level <= 30) return { text: '比圖書館還安靜', icon: '📚', color: 'text-green-600' }
  if (level <= 40) return { text: '如同輕聲細語', icon: '🤫', color: 'text-green-500' }
  if (level <= 45) return { text: '類似安靜辦公室', icon: '💼', color: 'text-blue-500' }
  if (level <= 50) return { text: '一般冷氣運轉聲', icon: '❄️', color: 'text-blue-600' }
  return { text: '正常對話音量', icon: '💬', color: 'text-yellow-600' }
})

// 每月電費估算 (假設每天運轉 8 小時，電價 3.5 元/度)
const monthlyElectricity = computed(() => {
  const p = product.value as any
  const watts = p?.power_consumption ?? p?.specs?.power_consumption
  if (!watts) return null
  const dailyKwh = (watts * 8) / 1000 // 每天耗電度數
  const monthlyKwh = dailyKwh * 30
  const cost = Math.round(monthlyKwh * 3.5)
  return { kwh: monthlyKwh.toFixed(1), cost }
})

// 適用空間情境
const roomSuitability = computed(() => {
  const p = product.value as any
  const capacity = p?.daily_capacity ?? p?.specs?.daily_capacity ?? 0
  const noise = p?.noise_level ?? p?.specs?.noise_level ?? 50
  return [
    {
      name: '臥室',
      icon: BedDouble,
      suitable: capacity <= 14 && noise <= 42,
      reason: noise <= 42 ? '安靜適合睡眠' : '運轉聲稍大'
    },
    {
      name: '客廳',
      icon: Sofa,
      suitable: capacity >= 10,
      reason: capacity >= 10 ? '除濕力足夠' : '建議選大容量'
    },
    {
      name: '整層住家',
      icon: Home,
      suitable: capacity >= 16,
      reason: capacity >= 16 ? '大坪數適用' : '適合單一空間'
    }
  ]
})

// 取得除濕量數值
const dailyCapacity = computed(() => {
  const p = product.value as any
  return p?.daily_capacity ?? p?.specs?.daily_capacity ?? null
})

// 取得噪音數值
const noiseLevel = computed(() => {
  const p = product.value as any
  return p?.noise_level ?? p?.specs?.noise_level ?? null
})

// 品類主題色
const categoryTheme = computed(() => {
  const themes: Record<string, { gradient: string; bgLight: string }> = {
    dehumidifier: { gradient: 'from-blue-600 to-blue-500', bgLight: 'bg-blue-100' },
    'air-purifier': { gradient: 'from-emerald-600 to-teal-500', bgLight: 'bg-emerald-100' },
    'air-conditioner': { gradient: 'from-cyan-600 to-blue-500', bgLight: 'bg-cyan-100' },
    heater: { gradient: 'from-orange-600 to-red-500', bgLight: 'bg-orange-100' },
    fan: { gradient: 'from-indigo-600 to-purple-500', bgLight: 'bg-indigo-100' },
  }
  return themes[categorySlug.value] || themes.dehumidifier
})

// ============ 空氣清淨機視覺化 computed ============

// 適用坪數
const coverageArea = computed(() => {
  const p = product.value as any
  return p?.specs?.coverage_area ?? p?.coverage_area ?? null
})

// CADR 值
const cadrValue = computed(() => {
  const p = product.value as any
  return p?.specs?.cadr ?? p?.cadr ?? null
})

// 濾網類型
const filterType = computed(() => {
  const p = product.value as any
  return p?.specs?.filter_type ?? p?.filter_type ?? null
})

// CADR 等級評估
const cadrRating = computed(() => {
  if (!cadrValue.value) return null
  const cadr = cadrValue.value
  if (cadr >= 500) return { text: '旗艦級淨化', icon: '🏆', color: 'text-purple-600', stars: 5 }
  if (cadr >= 400) return { text: '高效淨化', icon: '⭐', color: 'text-emerald-600', stars: 4 }
  if (cadr >= 300) return { text: '標準效能', icon: '✨', color: 'text-blue-600', stars: 3 }
  if (cadr >= 200) return { text: '小空間適用', icon: '🌿', color: 'text-green-600', stars: 2 }
  return { text: '入門款', icon: '🌱', color: 'text-gray-600', stars: 1 }
})

// 濾網等級說明
const filterInfo = computed(() => {
  if (!filterType.value) return null
  const type = filterType.value.toUpperCase()
  if (type.includes('H14')) return { grade: 'H14', desc: '醫療級濾網，過濾 99.995% 微粒', icon: '🏥', color: 'text-purple-600' }
  if (type.includes('H13')) return { grade: 'H13', desc: '真 HEPA，過濾 99.97% 微粒', icon: '🛡️', color: 'text-emerald-600' }
  if (type.includes('HEPA')) return { grade: 'HEPA', desc: '高效濾網，過濾 99.9% 微粒', icon: '✅', color: 'text-blue-600' }
  return { grade: type, desc: '標準濾網', icon: '📋', color: 'text-gray-600' }
})

// 空氣清淨機適用空間
const airPurifierRoomSuitability = computed(() => {
  const coverage = coverageArea.value ?? 0
  const cadr = cadrValue.value ?? 0
  return [
    {
      name: '臥室',
      icon: BedDouble,
      suitable: coverage >= 3 && coverage <= 10,
      reason: coverage <= 10 ? '適合小空間' : '效能過剩',
      ping: '3-10坪'
    },
    {
      name: '客廳',
      icon: Sofa,
      suitable: coverage >= 8,
      reason: coverage >= 8 ? '涵蓋足夠' : '建議選大坪數',
      ping: '8-15坪'
    },
    {
      name: '整層住家',
      icon: Home,
      suitable: coverage >= 15 || cadr >= 400,
      reason: coverage >= 15 ? '大範圍淨化' : '適合單一空間',
      ping: '15坪以上'
    }
  ]
})

// 換氣次數估算 (假設 2.5 米樓高)
const airChangeRate = computed(() => {
  if (!cadrValue.value || !coverageArea.value) return null
  // 坪轉立方米: 1坪 ≈ 3.3平方米, 樓高2.5米
  const roomVolume = coverageArea.value * 3.3 * 2.5
  const changesPerHour = cadrValue.value / roomVolume
  return {
    rate: changesPerHour.toFixed(1),
    quality: changesPerHour >= 5 ? '優秀' : changesPerHour >= 3 ? '良好' : '普通'
  }
})
</script>

<template>
  <div v-if="!product" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">載入中...</p>
    </div>
  </div>

  <div v-else ref="pageRef" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Scroll Progress -->
    <ScrollProgress />

    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-1 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-2">
            <img src="/favicon.svg" alt="比比看" class="w-8 h-8" />
            <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">比比看</span>
            <span class="text-sm text-gray-500 hidden sm:inline">{{ categoryConfig?.name }}</span>
          </NuxtLink>
          <div class="flex items-center gap-2">
            <!-- Dark Mode Toggle -->
            <button
              class="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="toggleDarkMode"
              :title="isDark ? '切換淺色模式' : '切換深色模式'"
            >
              <Sun v-if="isDark" :size="18" />
              <Moon v-else :size="18" />
            </button>
            <!-- Share Button -->
            <button
              class="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="shareProduct"
            >
              <Share2 :size="18" />
              <span class="hidden sm:inline text-sm">分享</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink
            to="/"
            class="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Home :size="14" />
            首頁
          </NuxtLink>
          <ChevronRight :size="14" class="text-gray-300" />
          <NuxtLink
            :to="`/${categorySlug}`"
            class="text-gray-500 hover:text-blue-600 transition-colors"
          >
            {{ categoryConfig?.name }}
          </NuxtLink>
          <ChevronRight :size="14" class="text-gray-300" />
          <span class="text-gray-900 font-medium truncate max-w-[200px]">{{ displayBrand || product.model }}</span>
        </div>
      </nav>

      <!-- Product Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="md:flex">
          <!-- Image -->
          <div class="md:w-2/5 relative">
            <ImageZoom
              :src="product.image_url"
              :alt="product.name"
              aspect-ratio="aspect-square"
            />
            <!-- 折扣標籤 -->
            <span
              v-if="discountPercent"
              class="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg z-10"
            >
              -{{ discountPercent }}%
            </span>
          </div>

          <!-- Info -->
          <div class="md:w-3/5 p-6">
            <p v-if="displayBrand" class="text-gray-500 mb-1">{{ displayBrand }}</p>
            <h1 class="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {{ product.name }}
            </h1>

            <!-- Price -->
            <div class="mb-6">
              <div v-if="product.original_price && product.original_price > product.price" class="mb-2">
                <span class="text-sm text-gray-500">市售價 </span>
                <span class="text-lg text-gray-400 line-through">NT$ {{ formatPrice(product.original_price) }}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-gray-500">促銷價</span>
                <span class="text-3xl font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</span>
              </div>
              <p v-if="savingsAmount && savingsAmount >= 500" class="text-red-500 text-sm font-medium mt-1">
                🔥 現省 NT$ {{ formatPrice(savingsAmount) }}
              </p>
            </div>

            <!-- Highlight Specs Cards -->
            <div v-if="highlightSpecs.length > 0" class="grid grid-cols-2 gap-3 mb-6">
              <div
                v-for="spec in highlightSpecs"
                :key="spec.key"
                :class="[
                  'p-3 rounded-xl border transition-all hover:shadow-md',
                  getSpecColor(spec.key).bg,
                  getSpecColor(spec.key).border,
                ]"
              >
                <div class="flex items-center gap-2 mb-1">
                  <component
                    :is="getSpecIcon(spec.key)"
                    :size="16"
                    :class="getSpecColor(spec.key).text"
                  />
                  <span class="text-xs text-gray-500">{{ spec.label }}</span>
                </div>
                <p :class="['text-lg font-bold', getSpecColor(spec.key).text]">
                  {{ spec.formattedValue }}
                </p>
              </div>
            </div>

            <!-- Features Pills -->
            <div v-if="productFeatures.length > 0" class="flex flex-wrap gap-2 mb-6">
              <span
                v-for="feature in productFeatures"
                :key="feature"
                class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                <Check :size="14" class="text-green-500" />
                {{ feature }}
              </span>
            </div>

            <!-- CTA Button -->
            <a
              :href="product.affiliate_url"
              target="_blank"
              rel="noopener noreferrer nofollow"
              :class="[
                'inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]',
                savingsAmount && savingsAmount >= 500
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white'
                  : `bg-gradient-to-r ${categoryTheme.gradient} text-white`
              ]"
            >
              <ExternalLink :size="20" />
              {{ savingsAmount && savingsAmount >= 500 ? `現省 $${formatPrice(savingsAmount)} - 立即搶購` : '查看優惠價' }}
            </a>

            <!-- Social Share -->
            <div class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-sm text-gray-500 mb-2">分享給朋友</p>
              <SocialShare :title="product.name" />
            </div>
          </div>
        </div>
      </div>

      <!-- 這款商品適合你嗎？視覺化區塊 -->
      <div v-if="categorySlug === 'dehumidifier'" class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lightbulb class="text-yellow-500 animate-pulse" :size="24" />
          這款商品適合你嗎？
        </h2>

        <div class="space-y-6">
          <!-- 除濕量視覺化 -->
          <div v-if="dailyCapacity" class="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl animate-fade-in-up relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <!-- 背景水波紋動畫 -->
            <div class="absolute inset-0 opacity-20">
              <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-200 to-transparent animate-wave"></div>
            </div>

            <div class="relative">
              <div class="flex items-center gap-3 mb-3">
                <div class="relative">
                  <Droplets class="text-blue-600 animate-bounce-slow" :size="20" />
                  <div class="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                </div>
                <span class="font-medium text-gray-900">每日除濕量</span>
              </div>
              <div class="flex items-end gap-2 mb-3">
                <span class="text-5xl font-bold text-blue-600 tabular-nums animate-count-up">{{ dailyCapacity }}</span>
                <span class="text-lg text-gray-600 mb-2">公升/天</span>
              </div>

              <!-- 礦泉水瓶視覺化 -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm text-gray-500">相當於</span>
                <div class="flex items-end gap-0.5">
                  <span
                    v-for="i in Math.min(waterBottles, 10)"
                    :key="i"
                    class="text-lg animate-bounce-stagger"
                    :style="{ animationDelay: `${i * 0.1}s` }"
                  >🍶</span>
                  <span v-if="waterBottles > 10" class="text-sm text-blue-600 font-medium ml-1">+{{ waterBottles - 10 }}</span>
                </div>
                <span class="text-sm text-gray-500">瓶礦泉水</span>
              </div>
            </div>
          </div>

          <!-- 噪音比較 -->
          <div v-if="noiseComparison" class="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl animate-fade-in-up animation-delay-100 hover:shadow-lg transition-shadow duration-300">
            <div class="flex items-center gap-3 mb-3">
              <Volume2 class="text-gray-600" :size="20" />
              <span class="font-medium text-gray-900">運轉噪音</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-4xl animate-bounce-slow">{{ noiseComparison.icon }}</span>
              <div>
                <p class="text-2xl font-bold tabular-nums" :class="noiseComparison.color">
                  {{ noiseLevel }} <span class="text-base font-normal">dB</span>
                </p>
                <p class="text-sm text-gray-600">{{ noiseComparison.text }}</p>
              </div>
            </div>
            <!-- 噪音刻度條 - 帶動畫 -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>🤫 安靜</span>
                <span>吵雜 📢</span>
              </div>
              <div class="h-3 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 rounded-full relative shadow-inner">
                <div
                  class="absolute w-4 h-4 bg-white border-2 border-gray-700 rounded-full -top-0.5 transform -translate-x-1/2 shadow-lg transition-all duration-1000 ease-out animate-slide-in"
                  :style="{ left: `${Math.min(Math.max((noiseLevel - 20) / 40 * 100, 0), 100)}%` }"
                >
                  <div class="absolute inset-0.5 bg-gray-700 rounded-full"></div>
                </div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>20dB</span>
                <span>40dB</span>
                <span>60dB</span>
              </div>
            </div>
          </div>

          <!-- 電費估算 -->
          <div v-if="monthlyElectricity" class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl animate-fade-in-up animation-delay-200 hover:shadow-lg transition-shadow duration-300 group">
            <div class="flex items-center gap-3 mb-3">
              <CircleDollarSign class="text-green-600 group-hover:animate-spin-slow" :size="20" />
              <span class="font-medium text-gray-900">每月電費預估</span>
            </div>
            <div class="flex items-end gap-2 mb-2">
              <span class="text-sm text-green-600 mb-1">≈</span>
              <span class="text-4xl font-bold text-green-600 tabular-nums">${{ monthlyElectricity.cost }}</span>
              <span class="text-sm text-gray-500 mb-1">/ 月</span>
            </div>
            <!-- 電費視覺化小圖示 -->
            <div class="flex items-center gap-2 mt-2">
              <div class="flex gap-0.5">
                <span v-for="i in Math.min(Math.ceil(monthlyElectricity.cost / 50), 5)" :key="i" class="text-yellow-500 animate-pulse" :style="{ animationDelay: `${i * 0.2}s` }">⚡</span>
              </div>
              <span class="text-xs text-gray-400">{{ monthlyElectricity.kwh }} 度/月 (每天 8 小時)</span>
            </div>
          </div>

          <!-- 適用空間 -->
          <div class="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl animate-fade-in-up animation-delay-300">
            <div class="flex items-center gap-3 mb-4">
              <Home class="text-orange-600" :size="20" />
              <span class="font-medium text-gray-900">適用空間</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="(room, index) in roomSuitability"
                :key="room.name"
                class="text-center p-3 rounded-xl transition-all duration-300 cursor-pointer animate-fade-in-up"
                :class="[
                  room.suitable
                    ? 'bg-white shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-1'
                    : 'bg-orange-50/50 opacity-60 hover:opacity-80'
                ]"
                :style="{ animationDelay: `${0.4 + index * 0.1}s` }"
              >
                <div class="relative inline-block">
                  <component
                    :is="room.icon"
                    :size="32"
                    class="mx-auto mb-2 transition-transform duration-300"
                    :class="room.suitable ? 'text-orange-500 group-hover:scale-110' : 'text-gray-400'"
                  />
                  <div v-if="room.suitable" class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce-slow">
                    <Check :size="10" class="text-white" />
                  </div>
                </div>
                <p class="text-sm font-semibold" :class="room.suitable ? 'text-gray-900' : 'text-gray-500'">
                  {{ room.name }}
                </p>
                <p class="text-xs mt-1" :class="room.suitable ? 'text-green-600' : 'text-gray-400'">
                  {{ room.reason }}
                </p>
              </div>
            </div>
          </div>

          <!-- 折扣提示 -->
          <div v-if="discountPercent && discountPercent >= 15" class="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 animate-fade-in-up animation-delay-400 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-red-400/10 to-orange-400/10 animate-shimmer"></div>
            <p class="text-red-600 font-bold flex items-center gap-2 relative">
              <span class="text-xl animate-bounce">⭐</span>
              目前折扣 {{ discountPercent }}%，是入手的好時機！
              <span class="text-xl animate-bounce animation-delay-200">🔥</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 空氣清淨機視覺化區塊 -->
      <div v-else-if="categorySlug === 'air-purifier'" class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Wind class="text-emerald-500 animate-pulse" :size="24" />
          這款商品適合你嗎？
        </h2>

        <div class="space-y-6">
          <!-- 適用坪數視覺化 -->
          <div v-if="coverageArea" class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl animate-fade-in-up relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <div class="absolute inset-0 opacity-10">
              <div class="absolute inset-0 bg-gradient-to-r from-emerald-200 to-teal-200 animate-shimmer"></div>
            </div>

            <div class="relative">
              <div class="flex items-center gap-3 mb-3">
                <div class="relative">
                  <Home class="text-emerald-600 animate-bounce-slow" :size="20" />
                </div>
                <span class="font-medium text-gray-900">適用坪數</span>
              </div>
              <div class="flex items-end gap-2 mb-3">
                <span class="text-5xl font-bold text-emerald-600 tabular-nums">{{ coverageArea }}</span>
                <span class="text-lg text-gray-600 mb-2">坪</span>
              </div>

              <!-- 坪數視覺化格子 -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm text-gray-500">空間示意</span>
                <div class="flex gap-0.5 flex-wrap">
                  <span
                    v-for="i in Math.min(Math.ceil(coverageArea), 20)"
                    :key="i"
                    class="w-4 h-4 bg-emerald-400 rounded-sm animate-fade-in-up shadow-sm"
                    :style="{ animationDelay: `${i * 0.05}s`, opacity: i <= coverageArea ? 1 : 0.3 }"
                  ></span>
                  <span v-if="coverageArea > 20" class="text-sm text-emerald-600 font-medium ml-1">+{{ Math.ceil(coverageArea) - 20 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CADR 淨化效能 -->
          <div v-if="cadrValue && cadrRating" class="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl animate-fade-in-up animation-delay-100 hover:shadow-lg transition-shadow duration-300">
            <div class="flex items-center gap-3 mb-3">
              <Wind class="text-blue-600" :size="20" />
              <span class="font-medium text-gray-900">CADR 淨化效能</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-4xl animate-bounce-slow">{{ cadrRating.icon }}</span>
              <div>
                <p class="text-2xl font-bold tabular-nums" :class="cadrRating.color">
                  {{ cadrValue }} <span class="text-base font-normal">m³/h</span>
                </p>
                <p class="text-sm text-gray-600">{{ cadrRating.text }}</p>
              </div>
            </div>
            <!-- 效能等級條 -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>入門</span>
                <span>旗艦</span>
              </div>
              <div class="h-3 bg-gradient-to-r from-gray-200 via-emerald-300 to-purple-400 rounded-full relative shadow-inner">
                <div
                  class="absolute w-4 h-4 bg-white border-2 border-gray-700 rounded-full -top-0.5 transform -translate-x-1/2 shadow-lg transition-all duration-1000 ease-out animate-slide-in"
                  :style="{ left: `${Math.min(Math.max((cadrValue - 100) / 500 * 100, 0), 100)}%` }"
                >
                  <div class="absolute inset-0.5 bg-gray-700 rounded-full"></div>
                </div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>100</span>
                <span>300</span>
                <span>600</span>
              </div>
            </div>
          </div>

          <!-- 濾網類型 -->
          <div v-if="filterInfo" class="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl animate-fade-in-up animation-delay-200 hover:shadow-lg transition-shadow duration-300 group">
            <div class="flex items-center gap-3 mb-3">
              <Shield class="text-purple-600 group-hover:animate-bounce-slow" :size="20" />
              <span class="font-medium text-gray-900">濾網等級</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-4xl animate-bounce-slow">{{ filterInfo.icon }}</span>
              <div>
                <p class="text-2xl font-bold" :class="filterInfo.color">
                  {{ filterInfo.grade }}
                </p>
                <p class="text-sm text-gray-600">{{ filterInfo.desc }}</p>
              </div>
            </div>
            <!-- 濾網效能視覺化 -->
            <div class="mt-4 flex items-center gap-2">
              <span class="text-xs text-gray-500">過濾效果：</span>
              <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000"
                  :style="{ width: filterInfo.grade === 'H14' ? '100%' : filterInfo.grade === 'H13' ? '95%' : filterInfo.grade === 'HEPA' ? '85%' : '60%' }"
                ></div>
              </div>
              <span class="text-xs font-medium" :class="filterInfo.color">
                {{ filterInfo.grade === 'H14' ? '99.995%' : filterInfo.grade === 'H13' ? '99.97%' : filterInfo.grade === 'HEPA' ? '99.9%' : '95%' }}
              </span>
            </div>
          </div>

          <!-- 換氣次數 -->
          <div v-if="airChangeRate" class="p-4 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-xl animate-fade-in-up animation-delay-250 hover:shadow-lg transition-shadow duration-300">
            <div class="flex items-center gap-3 mb-3">
              <Zap class="text-cyan-600" :size="20" />
              <span class="font-medium text-gray-900">預估換氣次數</span>
            </div>
            <div class="flex items-end gap-2 mb-2">
              <span class="text-4xl font-bold text-cyan-600 tabular-nums">{{ airChangeRate.rate }}</span>
              <span class="text-sm text-gray-500 mb-1">次/小時</span>
              <span
                class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                :class="airChangeRate.quality === '優秀' ? 'bg-green-100 text-green-700' : airChangeRate.quality === '良好' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
              >
                {{ airChangeRate.quality }}
              </span>
            </div>
            <p class="text-xs text-gray-400">建議值：每小時換氣 3-5 次以上</p>
          </div>

          <!-- 適用空間 -->
          <div v-if="coverageArea" class="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl animate-fade-in-up animation-delay-300">
            <div class="flex items-center gap-3 mb-4">
              <Home class="text-orange-600" :size="20" />
              <span class="font-medium text-gray-900">適用空間</span>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="(room, index) in airPurifierRoomSuitability"
                :key="room.name"
                class="text-center p-3 rounded-xl transition-all duration-300 cursor-pointer animate-fade-in-up"
                :class="[
                  room.suitable
                    ? 'bg-white shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-1'
                    : 'bg-orange-50/50 opacity-60 hover:opacity-80'
                ]"
                :style="{ animationDelay: `${0.4 + index * 0.1}s` }"
              >
                <div class="relative inline-block">
                  <component
                    :is="room.icon"
                    :size="32"
                    class="mx-auto mb-2 transition-transform duration-300"
                    :class="room.suitable ? 'text-orange-500' : 'text-gray-400'"
                  />
                  <div v-if="room.suitable" class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce-slow">
                    <Check :size="10" class="text-white" />
                  </div>
                </div>
                <p class="text-sm font-semibold" :class="room.suitable ? 'text-gray-900' : 'text-gray-500'">
                  {{ room.name }}
                </p>
                <p class="text-xs text-gray-400">{{ room.ping }}</p>
                <p class="text-xs mt-1" :class="room.suitable ? 'text-green-600' : 'text-gray-400'">
                  {{ room.reason }}
                </p>
              </div>
            </div>
          </div>

          <!-- 小提示 -->
          <div class="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl animate-fade-in-up animation-delay-350 border border-gray-100">
            <div class="flex items-start gap-3">
              <Info class="text-gray-500 flex-shrink-0 mt-0.5" :size="18" />
              <div class="text-sm text-gray-600">
                <p class="font-medium mb-1">選購小提示</p>
                <ul class="space-y-1 text-xs text-gray-500">
                  <li>• CADR 值建議為實際坪數的 15-20 倍</li>
                  <li>• HEPA H13 以上濾網可有效過濾 PM2.5</li>
                  <li>• 記得定期更換濾網以維持效能</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 折扣提示 -->
          <div v-if="discountPercent && discountPercent >= 15" class="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 animate-fade-in-up animation-delay-400 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-red-400/10 to-orange-400/10 animate-shimmer"></div>
            <p class="text-red-600 font-bold flex items-center gap-2 relative">
              <span class="text-xl animate-bounce">⭐</span>
              目前折扣 {{ discountPercent }}%，是入手的好時機！
              <span class="text-xl animate-bounce animation-delay-200">🔥</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 其他品類的推薦理由（保留原本邏輯） -->
      <div v-else-if="highlightSpecs.length > 0 || productFeatures.length > 0" class="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <TrendingUp :size="24" class="text-blue-600" />
          </div>
          <div>
            <h3 class="font-bold text-gray-900 mb-2">這款商品適合你嗎？</h3>
            <p class="text-gray-600 leading-relaxed">
              根據您的需求選擇適合的規格，建議比較多款商品後再做決定。
            </p>
            <p v-if="discountPercent && discountPercent >= 15" class="mt-2 text-blue-600 font-medium">
              ⭐ 目前折扣 {{ discountPercent }}%，是入手的好時機！
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky CTA (Mobile) -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-gray-500">促銷價</p>
          <p class="text-xl font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</p>
        </div>
        <a
          :href="product.affiliate_url"
          target="_blank"
          rel="noopener noreferrer nofollow"
          :class="[
            'flex-1 text-center py-3 px-6 font-semibold rounded-xl shadow-md',
            savingsAmount && savingsAmount >= 500
              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
              : `bg-gradient-to-r ${categoryTheme.gradient} text-white`
          ]"
        >
          {{ savingsAmount && savingsAmount >= 500 ? `省$${formatPrice(savingsAmount)}` : '查看優惠' }}
        </a>
      </div>
    </div>

    <!-- Product Navigation (Desktop) -->
    <div class="hidden md:block">
      <!-- Previous Product -->
      <NuxtLink
        v-if="prevProduct"
        :to="`/${categorySlug}/${getProductSlug(prevProduct)}`"
        class="fixed left-4 top-1/2 -translate-y-1/2 z-30 group"
      >
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 hover:shadow-xl transition-all hover:scale-105">
          <ChevronLeft :size="24" class="text-gray-600 dark:text-gray-300" />
          <span class="hidden group-hover:block text-sm text-gray-600 dark:text-gray-300 max-w-[120px] truncate">
            {{ prevProduct.brand }}
          </span>
        </div>
      </NuxtLink>

      <!-- Next Product -->
      <NuxtLink
        v-if="nextProduct"
        :to="`/${categorySlug}/${getProductSlug(nextProduct)}`"
        class="fixed right-4 top-1/2 -translate-y-1/2 z-30 group"
      >
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 hover:shadow-xl transition-all hover:scale-105">
          <span class="hidden group-hover:block text-sm text-gray-600 dark:text-gray-300 max-w-[120px] truncate">
            {{ nextProduct.brand }}
          </span>
          <ChevronRight :size="24" class="text-gray-600 dark:text-gray-300" />
        </div>
      </NuxtLink>
    </div>

    <!-- Swipe Hint (Mobile) -->
    <div
      v-if="prevProduct || nextProduct"
      class="md:hidden fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-30"
    >
      <div class="bg-black/60 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
        <ChevronLeft v-if="prevProduct" :size="14" />
        <span>左右滑動切換商品</span>
        <ChevronRight v-if="nextProduct" :size="14" />
      </div>
    </div>

    <!-- Similar Products -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <SimilarProducts
        :current-product="product"
        :category-slug="categorySlug"
        :limit="4"
      />
    </div>

    <!-- Recently Viewed -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <RecentlyViewed :exclude-id="product.id" :limit="5" />
    </div>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16 pb-24 md:pb-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 比比看. 本站包含聯盟行銷連結。</p>
          <p class="mt-1">價格與規格僅供參考，請以官方公告為準。</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes bounce-stagger {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes wave {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50% { transform: translateY(-5px) scaleY(1.1); }
}

@keyframes slide-in {
  from { left: 0%; }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
  opacity: 0;
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-bounce-stagger {
  animation: bounce-stagger 1.5s ease-in-out infinite;
}

.animate-wave {
  animation: wave 3s ease-in-out infinite;
}

.animate-slide-in {
  animation: slide-in 1s ease-out forwards;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}

.animation-delay-100 { animation-delay: 0.1s; }
.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-250 { animation-delay: 0.25s; }
.animation-delay-300 { animation-delay: 0.3s; }
.animation-delay-350 { animation-delay: 0.35s; }
.animation-delay-400 { animation-delay: 0.4s; }
</style>
