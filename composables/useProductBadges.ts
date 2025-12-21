import type { Product, Dehumidifier } from '~/types'
import { getDiscountPercent, getValueScore } from '~/utils/product'

export type BadgeType = 'hot' | 'editor-pick' | 'best-value' | 'flash-sale'

export interface ProductBadge {
  type: BadgeType
  label: string
  icon: string
  bgClass: string
  animate: boolean
}

const POPULAR_BRANDS = ['Panasonic', 'HITACHI', 'SHARP', 'LG', 'Dyson', 'DAIKIN', '三菱', 'MITSUBISHI']

export function useProductBadges() {
  const getBadges = (product: Product | Dehumidifier, categorySlug: string = 'dehumidifier'): ProductBadge[] => {
    const badges: ProductBadge[] = []
    const discount = getDiscountPercent(product)

    // Check if popular brand
    const isPopularBrand = POPULAR_BRANDS.some(b =>
      product.brand.toUpperCase().includes(b.toUpperCase())
    )

    // Flash Sale badge: discount >= 20%
    if (discount && discount >= 20) {
      badges.push({
        type: 'flash-sale',
        label: `${discount}% OFF`,
        icon: '⚡',
        bgClass: 'bg-gradient-to-r from-red-500 to-orange-500',
        animate: true
      })
      return badges.slice(0, 2) // Return early if flash sale
    }

    // Hot badge: discount >= 15% + popular brand
    if (discount && discount >= 15 && isPopularBrand) {
      badges.push({
        type: 'hot',
        label: '熱銷',
        icon: '🔥',
        bgClass: 'bg-red-500',
        animate: true
      })
    }

    // Editor's Pick: energy efficiency 1 + good capacity
    const efficiency = (product as Dehumidifier).energy_efficiency
    const capacity = (product as Dehumidifier).daily_capacity
    const specs = (product as any).specs || {}

    // Check for editor pick conditions based on category
    let isEditorPick = false
    if (categorySlug === 'dehumidifier' && efficiency === 1 && capacity && capacity >= 10) {
      isEditorPick = true
    } else if (categorySlug === 'air-purifier' && specs.cadr && specs.cadr >= 400) {
      isEditorPick = true
    } else if (categorySlug === 'air-conditioner' && specs.cspf && specs.cspf >= 6) {
      isEditorPick = true
    }

    if (isEditorPick && badges.length < 2) {
      badges.push({
        type: 'editor-pick',
        label: '編輯推薦',
        icon: '⭐',
        bgClass: 'bg-indigo-500',
        animate: false
      })
    }

    // Best Value: good price/performance ratio
    if (categorySlug === 'dehumidifier' && capacity) {
      const valueScoreNum = getValueScore(product.price, capacity)
      if (valueScoreNum && valueScoreNum < 600 && badges.length < 2) {
        badges.push({
          type: 'best-value',
          label: 'CP值王',
          icon: '💰',
          bgClass: 'bg-green-500',
          animate: false
        })
      }
    }

    return badges.slice(0, 2) // Max 2 badges
  }

  return { getBadges }
}
