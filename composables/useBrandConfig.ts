import type { Product, Dehumidifier } from '~/types'
import { getProductSpec, getProductCategorySlug } from '~/types'

export interface BrandInfo {
  slug: string
  name: string
  aliases: string[]
  country?: string
  description?: string
  features?: string[]
  officialUrl?: string
}

export const brandConfigs: BrandInfo[] = [
  {
    slug: 'panasonic',
    name: 'Panasonic 國際牌',
    aliases: ['Panasonic', '國際牌', 'National'],
    country: '日本',
    description: '日本知名家電品牌，以高品質和創新技術著稱。在台灣市佔率第一，維修服務據點遍佈全台。',
    features: ['nanoe™ 淨化技術', '智慧家電連網', '節能省電設計', '完善售後服務'],
    officialUrl: 'https://www.panasonic.com/tw/'
  },
  {
    slug: 'hitachi',
    name: 'HITACHI 日立',
    aliases: ['HITACHI', '日立', 'Hitachi'],
    country: '日本',
    description: '日本百年家電品牌，以靜音技術和耐用品質聞名。壓縮機保固期長，適合重視品質的消費者。',
    features: ['超靜音設計', '日本製壓縮機', '長效耐用', '智慧感測'],
    officialUrl: 'https://www.hitachi-hometech.com.tw/'
  },
  {
    slug: 'sharp',
    name: 'SHARP 夏普',
    aliases: ['SHARP', '夏普', 'Sharp'],
    country: '日本',
    description: '日本家電品牌，以 Plasmacluster 空氣淨化技術著稱，結合除濕與空氣清淨功能。',
    features: ['Plasmacluster 技術', '除濕空氣清淨二合一', '自動除菌', '時尚外型'],
    officialUrl: 'https://www.sharp.com.tw/'
  },
  {
    slug: 'lg',
    name: 'LG',
    aliases: ['LG', '樂金', 'LG Electronics'],
    country: '韓國',
    description: '韓國科技家電品牌，以時尚設計和智慧功能著稱，ThinQ 智慧家電系統完整。',
    features: ['時尚設計', 'ThinQ 智慧連網', '變頻省電', '雙迴轉壓縮機'],
    officialUrl: 'https://www.lg.com/tw/'
  },
  {
    slug: 'mitsubishi',
    name: '三菱電機',
    aliases: ['MITSUBISHI', '三菱', 'Mitsubishi', '三菱電機'],
    country: '日本',
    description: '日本三菱集團旗下家電品牌，以高效能和耐用品質著稱，特別在冷氣領域享有盛名。',
    features: ['高效壓縮機', '日本品質', '靜音運轉', '長壽命設計'],
    officialUrl: 'https://www.mitsubishielectric.com.tw/'
  },
  {
    slug: 'daikin',
    name: 'DAIKIN 大金',
    aliases: ['DAIKIN', '大金', 'Daikin'],
    country: '日本',
    description: '全球空調領導品牌，以專業空調技術著稱，變頻技術業界領先。',
    features: ['專業空調技術', '變頻領先', '節能認證', '空氣淨化'],
    officialUrl: 'https://www.hotaidev.com.tw/daikin/'
  },
  {
    slug: 'dyson',
    name: 'Dyson',
    aliases: ['Dyson', '戴森'],
    country: '英國',
    description: '英國創新科技品牌，以獨特設計和先進技術著稱，產品定位高端市場。',
    features: ['創新設計', 'Air Multiplier 技術', '無扇葉安全', 'HEPA 過濾'],
    officialUrl: 'https://www.dyson.tw/'
  },
  {
    slug: 'sampo',
    name: 'SAMPO 聲寶',
    aliases: ['SAMPO', '聲寶', 'Sampo'],
    country: '台灣',
    description: '台灣本土家電品牌，以高 CP 值和完善服務網絡著稱，全台服務據點超過 400 間。',
    features: ['高 CP 值', '全台服務網絡', '在地品牌', '價格親民'],
    officialUrl: 'https://www.sampo.com.tw/'
  },
  {
    slug: 'teco',
    name: 'TECO 東元',
    aliases: ['TECO', '東元', 'Teco'],
    country: '台灣',
    description: '台灣老牌家電品牌，以實用功能和穩定品質著稱，維修服務方便。',
    features: ['實用設計', '穩定品質', '維修方便', '價格實惠'],
    officialUrl: 'https://www.teco.com.tw/'
  },
  {
    slug: 'tatung',
    name: 'TATUNG 大同',
    aliases: ['TATUNG', '大同', 'Tatung'],
    country: '台灣',
    description: '台灣經典家電品牌，歷史超過百年，以耐用品質和在地服務著稱。',
    features: ['百年品牌', '耐用品質', '在地服務', '經典設計'],
    officialUrl: 'https://www.tatung.com.tw/'
  }
]

export function useBrandConfig() {
  const getBrandBySlug = (slug: string): BrandInfo | undefined => {
    return brandConfigs.find(b => b.slug === slug)
  }

  const getAllBrands = (): BrandInfo[] => brandConfigs

  const matchBrand = (productBrand: string): BrandInfo | undefined => {
    const upperBrand = productBrand.toUpperCase()
    return brandConfigs.find(b =>
      b.aliases.some(alias => upperBrand.includes(alias.toUpperCase()))
    )
  }

  const getBrandStats = (brandInfo: BrandInfo, products: readonly (Product | Dehumidifier)[]) => {
    const brandProducts = products.filter(p => {
      const upperBrand = p.brand.toUpperCase()
      return brandInfo.aliases.some(alias => upperBrand.includes(alias.toUpperCase()))
    })

    const categories = [...new Set(brandProducts.map(p => getProductCategorySlug(p)))]

    // 使用迴圈計算價格範圍，避免 Math.min/max 的 stack overflow 風險
    let minPrice = Infinity
    let maxPrice = -Infinity
    for (const p of brandProducts) {
      if (p.price < minPrice) minPrice = p.price
      if (p.price > maxPrice) maxPrice = p.price
    }

    return {
      totalProducts: brandProducts.length,
      categories,
      priceRange: {
        min: brandProducts.length > 0 ? minPrice : 0,
        max: brandProducts.length > 0 ? maxPrice : 0
      },
      products: brandProducts
    }
  }

  const getProductsByBrandAndCategory = (
    brandInfo: BrandInfo,
    products: readonly (Product | Dehumidifier)[],
    categorySlug: string
  ): (Product | Dehumidifier)[] => {
    return [...products].filter(p => {
      const upperBrand = p.brand.toUpperCase()
      const productCategory = getProductCategorySlug(p)
      return brandInfo.aliases.some(alias => upperBrand.includes(alias.toUpperCase())) &&
             productCategory === categorySlug
    })
  }

  return {
    getBrandBySlug,
    getAllBrands,
    matchBrand,
    getBrandStats,
    getProductsByBrandAndCategory,
    brandConfigs
  }
}
