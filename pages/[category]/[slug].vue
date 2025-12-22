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
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Ruler,
  ChevronDown,
  X as XIcon,
  Heart,
  Scale,
  Calculator,
  Package,
} from 'lucide-vue-next'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useCategoryConfig } from '~/composables/useCategoryConfig'
import { useRoute, useHead, createError, useRouter, navigateTo } from '#imports'
import { useToast } from '~/composables/useToast'
import { useSwipe } from '~/composables/useSwipe'
import { useRecentlyViewed } from '~/composables/useRecentlyViewed'
import { useCompare } from '~/composables/useCompare'
import { useFavorites } from '~/composables/useFavorites'
import { useProductDetailShortcuts } from '~/composables/useKeyboardShortcuts'
import ScrollProgress from '~/components/ScrollProgress.vue'
import SocialShare from '~/components/SocialShare.vue'
import RecentlyViewed from '~/components/RecentlyViewed.vue'
import ImageZoom from '~/components/ImageZoom.vue'
import SimilarProducts from '~/components/SimilarProducts.vue'
import SameBrandProducts from '~/components/SameBrandProducts.vue'
import SiteHeader from '~/components/SiteHeader.vue'
import { useStructuredData } from '~/composables/useStructuredData'
import {
  formatPrice,
  getDiscountPercent,
  getSavingsAmount,
  getDisplayBrand,
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  formatRelativeTime,
} from '~/utils/product'

// SSR 資料預載
await useProductsSSR()

const route = useRoute()
const router = useRouter()
const { success } = useToast()

// 比較與收藏功能
const { toggleCompare, isInCompare, isAtLimit } = useCompare()
const { init: initFavorites, toggleFavorite, isFavorite } = useFavorites()

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

// 使用 utils/product.ts 的函數
const discountPercent = computed(() => {
  if (!product.value) return null
  return getDiscountPercent(product.value)
})

const savingsAmount = computed(() => {
  if (!product.value) return null
  return getSavingsAmount(product.value)
})

const displayBrand = computed(() => {
  if (!product.value) return ''
  return getDisplayBrand(product.value)
})

// Tracked affiliate URL with UTM parameters
const trackedAffiliateUrl = computed(() => {
  if (!product.value) return ''
  return getTrackedAffiliateUrl(product.value.affiliate_url, 'detail_page', product.value.id)
})

// CTA text optimized for conversion
const ctaInfo = computed(() => getOptimizedCtaText(discountPercent.value, savingsAmount.value))

// Price update time
const priceUpdateTime = computed(() => {
  const p = product.value as any
  return formatRelativeTime(p?.updated_at)
})

// 庫存狀態指示器
const stockStatus = computed(() => {
  const discount = discountPercent.value ?? 0

  // 根據折扣力度顯示不同的緊迫度
  if (discount >= 30) {
    return {
      label: '限量特惠',
      icon: '🔥',
      color: 'bg-red-500 text-white',
      pulse: true,
    }
  } else if (discount >= 20) {
    return {
      label: '熱銷優惠中',
      icon: '⚡',
      color: 'bg-orange-500 text-white',
      pulse: true,
    }
  } else if (discount >= 10) {
    return {
      label: '促銷中',
      icon: '🏷️',
      color: 'bg-yellow-500 text-gray-900',
      pulse: false,
    }
  } else {
    return {
      label: '有現貨',
      icon: '✓',
      color: 'bg-green-500 text-white',
      pulse: false,
    }
  }
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
  // 初始化收藏功能
  initFavorites()

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

// 加入比較功能
const handleToggleCompare = () => {
  if (!product.value) return

  const wasInCompare = isInCompare(product.value.id)
  if (!wasInCompare && isAtLimit.value) {
    success('比較清單已滿（最多 4 項）')
    return
  }

  toggleCompare(product.value)
  success(wasInCompare ? '已從比較清單移除' : '已加入比較清單')
}

// 收藏功能
const handleToggleFavorite = () => {
  if (!product.value) return

  const wasFavorite = isFavorite(product.value.id)
  toggleFavorite(product.value.id)
  success(wasFavorite ? '已取消收藏' : '已加入收藏')
}

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
const { SITE_URL } = useStructuredData()
const pageUrl = `${SITE_URL}/${categorySlug.value}/${productSlug.value}`
const pageTitle = `${product.value?.name || ''} | 比比看`
const pageDescription = `${product.value?.name} - NT$ ${formatPrice(product.value?.price || 0)}，查看詳細規格與最新優惠價格。`

useHead({
  title: pageTitle,
  meta: [
    // Basic meta
    { name: 'description', content: pageDescription },
    // Open Graph
    { property: 'og:type', content: 'product' },
    { property: 'og:site_name', content: '比比看' },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: product.value?.image_url || '' },
    { property: 'og:image:alt', content: product.value?.name || '' },
    { property: 'og:image:width', content: '800' },
    { property: 'og:image:height', content: '800' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@jiadian_tw' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: product.value?.image_url || '' },
    { name: 'twitter:image:alt', content: product.value?.name || '' },
    // Product specific
    { property: 'product:price:amount', content: String(product.value?.price || 0) },
    { property: 'product:price:currency', content: 'TWD' },
    { property: 'product:availability', content: 'in stock' },
    { property: 'product:brand', content: displayBrand.value },
  ],
  link: [
    { rel: 'canonical', href: pageUrl },
  ],
})

// JSON-LD 結構化資料
const { setProductStructuredData, setBreadcrumbStructuredData, setFAQStructuredData } = useStructuredData()

if (product.value) {
  // Product Schema - 增強版
  setProductStructuredData({
    name: product.value.name,
    description: `${product.value.name} - 查看詳細規格、比較價格`,
    image: product.value.image_url,
    brand: displayBrand.value,
    model: product.value.model,
    sku: product.value.id,
    price: product.value.price,
    originalPrice: product.value.original_price || undefined,
    url: pageUrl,
    category: categoryConfig.value?.name,
    inStock: (product.value as any).in_stock !== false,
  })

  // Breadcrumb Schema
  setBreadcrumbStructuredData([
    { name: '首頁', url: `${SITE_URL}/` },
    { name: categoryConfig.value?.name || '', url: `${SITE_URL}/${categorySlug.value}` },
    { name: product.value.name, url: `${SITE_URL}/${categorySlug.value}/${productSlug.value}` },
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

// 電費計算機 - 可調整使用時數
const dailyHours = ref(8)
const electricityRate = 4.5 // 台電平均電價 (2024年調整後約 4.5 元/度)

const monthlyElectricity = computed(() => {
  const p = product.value as any
  const watts = p?.power_consumption ?? p?.specs?.power_consumption
  if (!watts) return null
  const dailyKwh = (watts * dailyHours.value) / 1000 // 每天耗電度數
  const monthlyKwh = dailyKwh * 30
  const cost = Math.round(monthlyKwh * electricityRate)
  return { watts, kwh: monthlyKwh.toFixed(1), cost, dailyKwh: dailyKwh.toFixed(2) }
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

// 同價位替代品比較
const priceAlternatives = computed(() => {
  if (!product.value) return []

  const currentPrice = product.value.price
  const priceRange = currentPrice * 0.15 // 15% 價格範圍
  const minPrice = currentPrice - priceRange
  const maxPrice = currentPrice + priceRange

  // 找出同品類、同價位區間的商品（排除自己）
  const alternatives = categoryProducts.value
    .filter(p => {
      if (p.id === product.value?.id) return false
      if (p.price < minPrice || p.price > maxPrice) return false
      return true
    })
    .map(p => {
      // 計算各項目與當前商品的比較
      const priceDiff = p.price - currentPrice
      const capacityDiff = (p.daily_capacity ?? 0) - (product.value?.daily_capacity ?? 0)
      const noiseDiff = (p.noise_level ?? 0) - (product.value?.noise_level ?? 0)

      return {
        ...p,
        comparison: {
          priceDiff,
          priceLabel: priceDiff === 0 ? '相同' : priceDiff > 0 ? `貴 $${formatPrice(priceDiff)}` : `便宜 $${formatPrice(Math.abs(priceDiff))}`,
          priceWin: priceDiff < 0,
          capacityDiff,
          capacityLabel: capacityDiff === 0 ? '相同' : capacityDiff > 0 ? `多 ${capacityDiff}L` : `少 ${Math.abs(capacityDiff)}L`,
          capacityWin: capacityDiff > 0,
          noiseDiff,
          noiseLabel: noiseDiff === 0 ? '相同' : noiseDiff > 0 ? `大 ${noiseDiff}dB` : `小 ${Math.abs(noiseDiff)}dB`,
          noiseWin: noiseDiff < 0,
        }
      }
    })
    .sort((a, b) => {
      // 優先顯示 CP 值較高的
      const aValue = a.daily_capacity ? a.price / a.daily_capacity : Infinity
      const bValue = b.daily_capacity ? b.price / b.daily_capacity : Infinity
      return aValue - bValue
    })
    .slice(0, 3) // 最多顯示 3 個替代品

  return alternatives
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

// ============ 優缺點分析 ============
const prosAndCons = computed(() => {
  if (!product.value) return { pros: [], cons: [] }

  const p = product.value as any
  const pros: string[] = []
  const cons: string[] = []

  if (categorySlug.value === 'dehumidifier') {
    // 優點分析
    if (p.energy_efficiency === 1) pros.push('一級能效，省電環保')
    else if (p.energy_efficiency === 2) pros.push('二級能效，節能表現佳')

    if (p.daily_capacity >= 16) pros.push('大除濕量，適合大坪數')
    else if (p.daily_capacity >= 12) pros.push('中大除濕量，多數空間適用')

    if (p.noise_level && p.noise_level <= 38) pros.push('超靜音設計，適合臥室')
    else if (p.noise_level && p.noise_level <= 42) pros.push('低噪音運轉')

    if (p.tank_capacity >= 5) pros.push('大容量水箱，減少倒水次數')
    else if (p.tank_capacity >= 4) pros.push('水箱容量適中')

    if (discountPercent.value && discountPercent.value >= 15) pros.push('目前折扣優惠大')

    // 缺點/注意事項
    if (p.energy_efficiency && p.energy_efficiency >= 4) cons.push('能源效率較低，長期電費較高')

    if (p.noise_level && p.noise_level >= 50) cons.push('運轉聲音較大')
    else if (p.noise_level && p.noise_level >= 45) cons.push('噪音值中等，睡眠時可能受影響')

    if (p.daily_capacity && p.daily_capacity < 8) cons.push('除濕量較小，適合小空間')

    if (p.tank_capacity && p.tank_capacity < 3) cons.push('水箱較小，需頻繁倒水')

    if (!p.features || p.features.length === 0) cons.push('功能較基本')

  } else if (categorySlug.value === 'air-purifier') {
    // 空氣清淨機優缺點
    if (cadrValue.value && cadrValue.value >= 500) pros.push('超高 CADR 值，淨化效率極佳')
    else if (cadrValue.value && cadrValue.value >= 350) pros.push('高效淨化能力')

    if (filterType.value?.toUpperCase().includes('H13')) pros.push('H13 真 HEPA 濾網，過濾 99.97% 微粒')
    else if (filterType.value?.toUpperCase().includes('HEPA')) pros.push('HEPA 等級濾網')

    if (coverageArea.value && coverageArea.value >= 15) pros.push('適用大坪數空間')

    if (discountPercent.value && discountPercent.value >= 15) pros.push('目前折扣優惠大')

    // 缺點
    if (cadrValue.value && cadrValue.value < 200) cons.push('CADR 值較低，適合小空間')
    if (coverageArea.value && coverageArea.value < 8) cons.push('適用坪數較小')

  } else if (categorySlug.value === 'air-conditioner') {
    // 冷氣優缺點
    const cspf = p.specs?.cspf ?? p.cspf
    const btu = p.specs?.cooling_capacity ?? p.cooling_capacity

    if (cspf && cspf >= 6) pros.push('高能效比，省電效果佳')
    if (btu && btu >= 10000) pros.push('大冷房能力，快速降溫')
    if (p.energy_efficiency === 1) pros.push('一級能效，最省電')

    if (cspf && cspf < 4.5) cons.push('能效比較低，長期電費較高')

  } else if (categorySlug.value === 'fan') {
    // 電風扇優缺點
    const dcMotor = p.specs?.motor_type === 'DC' || p.name?.includes('DC')
    if (dcMotor) pros.push('DC 直流馬達，省電靜音')
    if (p.specs?.wind_modes >= 10) pros.push('多段風速調節')
    if (p.specs?.remote_control) pros.push('附遙控器，操作方便')

    if (!dcMotor) cons.push('AC 馬達，耗電量較高')
  }

  // 通用
  if (pros.length === 0) pros.push('價格實惠', '品牌信賴')
  if (cons.length === 0) cons.push('建議比較多款後決定')

  return { pros: pros.slice(0, 5), cons: cons.slice(0, 3) }
})

// ============ 常見問答 FAQ ============
const expandedFaq = ref<number | null>(null)

const productFAQ = computed(() => {
  if (!product.value) return []

  const p = product.value as any
  const faqs: { question: string; answer: string }[] = []

  if (categorySlug.value === 'dehumidifier') {
    faqs.push({
      question: '這款除濕機適合幾坪的空間？',
      answer: p.daily_capacity >= 16
        ? `日除濕量 ${p.daily_capacity}L，建議適用於 12-20 坪的空間，如客廳或整層住家。`
        : p.daily_capacity >= 10
        ? `日除濕量 ${p.daily_capacity}L，建議適用於 6-12 坪的空間，如臥室或小客廳。`
        : `日除濕量 ${p.daily_capacity}L，建議適用於 6 坪以下的小空間，如衣帽間或浴室。`
    })

    faqs.push({
      question: '水箱多久需要倒一次？',
      answer: p.tank_capacity
        ? `水箱容量 ${p.tank_capacity}L，以日除濕量 ${p.daily_capacity || 10}L 計算，約 ${Math.round((p.tank_capacity / (p.daily_capacity || 10)) * 24)} 小時需要倒一次。建議連接排水管可 24 小時連續除濕。`
        : '建議連接排水管以實現 24 小時連續除濕，免去倒水麻煩。'
    })

    faqs.push({
      question: '運轉時會很吵嗎？可以放臥室嗎？',
      answer: p.noise_level
        ? p.noise_level <= 38
          ? `噪音值 ${p.noise_level}dB，非常安靜，適合放在臥室使用。`
          : p.noise_level <= 45
          ? `噪音值 ${p.noise_level}dB，運轉聲音適中，建議睡眠時使用靜音模式。`
          : `噪音值 ${p.noise_level}dB，運轉聲較明顯，建議放在客廳等開放空間。`
        : '建議選購有靜音模式的機型，夜間使用更舒適。'
    })

    faqs.push({
      question: '這款除濕機省電嗎？',
      answer: p.energy_efficiency === 1
        ? '一級能效認證，是市面上最省電的等級，長期使用電費更經濟。'
        : p.energy_efficiency === 2
        ? '二級能效，節能表現不錯，日常使用電費合理。'
        : p.energy_efficiency
        ? `${p.energy_efficiency} 級能效，建議選購一、二級能效機型更省電。`
        : '購買前請確認能效等級，一、二級能效最省電。'
    })

  } else if (categorySlug.value === 'air-purifier') {
    faqs.push({
      question: '這款清淨機適合幾坪的空間？',
      answer: coverageArea.value
        ? `適用坪數約 ${coverageArea.value} 坪。建議選購適用坪數大於實際空間的機型，淨化效果更好。`
        : '請參考商品規格的適用坪數，建議選購大於實際空間的機型。'
    })

    faqs.push({
      question: '濾網多久需要更換？費用大概多少？',
      answer: '一般 HEPA 濾網建議每 6-12 個月更換一次，視使用環境而定。濾網費用約 NT$ 500-2,000 不等，建議購買前確認耗材價格。'
    })

    faqs.push({
      question: 'CADR 值是什麼意思？',
      answer: cadrValue.value
        ? `CADR (潔淨空氣輸出率) 表示每小時能淨化的空氣量。本機 CADR 值為 ${cadrValue.value} m³/h，${cadrValue.value >= 400 ? '屬於高效淨化等級' : cadrValue.value >= 250 ? '屬於中等淨化能力' : '適合小空間使用'}。`
        : 'CADR 值越高，淨化能力越強。建議選擇 CADR 值為房間體積 5 倍以上的機型。'
    })

    faqs.push({
      question: '可以過濾 PM2.5 和甲醛嗎？',
      answer: filterType.value?.toUpperCase().includes('HEPA')
        ? 'HEPA 濾網可有效過濾 99.9% 以上的 PM2.5 微粒。如需去除甲醛，建議選購含活性碳濾網的機型。'
        : '請確認是否配備 HEPA 等級濾網，才能有效過濾 PM2.5。'
    })

  } else if (categorySlug.value === 'air-conditioner') {
    faqs.push({
      question: '這款冷氣適合幾坪的空間？',
      answer: '建議根據 BTU 值選擇：1 坪約需 450-550 BTU。請參考商品規格確認適用坪數。'
    })

    faqs.push({
      question: '變頻冷氣真的比較省電嗎？',
      answer: '是的，變頻冷氣可依溫度自動調節壓縮機轉速，長時間使用比定頻省電 30-50%。建議選購一級能效機型最省電。'
    })

    faqs.push({
      question: '安裝費用大約多少？',
      answer: '標準安裝通常包含在購買價格中。特殊安裝（如高樓層、銅管加長）可能額外收費 NT$ 1,000-5,000。建議購買前確認安裝條件。'
    })

  } else if (categorySlug.value === 'fan') {
    faqs.push({
      question: 'DC 和 AC 馬達有什麼差別？',
      answer: 'DC 直流馬達比 AC 交流馬達省電約 40-70%，運轉更安靜，價格較高但長期使用更划算。'
    })

    faqs.push({
      question: '電風扇一個月電費大約多少？',
      answer: 'DC 電風扇每日使用 8 小時，月電費約 NT$ 20-40。AC 電風扇月電費約 NT$ 50-100。'
    })
  }

  // 通用問題
  faqs.push({
    question: '這個價格包含運費嗎？',
    answer: 'MOMO 購物通常滿額免運，大型家電多數免運費。實際運費請以結帳頁面為準。'
  })

  return faqs
})

// 設置 FAQ Schema (在 productFAQ 計算後)
if (product.value && productFAQ.value.length > 0) {
  setFAQStructuredData(productFAQ.value)
}

// ============ 尺寸視覺化 ============
const productDimensions = computed(() => {
  if (!product.value) return null

  const p = product.value as any

  // 嘗試從不同欄位取得尺寸資訊
  const dimensions = p.specs?.dimensions || p.dimensions
  const weight = p.specs?.weight || p.weight

  // 根據品類給予預估尺寸（如果沒有實際資料）
  let width = 0, height = 0, depth = 0, productWeight = 0
  let sizeCategory = ''

  if (categorySlug.value === 'dehumidifier') {
    const capacity = p.daily_capacity || 10
    if (capacity >= 16) {
      width = 38; height = 57; depth = 24; productWeight = 14
      sizeCategory = '大型'
    } else if (capacity >= 10) {
      width = 35; height = 50; depth = 22; productWeight = 11
      sizeCategory = '中型'
    } else {
      width = 30; height = 45; depth = 20; productWeight = 8
      sizeCategory = '小型'
    }
  } else if (categorySlug.value === 'air-purifier') {
    const coverage = coverageArea.value || 10
    if (coverage >= 15) {
      width = 40; height = 65; depth = 25; productWeight = 10
      sizeCategory = '大型'
    } else if (coverage >= 8) {
      width = 30; height = 50; depth = 20; productWeight = 7
      sizeCategory = '中型'
    } else {
      width = 25; height = 40; depth = 18; productWeight = 5
      sizeCategory = '小型'
    }
  } else if (categorySlug.value === 'fan') {
    width = 35; height = 90; depth = 35; productWeight = 4
    sizeCategory = '標準'
  } else {
    return null
  }

  // 計算相對大小（以 A4 紙為參考：21 x 29.7 cm）
  const a4Width = 21
  const a4Height = 29.7

  return {
    width,
    height,
    depth,
    weight: productWeight,
    sizeCategory,
    // 相對於 A4 紙的倍數
    widthRatio: (width / a4Width).toFixed(1),
    heightRatio: (height / a4Height).toFixed(1),
    // 比較物件
    comparisons: [
      { name: 'A4 紙寬', value: a4Width, unit: 'cm' },
      { name: '礦泉水瓶', value: 22, unit: 'cm' },
      { name: '一般椅子高', value: 45, unit: 'cm' },
    ]
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
    <!-- Header -->
    <SiteHeader />

    <!-- Scroll Progress -->
    <ScrollProgress />

    <main id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink
            to="/"
            class="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Home :size="14" />
            首頁
          </NuxtLink>
          <ChevronRight :size="14" class="text-gray-300 dark:text-gray-600" />
          <NuxtLink
            :to="`/${categorySlug}`"
            class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {{ categoryConfig?.name }}
          </NuxtLink>
          <ChevronRight :size="14" class="text-gray-300 dark:text-gray-600" />
          <span class="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{{ displayBrand || product.model }}</span>
        </div>
      </nav>

      <!-- Product Card - 使用 article 語意標籤 -->
      <article class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" itemscope itemtype="https://schema.org/Product">
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
            <!-- Stock Status Badge -->
            <div class="flex items-center gap-2 mb-2">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full',
                  stockStatus.color,
                  stockStatus.pulse ? 'animate-pulse' : ''
                ]"
              >
                <span>{{ stockStatus.icon }}</span>
                <span>{{ stockStatus.label }}</span>
              </span>
              <span v-if="displayBrand" class="text-gray-500 dark:text-gray-400 text-sm">{{ displayBrand }}</span>
            </div>
            <div class="flex items-start justify-between gap-4 mb-4">
              <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {{ product.name }}
              </h1>
              <!-- 操作按鈕組 -->
              <div class="flex-shrink-0 flex items-center gap-1">
                <!-- 加入比較 -->
                <button
                  :class="[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
                    isInCompare(product.id)
                      ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700'
                  ]"
                  @click="handleToggleCompare"
                  :title="isInCompare(product.id) ? '從比較清單移除' : '加入比較'"
                  :aria-label="isInCompare(product.id) ? '從比較清單移除' : '加入比較'"
                >
                  <Scale :size="16" aria-hidden="true" />
                  <span class="hidden sm:inline">{{ isInCompare(product.id) ? '比較中' : '比較' }}</span>
                </button>
                <!-- 收藏 -->
                <button
                  :class="[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm',
                    isFavorite(product.id)
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700'
                  ]"
                  @click="handleToggleFavorite"
                  :title="isFavorite(product.id) ? '取消收藏' : '加入收藏'"
                  :aria-label="isFavorite(product.id) ? '取消收藏' : '加入收藏'"
                >
                  <Heart :size="16" :fill="isFavorite(product.id) ? 'currentColor' : 'none'" aria-hidden="true" />
                  <span class="hidden sm:inline">{{ isFavorite(product.id) ? '已收藏' : '收藏' }}</span>
                </button>
                <!-- 分享 -->
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                  @click="shareProduct"
                  title="分享此商品"
                  aria-label="分享此商品"
                >
                  <Share2 :size="16" aria-hidden="true" />
                  <span class="hidden sm:inline">分享</span>
                </button>
              </div>
            </div>

            <!-- Price -->
            <div class="mb-6">
              <div v-if="product.original_price && product.original_price > product.price" class="mb-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">市售價 </span>
                <span class="text-lg text-gray-400 dark:text-gray-500 line-through">NT$ {{ formatPrice(product.original_price) }}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">促銷價</span>
                <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">NT$ {{ formatPrice(product.price) }}</span>
              </div>
              <p v-if="savingsAmount && savingsAmount >= 500" class="text-red-500 text-sm font-medium mt-1">
                🔥 現省 NT$ {{ formatPrice(savingsAmount) }}
              </p>
              <!-- Price update time -->
              <p v-if="priceUpdateTime" class="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <span class="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {{ priceUpdateTime }}
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
              :href="trackedAffiliateUrl"
              target="_blank"
              rel="noopener noreferrer nofollow"
              :class="[
                'inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]',
                ctaInfo.urgent
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white animate-pulse-cta'
                  : `bg-gradient-to-r ${categoryTheme.gradient} text-white`
              ]"
            >
              <ExternalLink :size="20" />
              {{ ctaInfo.urgent && savingsAmount && savingsAmount >= 1000 ? `${ctaInfo.text} - 立即搶購` : ctaInfo.text }}
            </a>

            <!-- Social Share -->
            <div class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-sm text-gray-500 mb-2">分享給朋友</p>
              <SocialShare :title="product.name" />
            </div>
          </div>
        </div>
      </article>

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

          <!-- 電費計算機 (互動式) -->
          <div v-if="monthlyElectricity" class="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl animate-fade-in-up animation-delay-200 hover:shadow-lg transition-shadow duration-300 group">
            <div class="flex items-center gap-3 mb-3">
              <Calculator class="text-green-600 dark:text-green-400" :size="20" />
              <span class="font-medium text-gray-900 dark:text-white">電費計算機</span>
            </div>

            <!-- 使用時數調整 -->
            <div class="mb-4">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-600 dark:text-gray-400">每日使用時數</span>
                <span class="font-medium text-green-600 dark:text-green-400">{{ dailyHours }} 小時</span>
              </div>
              <input
                type="range"
                v-model.number="dailyHours"
                min="1"
                max="24"
                step="1"
                class="w-full h-2 bg-green-200 dark:bg-green-800 rounded-lg appearance-none cursor-pointer slider-green"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>1hr</span>
                <span>12hr</span>
                <span>24hr</span>
              </div>
            </div>

            <!-- 計算結果 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
              <div class="flex items-end gap-2 mb-2">
                <span class="text-sm text-green-600 dark:text-green-400 mb-1">≈</span>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400 tabular-nums">${{ monthlyElectricity.cost }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400 mb-1">/ 月</span>
              </div>
              <!-- 電費視覺化 -->
              <div class="flex items-center gap-2">
                <div class="flex gap-0.5">
                  <span v-for="i in Math.min(Math.ceil(monthlyElectricity.cost / 50), 5)" :key="i" class="text-yellow-500 animate-pulse" :style="{ animationDelay: `${i * 0.2}s` }">⚡</span>
                </div>
                <span class="text-xs text-gray-400">{{ monthlyElectricity.kwh }} 度/月</span>
              </div>
            </div>

            <!-- 計算明細 -->
            <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-green-100 dark:border-green-800 pt-2">
              <p class="flex justify-between">
                <span>消耗功率</span>
                <span class="font-mono">{{ monthlyElectricity.watts }}W</span>
              </p>
              <p class="flex justify-between">
                <span>每日用電</span>
                <span class="font-mono">{{ monthlyElectricity.dailyKwh }} 度</span>
              </p>
              <p class="flex justify-between">
                <span>電價 (台電平均)</span>
                <span class="font-mono">$4.5/度</span>
              </p>
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

      <!-- ============ 優缺點分析區塊 ============ -->
      <div v-if="prosAndCons.pros.length > 0 || prosAndCons.cons.length > 0" class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Star class="text-yellow-500" :size="24" />
          優缺點分析
        </h2>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- 優點 -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <ThumbsUp :size="16" class="text-white" />
              </div>
              <h3 class="font-semibold text-green-800">優點</h3>
            </div>
            <ul class="space-y-3">
              <li
                v-for="(pro, index) in prosAndCons.pros"
                :key="index"
                class="flex items-start gap-2 animate-fade-in-up"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <Check :size="18" class="text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-700">{{ pro }}</span>
              </li>
            </ul>
          </div>

          <!-- 缺點/注意事項 -->
          <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <Info :size="16" class="text-white" />
              </div>
              <h3 class="font-semibold text-amber-800">注意事項</h3>
            </div>
            <ul class="space-y-3">
              <li
                v-for="(con, index) in prosAndCons.cons"
                :key="index"
                class="flex items-start gap-2 animate-fade-in-up"
                :style="{ animationDelay: `${index * 0.1 + 0.2}s` }"
              >
                <Info :size="18" class="text-amber-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-700">{{ con }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 結論提示 -->
        <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p class="text-sm text-blue-800 flex items-center gap-2">
            <Lightbulb :size="16" class="text-blue-600" />
            <span>以上分析僅供參考，建議依個人需求和使用環境做最終決定。</span>
          </p>
        </div>
      </div>

      <!-- ============ 尺寸視覺化區塊 ============ -->
      <div v-if="productDimensions" class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Ruler class="text-purple-500" :size="24" />
          尺寸參考
        </h2>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- 尺寸數據 - 使用 dl 定義列表語意化 -->
          <dl class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <dt class="text-gray-600 dark:text-gray-400">機身尺寸</dt>
              <dd class="font-semibold text-gray-900 dark:text-white">
                約 {{ productDimensions.width }} × {{ productDimensions.depth }} × {{ productDimensions.height }} cm
              </dd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <dt class="text-gray-600 dark:text-gray-400">重量</dt>
              <dd class="font-semibold text-gray-900 dark:text-white">約 {{ productDimensions.weight }} kg</dd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <dt class="text-gray-600 dark:text-gray-400">體積分類</dt>
              <dd class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {{ productDimensions.sizeCategory }}
              </dd>
            </div>
          </dl>

          <!-- 視覺比較 -->
          <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
            <p class="text-sm text-gray-500 mb-4">相對大小比較</p>

            <!-- 高度比較條 -->
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500 w-20">本產品</span>
                <div class="flex-1 h-6 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                    :style="{ width: `${Math.min((productDimensions.height / 100) * 100, 100)}%` }"
                  />
                </div>
                <span class="text-sm font-medium text-gray-700 w-16 text-right">{{ productDimensions.height }}cm</span>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500 w-20">椅子高</span>
                <div class="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-gray-400 rounded-full" style="width: 45%" />
                </div>
                <span class="text-sm text-gray-500 w-16 text-right">45cm</span>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500 w-20">A4 紙長</span>
                <div class="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-gray-400 rounded-full" style="width: 30%" />
                </div>
                <span class="text-sm text-gray-500 w-16 text-right">29.7cm</span>
              </div>
            </div>

            <!-- 占地面積提示 -->
            <div class="mt-4 p-3 bg-white/60 rounded-lg">
              <p class="text-xs text-gray-600">
                📐 占地面積約 <span class="font-semibold">{{ productDimensions.width }} × {{ productDimensions.depth }}</span> cm，
                相當於 <span class="font-semibold">{{ productDimensions.widthRatio }}</span> 張 A4 紙寬
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 常見問答 FAQ ============ -->
      <div v-if="productFAQ.length > 0" class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle class="text-blue-500" :size="24" />
          常見問答
        </h2>

        <div class="space-y-3">
          <div
            v-for="(faq, index) in productFAQ"
            :key="index"
            class="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300"
            :class="expandedFaq === index ? 'shadow-md' : 'hover:border-blue-200'"
          >
            <button
              class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              @click="expandedFaq = expandedFaq === index ? null : index"
            >
              <span class="font-medium text-gray-900 pr-4">{{ faq.question }}</span>
              <ChevronDown
                :size="20"
                class="text-gray-400 flex-shrink-0 transition-transform duration-300"
                :class="expandedFaq === index ? 'rotate-180' : ''"
              />
            </button>

            <Transition name="faq">
              <div v-if="expandedFaq === index" class="px-4 pb-4">
                <div class="pt-2 border-t border-gray-100">
                  <p class="text-gray-600 leading-relaxed">{{ faq.answer }}</p>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- SEO 提示 -->
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-400">還有其他問題？歡迎比較更多商品找到最適合您的選擇</p>
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
          :href="trackedAffiliateUrl"
          target="_blank"
          rel="noopener noreferrer nofollow"
          :class="[
            'flex-1 text-center py-3 px-6 font-semibold rounded-xl shadow-md',
            ctaInfo.urgent
              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
              : `bg-gradient-to-r ${categoryTheme.gradient} text-white`
          ]"
        >
          {{ ctaInfo.text }}
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

    <!-- Same Price Alternatives -->
    <div v-if="priceAlternatives.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-6">
          <Scale class="text-purple-600 dark:text-purple-400" :size="24" />
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">同價位比一比</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">價差 15% 內的替代選擇</p>
          </div>
        </div>

        <!-- Comparison Table -->
        <div class="overflow-x-auto -mx-6 px-6">
          <table class="w-full min-w-[600px]">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">商品</th>
                <th class="text-center py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">價格</th>
                <th class="text-center py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">除濕力</th>
                <th class="text-center py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">噪音</th>
                <th class="text-center py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              <!-- Current Product (Reference) -->
              <tr class="bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                <td class="py-3 px-2">
                  <div class="flex items-center gap-3">
                    <img :src="product.image_url" :alt="product.name" class="w-12 h-12 object-cover rounded-lg" />
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{{ product.name }}</p>
                      <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">目前瀏覽</p>
                    </div>
                  </div>
                </td>
                <td class="text-center py-3 px-2">
                  <span class="font-semibold text-gray-900 dark:text-white">${{ formatPrice(product.price) }}</span>
                </td>
                <td class="text-center py-3 px-2">
                  <span class="text-gray-900 dark:text-white">{{ product.daily_capacity ?? '-' }}L</span>
                </td>
                <td class="text-center py-3 px-2">
                  <span class="text-gray-900 dark:text-white">{{ product.noise_level ?? '-' }}dB</span>
                </td>
                <td class="text-center py-3 px-2">
                  <span class="text-xs text-gray-400">基準</span>
                </td>
              </tr>
              <!-- Alternatives -->
              <tr
                v-for="alt in priceAlternatives"
                :key="alt.id"
                class="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="py-3 px-2">
                  <NuxtLink :to="`/${categorySlug}/${getProductSlug(alt)}`" class="flex items-center gap-3 group">
                    <img :src="alt.image_url" :alt="alt.name" class="w-12 h-12 object-cover rounded-lg" />
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ alt.name }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ alt.brand }}</p>
                    </div>
                  </NuxtLink>
                </td>
                <td class="text-center py-3 px-2">
                  <div>
                    <span class="font-semibold text-gray-900 dark:text-white">${{ formatPrice(alt.price) }}</span>
                    <p :class="[
                      'text-xs mt-0.5',
                      alt.comparison.priceWin ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                    ]">
                      {{ alt.comparison.priceLabel }}
                    </p>
                  </div>
                </td>
                <td class="text-center py-3 px-2">
                  <div>
                    <span class="text-gray-900 dark:text-white">{{ alt.daily_capacity ?? '-' }}L</span>
                    <p v-if="alt.daily_capacity" :class="[
                      'text-xs mt-0.5',
                      alt.comparison.capacityWin ? 'text-green-600 dark:text-green-400' : alt.comparison.capacityDiff < 0 ? 'text-red-500' : 'text-gray-400'
                    ]">
                      {{ alt.comparison.capacityLabel }}
                    </p>
                  </div>
                </td>
                <td class="text-center py-3 px-2">
                  <div>
                    <span class="text-gray-900 dark:text-white">{{ alt.noise_level ?? '-' }}dB</span>
                    <p v-if="alt.noise_level" :class="[
                      'text-xs mt-0.5',
                      alt.comparison.noiseWin ? 'text-green-600 dark:text-green-400' : alt.comparison.noiseDiff > 0 ? 'text-red-500' : 'text-gray-400'
                    ]">
                      {{ alt.comparison.noiseLabel }}
                    </p>
                  </div>
                </td>
                <td class="text-center py-3 px-2">
                  <NuxtLink
                    :to="`/${categorySlug}/${getProductSlug(alt)}`"
                    class="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    查看
                    <ChevronRight :size="14" />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

    <!-- Same Brand Products - 加強內部連結 SEO -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <SameBrandProducts
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
/* CTA pulse animation for urgent deals */
@keyframes pulse-cta {
  0%, 100% {
    box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 10px 25px -3px rgba(239, 68, 68, 0.5);
  }
}

.animate-pulse-cta {
  animation: pulse-cta 2s ease-in-out infinite;
}

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

/* FAQ Accordion Transition */
.faq-enter-active {
  animation: faq-expand 0.3s ease-out;
}

.faq-leave-active {
  animation: faq-collapse 0.2s ease-in forwards;
}

@keyframes faq-expand {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }
}

@keyframes faq-collapse {
  from {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
}

/* Range Slider - Green Theme */
.slider-green::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #16a34a;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
  transition: all 0.2s;
}

.slider-green::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 10px rgba(22, 163, 74, 0.4);
}

.slider-green::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #16a34a;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
}
</style>
