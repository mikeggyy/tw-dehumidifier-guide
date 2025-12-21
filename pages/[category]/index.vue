<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronRight,
  Calculator,
  Sparkles,
  GitCompare,
  Search,
  ArrowUp,
  Heart,
  SearchX,
  Droplets,
  Wind,
  Snowflake,
  Flame,
  Fan,
} from 'lucide-vue-next'
import type { GenericFilterState, SortOption, Product } from '~/types'
import ProductCard from '~/components/ProductCard.vue'
import ProductCardSkeleton from '~/components/ProductCardSkeleton.vue'
import CompareModal from '~/components/CompareModal.vue'
import SiteHeader from '~/components/category/SiteHeader.vue'
import SiteFooter from '~/components/category/SiteFooter.vue'
import FloatingCompareBar from '~/components/category/FloatingCompareBar.vue'
import Pagination from '~/components/category/Pagination.vue'
import { formatPrice, getDisplayBrand } from '~/utils/product'

// Loading component for async components
import LoadingModal from '~/components/LoadingModal.vue'

// Lazy load Calculator and Finder components (only loaded when modal opens)
const RoomCalculator = defineAsyncComponent({
  loader: () => import('~/components/RoomCalculator.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const ProductFinder = defineAsyncComponent({
  loader: () => import('~/components/ProductFinder.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const AirPurifierCalculator = defineAsyncComponent({
  loader: () => import('~/components/AirPurifierCalculator.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const AirPurifierFinder = defineAsyncComponent({
  loader: () => import('~/components/AirPurifierFinder.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const AirConditionerCalculator = defineAsyncComponent({
  loader: () => import('~/components/AirConditionerCalculator.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const AirConditionerFinder = defineAsyncComponent({
  loader: () => import('~/components/AirConditionerFinder.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const HeaterFinder = defineAsyncComponent({
  loader: () => import('~/components/HeaterFinder.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
const FanFinder = defineAsyncComponent({
  loader: () => import('~/components/FanFinder.vue'),
  loadingComponent: LoadingModal,
  delay: 0,
})
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useCategoryConfig } from '~/composables/useCategoryConfig'
import { useUrlFilters } from '~/composables/useUrlFilters'
import { useStructuredData } from '~/composables/useStructuredData'
import { useRoute, useHead, createError } from '#imports'
import { useCookieConsent } from '~/composables/useCookieConsent'

const route = useRoute()
const categorySlug = computed(() => route.params.category as string)

// 取得品類設定
const { getCategoryConfig, formatSpecValue } = useCategoryConfig()
const categoryConfig = computed(() => getCategoryConfig(categorySlug.value))

// 如果品類不存在，顯示 404
if (!categoryConfig.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '找不到此品類',
    fatal: true,
  })
}

// SSR 資料預載
await useProductsSSR()

// Cookie 同意橫幅狀態
const { showBanner: showCookieBanner } = useCookieConsent()

const { allProducts, isLoading, getAllBrands, getPriceRange, filterProducts, sortProducts, getProductSlug } = useProducts()

// 只顯示當前品類的商品
const categoryProducts = computed(() => {
  return allProducts.value.filter(p => {
    const productCategory = (p as any).category_slug || 'dehumidifier'
    return productCategory === categorySlug.value
  })
})

// SEO - 完整 Meta Tags
const { SITE_URL } = useStructuredData()
const pageUrl = computed(() => `${SITE_URL}/${categorySlug.value}`)
const pageTitle = computed(() => `${categoryConfig.value?.name || ''}規格比較 2025 | 比比看`)
const pageDescription = computed(() => categoryConfig.value?.seoDescription || `${categoryConfig.value?.name}規格比較，收錄多款商品，比較品牌、價格、規格。`)
// 使用第一個商品的圖片作為 OG Image
const ogImage = computed(() => {
  if (categoryProducts.value.length > 0) {
    return categoryProducts.value[0].image_url
  }
  return `${SITE_URL}/og-image.png`
})

useHead({
  title: pageTitle.value,
  meta: [
    // Basic meta
    { name: 'description', content: pageDescription.value },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: pageDescription.value },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:image', content: ogImage.value },
    { property: 'og:image:alt', content: `${categoryConfig.value?.name}規格比較` },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle.value },
    { name: 'twitter:description', content: pageDescription.value },
    { name: 'twitter:image', content: ogImage.value },
  ],
  link: [
    { rel: 'canonical', href: pageUrl.value },
  ],
})

// Structured Data - ItemList for category page
const { setItemListStructuredData, setBreadcrumbStructuredData } = useStructuredData()

// 設置 Breadcrumb 結構化資料
setBreadcrumbStructuredData([
  { name: '首頁', url: SITE_URL },
  { name: categoryConfig.value?.name || '', url: pageUrl.value },
])

// 設置 ItemList 結構化資料（使用前 10 個商品）
const itemListData = computed(() => {
  return categoryProducts.value.slice(0, 10).map(product => ({
    name: product.name,
    url: `${SITE_URL}/${categorySlug.value}/${getProductSlug(product)}`,
    image: product.image_url,
    price: product.price,
  }))
})

// 當商品載入後設置 ItemList
watch(categoryProducts, (products) => {
  if (products.length > 0) {
    setItemListStructuredData(itemListData.value)
  }
}, { immediate: true })

// 分頁設定
const ITEMS_PER_PAGE = 20
const currentPage = ref(1)

// 手機版載入更多
const mobileItemsShown = ref(ITEMS_PER_PAGE)
const isMobile = ref(false)

const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
  }
}

const loadMore = () => {
  mobileItemsShown.value += ITEMS_PER_PAGE
}

const hasMoreItems = computed(() => mobileItemsShown.value < displayedProducts.value.length)
const remainingItems = computed(() => displayedProducts.value.length - mobileItemsShown.value)

// 搜尋功能
const searchQuery = ref('')

// 活躍的快速標籤
const activeQuickTag = ref<string | null>(null)

// 回到頂部按鈕
const showScrollTop = ref(false)

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 500
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', checkMobile)
  checkMobile()
  loadFavorites()
  // 從 URL 初始化篩選條件
  initFromUrl()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', checkMobile)
})

// 收藏功能
const favorites = ref<Set<string>>(new Set())
const showFavoritesOnly = ref(false)

const loadFavorites = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`${categorySlug.value}-favorites`)
    if (saved) {
      favorites.value = new Set(JSON.parse(saved))
    }
  }
}

const saveFavorites = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${categorySlug.value}-favorites`, JSON.stringify([...favorites.value]))
  }
}

const toggleFavorite = (productId: string) => {
  if (favorites.value.has(productId)) {
    favorites.value.delete(productId)
  } else {
    favorites.value.add(productId)
  }
  favorites.value = new Set(favorites.value)
  saveFavorites()
}

const isFavorite = (productId: string): boolean => {
  return favorites.value.has(productId)
}

// Modal states
const showCompareModal = ref(false)
const showCalculator = ref(false)
const showFinder = ref(false)

// Compare list (max 4)
const compareList = ref<any[]>([])

const toggleCompare = (product: any) => {
  const index = compareList.value.findIndex(p => p.id === product.id)
  if (index === -1) {
    if (compareList.value.length < 4) {
      compareList.value.push(product)
    }
  } else {
    compareList.value.splice(index, 1)
  }
}

const isInCompare = (productId: string): boolean => {
  return compareList.value.some(p => p.id === productId)
}

const removeFromCompare = (id: string) => {
  compareList.value = compareList.value.filter(p => p.id !== id)
}

// 快速標籤
const applyQuickTag = (tag: { label: string; filterKey?: string; filterValue?: any; sortBy?: string }) => {
  if (activeQuickTag.value === tag.label) {
    activeQuickTag.value = null
    resetFilters()
  } else {
    activeQuickTag.value = tag.label
    // Apply filter based on tag configuration
    if (tag.filterKey && tag.filterValue !== undefined) {
      (filters as any)[tag.filterKey] = tag.filterValue
    }
    // Apply sort if specified
    if (tag.sortBy) {
      sortBy.value = tag.sortBy as SortOption
    }
  }
}

// 資料已經在 SSR 階段載入完成（檢查所有產品是否已載入）
const isReady = computed(() => allProducts.value.length > 0 || !isLoading.value)

// Get available brands and price range
const brands = computed(() => getAllBrands())
const priceRange = computed(() => getPriceRange())

// Brand filter
const showAllBrands = ref(false)
const majorBrandNames = categoryConfig.value?.popularBrands || []

const getBrandCount = (brand: string): number => {
  return categoryProducts.value.filter(p => p.brand === brand).length
}

const majorBrands = computed(() => {
  return brands.value.filter(b =>
    majorBrandNames.some(major => b.toUpperCase().includes(major.toUpperCase())) &&
    getBrandCount(b) > 0
  )
})

const otherBrands = computed(() => {
  return brands.value.filter(b =>
    !majorBrandNames.some(major => b.toUpperCase().includes(major.toUpperCase())) &&
    getBrandCount(b) > 0
  )
})

// Filter state
const filters = reactive<GenericFilterState>({
  brands: [],
  priceMin: 0,
  priceMax: 100000,
  capacityRange: 'all',
})

// 當資料載入完成後初始化價格範圍
watch(isReady, (ready) => {
  if (ready) {
    const range = priceRange.value
    filters.priceMin = range.min
    filters.priceMax = range.max
  }
}, { immediate: true })

// Sort state
const sortBy = ref<SortOption>(categoryConfig.value?.defaultSort as SortOption || 'popularity')

// URL 篩選同步
const { parseUrlFilters, updateUrl, hasActiveFilters } = useUrlFilters({ min: 0, max: 100000 })

// 從 URL 初始化篩選條件
const initFromUrl = () => {
  const urlFilters = parseUrlFilters()
  if (urlFilters.brands && urlFilters.brands.length > 0) {
    filters.brands = urlFilters.brands
  }
  if (urlFilters.capacityRange) {
    filters.capacityRange = urlFilters.capacityRange
  }
  if (urlFilters.priceMin !== undefined) {
    filters.priceMin = urlFilters.priceMin
  }
  if (urlFilters.priceMax !== undefined) {
    filters.priceMax = urlFilters.priceMax
  }
  if (urlFilters.sort) {
    sortBy.value = urlFilters.sort
  }
  if (urlFilters.q) {
    searchQuery.value = urlFilters.q
  }
  if (urlFilters.page) {
    currentPage.value = urlFilters.page
  }
}

// 監聽篩選條件變化，更新 URL
watch(
  [() => filters.brands, () => filters.capacityRange, () => filters.priceMin, () => filters.priceMax, sortBy, searchQuery, currentPage],
  () => {
    updateUrl({
      brands: filters.brands,
      capacityRange: filters.capacityRange,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      sort: sortBy.value,
      q: searchQuery.value,
      page: currentPage.value,
    }, true)
  },
  { deep: true }
)

// 監聽 URL 變化（瀏覽器前進/後退）
watch(() => route.query, () => {
  initFromUrl()
}, { deep: true })

// Mobile filter panel
const showMobileFilters = ref(false)

// Computed filtered and sorted products
const displayedProducts = computed(() => {
  let filtered = filterProducts(filters as any)

  // 只顯示當前品類
  filtered = filtered.filter(p => {
    const productCategory = (p as any).category_slug || 'dehumidifier'
    return productCategory === categorySlug.value
  })

  // 搜尋過濾
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.model.toLowerCase().includes(query)
    )
  }

  // 只顯示收藏
  if (showFavoritesOnly.value) {
    filtered = filtered.filter(p => favorites.value.has(p.id))
  }

  return sortProducts(filtered, sortBy.value)
})

// 搜尋建議
const searchSuggestions = computed(() => {
  if (displayedProducts.value.length > 0 || !searchQuery.value.trim()) return []
  return majorBrandNames.slice(0, 3)
})

// 分頁計算
const totalPages = computed(() => Math.ceil(displayedProducts.value.length / ITEMS_PER_PAGE))

const paginatedProducts = computed(() => {
  // 手機版使用載入更多模式
  if (isMobile.value) {
    return displayedProducts.value.slice(0, mobileItemsShown.value)
  }
  // 桌面版使用傳統分頁
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return displayedProducts.value.slice(start, end)
})


watch([() => filters.brands, () => filters.priceMin, () => filters.priceMax, sortBy, searchQuery], () => {
  currentPage.value = 1
  mobileItemsShown.value = ITEMS_PER_PAGE // 重設手機載入數量
})

const toggleBrand = (brand: string) => {
  const index = filters.brands.indexOf(brand)
  if (index === -1) {
    filters.brands.push(brand)
  } else {
    filters.brands.splice(index, 1)
  }
}

const resetFilters = () => {
  filters.brands = []
  filters.priceMin = priceRange.value.min
  filters.priceMax = priceRange.value.max
  sortBy.value = categoryConfig.value?.defaultSort as SortOption || 'popularity'
  activeQuickTag.value = null
  searchQuery.value = ''
  showFavoritesOnly.value = false
}

const searchBrand = (brand: string) => {
  searchQuery.value = brand
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <SiteHeader
      :category-slug="categorySlug"
      :category-name="categoryConfig?.name || ''"
    />

    <main
      id="main-content"
      :class="[
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        showCookieBanner ? 'pb-44 sm:pb-24' : ''
      ]"
      role="main"
    >
      <!-- Page Title -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <component :is="CategoryIcon" :size="32" class="text-blue-600" />
          {{ categoryConfig?.name }}規格比較
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-300">
          收錄 {{ categoryProducts.length }} {{ categoryConfig?.namePlural }}，{{ categoryConfig?.description }}
        </p>
      </div>

      <!-- 搜尋框 - 手機全寬 -->
      <div class="mb-6">
        <div class="relative w-full sm:max-w-md">
          <label for="product-search" class="sr-only">搜尋商品</label>
          <Search :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="product-search"
            v-model="searchQuery"
            type="search"
            placeholder="搜尋品牌、型號..."
            class="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            autocomplete="off"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="清除搜尋"
            @click="searchQuery = ''"
          >
            <X :size="18" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Compare Tip Banner -->
      <div
        v-if="compareList.length === 0"
        class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800 rounded-xl"
      >
        <div class="flex items-start gap-3">
          <GitCompare :size="20" class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-blue-900 dark:text-blue-100">不知道選哪款？</p>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
              點擊商品卡片下方的「加入比較」按鈕，最多可選 4 款並排比較規格！
            </p>
          </div>
        </div>
      </div>

      <!-- Tool Buttons - 手機橫向滾動 -->
      <div class="flex gap-3 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap scrollbar-hide">
        <!-- 除濕機工具 -->
        <button
          v-if="categorySlug === 'dehumidifier'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-sm transition-all"
          @click="showCalculator = true"
        >
          <Calculator :size="18" />
          坪數計算器
        </button>
        <button
          v-if="categorySlug === 'dehumidifier'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-600 shadow-sm transition-all"
          @click="showFinder = true"
        >
          <Sparkles :size="18" />
          幫我選
        </button>
        <!-- 空氣清淨機工具 -->
        <button
          v-if="categorySlug === 'air-purifier'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-600 shadow-sm transition-all"
          @click="showCalculator = true"
        >
          <Calculator :size="18" />
          坪數計算器
        </button>
        <button
          v-if="categorySlug === 'air-purifier'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-500 text-white font-medium rounded-xl hover:from-green-700 hover:to-teal-600 shadow-sm transition-all"
          @click="showFinder = true"
        >
          <Sparkles :size="18" />
          幫我選
        </button>
        <!-- 冷氣工具 -->
        <button
          v-if="categorySlug === 'air-conditioner'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-700 hover:to-blue-600 shadow-sm transition-all"
          @click="showCalculator = true"
        >
          <Calculator :size="18" />
          噸數計算器
        </button>
        <button
          v-if="categorySlug === 'air-conditioner'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-indigo-600 shadow-sm transition-all"
          @click="showFinder = true"
        >
          <Sparkles :size="18" />
          幫我選
        </button>
        <!-- 電暖器工具 -->
        <button
          v-if="categorySlug === 'heater'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-500 text-white font-medium rounded-xl hover:from-orange-700 hover:to-red-600 shadow-sm transition-all"
          @click="showFinder = true"
        >
          <Sparkles :size="18" />
          幫我選
        </button>
        <!-- 電風扇工具 -->
        <button
          v-if="categorySlug === 'fan'"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-600 shadow-sm transition-all"
          @click="showFinder = true"
        >
          <Sparkles :size="18" />
          幫我選
        </button>
        <button
          v-if="favorites.size > 0"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 font-medium rounded-xl transition-all whitespace-nowrap flex-shrink-0',
            showFavoritesOnly
              ? 'bg-red-500 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-red-300 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400'
          ]"
          @click="showFavoritesOnly = !showFavoritesOnly"
        >
          <Heart :size="18" :fill="showFavoritesOnly ? 'currentColor' : 'none'" />
          我的收藏 ({{ favorites.size }})
        </button>
      </div>

      <!-- Quick Filter Tags - 手機橫向滾動 -->
      <div v-if="categoryConfig?.quickTags" class="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap scrollbar-hide">
        <button
          v-for="tag in categoryConfig.quickTags"
          :key="tag.label"
          :class="[
            'px-4 py-2 text-sm rounded-full transition-all whitespace-nowrap flex-shrink-0',
            activeQuickTag === tag.label
              ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
          ]"
          @click="applyQuickTag(tag)"
        >
          {{ tag.label }}
        </button>
      </div>

      <div class="lg:flex lg:gap-8">
        <!-- Mobile: Filter + Sort Bar (合併為一行) -->
        <div class="lg:hidden flex items-center justify-between gap-3 mb-4 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <!-- 篩選按鈕 -->
          <button
            class="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="showMobileFilters = true"
          >
            <Filter :size="18" />
            <span>篩選</span>
          </button>

          <!-- 商品數量 -->
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ displayedProducts.length }} 項
          </span>

          <!-- 排序選單 -->
          <div class="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <select
              v-model="sortBy"
              class="text-sm bg-transparent text-gray-700 dark:text-gray-200 font-medium focus:ring-0 focus:outline-none cursor-pointer border-0 p-0 pr-6"
            >
              <option
                v-for="option in categoryConfig?.sortOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Sidebar Filters -->
        <aside
          v-if="showMobileFilters || true"
          :class="[
            'fixed inset-0 z-50 lg:relative lg:inset-auto',
            'lg:block lg:w-64 lg:flex-shrink-0',
            showMobileFilters ? 'block' : 'hidden lg:block'
          ]"
        >
          <!-- 遮罩層 with fade animation -->
          <Transition name="fade">
            <div
              v-if="showMobileFilters"
              class="absolute inset-0 bg-black/50 lg:hidden"
              @click="showMobileFilters = false"
            />
          </Transition>

          <!-- 篩選面板 with slide animation -->
          <Transition name="slide-right">
            <div
              v-show="showMobileFilters"
              class="absolute right-0 top-0 h-full w-[85vw] max-w-80 bg-white dark:bg-gray-800 overflow-y-auto lg:hidden shadow-xl"
            >
              <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <span class="font-semibold text-gray-900 dark:text-white">篩選條件</span>
                <button
                  class="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  @click="showMobileFilters = false"
                >
                  <X :size="22" class="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div class="p-4 space-y-6">
                <!-- Brand Filter -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-3">品牌</h3>
                  <div class="space-y-2">
                    <label
                      v-for="brand in majorBrands"
                      :key="brand"
                      class="flex items-center gap-3 cursor-pointer group py-1"
                    >
                      <input
                        type="checkbox"
                        :checked="filters.brands.includes(brand)"
                        class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        @change="toggleBrand(brand)"
                      />
                      <span class="text-gray-700 dark:text-gray-200 flex-1">{{ brand }}</span>
                      <span class="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">{{ getBrandCount(brand) }}</span>
                    </label>

                    <div v-if="otherBrands.length > 0">
                      <button
                        class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 mb-2 py-1"
                        @click="showAllBrands = !showAllBrands"
                      >
                        <ChevronRight
                          :size="16"
                          :class="['transition-transform', showAllBrands ? 'rotate-90' : '']"
                        />
                        {{ showAllBrands ? '收起' : `其他品牌 (${otherBrands.length})` }}
                      </button>

                      <div v-show="showAllBrands" class="space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                        <label
                          v-for="brand in otherBrands"
                          :key="brand"
                          class="flex items-center gap-3 cursor-pointer group py-1"
                        >
                          <input
                            type="checkbox"
                            :checked="filters.brands.includes(brand)"
                            class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            @change="toggleBrand(brand)"
                          />
                          <span class="text-gray-600 dark:text-gray-300 text-sm flex-1">{{ brand }}</span>
                          <span class="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">{{ getBrandCount(brand) }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Price Range Filter - Mobile: Use quick buttons -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-3">價格範圍</h3>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      :class="[
                        'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                        filters.priceMax <= 5000
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-300'
                      ]"
                      @click="filters.priceMin = 0; filters.priceMax = 5000"
                    >
                      5千以下
                    </button>
                    <button
                      :class="[
                        'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                        filters.priceMin >= 5000 && filters.priceMax <= 10000
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-300'
                      ]"
                      @click="filters.priceMin = 5000; filters.priceMax = 10000"
                    >
                      5千-1萬
                    </button>
                    <button
                      :class="[
                        'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                        filters.priceMin >= 10000 && filters.priceMax <= 20000
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-300'
                      ]"
                      @click="filters.priceMin = 10000; filters.priceMax = 20000"
                    >
                      1-2萬
                    </button>
                    <button
                      :class="[
                        'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                        filters.priceMin >= 20000
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-300'
                      ]"
                      @click="filters.priceMin = 20000; filters.priceMax = priceRange.max"
                    >
                      2萬以上
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    NT$ {{ formatPrice(filters.priceMin) }} - NT$ {{ formatPrice(filters.priceMax) }}
                  </p>
                </div>

                <!-- Reset Button -->
                <button
                  class="w-full py-2.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  @click="resetFilters"
                >
                  重設篩選條件
                </button>
              </div>

              <!-- Apply Button - Sticky bottom -->
              <div class="sticky bottom-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button
                  class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                  @click="showMobileFilters = false"
                >
                  套用篩選 ({{ displayedProducts.length }} 項結果)
                </button>
              </div>
            </div>
          </Transition>

          <!-- Desktop sidebar -->
          <div class="hidden lg:block lg:w-full lg:relative lg:h-auto bg-transparent rounded-xl overflow-y-auto">

            <div class="p-4 lg:p-0 space-y-6">
              <!-- Brand Filter -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 lg:border lg:border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3">品牌</h3>
                <div class="space-y-2">
                  <label
                    v-for="brand in majorBrands"
                    :key="brand"
                    class="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      :checked="filters.brands.includes(brand)"
                      class="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                      @change="toggleBrand(brand)"
                    />
                    <span class="text-gray-700 dark:text-gray-200 flex-1">{{ brand }}</span>
                    <span class="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">{{ getBrandCount(brand) }}</span>
                  </label>

                  <div v-if="otherBrands.length > 0">
                    <button
                      class="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-2 mb-2"
                      @click="showAllBrands = !showAllBrands"
                    >
                      <ChevronRight
                        :size="16"
                        :class="['transition-transform', showAllBrands ? 'rotate-90' : '']"
                      />
                      {{ showAllBrands ? '收起' : `其他品牌 (${otherBrands.length})` }}
                    </button>

                    <div v-show="showAllBrands" class="space-y-2 pl-2 border-l-2 border-gray-100 dark:border-gray-600">
                      <label
                        v-for="brand in otherBrands"
                        :key="brand"
                        class="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          :checked="filters.brands.includes(brand)"
                          class="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                          @change="toggleBrand(brand)"
                        />
                        <span class="text-gray-600 dark:text-gray-300 text-sm flex-1">{{ brand }}</span>
                        <span class="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">{{ getBrandCount(brand) }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Price Range Filter -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 lg:border lg:border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3">價格範圍</h3>
                <div class="space-y-4">
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="filters.priceMin"
                      type="number"
                      :min="priceRange.min"
                      :max="filters.priceMax"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="最低"
                    />
                    <span class="text-gray-400">-</span>
                    <input
                      v-model.number="filters.priceMax"
                      type="number"
                      :min="filters.priceMin"
                      :max="priceRange.max"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="最高"
                    />
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    NT$ {{ formatPrice(filters.priceMin) }} - NT$ {{ formatPrice(filters.priceMax) }}
                  </p>
                </div>
              </div>

              <!-- Reset Button -->
              <button
                class="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                @click="resetFilters"
              >
                重設篩選條件
              </button>
            </div>

            <div class="p-4 border-t border-gray-200 lg:hidden">
              <button
                class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg"
                @click="showMobileFilters = false"
              >
                套用篩選 ({{ displayedProducts.length }} 項結果)
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Sort Bar (桌面版) -->
          <div class="hidden lg:block mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm text-gray-600 dark:text-gray-300">
                顯示 {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}-{{ Math.min(currentPage * ITEMS_PER_PAGE, displayedProducts.length) }} / {{ displayedProducts.length }} 項結果
              </span>
              <div class="flex items-center gap-2">
                <SlidersHorizontal :size="18" class="text-gray-400" />
                <select
                  v-model="sortBy"
                  class="text-sm border-0 bg-transparent text-gray-700 dark:text-gray-200 font-medium focus:ring-0 cursor-pointer"
                >
                  <option
                    v-for="option in categoryConfig?.sortOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-if="!isReady"
            class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
          >
            <ProductCardSkeleton v-for="i in 6" :key="i" />
          </div>

          <!-- Product Grid - 手機 2 列，桌面 3 列 -->
          <div
            v-else-if="displayedProducts.length > 0"
            class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
          >
            <ProductCard
              v-for="product in paginatedProducts"
              :key="product.id"
              :product="product"
              :show-compare="true"
              :is-in-compare="isInCompare(product.id)"
              :is-favorite="isFavorite(product.id)"
              :search-query="searchQuery"
              :category-slug="categorySlug"
              @toggle-compare="toggleCompare(product)"
              @toggle-favorite="toggleFavorite(product.id)"
            />
          </div>

          <!-- 手機版: 載入更多按鈕 -->
          <div v-if="isMobile && hasMoreItems" class="mt-6">
            <button
              class="w-full py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="loadMore"
            >
              載入更多商品 (剩餘 {{ remainingItems }} 項)
            </button>
          </div>

          <!-- 桌面版: 傳統分頁 -->
          <Pagination
            v-if="!isMobile"
            v-model:current-page="currentPage"
            :total-pages="totalPages"
          />

          <!-- No Results -->
          <div
            v-if="isReady && displayedProducts.length === 0"
            class="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <SearchX :size="48" class="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p class="text-gray-900 dark:text-white font-medium mb-2">
              {{ showFavoritesOnly ? '您還沒有收藏任何商品' : '沒有找到符合條件的產品' }}
            </p>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {{ showFavoritesOnly ? '點擊商品卡片上的愛心即可收藏' : searchQuery ? `找不到「${searchQuery}」相關的商品` : '試試調整篩選條件' }}
            </p>

            <div v-if="searchSuggestions.length > 0" class="mb-6">
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">試試搜尋這些品牌：</p>
              <div class="flex flex-wrap justify-center gap-2">
                <button
                  v-for="brand in searchSuggestions"
                  :key="brand"
                  class="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  @click="searchBrand(brand)"
                >
                  {{ brand }}
                </button>
              </div>
            </div>

            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              @click="resetFilters"
            >
              {{ showFavoritesOnly ? '查看全部商品' : '清除篩選條件' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <SiteFooter :has-floating-bar="compareList.length > 0" />

    <!-- Scroll to top - 動態調整位置避免與底部元素衝突 -->
    <Transition name="fade">
      <button
        v-if="showScrollTop"
        :class="[
          'fixed right-4 sm:right-6 z-50 w-11 h-11 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110',
          compareList.length > 0
            ? (showCookieBanner ? 'bottom-44 md:bottom-32' : 'bottom-36 md:bottom-24')
            : (showCookieBanner ? 'bottom-32 md:bottom-20' : 'bottom-24 md:bottom-6')
        ]"
        @click="scrollToTop"
        aria-label="回到頂部"
      >
        <ArrowUp :size="22" />
      </button>
    </Transition>

    <!-- Floating Compare Bar -->
    <FloatingCompareBar
      :compare-list="compareList"
      @remove="removeFromCompare"
      @clear="compareList = []"
      @compare="showCompareModal = true"
    />

    <!-- Compare Modal -->
    <CompareModal
      v-if="showCompareModal"
      :products="compareList"
      :category-slug="categorySlug"
      @close="showCompareModal = false"
      @remove="removeFromCompare"
    />

    <!-- Dehumidifier Tools -->
    <RoomCalculator
      v-if="showCalculator && categorySlug === 'dehumidifier'"
      :products="categoryProducts"
      @close="showCalculator = false"
    />

    <ProductFinder
      v-if="showFinder && categorySlug === 'dehumidifier'"
      :products="categoryProducts"
      @close="showFinder = false"
    />

    <!-- Air Purifier Tools -->
    <AirPurifierCalculator
      v-if="showCalculator && categorySlug === 'air-purifier'"
      :products="categoryProducts"
      @close="showCalculator = false"
    />

    <AirPurifierFinder
      v-if="showFinder && categorySlug === 'air-purifier'"
      :products="categoryProducts"
      @close="showFinder = false"
    />

    <!-- Air Conditioner Tools -->
    <AirConditionerCalculator
      v-if="showCalculator && categorySlug === 'air-conditioner'"
      :products="categoryProducts"
      @close="showCalculator = false"
    />

    <AirConditionerFinder
      v-if="showFinder && categorySlug === 'air-conditioner'"
      :products="categoryProducts"
      @close="showFinder = false"
    />

    <!-- Heater Tools -->
    <HeaterFinder
      v-if="showFinder && categorySlug === 'heater'"
      :products="categoryProducts"
      @close="showFinder = false"
    />

    <!-- Fan Tools -->
    <FanFinder
      v-if="showFinder && categorySlug === 'fan'"
      :products="categoryProducts"
      @close="showFinder = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 篩選面板滑入動畫 */
.slide-right-enter-active {
  transition: transform 0.3s ease-out;
}

.slide-right-leave-active {
  transition: transform 0.25s ease-in;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* 隱藏橫向滾動條 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
