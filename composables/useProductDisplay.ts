import { computed } from 'vue'
import type { Dehumidifier } from '~/types'
import { getProductSpec } from '~/types'
import {
  formatPrice,
  getDiscountPercent,
  getSavingsAmount,
  getDisplayBrand,
  getEnergyLabel,
  getEnergyColor,
  getValueScore,
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  formatRelativeTime,
  type TrackingSource,
} from '~/utils/product'

/**
 * Composable for product display logic
 * Extracts common computed properties used across ProductCard and product detail pages
 */
export function useProductDisplay(product: () => Dehumidifier | null | undefined, options?: {
  source?: TrackingSource
  categorySlug?: string
}) {
  const source: TrackingSource = options?.source || 'product_card'

  // Display brand - hide "Other", try to extract from name
  const displayBrand = computed(() => {
    const p = product()
    if (!p) return ''
    return getDisplayBrand(p)
  })

  // Discount percentage
  const discountPercent = computed(() => {
    const p = product()
    if (!p) return null
    return getDiscountPercent(p)
  })

  // Savings amount
  const savingsAmount = computed(() => {
    const p = product()
    if (!p) return null
    return getSavingsAmount(p)
  })

  // Energy efficiency label and color
  const energyLabel = computed(() => {
    const p = product()
    if (!p) return ''
    return getEnergyLabel(p.energy_efficiency)
  })

  const energyColor = computed(() => {
    const p = product()
    if (!p) return ''
    return getEnergyColor(p.energy_efficiency)
  })

  // Value score (price per liter of daily capacity)
  const valueScore = computed(() => {
    const p = product()
    if (!p) return null
    return getValueScore(p.price, p.daily_capacity)
  })

  // CTA text based on discount
  const ctaInfo = computed(() => {
    return getOptimizedCtaText(discountPercent.value, savingsAmount.value)
  })

  // Tracked affiliate URL with UTM parameters
  const trackedAffiliateUrl = computed(() => {
    const p = product()
    if (!p) return ''
    return getTrackedAffiliateUrl(p.affiliate_url, source, p.id)
  })

  // Price update time (relative)
  const priceUpdateTime = computed(() => {
    const p = product()
    if (!p) return ''
    const updatedAt = getProductSpec<string>(p, 'updated_at')
    return formatRelativeTime(updatedAt ?? undefined)
  })

  // Formatted price
  const formattedPrice = computed(() => {
    const p = product()
    if (!p) return ''
    return formatPrice(p.price)
  })

  // Formatted original price
  const formattedOriginalPrice = computed(() => {
    const p = product()
    if (!p?.original_price) return ''
    return formatPrice(p.original_price)
  })

  // Has discount
  const hasDiscount = computed(() => {
    const p = product()
    if (!p) return false
    return !!(p.original_price && p.original_price > p.price)
  })

  // Significant savings (for showing savings badge)
  const hasSignificantSavings = computed(() => {
    return savingsAmount.value !== null && savingsAmount.value >= 500
  })

  return {
    // Brand
    displayBrand,

    // Pricing
    formattedPrice,
    formattedOriginalPrice,
    discountPercent,
    savingsAmount,
    hasDiscount,
    hasSignificantSavings,
    priceUpdateTime,

    // Energy
    energyLabel,
    energyColor,

    // Value
    valueScore,

    // CTA
    ctaInfo,
    trackedAffiliateUrl,
  }
}
