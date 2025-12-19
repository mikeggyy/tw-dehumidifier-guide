<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
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
  Home,
  ChevronDown,
} from 'lucide-vue-next'
import type { GenericFilterState, SortOption, Product } from '~/types'
import ProductCard from '~/components/ProductCard.vue'
import ProductCardSkeleton from '~/components/ProductCardSkeleton.vue'
import CompareModal from '~/components/CompareModal.vue'
import RoomCalculator from '~/components/RoomCalculator.vue'
import ProductFinder from '~/components/ProductFinder.vue'
import AirPurifierCalculator from '~/components/AirPurifierCalculator.vue'
import AirPurifierFinder from '~/components/AirPurifierFinder.vue'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useCategoryConfig, categoryConfigs } from '~/composables/useCategoryConfig'
import { useRoute, useHead, createError } from '#imports'

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

const { allProducts, isLoading, getAllBrands, getPriceRange, filterProducts, sortProducts, getProductSlug } = useProducts()

// 只顯示當前品類的商品
const categoryProducts = computed(() => {
  return allProducts.value.filter(p =>
    (p as any).category_slug === categorySlug.value || categorySlug.value === 'dehumidifier'
  )
})

// SEO
useHead({
  title: `${categoryConfig.value?.name || ''} | 比比看`,
  meta: [
    {
      name: 'description',
      content: categoryConfig.value?.seoDescription || '',
    },
  ],
})

// 分頁設定
const ITEMS_PER_PAGE = 20
const currentPage = ref(1)

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
  loadFavorites()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
const applyQuickTag = (tag: { label: string }) => {
  if (activeQuickTag.value === tag.label) {
    activeQuickTag.value = null
    resetFilters()
  } else {
    activeQuickTag.value = tag.label
    // TODO: Apply tag filter based on categoryConfig
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

// Mobile filter panel
const showMobileFilters = ref(false)

// Computed filtered and sorted products
const displayedProducts = computed(() => {
  let filtered = filterProducts(filters as any)

  // 只顯示當前品類
  filtered = filtered.filter(p =>
    (p as any).category_slug === categorySlug.value || categorySlug.value === 'dehumidifier'
  )

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
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return displayedProducts.value.slice(start, end)
})

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

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch([() => filters.brands, () => filters.priceMin, () => filters.priceMax, sortBy, searchQuery], () => {
  currentPage.value = 1
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

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

const getDisplayBrand = (product: any): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
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

// 品類導覽列表
const allCategories = computed(() => [
  { slug: 'dehumidifier', name: '除濕機', icon: Droplets, isActive: true },
  { slug: 'air-purifier', name: '空氣清淨機', icon: Wind, isActive: true },
  { slug: 'air-conditioner', name: '冷氣', icon: Snowflake, isActive: false },
  { slug: 'heater', name: '電暖器', icon: Flame, isActive: false },
  { slug: 'fan', name: '電風扇', icon: Fan, isActive: false },
])

// 品類選擇器下拉狀態
const showCategoryDropdown = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">比比看</span>
          </NuxtLink>

          <!-- Category Selector (Desktop) -->
          <div class="hidden sm:flex items-center gap-1">
            <NuxtLink
              to="/"
              class="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Home :size="16" />
              <span class="text-sm">全部品類</span>
            </NuxtLink>
            <ChevronRight :size="16" class="text-gray-300" />
            <!-- Current Category Dropdown -->
            <div class="relative">
              <button
                class="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm"
                @click="showCategoryDropdown = !showCategoryDropdown"
              >
                <component :is="CategoryIcon" :size="16" />
                {{ categoryConfig?.name }}
                <ChevronDown :size="16" :class="['transition-transform', showCategoryDropdown ? 'rotate-180' : '']" />
              </button>
              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                  v-if="showCategoryDropdown"
                  class="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  @mouseleave="showCategoryDropdown = false"
                >
                  <NuxtLink
                    v-for="cat in allCategories"
                    :key="cat.slug"
                    :to="cat.isActive ? `/${cat.slug}` : '#'"
                    :class="[
                      'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                      cat.slug === categorySlug
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : cat.isActive
                          ? 'text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                    ]"
                    @click="showCategoryDropdown = false"
                  >
                    <component :is="cat.icon" :size="18" />
                    {{ cat.name }}
                    <span v-if="!cat.isActive" class="ml-auto text-xs text-gray-400">敬請期待</span>
                  </NuxtLink>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Mobile: Back to Home -->
          <NuxtLink
            to="/"
            class="sm:hidden flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-blue-600"
          >
            <Home :size="18" />
            <span class="text-sm">品類</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Title -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <component :is="CategoryIcon" :size="32" class="text-blue-600" />
          {{ categoryConfig?.name }}規格比較
        </h1>
        <p class="mt-2 text-gray-600">
          收錄 {{ categoryProducts.length }} {{ categoryConfig?.namePlural }}，{{ categoryConfig?.description }}
        </p>
      </div>

      <!-- 搜尋框 -->
      <div class="mb-6">
        <div class="relative max-w-md">
          <Search :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋品牌、型號..."
            class="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="searchQuery = ''"
          >
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Compare Tip Banner -->
      <div
        v-if="compareList.length === 0"
        class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl"
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

      <!-- Tool Buttons -->
      <div class="flex flex-wrap gap-3 mb-6">
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
        <button
          v-if="favorites.size > 0"
          :class="[
            'flex items-center gap-2 px-4 py-2.5 font-medium rounded-xl transition-all',
            showFavoritesOnly
              ? 'bg-red-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-500'
          ]"
          @click="showFavoritesOnly = !showFavoritesOnly"
        >
          <Heart :size="18" :fill="showFavoritesOnly ? 'currentColor' : 'none'" />
          我的收藏 ({{ favorites.size }})
        </button>
      </div>

      <!-- Quick Filter Tags -->
      <div v-if="categoryConfig?.quickTags" class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="tag in categoryConfig.quickTags"
          :key="tag.label"
          :class="[
            'px-3 py-1.5 text-sm rounded-full transition-all',
            activeQuickTag === tag.label
              ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
          ]"
          @click="applyQuickTag(tag)"
        >
          {{ tag.label }}
        </button>
      </div>

      <div class="lg:flex lg:gap-8">
        <!-- Mobile Filter Button -->
        <button
          class="lg:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium"
          @click="showMobileFilters = true"
        >
          <Filter :size="20" />
          篩選條件
        </button>

        <!-- Sidebar Filters -->
        <aside
          :class="[
            'fixed inset-0 z-50 lg:relative lg:inset-auto',
            'lg:block lg:w-64 lg:flex-shrink-0',
            showMobileFilters ? 'block' : 'hidden'
          ]"
        >
          <div
            class="absolute inset-0 bg-black/50 lg:hidden"
            @click="showMobileFilters = false"
          />

          <div class="absolute right-0 top-0 h-full w-80 lg:w-full lg:relative lg:h-auto bg-white lg:bg-transparent lg:rounded-xl overflow-y-auto">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
              <span class="font-semibold text-gray-900">篩選條件</span>
              <button @click="showMobileFilters = false">
                <X :size="24" class="text-gray-500" />
              </button>
            </div>

            <div class="p-4 lg:p-0 space-y-6">
              <!-- Brand Filter -->
              <div class="bg-white rounded-xl p-4 lg:border lg:border-gray-200">
                <h3 class="font-semibold text-gray-900 mb-3">品牌</h3>
                <div class="space-y-2">
                  <label
                    v-for="brand in majorBrands"
                    :key="brand"
                    class="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      :checked="filters.brands.includes(brand)"
                      class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      @change="toggleBrand(brand)"
                    />
                    <span class="text-gray-700 flex-1">{{ brand }}</span>
                    <span class="text-xs text-gray-400 group-hover:text-gray-600">{{ getBrandCount(brand) }}</span>
                  </label>

                  <div v-if="otherBrands.length > 0">
                    <button
                      class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 mb-2"
                      @click="showAllBrands = !showAllBrands"
                    >
                      <ChevronRight
                        :size="16"
                        :class="['transition-transform', showAllBrands ? 'rotate-90' : '']"
                      />
                      {{ showAllBrands ? '收起' : `其他品牌 (${otherBrands.length})` }}
                    </button>

                    <div v-show="showAllBrands" class="space-y-2 pl-2 border-l-2 border-gray-100">
                      <label
                        v-for="brand in otherBrands"
                        :key="brand"
                        class="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          :checked="filters.brands.includes(brand)"
                          class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          @change="toggleBrand(brand)"
                        />
                        <span class="text-gray-600 text-sm flex-1">{{ brand }}</span>
                        <span class="text-xs text-gray-400 group-hover:text-gray-600">{{ getBrandCount(brand) }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Price Range Filter -->
              <div class="bg-white rounded-xl p-4 lg:border lg:border-gray-200">
                <h3 class="font-semibold text-gray-900 mb-3">價格範圍</h3>
                <div class="space-y-4">
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="filters.priceMin"
                      type="number"
                      :min="priceRange.min"
                      :max="filters.priceMax"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="最低"
                    />
                    <span class="text-gray-400">-</span>
                    <input
                      v-model.number="filters.priceMax"
                      type="number"
                      :min="filters.priceMin"
                      :max="priceRange.max"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="最高"
                    />
                  </div>
                  <p class="text-xs text-gray-500">
                    NT$ {{ formatPrice(filters.priceMin) }} - NT$ {{ formatPrice(filters.priceMax) }}
                  </p>
                </div>
              </div>

              <!-- Reset Button -->
              <button
                class="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
          <!-- Sort Bar -->
          <div class="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border border-gray-200">
            <span class="text-sm text-gray-600">
              顯示 <strong>{{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}-{{ Math.min(currentPage * ITEMS_PER_PAGE, displayedProducts.length) }}</strong> / {{ displayedProducts.length }} 項結果
            </span>
            <div class="flex items-center gap-2">
              <SlidersHorizontal :size="18" class="text-gray-400" />
              <select
                v-model="sortBy"
                class="text-sm border-0 bg-transparent text-gray-700 font-medium focus:ring-0 cursor-pointer"
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

          <!-- Loading State -->
          <div
            v-if="!isReady"
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <ProductCardSkeleton v-for="i in 6" :key="i" />
          </div>

          <!-- Product Grid -->
          <div
            v-else-if="displayedProducts.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
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

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-center gap-2 mt-8"
          >
            <button
              class="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft :size="20" class="text-gray-600" />
            </button>

            <template v-if="pageNumbers[0] > 1">
              <button
                class="w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                @click="goToPage(1)"
              >
                1
              </button>
              <span v-if="pageNumbers[0] > 2" class="text-gray-400">...</span>
            </template>

            <button
              v-for="page in pageNumbers"
              :key="page"
              :class="[
                'w-10 h-10 rounded-lg border font-medium',
                page === currentPage
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              ]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>

            <template v-if="pageNumbers[pageNumbers.length - 1] < totalPages">
              <span v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1" class="text-gray-400">...</span>
              <button
                class="w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                @click="goToPage(totalPages)"
              >
                {{ totalPages }}
              </button>
            </template>

            <button
              class="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight :size="20" class="text-gray-600" />
            </button>
          </div>

          <div v-if="totalPages > 1" class="text-center text-sm text-gray-500 mt-4">
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
            <p class="text-gray-500 text-sm mb-6">
              {{ showFavoritesOnly ? '點擊商品卡片上的愛心即可收藏' : searchQuery ? `找不到「${searchQuery}」相關的商品` : '試試調整篩選條件' }}
            </p>

            <div v-if="searchSuggestions.length > 0" class="mb-6">
              <p class="text-sm text-gray-500 mb-2">試試搜尋這些品牌：</p>
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
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500 text-sm">
          <p>© 2025 比比看. 本站包含聯盟行銷連結。</p>
          <p class="mt-1">價格與規格僅供參考，請以官方公告為準。</p>
        </div>
      </div>
    </footer>

    <!-- Scroll to top -->
    <Transition name="fade">
      <button
        v-if="showScrollTop"
        class="fixed bottom-24 right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        @click="scrollToTop"
        aria-label="回到頂部"
      >
        <ArrowUp :size="24" />
      </button>
    </Transition>

    <!-- Floating Compare Bar -->
    <Transition name="slide-up">
      <div
        v-if="compareList.length > 0"
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-4"
      >
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <GitCompare :size="20" class="text-blue-600" />
            <span class="font-medium text-gray-900">
              已選 {{ compareList.length }} / 4 項商品
            </span>
            <div class="hidden sm:flex items-center gap-2">
              <div
                v-for="product in compareList"
                :key="product.id"
                class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
              >
                <span class="truncate max-w-[100px]">{{ getDisplayBrand(product) || product.model }}</span>
                <button
                  class="text-gray-400 hover:text-red-500"
                  @click="removeFromCompare(product.id)"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="text-sm text-gray-500 hover:text-gray-700"
              @click="compareList = []"
            >
              清除全部
            </button>
            <button
              :disabled="compareList.length < 2"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                compareList.length >= 2
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              ]"
              @click="showCompareModal = true"
            >
              比較 ({{ compareList.length }})
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Compare Modal -->
    <CompareModal
      v-if="showCompareModal"
      :products="compareList"
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
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
