import { readonly } from 'vue'
import type { Dehumidifier, FilterState, SortOption } from '~/types'

const products: Dehumidifier[] = [
  {
    id: '1',
    brand: 'Panasonic',
    model: 'F-Y22EN',
    price: 12900,
    daily_capacity: 11,
    tank_capacity: 3.2,
    noise_level: 39,
    power_consumption: 185,
    energy_efficiency: 1,
    features: ['ECONAVI智慧節能', '奈米水離子', '廣角出風', '乾衣功能', '定時功能'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=F-Y22EN',
    affiliate_url: 'https://momo.dm/panasonic-fy22en'
  },
  {
    id: '2',
    brand: 'Panasonic',
    model: 'F-Y28GX',
    price: 16900,
    daily_capacity: 14,
    tank_capacity: 4.8,
    noise_level: 41,
    power_consumption: 220,
    energy_efficiency: 1,
    features: ['ECONAVI智慧節能', '奈米水離子', 'HEPA濾網', 'App遠端控制', '衣物乾燥'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=F-Y28GX',
    affiliate_url: 'https://momo.dm/panasonic-fy28gx'
  },
  {
    id: '3',
    brand: 'Panasonic',
    model: 'F-Y36GX',
    price: 21900,
    daily_capacity: 18,
    tank_capacity: 5.0,
    noise_level: 43,
    power_consumption: 285,
    energy_efficiency: 1,
    features: ['ECONAVI智慧節能', '奈米水離子', 'HEPA濾網', 'App遠端控制', '雙重除濕'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=F-Y36GX',
    affiliate_url: 'https://momo.dm/panasonic-fy36gx'
  },
  {
    id: '4',
    brand: 'Hitachi',
    model: 'RD-200HH',
    price: 14500,
    daily_capacity: 10,
    tank_capacity: 3.0,
    noise_level: 38,
    power_consumption: 175,
    energy_efficiency: 1,
    features: ['PM2.5濾網', '負離子', '自動除霜', '水箱滿水警示', '靜音模式'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=RD-200HH',
    affiliate_url: 'https://momo.dm/hitachi-rd200hh'
  },
  {
    id: '5',
    brand: 'Hitachi',
    model: 'RD-280HH',
    price: 17800,
    daily_capacity: 14,
    tank_capacity: 4.5,
    noise_level: 40,
    power_consumption: 230,
    energy_efficiency: 1,
    features: ['PM2.5濾網', '負離子', 'HEPA濾網', '烘鞋功能', '連續排水'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=RD-280HH',
    affiliate_url: 'https://momo.dm/hitachi-rd280hh'
  },
  {
    id: '6',
    brand: 'Hitachi',
    model: 'RD-360HH',
    price: 22500,
    daily_capacity: 18,
    tank_capacity: 5.0,
    noise_level: 44,
    power_consumption: 310,
    energy_efficiency: 2,
    features: ['PM2.5濾網', '負離子', 'HEPA濾網', '大坪數適用', '快速乾衣'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=RD-360HH',
    affiliate_url: 'https://momo.dm/hitachi-rd360hh'
  },
  {
    id: '7',
    brand: 'LG',
    model: 'MD171QSK1',
    price: 18900,
    daily_capacity: 17,
    tank_capacity: 5.3,
    noise_level: 42,
    power_consumption: 260,
    energy_efficiency: 1,
    features: ['WiFi遠端控制', '變頻壓縮機', 'HEPA濾網', '低噪音設計', '智慧感濕'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=MD171QSK1',
    affiliate_url: 'https://momo.dm/lg-md171qsk1'
  },
  {
    id: '8',
    brand: 'LG',
    model: 'MD191QCE0',
    price: 24900,
    daily_capacity: 19,
    tank_capacity: 6.0,
    noise_level: 45,
    power_consumption: 320,
    energy_efficiency: 1,
    features: ['WiFi遠端控制', '變頻壓縮機', 'ThinQ App', '空氣清淨', '大容量水箱'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=MD191QCE0',
    affiliate_url: 'https://momo.dm/lg-md191qce0'
  },
  {
    id: '9',
    brand: 'Sharp',
    model: 'DW-L10FT-W',
    price: 9900,
    daily_capacity: 10,
    tank_capacity: 2.5,
    noise_level: 36,
    power_consumption: 165,
    energy_efficiency: 2,
    features: ['自體淨化', '輕巧設計', '除臭功能', '定時開關', '省電模式'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=DW-L10FT',
    affiliate_url: 'https://momo.dm/sharp-dwl10ft'
  },
  {
    id: '10',
    brand: 'Mitsubishi',
    model: 'MJ-E195HM',
    price: 19500,
    daily_capacity: 19.5,
    tank_capacity: 4.7,
    noise_level: 46,
    power_consumption: 395,
    energy_efficiency: 2,
    features: ['三合一濾網', '高效除濕', '銀離子抗菌', '大坪數適用', '移動滑輪'],
    image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=MJ-E195HM',
    affiliate_url: 'https://momo.dm/mitsubishi-mje195hm'
  }
]

export const useProducts = () => {
  const allProducts = readonly(products)

  const getAllBrands = (): string[] => {
    return [...new Set(products.map(p => p.brand))]
  }

  const getPriceRange = (): { min: number; max: number } => {
    const prices = products.map(p => p.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  }

  const filterProducts = (filters: FilterState): Dehumidifier[] => {
    return products.filter(product => {
      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false
      }

      // Capacity filter
      if (filters.capacityRange !== 'all') {
        if (filters.capacityRange === 'under10' && product.daily_capacity >= 10) return false
        if (filters.capacityRange === '10to15' && (product.daily_capacity < 10 || product.daily_capacity > 15)) return false
        if (filters.capacityRange === 'over15' && product.daily_capacity <= 15) return false
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
        return sorted.sort((a, b) => a.noise_level - b.noise_level)
      case 'capacity_desc':
        return sorted.sort((a, b) => b.daily_capacity - a.daily_capacity)
      case 'popularity':
      default:
        return sorted // Default order as "popularity"
    }
  }

  const getProductBySlug = (slug: string): Dehumidifier | undefined => {
    return products.find(p => {
      const productSlug = `${p.brand.toLowerCase()}-${p.model.toLowerCase()}`.replace(/[\s_]/g, '-')
      return productSlug === slug
    })
  }

  const getProductSlug = (product: Pick<Dehumidifier, 'brand' | 'model'>): string => {
    return `${product.brand.toLowerCase()}-${product.model.toLowerCase()}`.replace(/[\s_]/g, '-')
  }

  const getAllSlugs = (): string[] => {
    return products.map(p => getProductSlug(p))
  }

  return {
    allProducts,
    getAllBrands,
    getPriceRange,
    filterProducts,
    sortProducts,
    getProductBySlug,
    getProductSlug,
    getAllSlugs
  }
}
