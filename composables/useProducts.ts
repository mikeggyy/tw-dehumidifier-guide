import { ref, readonly } from 'vue'
import { useFetch, useRuntimeConfig } from '#imports'
import type { Dehumidifier, FilterState, SortOption } from '~/types'

// Supabase 配置 - 使用 runtimeConfig（在 composable 外部定義 fallback 值）
const DEFAULT_SUPABASE_URL = 'https://tqyefifafabyudtyjfam.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ioNYT5D-3-ZPObp82HK5Yg_EEFwrGD5'

// Helper function to get Supabase config
function getSupabaseConfig() {
  try {
    const config = useRuntimeConfig()
    return {
      url: config.public.supabaseUrl || DEFAULT_SUPABASE_URL,
      anonKey: config.public.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
    }
  } catch {
    // Fallback for contexts where useRuntimeConfig is not available
    return {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
    }
  }
}

// 全域響應式產品資料（跨組件共享）
const globalProducts = ref<Dehumidifier[]>([])
const isGlobalLoading = ref(false)
let hasLoaded = false

// 從本地 JSON 檔案載入指定品類資料
async function loadLocalCategoryProducts(category: string): Promise<Dehumidifier[]> {
  const products: Dehumidifier[] = []

  try {
    if (category === 'dehumidifier') {
      const data = await import('~/data/products.json')
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => ({
          ...p,
          category_slug: p.category_slug || 'dehumidifier',
        })))
      }
    } else if (category === 'air-purifier') {
      const data = await import('~/data/air_purifiers.json')
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => ({
          ...p,
          category_slug: 'air-purifier',
          slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
          affiliate_url: p.affiliate_url || p.momo_url,
        })))
      }
    } else if (category === 'air-conditioner') {
      const data = await import('~/data/air_conditioners.json')
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => ({
          ...p,
          category_slug: 'air-conditioner',
          slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
          affiliate_url: p.affiliate_url || p.momo_url,
        })))
      }
    } else if (category === 'heater') {
      const data = await import('~/data/heaters.json')
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => ({
          ...p,
          category_slug: 'heater',
          slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
          affiliate_url: p.affiliate_url || p.momo_url,
        })))
      }
    } else if (category === 'fan') {
      const data = await import('~/data/fans.json')
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => ({
          ...p,
          category_slug: 'fan',
          slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
          affiliate_url: p.affiliate_url || p.momo_url,
        })))
      }
    }
  } catch (e) {
    console.warn(`Failed to load ${category} data:`, e)
  }

  return products
}

// 從本地 JSON 檔案載入所有品類資料
async function loadLocalProducts(): Promise<Dehumidifier[]> {
  const categories = ['dehumidifier', 'air-purifier', 'air-conditioner', 'heater', 'fan']
  const allProducts: Dehumidifier[] = []

  for (const category of categories) {
    const products = await loadLocalCategoryProducts(category)
    allProducts.push(...products)
  }

  return allProducts
}

// 補充缺少的品類資料（從本地 JSON 載入）
async function supplementMissingCategories(existingProducts: Dehumidifier[]): Promise<Dehumidifier[]> {
  const allProducts = [...existingProducts]
  const categories = ['dehumidifier', 'air-purifier', 'air-conditioner', 'heater', 'fan']

  // 檢查每個品類是否有資料
  for (const category of categories) {
    const hasCategory = existingProducts.some(p =>
      (p as any).category_slug === category ||
      (category === 'dehumidifier' && !(p as any).category_slug)
    )

    if (!hasCategory) {
      console.log(`Supplementing missing category: ${category}`)
      const localProducts = await loadLocalCategoryProducts(category)
      allProducts.push(...localProducts)
    }
  }

  return allProducts
}

async function fetchProducts(): Promise<Dehumidifier[]> {
  if (hasLoaded && globalProducts.value.length > 0) {
    return globalProducts.value
  }

  const { url, anonKey } = getSupabaseConfig()

  try {
    const response = await fetch(
      `${url}/rest/v1/products?in_stock=eq.true`,
      {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json() as Dehumidifier[]
    // 補充 Supabase 中缺少的品類資料
    const allProducts = await supplementMissingCategories(data)
    globalProducts.value = allProducts
    hasLoaded = true
    return globalProducts.value
  } catch (error) {
    console.error('Failed to fetch products from Supabase:', error)
    // 備用方案：從本地 JSON 載入（支援多品類）
    const localProducts = await loadLocalProducts()
    if (localProducts.length > 0) {
      globalProducts.value = localProducts as Dehumidifier[]
      hasLoaded = true
    }
    return globalProducts.value
  }
}

// SSR-friendly 資料載入（使用 Nuxt 的 useFetch）
export async function useProductsSSR() {
  // 如果已經載入過，直接返回
  if (hasLoaded && globalProducts.value.length > 0) {
    return { data: ref(globalProducts.value), error: ref(null) }
  }

  const { url, anonKey } = getSupabaseConfig()

  const { data, error } = await useFetch<Dehumidifier[]>(
    `${url}/rest/v1/products?in_stock=eq.true`,
    {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      key: 'products',
      default: () => [] as Dehumidifier[],
    }
  )

  if (data.value && data.value.length > 0) {
    // 補充 Supabase 中缺少的品類資料
    const allProducts = await supplementMissingCategories(data.value)
    globalProducts.value = allProducts
    hasLoaded = true
  } else {
    // 備用方案：從本地 JSON 載入（支援多品類）
    const localProducts = await loadLocalProducts()
    if (localProducts.length > 0) {
      globalProducts.value = localProducts as Dehumidifier[]
      hasLoaded = true
    }
  }

  return { data, error }
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

  const getDiscountPercent = (product: Dehumidifier): number => {
    const original = product.original_price
    if (!original || original <= product.price) return 0
    return Math.round((1 - product.price / original) * 100)
  }

  const getValueScore = (product: Dehumidifier): number => {
    // CP值 = 價格 / 日除濕量，越低越好
    const capacity = product.daily_capacity ?? 0
    if (capacity === 0) return Infinity
    return product.price / capacity
  }

  const getPopularityScore = (product: Dehumidifier): number => {
    // 熱門分數計算 (越高越好)
    let score = 0

    // 1. 折扣幅度 (最高 40 分)
    const discount = getDiscountPercent(product)
    score += Math.min(discount, 40)

    // 2. 能源效率 (最高 25 分)
    const efficiency = product.energy_efficiency ?? 5
    score += (6 - efficiency) * 5 // 一級=25, 二級=20, ...

    // 3. CP值 (最高 20 分) - 每公升價格越低越好
    const valueScore = getValueScore(product)
    if (valueScore !== Infinity) {
      // 假設 300-800 是常見範圍，越低分數越高
      const normalizedValue = Math.max(0, Math.min(20, (800 - valueScore) / 25))
      score += normalizedValue
    }

    // 4. 知名品牌加分 (最高 15 分)
    const popularBrands = ['Panasonic', '國際牌', 'HITACHI', '日立', 'SHARP', '夏普', 'MITSUBISHI', '三菱']
    if (popularBrands.some(brand => product.brand.toUpperCase().includes(brand.toUpperCase()))) {
      score += 15
    }

    return score
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
      case 'discount_desc':
        // 折扣幅度：高到低
        return sorted.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
      case 'value_asc':
        // CP值：每公升價格低到高
        return sorted.sort((a, b) => getValueScore(a) - getValueScore(b))
      case 'popularity':
      default:
        // 熱門推薦：綜合分數高到低
        return sorted.sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
    }
  }

  const getProductBySlug = (slug: string): Dehumidifier | undefined => {
    // 優先使用 slug 欄位
    const bySlug = globalProducts.value.find(prod => prod.slug === slug)
    if (bySlug) return bySlug

    // 備用 1：使用 brand-id 格式（與 getProductSlug 一致）
    const byBrandId = globalProducts.value.find(prod => {
      const productSlug = `${prod.brand.toLowerCase()}-${prod.id}`.replace(/[\s_]/g, '-')
      return productSlug === slug
    })
    if (byBrandId) return byBrandId

    // 備用 2：使用 brand-model 格式（舊格式相容）
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
