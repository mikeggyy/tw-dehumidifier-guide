import { ref, readonly, computed } from 'vue'
import type { Dehumidifier, FilterState, SortOption } from '~/types'

// Supabase 配置
const SUPABASE_URL = 'https://tqyefifafabyudtyjfam.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ioNYT5D-3-ZPObp82HK5Yg_EEFwrGD5'

// 全域響應式產品資料（跨組件共享）
const globalProducts = ref<Dehumidifier[]>([])
const isGlobalLoading = ref(false)
let hasLoaded = false

async function fetchProducts(): Promise<Dehumidifier[]> {
  if (hasLoaded && globalProducts.value.length > 0) {
    return globalProducts.value
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?in_stock=eq.true&order=price.asc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    globalProducts.value = data as Dehumidifier[]
    hasLoaded = true
    return globalProducts.value
  } catch (error) {
    console.error('Failed to fetch products from Supabase:', error)
    // 備用方案：從本地 JSON 載入
    try {
      const localData = await import('~/data/products.json')
      globalProducts.value = localData.products as Dehumidifier[]
      hasLoaded = true
      return globalProducts.value
    } catch {
      return []
    }
  }
}

export const useProducts = () => {
  const loadProducts = async (): Promise<Dehumidifier[]> => {
    if (isGlobalLoading.value) {
      // 等待載入完成
      while (isGlobalLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return globalProducts.value
    }

    isGlobalLoading.value = true
    try {
      return await fetchProducts()
    } finally {
      isGlobalLoading.value = false
    }
  }

  const allProducts = readonly(globalProducts)
  const isLoading = readonly(isGlobalLoading)

  const getAllBrands = (): string[] => {
    return [...new Set(globalProducts.value.map(prod => prod.brand))].sort()
  }

  const getPriceRange = (): { min: number; max: number } => {
    if (globalProducts.value.length === 0) {
      return { min: 0, max: 100000 }
    }
    const prices = globalProducts.value.map(prod => prod.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  }

  const filterProducts = (filters: FilterState): Dehumidifier[] => {
    return globalProducts.value.filter(product => {
      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false
      }

      // Capacity filter
      const capacity = product.daily_capacity ?? 0
      if (filters.capacityRange !== 'all') {
        if (filters.capacityRange === 'under10' && capacity >= 10) return false
        if (filters.capacityRange === '10to15' && (capacity < 10 || capacity > 15)) return false
        if (filters.capacityRange === 'over15' && capacity <= 15) return false
      }

      // Price filter
      if (product.price < filters.priceMin || product.price > filters.priceMax) {
        return false
      }

      return true
    })
  }

  const sortProducts = (items: Dehumidifier[], sortBy: SortOption): Dehumidifier[] => {
    const sorted = [...items]
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price)
      case 'noise_asc':
        return sorted.sort((a, b) => (a.noise_level ?? 99) - (b.noise_level ?? 99))
      case 'capacity_desc':
        return sorted.sort((a, b) => (b.daily_capacity ?? 0) - (a.daily_capacity ?? 0))
      case 'popularity':
      default:
        return sorted
    }
  }

  const getProductBySlug = (slug: string): Dehumidifier | undefined => {
    // 優先使用 slug 欄位
    const bySlug = globalProducts.value.find(prod => prod.slug === slug)
    if (bySlug) return bySlug

    // 備用：使用 brand-model 格式
    return globalProducts.value.find(prod => {
      const productSlug = `${prod.brand.toLowerCase()}-${prod.model.toLowerCase()}`.replace(/[\s_]/g, '-')
      return productSlug === slug
    })
  }

  const getProductSlug = (product: Pick<Dehumidifier, 'brand' | 'model' | 'slug' | 'id'>): string => {
    if (product.slug) return product.slug
    return `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-')
  }

  const getAllSlugs = (): string[] => {
    return globalProducts.value.map(prod => getProductSlug(prod))
  }

  return {
    allProducts,
    isLoading,
    loadProducts,
    getAllBrands,
    getPriceRange,
    filterProducts,
    sortProducts,
    getProductBySlug,
    getProductSlug,
    getAllSlugs
  }
}
