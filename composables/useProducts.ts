import { ref, readonly } from 'vue'
import type { Dehumidifier, FilterState, SortOption } from '~/types'

// Supabase 配置
const SUPABASE_URL = 'https://tqyefifafabyudtyjfam.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ioNYT5D-3-ZPObp82HK5Yg_EEFwrGD5'

// 產品資料快取
let productsCache: Dehumidifier[] | null = null

async function fetchProducts(): Promise<Dehumidifier[]> {
  if (productsCache) {
    return productsCache
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
    productsCache = data as Dehumidifier[]
    return productsCache
  } catch (error) {
    console.error('Failed to fetch products from Supabase:', error)
    // 備用方案：從本地 JSON 載入
    try {
      const localData = await import('~/data/products.json')
      productsCache = localData.products as Dehumidifier[]
      return productsCache
    } catch {
      return []
    }
  }
}

// 同步版本的產品存取（使用快取）
function getProducts(): Dehumidifier[] {
  return productsCache || []
}

export const useProducts = () => {
  const products = ref<Dehumidifier[]>([])
  const isLoading = ref(false)

  const loadProducts = async (): Promise<Dehumidifier[]> => {
    isLoading.value = true
    try {
      const data = await fetchProducts()
      products.value = data
      return data
    } finally {
      isLoading.value = false
    }
  }

  const allProducts = readonly(products)

  const getAllBrands = (): string[] => {
    const p = getProducts()
    return [...new Set(p.map(prod => prod.brand))]
  }

  const getPriceRange = (): { min: number; max: number } => {
    const p = getProducts()
    if (p.length === 0) {
      return { min: 0, max: 100000 }
    }
    const prices = p.map(prod => prod.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  }

  const filterProducts = (filters: FilterState): Dehumidifier[] => {
    const p = getProducts()
    return p.filter(product => {
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
    const p = getProducts()
    // 優先使用 slug 欄位
    const bySlug = p.find(prod => prod.slug === slug)
    if (bySlug) return bySlug

    // 備用：使用 brand-model 格式
    return p.find(prod => {
      const productSlug = `${prod.brand.toLowerCase()}-${prod.model.toLowerCase()}`.replace(/[\s_]/g, '-')
      return productSlug === slug
    })
  }

  const getProductSlug = (product: Pick<Dehumidifier, 'brand' | 'model' | 'slug' | 'id'>): string => {
    if (product.slug) return product.slug
    return `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-')
  }

  const getAllSlugs = (): string[] => {
    const p = getProducts()
    return p.map(prod => getProductSlug(prod))
  }

  return {
    allProducts,
    isLoading: readonly(isLoading),
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
