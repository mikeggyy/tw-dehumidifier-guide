import type { Product, Dehumidifier } from '~/types'
import { getProductSpec } from '~/types'

export interface Scenario {
  id: string
  title: string
  emoji: string
  description: string
  filters: {
    categories?: string[]
    priceMax?: number
    priceMin?: number
    prioritySpecs?: string[]
    features?: string[]
  }
}

export const scenarios: Scenario[] = [
  {
    id: 'allergy-family',
    title: '過敏兒家庭',
    emoji: '🤧',
    description: '適合有過敏體質家人的空氣淨化方案',
    filters: {
      categories: ['air-purifier', 'dehumidifier'],
      prioritySpecs: ['cadr_desc', 'noise_asc'],
      features: ['HEPA', 'H13', 'H14']
    }
  },
  {
    id: 'basement',
    title: '地下室/儲藏室',
    emoji: '🏠',
    description: '潮濕空間的強力除濕解決方案',
    filters: {
      categories: ['dehumidifier'],
      prioritySpecs: ['capacity_desc', 'value_asc']
    }
  },
  {
    id: 'studio-rental',
    title: '小套房租屋',
    emoji: '🛏️',
    description: '小空間的經濟實惠選擇',
    filters: {
      categories: ['dehumidifier', 'air-purifier', 'fan'],
      priceMax: 8000,
      prioritySpecs: ['value_asc', 'noise_asc']
    }
  },
  {
    id: 'summer-cool',
    title: '夏日涼爽',
    emoji: '☀️',
    description: '對抗炎夏的消暑利器',
    filters: {
      categories: ['air-conditioner', 'fan'],
      prioritySpecs: ['cspf_desc', 'noise_asc']
    }
  },
  {
    id: 'winter-warm',
    title: '冬季保暖',
    emoji: '❄️',
    description: '寒冬必備的暖房設備',
    filters: {
      categories: ['heater'],
      prioritySpecs: ['power_desc', 'noise_asc']
    }
  },
  {
    id: 'quiet-sleep',
    title: '安靜睡眠',
    emoji: '😴',
    description: '低噪音，讓你一夜好眠',
    filters: {
      categories: ['dehumidifier', 'air-purifier', 'fan'],
      prioritySpecs: ['noise_asc']
    }
  }
]

export function useScenarioConfig() {
  const getScenarioById = (id: string): Scenario | undefined => {
    return scenarios.find(s => s.id === id)
  }

  const getAllScenarios = (): Scenario[] => scenarios

  const getRecommendedProducts = (
    scenario: Scenario,
    products: readonly (Product | Dehumidifier)[],
    limit = 6
  ): (Product | Dehumidifier)[] => {
    let filtered = [...products] as (Product | Dehumidifier)[]

    // Filter by categories
    if (scenario.filters.categories && scenario.filters.categories.length > 0) {
      filtered = filtered.filter(p => {
        const categorySlug = getProductSpec<string>(p, 'category_slug') || 'dehumidifier'
        return scenario.filters.categories!.includes(categorySlug)
      })
    }

    // Filter by max price
    if (scenario.filters.priceMax) {
      filtered = filtered.filter(p => p.price <= scenario.filters.priceMax!)
    }

    // Filter by min price
    if (scenario.filters.priceMin) {
      filtered = filtered.filter(p => p.price >= scenario.filters.priceMin!)
    }

    // Filter/boost by features
    if (scenario.filters.features && scenario.filters.features.length > 0) {
      const withFeatures = filtered.filter(p => {
        const productStr = JSON.stringify(p).toUpperCase()
        return scenario.filters.features!.some(f => productStr.includes(f.toUpperCase()))
      })
      // If we have products with features, prefer them
      if (withFeatures.length >= limit) {
        filtered = withFeatures
      }
    }

    // Sort by priority specs
    if (scenario.filters.prioritySpecs && scenario.filters.prioritySpecs.length > 0) {
      const primarySort = scenario.filters.prioritySpecs[0]

      filtered.sort((a, b) => {
        const aProduct = a as Dehumidifier
        const bProduct = b as Dehumidifier

        if (primarySort === 'noise_asc') {
          const aVal = aProduct.noise_level ?? 99
          const bVal = bProduct.noise_level ?? 99
          return aVal - bVal
        }
        if (primarySort === 'capacity_desc') {
          const aVal = aProduct.daily_capacity ?? 0
          const bVal = bProduct.daily_capacity ?? 0
          return bVal - aVal
        }
        if (primarySort === 'value_asc') {
          const aVal = aProduct.daily_capacity ? aProduct.price / aProduct.daily_capacity : Infinity
          const bVal = bProduct.daily_capacity ? bProduct.price / bProduct.daily_capacity : Infinity
          return aVal - bVal
        }
        if (primarySort === 'cadr_desc') {
          const aVal = getProductSpec<number>(aProduct, 'cadr') ?? 0
          const bVal = getProductSpec<number>(bProduct, 'cadr') ?? 0
          return bVal - aVal
        }
        if (primarySort === 'cspf_desc') {
          const aVal = getProductSpec<number>(aProduct, 'cspf') ?? 0
          const bVal = getProductSpec<number>(bProduct, 'cspf') ?? 0
          return bVal - aVal
        }
        if (primarySort === 'power_desc') {
          const aVal = aProduct.power_consumption ?? 0
          const bVal = bProduct.power_consumption ?? 0
          return bVal - aVal
        }
        // Default: sort by discount
        const aDiscount = aProduct.original_price ? (aProduct.original_price - aProduct.price) / aProduct.original_price : 0
        const bDiscount = bProduct.original_price ? (bProduct.original_price - bProduct.price) / bProduct.original_price : 0
        return bDiscount - aDiscount
      })
    }

    return filtered.slice(0, limit)
  }

  return {
    getScenarioById,
    getAllScenarios,
    getRecommendedProducts,
    scenarios
  }
}
