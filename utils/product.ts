import type { Dehumidifier, Product } from '~/types'

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
