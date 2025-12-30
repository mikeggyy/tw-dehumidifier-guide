<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GitCompare,
  ArrowUp,
  Heart,
  SearchX,
  Droplets,
  Wind,
  Snowflake,
  Flame,
  Fan,
  AlertCircle,
} from 'lucide-vue-next'
import type { FilterState, SortOption, Dehumidifier } from '~/types'
import { getProductCategorySlug } from '~/types'
import ProductCard from '~/components/ProductCard.vue'
import ProductCardSkeleton from '~/components/ProductCardSkeleton.vue'
import OnboardingTour from '~/components/OnboardingTour.vue'
import SearchAutocomplete from '~/components/SearchAutocomplete.vue'
import ScenarioRecommender from '~/components/ScenarioRecommender.vue'
import FloatingCompareBar from '~/components/category/FloatingCompareBar.vue'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useStructuredData } from '~/composables/useStructuredData'
import { useFavorites } from '~/composables/useFavorites'
import SiteHeader from '~/components/SiteHeader.vue'
import { useHead } from '#imports'
import { useCookieConsent } from '~/composables/useCookieConsent'

// 動態載入 Modal 組件（減少初始 bundle 大小）
const CompareModal = defineAsyncComponent(() => import('~/components/CompareModal.vue'))

// Cookie 同意橫幅狀態
const { showBanner: showCookieBanner } = useCookieConsent()

// SSR 資料預載 - 在伺服器端就先載入資料
await useProductsSSR()

// 首頁 SEO - 結構化資料
const { setWebsiteStructuredData, setOrganizationStructuredData, SITE_URL, SITE_NAME } = useStructuredData()

// 設置 WebSite 和 Organization Schema (首頁專用)
setWebsiteStructuredData()
setOrganizationStructuredData()

// 首頁 Meta Tags
useHead({
  title: '比比看 - 台灣家電規格比較 2025 | 除濕機、空氣清淨機、冷氣',
  meta: [
    { name: 'description', content: '台灣最完整的家電規格比較網站，收錄除濕機、空氣清淨機、冷氣、電暖器、電風扇等品類，比較 Panasonic、Hitachi、LG 等品牌的規格與價格。' },
    // SEO - 確保首頁被索引
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: '比比看 - 台灣家電規格比較 2025 | 除濕機、空氣清淨機、冷氣、電暖器比價' },
    { property: 'og:description', content: '比比看是台灣最完整的家電規格比較網站，收錄除濕機、空氣清淨機、冷氣、電暖器、電風扇等品類，比較 Panasonic、Hitachi、LG、SHARP 等品牌的規格與價格，幫你快速找到最適合的家電產品。' },
    { property: 'og:url', content: SITE_URL },
    { property: 'og:image', content: `${SITE_URL}/og-image.png` },
    { property: 'og:image:alt', content: '比比看 - 台灣家電規格比較平台' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
  ],
  link: [
    { rel: 'canonical', href: SITE_URL },
  ],
})

const { allProducts, isLoading, getAllBrands, getPriceRange, filterProducts, sortProducts } = useProducts()

// 分頁設定
const ITEMS_PER_PAGE = 20
const currentPage = ref(1)

// 搜尋功能
const searchQuery = ref('')

// 回到頂部按鈕
const showScrollTop = ref(false)

const handleScroll = () => {
  if (typeof window !== 'undefined') {
    showScrollTop.value = window.scrollY > 500
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 收藏功能 - 使用統一的 composable
const { favorites, init: initFavorites, toggleFavorite, isFavorite } = useFavorites()
const showFavoritesOnly = ref(false)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // 初始化收藏清單
  initFavorites()
})

// 同品類比較提示訊息 (需要在 onUnmounted 前宣告)
const compareCategoryWarning = ref('')
const compareCategoryWarningTimer = ref<ReturnType<typeof setTimeout> | null>(null)

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (compareCategoryWarningTimer.value) {
    clearTimeout(compareCategoryWarningTimer.value)
  }
})

// Modal states
const showCompareModal = ref(false)

const showCompareCategoryWarning = (message: string) => {
  compareCategoryWarning.value = message
  if (compareCategoryWarningTimer.value) {
    clearTimeout(compareCategoryWarningTimer.value)
  }
  compareCategoryWarningTimer.value = setTimeout(() => {
    compareCategoryWarning.value = ''
  }, 3000)
}

// Compare list (max 4)
const compareList = ref<Dehumidifier[]>([])

const toggleCompare = (product: Dehumidifier) => {
  const index = compareList.value.findIndex(p => p.id === product.id)
  if (index === -1) {
    // 檢查是否已達上限
    if (compareList.value.length >= 4) {
      return
    }
    // 檢查品類是否一致
    if (compareList.value.length > 0) {
      const currentCategory = getProductCategorySlug(compareList.value[0])
      const newCategory = getProductCategorySlug(product)
      if (currentCategory !== newCategory) {
        showCompareCategoryWarning('只能比較同類別的商品，請先清空比較清單或選擇相同類別的商品')
        return
      }
    }
    compareList.value.push(product)
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

// 取得比較清單的品類 (以第一個商品為準)
const compareCategorySlug = computed(() => {
  if (compareList.value.length === 0) return 'dehumidifier'
  return getProductCategorySlug(compareList.value[0])
})

// 資料已經在 SSR 階段載入完成
const isReady = computed(() => allProducts.value.length > 0)

// Filter state (簡化版 - 首頁不使用分類篩選)
const filters = reactive<FilterState>({
  brands: [],
  capacityRange: 'all',
  priceMin: 0,
  priceMax: 100000
})

// Sort state
const sortBy = ref<SortOption>('popularity')

// Computed filtered and sorted products
const displayedProducts = computed(() => {
  let filtered = filterProducts(filters)

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
    filtered = filtered.filter(p => isFavorite(p.id))
  }

  return sortProducts(filtered, sortBy.value)
})

// 實際存在的收藏數量（排除已下架商品）
const validFavoritesCount = computed(() => {
  return allProducts.value.filter(p => isFavorite(p.id)).length
})

// 搜尋建議（當無結果時）
const searchSuggestions = computed(() => {
  if (displayedProducts.value.length > 0 || !searchQuery.value.trim()) return []
  const popularBrands = ['Panasonic', 'HITACHI', 'SHARP', 'LG', 'Mitsubishi']
  return popularBrands.filter(b =>
    allProducts.value.some(p => p.brand.toUpperCase().includes(b.toUpperCase()))
  ).slice(0, 3)
})

// 分頁計算
const totalPages = computed(() => Math.ceil(displayedProducts.value.length / ITEMS_PER_PAGE))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return displayedProducts.value.slice(start, end)
})

// 頁碼陣列（最多顯示 5 頁）
const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 3) {
    pages.push(1, 2, 3, 4, 5)
  } else if (current >= total - 2) {
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    for (let i = current - 2; i <= current + 2; i++) pages.push(i)
  }

  return pages
})

// 切換頁面
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 當篩選條件改變時，重置到第一頁
watch([sortBy, searchQuery], () => {
  currentPage.value = 1
})

// Reset filters
const resetFilters = () => {
  sortBy.value = 'popularity'
  searchQuery.value = ''
  showFavoritesOnly.value = false
}

// 搜尋品牌
const searchBrand = (brand: string) => {
  searchQuery.value = brand
}

// Sort options (通用排序，適用所有品類)
const sortOptions = [
  { value: 'popularity', label: '熱門推薦' },
  { value: 'discount_desc', label: '折扣幅度' },
  { value: 'price_asc', label: '價格：低到高' },
  { value: 'price_desc', label: '價格：高到低' },
]

// 根據品類計算商品數量
const getCategoryCount = (slug: string): number => {
  if (slug === 'dehumidifier') {
    // 除濕機：category_slug 為 dehumidifier 或沒有 category_slug 的舊資料
    return allProducts.value.filter(p =>
      getProductCategorySlug(p) === 'dehumidifier'
    ).length
  }
  return allProducts.value.filter(p => getProductCategorySlug(p) === slug).length
}

// 品類導覽資料
const categories = computed(() => [
  {
    slug: 'dehumidifier',
    name: '除濕機',
    icon: Droplets,
    description: '梅雨季必備',
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    count: getCategoryCount('dehumidifier'),
    isActive: true,
  },
  {
    slug: 'air-purifier',
    name: '空氣清淨機',
    icon: Wind,
    description: '淨化空氣品質',
    color: 'from-green-500 to-emerald-400',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    count: getCategoryCount('air-purifier'),
    isActive: true,
  },
  {
    slug: 'air-conditioner',
    name: '冷氣',
    icon: Snowflake,
    description: '夏日清涼首選',
    color: 'from-cyan-500 to-blue-400',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    count: getCategoryCount('air-conditioner'),
    isActive: true,
  },
  {
    slug: 'heater',
    name: '電暖器',
    icon: Flame,
    description: '冬季保暖神器',
    color: 'from-orange-500 to-red-400',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    count: getCategoryCount('heater'),
    isActive: true,
  },
  {
    slug: 'fan',
    name: '電風扇',
    icon: Fan,
    description: '省電涼爽',
    color: 'from-indigo-500 to-purple-400',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    count: getCategoryCount('fan'),
    isActive: true,
  },
])
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <SiteHeader />

    <!-- Hero Section with Category Navigation -->
    <section class="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold mb-3">
            家電規格比較，一目瞭然
          </h1>
          <p class="text-blue-100 text-lg">
            比較各品牌規格、價格，幫你找到最適合的家電
          </p>
        </div>

        <!-- Category Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="category in categories"
            :key="category.slug"
            :to="category.isActive ? `/${category.slug}` : undefined"
            :class="[
              'relative group rounded-2xl p-4 transition-all duration-300',
              category.isActive
                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm cursor-pointer hover:scale-105 hover:shadow-xl'
                : 'bg-white/5 cursor-not-allowed opacity-60'
            ]"
          >
            <div class="flex flex-col items-center text-center">
              <div
                :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110',
                  category.isActive ? 'bg-white/20' : 'bg-white/10'
                ]"
              >
                <component :is="category.icon" :size="24" class="text-white" />
              </div>
              <h3 class="font-semibold text-white mb-1">{{ category.name }}</h3>
              <p class="text-xs text-blue-200 mb-2">{{ category.description }}</p>
              <span
                v-if="category.isActive"
                class="text-xs bg-white/20 px-2 py-0.5 rounded-full"
              >
                {{ category.count }} 款
              </span>
              <span
                v-else
                class="text-xs bg-white/10 px-2 py-0.5 rounded-full text-blue-200"
              >
                敬請期待
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Wave Transition -->
    <div class="relative -mt-1">
      <svg
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-8 sm:h-12"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0L48 5C96 10 192 20 288 25C384 30 480 30 576 25C672 20 768 10 864 10C960 10 1056 20 1152 25C1248 30 1344 30 1392 30L1440 30V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0V0Z"
          class="fill-gray-50 dark:fill-gray-900"
        />
      </svg>
    </div>

    <main
      id="main-content"
      :class="[
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4',
        showCookieBanner ? 'pb-44 sm:pb-24' : ''
      ]"
      role="main"
    >
      <!-- Page Title -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-1">
          <Sparkles :size="24" class="text-blue-600" />
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">熱門推薦</h2>
        </div>
        <p class="text-gray-600 dark:text-gray-300">
          精選熱門家電商品，比較規格、價格
        </p>
      </div>

      <!-- 搜尋框 - 桌面版顯示 -->
      <div class="hidden md:block mb-6">
        <SearchAutocomplete
          v-model="searchQuery"
          placeholder="搜尋品牌、型號..."
          class="max-w-md"
          data-tour="search"
        />
      </div>

      <!-- Compare Tip Banner - 桌面版顯示 -->
      <div
        v-if="compareList.length === 0"
        class="hidden md:block mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl"
      >
        <div class="flex items-start gap-3">
          <GitCompare :size="20" class="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-blue-900">不知道選哪款？</p>
            <p class="text-sm text-blue-700 mt-0.5">
              點擊商品卡片下方的「加入比較」按鈕，最多可選 4 款並排比較規格！
            </p>
          </div>
        </div>
      </div>

      <!-- Tool Buttons - 桌面版顯示 (收藏功能) -->
      <div v-if="validFavoritesCount > 0" class="hidden md:flex flex-wrap gap-3 mb-6">
        <button
          :class="[
            'flex items-center gap-2 px-4 py-2.5 font-medium rounded-xl transition-all',
            showFavoritesOnly
              ? 'bg-red-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-500'
          ]"
          @click="showFavoritesOnly = !showFavoritesOnly"
        >
          <Heart :size="18" :fill="showFavoritesOnly ? 'currentColor' : 'none'" />
          我的收藏 ({{ validFavoritesCount }})
        </button>
      </div>

      <!-- 情境推薦 -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🎯</span>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">你的需求是？</h2>
        </div>
        <ScenarioRecommender />
      </div>

      <div>
        <!-- Mobile: Sort Bar -->
        <div class="lg:hidden flex items-center justify-between gap-2 mb-4 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <!-- 商品數量 -->
          <span class="text-sm text-gray-500 dark:text-gray-400 px-2">
            {{ displayedProducts.length }} 項結果
          </span>

          <!-- 收藏按鈕 (手機版) -->
          <button
            v-if="validFavoritesCount > 0"
            :class="[
              'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
              showFavoritesOnly
                ? 'bg-red-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @click="showFavoritesOnly = !showFavoritesOnly"
          >
            <Heart :size="16" :fill="showFavoritesOnly ? 'currentColor' : 'none'" />
            <span class="text-sm font-medium">{{ validFavoritesCount }}</span>
          </button>

          <!-- 排序選單 -->
          <div class="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <select
              v-model="sortBy"
              class="text-sm bg-transparent text-gray-700 dark:text-gray-200 font-medium focus:ring-0 focus:outline-none cursor-pointer border-0 p-0 pr-6"
            >
              <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Main Content (無側邊欄篩選器，首頁為綜合商品頁面) -->
        <div class="w-full">
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
                  <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Loading State - Skeleton -->
          <div
            v-if="!isReady"
            class="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6"
          >
            <ProductCardSkeleton v-for="i in 6" :key="i" />
          </div>

          <!-- Product Grid - 手機版2欄 -->
          <div
            v-else-if="displayedProducts.length > 0"
            class="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6"
          >
            <ProductCard
              v-for="(product, index) in paginatedProducts"
              :key="product.id"
              :product="product"
              :show-compare="true"
              :is-in-compare="isInCompare(product.id)"
              :is-favorite="isFavorite(product.id)"
              :search-query="searchQuery"
              :category-slug="getProductCategorySlug(product)"
              :priority="currentPage === 1 && index < 6"
              @toggle-compare="toggleCompare(product)"
              @toggle-favorite="toggleFavorite(product.id)"
            />
          </div>

          <!-- 分頁控制 -->
          <nav
            v-if="totalPages > 1"
            class="flex items-center justify-center gap-2 mt-8"
            role="navigation"
            aria-label="分頁導覽"
          >
            <!-- 上一頁 -->
            <button
              class="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === 1"
              aria-label="上一頁"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft :size="20" class="text-gray-600" aria-hidden="true" />
            </button>

            <!-- 第一頁 + 省略號 -->
            <template v-if="pageNumbers[0] > 1">
              <button
                class="w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                aria-label="第 1 頁"
                @click="goToPage(1)"
              >
                1
              </button>
              <span v-if="pageNumbers[0] > 2" class="text-gray-400" aria-hidden="true">...</span>
            </template>

            <!-- 頁碼按鈕 -->
            <button
              v-for="page in pageNumbers"
              :key="page"
              :class="[
                'w-10 h-10 rounded-lg border font-medium',
                page === currentPage
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              ]"
              :aria-label="`第 ${page} 頁`"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>

            <!-- 省略號 + 最後一頁 -->
            <template v-if="pageNumbers[pageNumbers.length - 1] < totalPages">
              <span v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1" class="text-gray-400" aria-hidden="true">...</span>
              <button
                class="w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                :aria-label="`第 ${totalPages} 頁`"
                @click="goToPage(totalPages)"
              >
                {{ totalPages }}
              </button>
            </template>

            <!-- 下一頁 -->
            <button
              class="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === totalPages"
              aria-label="下一頁"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight :size="20" class="text-gray-600" aria-hidden="true" />
            </button>
          </nav>

          <!-- 頁面資訊 -->
          <div v-if="totalPages > 1" class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
          </div>

          <!-- No Results -->
          <div
            v-if="isReady && displayedProducts.length === 0"
            class="text-center py-16 bg-white rounded-xl border border-gray-200"
          >
            <SearchX :size="48" class="mx-auto text-gray-300 mb-4" />
            <p class="text-gray-900 font-medium mb-2">
              {{ showFavoritesOnly ? '您還沒有收藏任何商品' : '沒有找到符合條件的產品' }}
            </p>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {{ showFavoritesOnly ? '點擊商品卡片上的愛心即可收藏' : searchQuery ? `找不到「${searchQuery}」相關的商品` : '試試調整篩選條件' }}
            </p>

            <!-- 搜尋建議 -->
            <div v-if="searchSuggestions.length > 0" class="mb-6">
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">試試搜尋這些品牌：</p>
              <div class="flex flex-wrap justify-center gap-2">
                <button
                  v-for="brand in searchSuggestions"
                  :key="brand"
                  class="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
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
    <footer
      :class="[
        'bg-white border-t border-gray-200 mt-16',
        (compareList.length > 0 || showCookieBanner) ? 'pb-24' : ''
      ]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 比比看. 本站包含聯盟行銷連結。</p>
          <p class="mt-1">價格與規格僅供參考，請以官方公告為準。</p>
        </div>
      </div>
    </footer>

    <!-- 回到頂部按鈕 -->
    <ClientOnly>
      <Transition name="fade">
        <button
          v-if="showScrollTop"
          :class="[
            'fixed right-4 sm:right-6 z-50 w-11 h-11 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110',
            compareList.length > 0
              ? (showCookieBanner ? 'bottom-52 sm:bottom-32' : 'bottom-36 sm:bottom-24')
              : (showCookieBanner ? 'bottom-44 sm:bottom-20' : 'bottom-28 sm:bottom-6')
          ]"
          @click="scrollToTop"
          aria-label="回到頂部"
        >
          <ArrowUp :size="22" />
        </button>
      </Transition>
    </ClientOnly>

    <!-- Compare Category Warning Toast -->
    <ClientOnly>
      <Transition name="toast">
        <div
          v-if="compareCategoryWarning"
          class="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-full mx-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg flex items-start gap-3"
        >
          <AlertCircle :size="20" class="text-amber-600 flex-shrink-0 mt-0.5" />
          <p class="text-sm text-amber-800">{{ compareCategoryWarning }}</p>
        </div>
      </Transition>
    </ClientOnly>

    <!-- Floating Compare Bar -->
    <FloatingCompareBar
      :compare-list="compareList"
      @remove="removeFromCompare"
      @clear="compareList = []"
      @compare="showCompareModal = true"
    />

    <!-- Modals -->
    <CompareModal
      v-if="showCompareModal"
      :products="compareList"
      :category-slug="compareCategorySlug"
      @close="showCompareModal = false"
      @remove="removeFromCompare"
    />

    <!-- Onboarding Tour for first-time users -->
    <OnboardingTour />
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

.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}
</style>
