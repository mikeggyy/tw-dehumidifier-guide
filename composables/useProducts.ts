import { ref, readonly, computed } from 'vue'
import { useRuntimeConfig } from '#imports'
import type { Dehumidifier, FilterState, SortOption } from '~/types'
import { productsLogger as logger } from '~/utils/logger'

// 靜態 import JSON 檔案，確保在 Vercel build 時能正確載入
import productsData from '~/data/products.json'
import airPurifiersData from '~/data/air_purifiers.json'
import airConditionersData from '~/data/air_conditioners.json'
import heatersData from '~/data/heaters.json'
import fansData from '~/data/fans.json'

// Supabase 配置 - 使用 runtimeConfig
// 注意：必須設定 NUXT_PUBLIC_SUPABASE_URL 和 NUXT_PUBLIC_SUPABASE_ANON_KEY 環境變數
// 開發環境可使用 .env 檔案設定

// 請求超時設定（毫秒）
const REQUEST_TIMEOUT = 10000 // 10 秒

// 除濕機品類的排除關鍵字（這些商品不應該出現在除濕機列表中）
const DEHUMIDIFIER_EXCLUSION_KEYWORDS = [
  '香薰', '香氛',           // 香薰機
  '水氧機', '水氣機',       // 水氧機
  '加濕器', '加濕機',       // 加濕器（與除濕機相反）
  '電暖器', '暖爐',         // 電暖器
  '循環扇', '電風扇', '風扇', '涼風扇', // 電風扇
  '冷氣機', '冷暖氣',       // 冷氣
]

// 除濕機品類的必須包含關鍵字（商品名必須包含其中之一才算除濕機）
const DEHUMIDIFIER_REQUIRED_KEYWORDS = [
  '除濕',
]

// 檢查商品是否應該被排除（用於除濕機品類）
function shouldExcludeDehumidifierProduct(product: any): boolean {
  const name = product.name || ''

  // 如果名稱包含排除關鍵字，排除該商品
  for (const keyword of DEHUMIDIFIER_EXCLUSION_KEYWORDS) {
    if (name.includes(keyword)) {
      return true
    }
  }

  // 如果名稱不包含「除濕」，也排除（可能是誤分類的商品）
  const hasRequiredKeyword = DEHUMIDIFIER_REQUIRED_KEYWORDS.some(keyword => name.includes(keyword))
  if (!hasRequiredKeyword) {
    return true
  }

  return false
}

// 展平 Supabase 商品的 specs 到頂層欄位
function flattenProductSpecs(product: any): any {
  const specs = product.specs || {}
  const category = product.category_slug

  // 基本展平：所有 specs 內的欄位都提升到頂層
  const flattened = {
    ...product,
    ...specs,  // 展平所有 specs 欄位
  }

  // 品類特定的欄位對應（處理 Supabase 欄位名稱和前端期望的不一致）
  if (category === 'air-purifier') {
    flattened.coverage = specs.coverage_area ?? specs.coverage ?? null
  } else if (category === 'air-conditioner') {
    flattened.coverage = specs.coverage ?? specs.coverage_area ?? null
  } else if (category === 'heater') {
    flattened.coverage = specs.coverage ?? specs.coverage_area ?? null
  } else if (category === 'fan') {
    // 電風扇的特殊處理
  }

  return flattened
}

// Helper function to get Supabase config
function getSupabaseConfig(): { url: string; anonKey: string } | null {
  try {
    const config = useRuntimeConfig()
    const url = config.public.supabaseUrl
    const anonKey = config.public.supabaseAnonKey

    // 如果沒有設定 Supabase 環境變數，返回 null（將使用本地 JSON 資料）
    if (!url || !anonKey) {
      logger.warn('Supabase 環境變數未設定，將使用本地 JSON 資料')
      return null
    }

    return { url, anonKey }
  } catch {
    // useRuntimeConfig 不可用時，返回 null
    return null
  }
}

// Fetch with timeout using AbortController
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json() as T
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }

    throw error
  }
}

// 全域響應式產品資料（跨組件共享）
const globalProducts = ref<Dehumidifier[]>([])
const isGlobalLoading = ref(false)
let hasLoaded = false

// 快取的計算屬性（避免重複計算）
const cachedAllBrands = computed(() => {
  return [...new Set(globalProducts.value.map(prod => prod.brand))].sort()
})

const cachedPriceRange = computed(() => {
  const products = globalProducts.value
  if (products.length === 0) {
    return { min: 0, max: 100000 }
  }
  // 使用 reduce 避免 Math.min/max 的 stack overflow 風險（大型陣列）
  let min = Infinity
  let max = -Infinity
  for (const prod of products) {
    if (prod.price < min) min = prod.price
    if (prod.price > max) max = prod.price
  }
  return {
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 100000 : max
  }
})

// 從靜態 import 的 JSON 檔案載入指定品類資料
function loadLocalCategoryProducts(category: string): Dehumidifier[] {
  const products: Dehumidifier[] = []

  try {
    if (category === 'dehumidifier') {
      const data = productsData
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => ({
          ...p,
          category_slug: p.category_slug || 'dehumidifier',
        })))
      }
    } else if (category === 'air-purifier') {
      const data = airPurifiersData
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => {
          // 從 features 提取功能資訊
          const features = p.features || []
          const featuresStr = features.join(' ').toLowerCase()
          const hasAppControl = featuresStr.includes('app') || featuresStr.includes('wifi') || featuresStr.includes('智能')
          const hasPm25Sensor = featuresStr.includes('pm2.5') || featuresStr.includes('感測') || featuresStr.includes('sensor')

          // 展平 specs 到頂層
          const specs = p.specs || {}

          return {
            ...p,
            category_slug: 'air-purifier',
            slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
            affiliate_url: p.affiliate_url || p.momo_url,
            // 展平規格欄位
            cadr: specs.cadr ?? null,
            coverage: specs.coverage_area ?? specs.coverage ?? null,
            noise_level: specs.noise_level ?? null,
            power_consumption: specs.power_consumption ?? null,
            filter_type: specs.filter_type ?? null,
            filter_life: specs.filter_life ?? null,
            filter_cost: specs.filter_cost ?? null,
            // 從 features 提取的布林值
            app_control: hasAppControl,
            pm25_sensor: hasPm25Sensor,
          }
        }))
      }
    } else if (category === 'air-conditioner') {
      const data = airConditionersData
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => {
          // 展平 specs 到頂層
          const specs = p.specs || {}
          return {
            ...p,
            category_slug: 'air-conditioner',
            slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
            affiliate_url: p.affiliate_url || p.momo_url,
            // 展平規格欄位
            cooling_capacity: specs.cooling_capacity ?? null,
            coverage: specs.coverage ?? null,
            type: specs.type ?? null,
            inverter: specs.inverter ?? null,
            cspf: specs.cspf ?? null,
            energy_efficiency: specs.energy_efficiency ?? null,
            noise_indoor: specs.noise_indoor ?? null,
            noise_outdoor: specs.noise_outdoor ?? null,
            heating: specs.heating ?? false,
          }
        }))
      }
    } else if (category === 'heater') {
      const data = heatersData
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => {
          // 展平 specs 到頂層
          const specs = p.specs || {}
          return {
            ...p,
            category_slug: 'heater',
            slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
            affiliate_url: p.affiliate_url || p.momo_url,
            // 展平規格欄位
            heating_power: specs.heating_power ?? null,
            type: specs.type ?? null,
            coverage: specs.coverage ?? null,
            oscillation: specs.oscillation ?? false,
            timer: specs.timer ?? false,
            tip_over_protection: specs.tip_over_protection ?? false,
          }
        }))
      }
    } else if (category === 'fan') {
      const data = fansData
      if (data.products && data.products.length > 0) {
        products.push(...data.products.map((p: any) => {
          // 從 features 提取遙控器和定時功能
          const features = p.features || []
          const featuresLower = features.map((f: string) => f.toLowerCase())
          const hasRemote = featuresLower.some((f: string) =>
            f.includes('遙控') || f.includes('remote')
          )
          const hasTimer = featuresLower.some((f: string) =>
            f.includes('定時') || f.includes('timer')
          )

          // 展平 specs 到頂層
          const specs = p.specs || {}

          return {
            ...p,
            category_slug: 'fan',
            slug: p.slug || `${p.brand.toLowerCase()}-${p.id}`.replace(/[\s_]/g, '-'),
            affiliate_url: p.affiliate_url || p.momo_url,
            // 展平規格欄位
            fan_type: specs.fan_type || null,
            motor_type: specs.motor_type || null,
            size: specs.size || null,
            noise_level: specs.noise_level || null,
            // 從 features 提取的布林值
            has_remote: hasRemote,
            has_timer: hasTimer,
          }
        }))
      }
    }
  } catch (e) {
    logger.warn(`Failed to load ${category} data:`, e)
  }

  return products
}

// 從本地 JSON 檔案載入所有品類資料
function loadLocalProducts(): Dehumidifier[] {
  const categories = ['dehumidifier', 'air-purifier', 'air-conditioner', 'heater', 'fan']
  const allProducts: Dehumidifier[] = []

  for (const category of categories) {
    const products = loadLocalCategoryProducts(category)
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
      p.category_slug === category ||
      (category === 'dehumidifier' && !p.category_slug)
    )

    if (!hasCategory) {
      logger.log(`Supplementing missing category: ${category}`)
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

  const supabaseConfig = getSupabaseConfig()
  const categories = ['dehumidifier', 'air-purifier', 'air-conditioner', 'heater', 'fan']

  // 如果 Supabase 未設定，直接使用本地資料
  if (!supabaseConfig) {
    const localProducts = await loadLocalProducts()
    if (localProducts.length > 0) {
      globalProducts.value = localProducts as Dehumidifier[]
      hasLoaded = true
    }
    return globalProducts.value
  }

  const { url, anonKey } = supabaseConfig

  try {
    // 分品類載入，避免 Supabase 1000 筆限制導致資料被截斷
    const allProducts: Dehumidifier[] = []

    for (const category of categories) {
      try {
        const data = await fetchWithTimeout<Dehumidifier[]>(
          `${url}/rest/v1/products?in_stock=eq.true&category_slug=eq.${category}&limit=1000`,
          {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
          }
        )
        // 展平 specs 到頂層欄位
        let flattenedData = data.map(flattenProductSpecs)

        // 除濕機品類需要額外過濾，排除誤分類的商品
        if (category === 'dehumidifier') {
          const beforeCount = flattenedData.length
          flattenedData = flattenedData.filter(p => !shouldExcludeDehumidifierProduct(p))
          const filteredCount = beforeCount - flattenedData.length
          if (filteredCount > 0) {
            logger.log(`Filtered out ${filteredCount} non-dehumidifier products from Supabase data`)
          }
        }

        allProducts.push(...flattenedData)
      } catch (e) {
        logger.warn(`Failed to fetch ${category} from Supabase:`, e)
        // 該品類載入失敗，從本地補充
        const localProducts = await loadLocalCategoryProducts(category)
        allProducts.push(...localProducts)
      }
    }

    globalProducts.value = allProducts
    hasLoaded = true
    return globalProducts.value
  } catch (error) {
    logger.error('Failed to fetch products from Supabase:', error)
    // 備用方案：從本地 JSON 載入（支援多品類）
    const localProducts = await loadLocalProducts()
    if (localProducts.length > 0) {
      globalProducts.value = localProducts as Dehumidifier[]
      hasLoaded = true
    }
    return globalProducts.value
  }
}

// SSR-friendly 資料載入
// 在 prerender/SSG 時使用本地 JSON，確保 build 穩定性
export function useProductsSSR() {
  // 如果已經載入過，直接返回
  if (hasLoaded && globalProducts.value.length > 0) {
    return { data: ref(globalProducts.value), error: ref(null) }
  }

  // SSG/Prerender 時直接使用本地 JSON，確保 build 穩定
  // 這樣做的好處：
  // 1. Build 不依賴外部服務，更穩定
  // 2. Build 速度更快
  // 3. 資料由每日爬蟲更新，JSON 檔案始終是最新的
  const localProducts = loadLocalProducts()
  if (localProducts.length > 0) {
    globalProducts.value = localProducts as Dehumidifier[]
    hasLoaded = true
    logger.log(`Loaded ${localProducts.length} products from local JSON`)
  }

  return { data: ref(globalProducts.value), error: ref(null) }
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

  // 使用快取的 computed（向後相容：保留函數形式）
  const getAllBrands = (): string[] => cachedAllBrands.value
  const getPriceRange = (): { min: number; max: number } => cachedPriceRange.value

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
