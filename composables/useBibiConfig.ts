import { computed } from 'vue'
import type { Category } from '~/types'

/**
 * 網站基本設定（集中管理 SEO 相關常數）
 */
export const bibiSiteConfig = {
  // 網站基本資訊
  name: '比比看',
  tagline: '台灣家電規格比較平台',
  url: 'https://bibikan.tw',

  // SEO 預設值
  defaultTitle: '比比看 | 台灣家電規格比較平台',
  defaultDescription: '比較台灣各大品牌家電規格與價格，包含除濕機、空氣清淨機、冷氣、電暖器等，幫你找到最適合的家電產品。',
  defaultImage: 'https://bibikan.tw/og-image.png',

  // 版權資訊
  copyright: '© 2025 比比看. 本站包含聯盟行銷連結。',
  disclaimer: '價格與規格僅供參考，請以官方公告為準。',

  // 聯盟行銷聲明
  affiliateDisclaimer: '本站包含聯盟行銷連結，您透過本站連結購買商品，我們可能會獲得佣金。',
} as const

/**
 * 品類設定
 */
export const bibiCategoryConfigs: Record<string, Category> = {
  dehumidifier: {
    id: '1',
    slug: 'dehumidifier',
    name: '除濕機',
    icon: 'Droplets',
    description: '台灣除濕機規格比較，收錄各大品牌除濕機，比較價格、除濕量、噪音等規格。',
    is_active: true,
    sort_order: 1,
  },
  'air-purifier': {
    id: '2',
    slug: 'air-purifier',
    name: '空氣清淨機',
    icon: 'Wind',
    description: '空氣清淨機比較，收錄各大品牌空氣清淨機，比較 CADR、適用坪數、濾網等規格。',
    is_active: true,
    sort_order: 2,
  },
  'air-conditioner': {
    id: '3',
    slug: 'air-conditioner',
    name: '冷氣',
    icon: 'Snowflake',
    description: '冷氣規格比較，收錄各大品牌分離式冷氣，比較能效、冷房能力、CSPF 等規格。',
    is_active: true,
    sort_order: 3,
  },
  heater: {
    id: '4',
    slug: 'heater',
    name: '電暖器',
    icon: 'Flame',
    description: '電暖器規格比較，收錄各類型電暖器，比較功率、暖房效率、安全功能等規格。',
    is_active: true,
    sort_order: 4,
  },
  fan: {
    id: '5',
    slug: 'fan',
    name: '電風扇',
    icon: 'Fan',
    description: '電風扇規格比較，收錄立扇、循環扇、DC變頻風扇，比較風量、噪音、功能等規格。',
    is_active: true,
    sort_order: 5,
  },
}

/**
 * 取得網站設定的 composable
 */
export function useBibiConfig() {
  const site = bibiSiteConfig

  /**
   * 取得品類設定
   */
  const getCategoryConfig = (slug: string): Category | undefined => {
    return bibiCategoryConfigs[slug]
  }

  /**
   * 取得所有啟用的品類
   */
  const activeCategories = computed(() => {
    return Object.values(bibiCategoryConfigs)
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  })

  /**
   * 生成頁面標題
   */
  const generateTitle = (pageTitle?: string): string => {
    if (!pageTitle) return site.defaultTitle
    return `${pageTitle} | ${site.name}`
  }

  /**
   * 生成品類頁面 Meta
   */
  const generateCategoryMeta = (slug: string, productCount?: number) => {
    const category = getCategoryConfig(slug)
    if (!category) return null

    const title = `${category.name}比較推薦 | ${site.name}`
    const description = productCount
      ? `${category.name}規格比較，收錄 ${productCount} 款商品，比較品牌、價格、規格，幫你找到最適合的${category.name}。`
      : category.description

    return {
      title,
      description,
      ogUrl: `${site.url}/${slug}`,
      ogImage: site.defaultImage,
    }
  }

  /**
   * 生成商品頁面 Meta
   */
  const generateProductMeta = (product: {
    name: string
    price: number
    image_url: string
  }, categorySlug: string, productSlug: string) => {
    const category = getCategoryConfig(categorySlug)

    return {
      title: `${product.name} | ${site.name}`,
      description: `${product.name} - NT$ ${new Intl.NumberFormat('zh-TW').format(product.price)}，查看詳細規格與最新優惠價格。`,
      ogUrl: `${site.url}/${categorySlug}/${productSlug}`,
      ogImage: product.image_url,
      ogType: 'product',
    }
  }

  /**
   * 生成 Canonical URL
   */
  const generateCanonicalUrl = (...paths: string[]): string => {
    const path = paths.filter(Boolean).join('/')
    return path ? `${site.url}/${path}` : site.url
  }

  return {
    site,
    categoryConfigs: bibiCategoryConfigs,
    getCategoryConfig,
    activeCategories,
    generateTitle,
    generateCategoryMeta,
    generateProductMeta,
    generateCanonicalUrl,
  }
}
