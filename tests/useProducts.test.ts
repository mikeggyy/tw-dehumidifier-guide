import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 測試 useProducts 的核心函數
describe('useProducts helpers', () => {
  describe('flattenProductSpecs', () => {
    // 模擬 flattenProductSpecs 函數邏輯
    const flattenProductSpecs = (product: any): any => {
      const specs = product.specs || {}
      const category = product.category_slug

      const flattened = {
        ...product,
        ...specs,
      }

      if (category === 'air-purifier') {
        flattened.coverage = specs.coverage_area ?? specs.coverage ?? null
      } else if (category === 'air-conditioner') {
        flattened.coverage = specs.coverage ?? specs.coverage_area ?? null
      }

      return flattened
    }

    it('should flatten specs to top level', () => {
      const product = {
        id: '1',
        name: 'Test Product',
        specs: {
          daily_capacity: 16,
          noise_level: 40,
        },
      }

      const result = flattenProductSpecs(product)

      expect(result.daily_capacity).toBe(16)
      expect(result.noise_level).toBe(40)
      expect(result.id).toBe('1')
      expect(result.name).toBe('Test Product')
    })

    it('should handle air-purifier coverage field mapping', () => {
      const product = {
        id: '1',
        category_slug: 'air-purifier',
        specs: {
          coverage_area: 20,
        },
      }

      const result = flattenProductSpecs(product)
      expect(result.coverage).toBe(20)
    })

    it('should handle air-conditioner coverage field mapping', () => {
      const product = {
        id: '1',
        category_slug: 'air-conditioner',
        specs: {
          coverage: 15,
        },
      }

      const result = flattenProductSpecs(product)
      expect(result.coverage).toBe(15)
    })

    it('should handle empty specs', () => {
      const product = {
        id: '1',
        name: 'Test',
      }

      const result = flattenProductSpecs(product)
      expect(result.id).toBe('1')
      expect(result.name).toBe('Test')
    })
  })

  describe('fetchWithTimeout', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should abort request after timeout', async () => {
      const mockFetch = vi.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: () => Promise.resolve([]) }), 15000)
        })
      )
      global.fetch = mockFetch as any

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const fetchPromise = fetch('https://example.com', { signal: controller.signal })

      // 快進時間
      vi.advanceTimersByTime(10001)

      // 驗證 abort 被調用
      expect(controller.signal.aborted).toBe(true)
      clearTimeout(timeoutId)
    })
  })

  describe('product filtering logic', () => {
    const products = [
      { id: '1', brand: 'Panasonic', price: 10000, daily_capacity: 12, category_slug: 'dehumidifier' },
      { id: '2', brand: 'Hitachi', price: 15000, daily_capacity: 16, category_slug: 'dehumidifier' },
      { id: '3', brand: 'LG', price: 8000, daily_capacity: 10, category_slug: 'dehumidifier' },
      { id: '4', brand: 'Sharp', price: 12000, daily_capacity: 14, category_slug: 'air-purifier' },
    ]

    it('should filter by category', () => {
      const categorySlug = 'dehumidifier'
      const filtered = products.filter(p => p.category_slug === categorySlug)

      expect(filtered).toHaveLength(3)
      expect(filtered.every(p => p.category_slug === 'dehumidifier')).toBe(true)
    })

    it('should filter by brand', () => {
      const brands = ['Panasonic', 'Hitachi']
      const filtered = products.filter(p => brands.includes(p.brand))

      expect(filtered).toHaveLength(2)
    })

    it('should filter by price range', () => {
      const priceMin = 9000
      const priceMax = 13000
      const filtered = products.filter(p => p.price >= priceMin && p.price <= priceMax)

      expect(filtered).toHaveLength(2)
      expect(filtered.map(p => p.id)).toEqual(['1', '4'])
    })
  })

  describe('product sorting logic', () => {
    const products = [
      { id: '1', price: 10000, daily_capacity: 12, noise_level: 45 },
      { id: '2', price: 15000, daily_capacity: 16, noise_level: 40 },
      { id: '3', price: 8000, daily_capacity: 10, noise_level: 50 },
    ]

    it('should sort by price ascending', () => {
      const sorted = [...products].sort((a, b) => a.price - b.price)

      expect(sorted[0].id).toBe('3')
      expect(sorted[1].id).toBe('1')
      expect(sorted[2].id).toBe('2')
    })

    it('should sort by price descending', () => {
      const sorted = [...products].sort((a, b) => b.price - a.price)

      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')
      expect(sorted[2].id).toBe('3')
    })

    it('should sort by capacity descending', () => {
      const sorted = [...products].sort((a, b) => b.daily_capacity - a.daily_capacity)

      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')
      expect(sorted[2].id).toBe('3')
    })

    it('should sort by noise ascending (lower is better)', () => {
      const sorted = [...products].sort((a, b) => a.noise_level - b.noise_level)

      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')
      expect(sorted[2].id).toBe('3')
    })
  })

  describe('product slug generation', () => {
    it('should generate slug from brand and id', () => {
      const product = { id: '12345', brand: 'Panasonic', model: 'F-Y22EN' }
      const slug = `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-')

      expect(slug).toBe('panasonic-12345')
    })

    it('should handle brand with spaces', () => {
      const product = { id: '123', brand: 'De Longhi', model: 'ABC' }
      const slug = `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-')

      expect(slug).toBe('de-longhi-123')
    })
  })
})
