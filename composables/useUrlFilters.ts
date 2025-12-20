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

  // Parse URL query params
  const parseUrlFilters = (): Partial<UrlFilterState> => {
    const query = route.query

    return {
      brands: query.brands ? String(query.brands).split(',').filter(Boolean) : [],
      capacityRange: String(query.capacity || 'all'),
      priceMin: query.priceMin ? Number(query.priceMin) : defaultPriceRange.min,
      priceMax: query.priceMax ? Number(query.priceMax) : defaultPriceRange.max,
      sort: (query.sort as SortOption) || 'popularity',
      q: String(query.q || ''),
      page: query.page ? Number(query.page) : 1,
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
