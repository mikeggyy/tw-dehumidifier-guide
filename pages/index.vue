<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Filter, SlidersHorizontal, X } from 'lucide-vue-next'
import type { FilterState, SortOption } from '~/types'
import ProductCard from '~/components/ProductCard.vue'
import { useProducts } from '~/composables/useProducts'

const { allProducts, isLoading, loadProducts, getAllBrands, getPriceRange, filterProducts, sortProducts } = useProducts()

// 載入產品資料
const isReady = ref(false)

// Get available brands and price range (reactive)
const brands = computed(() => getAllBrands())
const priceRange = computed(() => getPriceRange())

// Filter state
const filters = reactive<FilterState>({
  brands: [],
  capacityRange: 'all',
  priceMin: 0,
  priceMax: 100000
})

// 初始化價格範圍 (在 loadProducts 之後)
const initPriceRange = () => {
  const range = priceRange.value
  filters.priceMin = range.min
  filters.priceMax = range.max
}

onMounted(async () => {
  await loadProducts()
  initPriceRange()
  isReady.value = true
})

// Sort state
const sortBy = ref<SortOption>('popularity')

// Mobile filter panel
const showMobileFilters = ref(false)

// Computed filtered and sorted products
const displayedProducts = computed(() => {
  const filtered = filterProducts(filters)
  return sortProducts(filtered, sortBy.value)
})

// Toggle brand filter
const toggleBrand = (brand: string) => {
  const index = filters.brands.indexOf(brand)
  if (index === -1) {
    filters.brands.push(brand)
  } else {
    filters.brands.splice(index, 1)
  }
}

// Reset filters
const resetFilters = () => {
  filters.brands = []
  filters.capacityRange = 'all'
  filters.priceMin = priceRange.value.min
  filters.priceMax = priceRange.value.max
}

// Format price for display
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

// Sort options
const sortOptions = [
  { value: 'popularity', label: '熱門推薦' },
  { value: 'price_asc', label: '價格：低到高' },
  { value: 'price_desc', label: '價格：高到低' },
  { value: 'noise_asc', label: '最安靜' },
  { value: 'capacity_desc', label: '除濕力：強到弱' }
]

// Capacity options
const capacityOptions = [
  { value: 'all', label: '全部容量' },
  { value: 'under10', label: '10L 以下' },
  { value: '10to15', label: '10-15L' },
  { value: 'over15', label: '15L 以上' }
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-xl font-bold text-blue-600">除濕機比較</span>
          </NuxtLink>
          <nav class="hidden sm:flex items-center gap-6">
            <span class="text-sm text-gray-600">2025 最新款式</span>
          </nav>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Title -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">除濕機規格比較</h1>
        <p class="mt-2 text-gray-600">
          收錄 {{ allProducts.length }} 款熱門除濕機，比較規格、價格，找到最適合你的選擇
        </p>
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
          <!-- Mobile overlay -->
          <div
            class="absolute inset-0 bg-black/50 lg:hidden"
            @click="showMobileFilters = false"
          />

          <!-- Filter panel -->
          <div class="absolute right-0 top-0 h-full w-80 lg:w-full lg:relative lg:h-auto bg-white lg:bg-transparent lg:rounded-xl overflow-y-auto">
            <!-- Mobile header -->
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
                    v-for="brand in brands"
                    :key="brand"
                    class="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :checked="filters.brands.includes(brand)"
                      class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      @change="toggleBrand(brand)"
                    />
                    <span class="text-gray-700">{{ brand }}</span>
                  </label>
                </div>
              </div>

              <!-- Capacity Filter -->
              <div class="bg-white rounded-xl p-4 lg:border lg:border-gray-200">
                <h3 class="font-semibold text-gray-900 mb-3">日除濕量</h3>
                <div class="space-y-2">
                  <label
                    v-for="option in capacityOptions"
                    :key="option.value"
                    class="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      :value="option.value"
                      v-model="filters.capacityRange"
                      class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span class="text-gray-700">{{ option.label }}</span>
                  </label>
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

            <!-- Mobile Apply Button -->
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
              顯示 <strong>{{ displayedProducts.length }}</strong> 項結果
            </span>
            <div class="flex items-center gap-2">
              <SlidersHorizontal :size="18" class="text-gray-400" />
              <select
                v-model="sortBy"
                class="text-sm border-0 bg-transparent text-gray-700 font-medium focus:ring-0 cursor-pointer"
              >
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-if="!isReady"
            class="text-center py-16 bg-white rounded-xl border border-gray-200"
          >
            <p class="text-gray-500">載入中...</p>
          </div>

          <!-- Product Grid -->
          <div
            v-else-if="displayedProducts.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <ProductCard
              v-for="product in displayedProducts"
              :key="product.id"
              :product="product"
            />
          </div>

          <!-- No Results -->
          <div
            v-else
            class="text-center py-16 bg-white rounded-xl border border-gray-200"
          >
            <p class="text-gray-500 mb-4">沒有找到符合條件的產品</p>
            <button
              class="text-blue-600 hover:text-blue-700 font-medium"
              @click="resetFilters"
            >
              清除篩選條件
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500 text-sm">
          <p>© 2025 除濕機比較. 本站包含聯盟行銷連結。</p>
          <p class="mt-1">價格與規格僅供參考，請以官方公告為準。</p>
        </div>
      </div>
    </footer>
  </div>
</template>
