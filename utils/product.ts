import type { Dehumidifier, Product } from '~/types'
import { productUtilsLogger as logger } from '~/utils/logger'

// ============================================================
// 聯盟連結追蹤
// ============================================================

// 有效的追蹤來源類型
const VALID_TRACKING_SOURCES = [
  'product_card',
  'comparison',
  'detail_page',
  'shared_compare',
  'finder',
  'calculator',
  'recently_viewed',
  'quick_preview',
  'test', // 用於測試
] as const

export type TrackingSource = typeof VALID_TRACKING_SOURCES[number]

/**
 * 產生帶有追蹤參數的聯盟連結
 * @param url 原始聯盟連結
 * @param source 點擊來源 (必須是有效的 TrackingSource)
 * @param productId 商品 ID (用於追蹤)
 */
export function getTrackedAffiliateUrl(
  url: string,
  source: TrackingSource = 'product_card',
  productId?: string
): string {
  if (!url) return ''

  // 驗證 source 是否有效
  if (!VALID_TRACKING_SOURCES.includes(source)) {
    logger.warn(`Invalid source: ${source}, using 'product_card'`)
    source = 'product_card'
  }

  const params = new URLSearchParams({
    utm_source: 'jiadian-tw',
    utm_medium: 'comparison',
    utm_campaign: source,
  })

  if (productId) {
    params.append('utm_content', productId)
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

// ============================================================
// 價格更新時間
// ============================================================

/**
 * 格式化更新時間為相對時間 (幾小時前、幾天前)
 */
export function formatRelativeTime(dateString: string | undefined): string | null {
  if (!dateString) return null

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return '剛剛更新'
  if (diffHours < 24) return `${diffHours} 小時前更新`
  if (diffDays === 1) return '昨天更新'
  if (diffDays < 7) return `${diffDays} 天前更新`

  // 超過一週顯示日期
  return `${date.getMonth() + 1}/${date.getDate()} 更新`
}

/**
 * 格式化更新時間為日期格式
 */
export function formatUpdateDate(dateString: string | undefined): string | null {
  if (!dateString) return null

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}/${month}/${day}`
}

// ============================================================
// CTA 文字優化
// ============================================================

/**
 * 根據折扣程度產生 CTA 文字
 * @param discountPercent 折扣百分比
 * @param savingsAmount 省下金額
 */
export function getOptimizedCtaText(
  discountPercent: number | null,
  savingsAmount: number | null
): { text: string; urgent: boolean } {
  // 高折扣 (>15%) - 緊急感
  if (discountPercent && discountPercent >= 15) {
    return { text: '限時搶購', urgent: true }
  }

  // 中折扣 (8-15%) 或省 $500 以上
  if ((discountPercent && discountPercent >= 8) || (savingsAmount && savingsAmount >= 500)) {
    if (savingsAmount && savingsAmount >= 1000) {
      return { text: `現省 $${formatPrice(savingsAmount)}`, urgent: true }
    }
    return { text: '限時優惠', urgent: false }
  }

  // 小折扣 (5-8%)
  if (discountPercent && discountPercent >= 5) {
    return { text: '查看優惠', urgent: false }
  }

  // 無折扣
  return { text: '前往購買', urgent: false }
}

// ============================================================
// 品牌與顯示
// ============================================================

/**
 * 從商品中取得顯示用品牌名稱
 * 如果品牌是 "Other"，嘗試從商品名稱的【】中提取
 */
export function getDisplayBrand(product: Pick<Dehumidifier | Product, 'brand' | 'name'>): string {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  // Try to extract from 【】in product name
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}

/**
 * 格式化價格（台幣）
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('zh-TW').format(price)
}

/**
 * 計算折扣百分比
 * 返回 null 如果沒有折扣或折扣低於 5%
 */
export function getDiscountPercent(product: Pick<Dehumidifier | Product, 'price' | 'original_price'>): number | null {
  const original = product.original_price
  const current = product.price
  if (!original || original <= current) return null
  const discount = Math.round((1 - current / original) * 100)
  return discount >= 5 ? discount : null
}

/**
 * 計算省下的金額
 */
export function getSavingsAmount(product: Pick<Dehumidifier | Product, 'price' | 'original_price'>): number | null {
  const original = product.original_price
  if (!original || original <= product.price) return null
  return original - product.price
}

/**
 * 取得能源效率標籤文字
 */
export function getEnergyLabel(efficiency: number | null | undefined): string {
  const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
  if (efficiency === null || efficiency === undefined) return ''
  return labels[efficiency] || ''
}

/**
 * 取得能源效率標籤顏色 (Tailwind class)
 */
export function getEnergyColor(efficiency: number | null | undefined): string {
  const colors: Record<number, string> = {
    1: 'bg-green-500',
    2: 'bg-lime-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500'
  }
  if (efficiency === null || efficiency === undefined) return 'bg-gray-500'
  return colors[efficiency] || 'bg-gray-500'
}

/**
 * 計算 CP 值分數（價格 / 規格值，越低越好）
 */
export function getValueScore(price: number, specValue: number | null | undefined): number {
  if (!specValue || specValue === 0) return Infinity
  return price / specValue
}

/**
 * 根據商品生成 SEO 描述
 */
export function generateProductDescription(product: Pick<Dehumidifier | Product, 'name' | 'brand' | 'price'>): string {
  const brand = getDisplayBrand(product as any)
  return `${product.name}${brand ? ` - ${brand}` : ''} 規格詳情、最新優惠價格 NT$ ${formatPrice(product.price)}，完整規格比較。`
}

/**
 * 根據品類生成 OG 描述
 */
export function generateCategoryDescription(categoryName: string, productCount: number): string {
  return `${categoryName}規格比較，收錄 ${productCount} 款商品，比較品牌、價格、規格，幫你找到最適合的${categoryName}。`
}
