<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, X, TrendingUp, Clock } from 'lucide-vue-next'
import { useProducts } from '~/composables/useProducts'
import { formatPrice } from '~/utils/product'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  categorySlug?: string
}>(), {
  placeholder: '搜尋商品...',
  categorySlug: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
  'select': [product: any]
}>()

const { allProducts } = useProducts()
const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(-1)

// Recent searches from localStorage
const recentSearches = ref<string[]>([])

const loadRecentSearches = () => {
  if (typeof window === 'undefined') return
  try {
    const saved = localStorage.getItem('recent-searches')
    recentSearches.value = saved ? JSON.parse(saved) : []
  } catch {
    recentSearches.value = []
  }
}

const saveRecentSearch = (query: string) => {
  if (!query.trim() || typeof window === 'undefined') return
  recentSearches.value = [
    query,
    ...recentSearches.value.filter(s => s !== query)
  ].slice(0, 5)
  localStorage.setItem('recent-searches', JSON.stringify(recentSearches.value))
}

// Filter products based on query
const suggestions = computed(() => {
  const query = props.modelValue.toLowerCase().trim()
  if (!query || query.length < 2) return []

  return allProducts.value
    .filter(p => {
      if (props.categorySlug && (p as any).category_slug !== props.categorySlug) {
        return false
      }
      const name = p.name.toLowerCase()
      const brand = (p.brand || '').toLowerCase()
      return name.includes(query) || brand.includes(query)
    })
    .slice(0, 6)
})

// Popular brands for suggestions
const popularBrands = computed(() => {
  const brands = new Map<string, number>()
  allProducts.value.forEach(p => {
    if (p.brand && p.brand !== 'Other') {
      brands.set(p.brand, (brands.get(p.brand) || 0) + 1)
    }
  })
  return Array.from(brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([brand]) => brand)
})

const showDropdown = computed(() => {
  return isOpen.value && (
    suggestions.value.length > 0 ||
    recentSearches.value.length > 0 ||
    !props.modelValue
  )
})

const handleInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  selectedIndex.value = -1
}

const handleFocus = () => {
  isOpen.value = true
  loadRecentSearches()
}

const handleBlur = () => {
  // Delay to allow click on suggestions
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

const handleKeydown = (e: KeyboardEvent) => {
  const items = suggestions.value.length > 0 ? suggestions.value : []
  const maxIndex = items.length - 1

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex.value >= 0 && items[selectedIndex.value]) {
        selectProduct(items[selectedIndex.value])
      } else {
        handleSearch()
      }
      break
    case 'Escape':
      isOpen.value = false
      inputRef.value?.blur()
      break
  }
}

const selectProduct = (product: any) => {
  emit('select', product)
  isOpen.value = false
}

const handleSearch = () => {
  if (props.modelValue.trim()) {
    saveRecentSearch(props.modelValue.trim())
    emit('search', props.modelValue)
  }
  isOpen.value = false
}

const selectRecentSearch = (query: string) => {
  emit('update:modelValue', query)
  emit('search', query)
  isOpen.value = false
}

const selectBrand = (brand: string) => {
  emit('update:modelValue', brand)
  emit('search', brand)
  isOpen.value = false
}

const clearInput = () => {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}
</script>

<template>
  <div class="relative">
    <!-- Input -->
    <div class="relative">
      <Search
        :size="18"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        class="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="showDropdown"
        aria-haspopup="listbox"
        aria-controls="search-listbox"
        :aria-activedescendant="selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="清除搜尋"
        @mousedown.prevent="clearInput"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown"
        id="search-listbox"
        role="listbox"
        aria-label="搜尋建議"
        class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        <!-- Product suggestions -->
        <div v-if="suggestions.length > 0" class="p-2">
          <p id="suggestions-label" class="text-xs text-gray-400 px-2 mb-2">商品建議</p>
          <button
            v-for="(product, index) in suggestions"
            :id="`search-option-${index}`"
            :key="product.id"
            role="option"
            :aria-selected="selectedIndex === index"
            class="w-full flex items-center gap-3 p-2 rounded-lg transition-colors"
            :class="[
              selectedIndex === index
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
            @mousedown.prevent="selectProduct(product)"
          >
            <img
              :src="product.image_url"
              :alt="product.name"
              class="w-10 h-10 object-cover rounded-lg bg-gray-100"
              loading="lazy"
              decoding="async"
            />
            <div class="flex-1 text-left min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ product.name }}
              </p>
              <p class="text-xs text-blue-600">NT$ {{ formatPrice(product.price) }}</p>
            </div>
          </button>
        </div>

        <!-- Recent searches -->
        <div v-else-if="recentSearches.length > 0 && !modelValue" class="p-2">
          <p class="text-xs text-gray-400 px-2 mb-2 flex items-center gap-1">
            <Clock :size="12" />
            最近搜尋
          </p>
          <button
            v-for="query in recentSearches"
            :key="query"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @mousedown.prevent="selectRecentSearch(query)"
          >
            <Clock :size="14" class="text-gray-400" />
            {{ query }}
          </button>
        </div>

        <!-- Popular brands -->
        <div v-if="!modelValue && popularBrands.length > 0" class="p-2 border-t border-gray-100 dark:border-gray-700">
          <p class="text-xs text-gray-400 px-2 mb-2 flex items-center gap-1">
            <TrendingUp :size="12" />
            熱門品牌
          </p>
          <div class="flex flex-wrap gap-2 px-2">
            <button
              v-for="brand in popularBrands"
              :key="brand"
              class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors"
              @mousedown.prevent="selectBrand(brand)"
            >
              {{ brand }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
