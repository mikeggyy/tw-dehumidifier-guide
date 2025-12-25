import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import type { FilterState, SortOption } from '~/types'

interface UrlFilterState {
  brands: string[]
  capacityRange: string
  priceMin: number
  priceMax: number
  sort: SortOption
  q: string
  page: number
}

export function useUrlFilters(defaultPriceRange: { min: number; max: number }) {
  const route = useRoute()
  const router = useRouter()

  // 輔助函數：安全解析數字（處理 NaN 和無效值）
  const parseNumber = (value: unknown, defaultValue: number, min = 0): number => {
    const num = Number(value)
    if (Number.isNaN(num) || !Number.isFinite(num)) return defaultValue
    return Math.max(min, num)
  }

  // 驗證排序選項
  const validSortOptions: SortOption[] = ['popularity', 'price_asc', 'price_desc', 'noise_asc', 'capacity_desc', 'discount_desc', 'value_asc']
  const parseSort = (value: unknown): SortOption => {
    if (validSortOptions.includes(value as SortOption)) {
      return value as SortOption
    }
    return 'popularity'
  }

  // Parse URL query params（含輸入驗證）
  const parseUrlFilters = (): Partial<UrlFilterState> => {
    const query = route.query

    // 安全解析價格範圍
    const priceMin = parseNumber(query.priceMin, defaultPriceRange.min, 0)
    const priceMax = parseNumber(query.priceMax, defaultPriceRange.max, 0)

    return {
      brands: query.brands ? String(query.brands).split(',').filter(Boolean) : [],
      capacityRange: String(query.capacity || 'all'),
      // 確保 priceMin <= priceMax
      priceMin: Math.min(priceMin, priceMax),
      priceMax: Math.max(priceMin, priceMax),
      sort: parseSort(query.sort),
      // 限制搜尋字串長度防止 DoS
      q: String(query.q || '').slice(0, 200),
      // 頁碼至少為 1
      page: Math.max(1, Math.floor(parseNumber(query.page, 1, 1))),
    }
  }

  // Update URL with current filters
  const updateUrl = (filters: Partial<UrlFilterState>, replace = false) => {
    const query: Record<string, string | undefined> = {}

    // Only add params that differ from defaults
    if (filters.brands && filters.brands.length > 0) {
      query.brands = filters.brands.join(',')
    }
    if (filters.capacityRange && filters.capacityRange !== 'all') {
      query.capacity = filters.capacityRange
    }
    if (filters.priceMin && filters.priceMin !== defaultPriceRange.min) {
      query.priceMin = String(filters.priceMin)
    }
    if (filters.priceMax && filters.priceMax !== defaultPriceRange.max) {
      query.priceMax = String(filters.priceMax)
    }
    if (filters.sort && filters.sort !== 'popularity') {
      query.sort = filters.sort
    }
    if (filters.q) {
      query.q = filters.q
    }
    if (filters.page && filters.page > 1) {
      query.page = String(filters.page)
    }

    // Use replace for filter changes to avoid too many history entries
    if (replace) {
      router.replace({ query })
    } else {
      router.push({ query })
    }
  }

  // Clear all filters
  const clearUrlFilters = () => {
    router.push({ query: {} })
  }

  // Check if there are any active filters
  const hasActiveFilters = (): boolean => {
    const filters = parseUrlFilters()
    return !!(
      (filters.brands && filters.brands.length > 0) ||
      (filters.capacityRange && filters.capacityRange !== 'all') ||
      (filters.priceMin && filters.priceMin !== defaultPriceRange.min) ||
      (filters.priceMax && filters.priceMax !== defaultPriceRange.max) ||
      (filters.sort && filters.sort !== 'popularity') ||
      filters.q
    )
  }

  // Generate shareable URL
  const getShareableUrl = (): string => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }

  return {
    parseUrlFilters,
    updateUrl,
    clearUrlFilters,
    hasActiveFilters,
    getShareableUrl,
  }
}
