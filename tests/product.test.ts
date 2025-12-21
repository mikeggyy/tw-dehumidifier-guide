import { describe, it, expect } from 'vitest'
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
} from '../utils/product'

describe('formatPrice', () => {
  it('formats integer prices with thousands separator', () => {
    expect(formatPrice(1000)).toBe('1,000')
    expect(formatPrice(12345)).toBe('12,345')
    expect(formatPrice(1234567)).toBe('1,234,567')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('0')
  })
})

describe('getDiscountPercent', () => {
  it('calculates discount percentage correctly', () => {
    expect(getDiscountPercent({ price: 8000, original_price: 10000 })).toBe(20)
    expect(getDiscountPercent({ price: 9000, original_price: 10000 })).toBe(10)
  })

  it('returns null for small discounts (< 5%)', () => {
    expect(getDiscountPercent({ price: 9600, original_price: 10000 })).toBeNull()
  })

  it('returns null when no original price', () => {
    expect(getDiscountPercent({ price: 10000, original_price: null })).toBeNull()
  })

  it('returns null when original price equals current price', () => {
    expect(getDiscountPercent({ price: 10000, original_price: 10000 })).toBeNull()
  })
})

describe('getSavingsAmount', () => {
  it('calculates savings correctly', () => {
    expect(getSavingsAmount({ price: 8000, original_price: 10000 })).toBe(2000)
  })

  it('returns null when no original price', () => {
    expect(getSavingsAmount({ price: 10000, original_price: null })).toBeNull()
  })

  it('returns null when original price is lower', () => {
    expect(getSavingsAmount({ price: 10000, original_price: 8000 })).toBeNull()
  })
})

describe('getDisplayBrand', () => {
  it('returns brand when valid', () => {
    expect(getDisplayBrand({ brand: 'Panasonic', name: 'Test' })).toBe('Panasonic')
  })

  it('extracts brand from name when brand is "Other"', () => {
    expect(getDisplayBrand({ brand: 'Other', name: '【日立】除濕機' })).toBe('日立')
  })

  it('returns empty string when no brand found', () => {
    expect(getDisplayBrand({ brand: 'Other', name: '一般除濕機' })).toBe('')
  })
})

describe('getEnergyLabel', () => {
  it('returns correct label for each level', () => {
    expect(getEnergyLabel(1)).toBe('一級能效')
    expect(getEnergyLabel(2)).toBe('二級能效')
    expect(getEnergyLabel(3)).toBe('三級能效')
    expect(getEnergyLabel(4)).toBe('四級能效')
    expect(getEnergyLabel(5)).toBe('五級能效')
  })

  it('returns empty string for null/undefined', () => {
    expect(getEnergyLabel(null)).toBe('')
    expect(getEnergyLabel(undefined)).toBe('')
  })
})

describe('getEnergyColor', () => {
  it('returns correct color class for each level', () => {
    expect(getEnergyColor(1)).toBe('bg-green-500')
    expect(getEnergyColor(2)).toBe('bg-lime-500')
    expect(getEnergyColor(5)).toBe('bg-red-500')
  })

  it('returns gray for null/undefined', () => {
    expect(getEnergyColor(null)).toBe('bg-gray-500')
    expect(getEnergyColor(undefined)).toBe('bg-gray-500')
  })
})

describe('getValueScore', () => {
  it('calculates value score correctly', () => {
    expect(getValueScore(10000, 10)).toBe(1000) // $1000 per L
    expect(getValueScore(15000, 15)).toBe(1000) // $1000 per L
  })

  it('returns Infinity for null/zero spec value', () => {
    expect(getValueScore(10000, null)).toBe(Infinity)
    expect(getValueScore(10000, 0)).toBe(Infinity)
  })
})

describe('getTrackedAffiliateUrl', () => {
  it('adds UTM parameters to URL', () => {
    const result = getTrackedAffiliateUrl('https://example.com', 'product_card', '123')
    expect(result).toContain('utm_source=jiadian-tw')
    expect(result).toContain('utm_medium=comparison')
    expect(result).toContain('utm_campaign=product_card')
    expect(result).toContain('utm_content=123')
  })

  it('handles URLs with existing query params', () => {
    const result = getTrackedAffiliateUrl('https://example.com?foo=bar', 'test')
    expect(result).toContain('&utm_source')
  })

  it('returns empty string for empty URL', () => {
    expect(getTrackedAffiliateUrl('', 'test')).toBe('')
  })
})

describe('getOptimizedCtaText', () => {
  it('returns urgent text for high discount', () => {
    const result = getOptimizedCtaText(20, 2000)
    expect(result.text).toBe('限時搶購')
    expect(result.urgent).toBe(true)
  })

  it('returns savings text for large savings', () => {
    const result = getOptimizedCtaText(10, 1500)
    expect(result.text).toContain('現省')
    expect(result.urgent).toBe(true)
  })

  it('returns normal text for medium discount', () => {
    const result = getOptimizedCtaText(10, 400)
    expect(result.text).toBe('限時優惠')
    expect(result.urgent).toBe(false)
  })

  it('returns default text when no discount', () => {
    const result = getOptimizedCtaText(null, null)
    expect(result.text).toBe('前往購買')
    expect(result.urgent).toBe(false)
  })
})
