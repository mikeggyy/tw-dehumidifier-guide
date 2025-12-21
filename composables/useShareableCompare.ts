import { computed } from 'vue'
import { useRoute } from '#imports'
import type { Dehumidifier, Product } from '~/types'
import { useProducts } from '~/composables/useProducts'

export function useShareableCompare() {
  const route = useRoute()
  const { allProducts } = useProducts()

  // Parse product IDs from URL
  const compareIdsFromUrl = computed((): string[] => {
    const ids = route.query.ids as string
    if (!ids) return []
    return ids.split(',').filter(Boolean)
  })

  // Get category from URL
  const categoryFromUrl = computed((): string => {
    return (route.query.cat as string) || 'dehumidifier'
  })

  // Generate shareable URL
  const generateShareUrl = (productIds: string[], categorySlug: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.jiadian-tw.work'
    const ids = productIds.join(',')
    return `${baseUrl}/compare?ids=${ids}&cat=${categorySlug}`
  }

  // Copy link to clipboard
  const copyShareLink = async (productIds: string[], categorySlug: string): Promise<boolean> => {
    try {
      const url = generateShareUrl(productIds, categorySlug)
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      // Fallback for older browsers
      try {
        const url = generateShareUrl(productIds, categorySlug)
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch {
        return false
      }
    }
  }

  // Social share functions
  const shareToFacebook = (productIds: string[], categorySlug: string) => {
    const url = encodeURIComponent(generateShareUrl(productIds, categorySlug))
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400')
  }

  const shareToLine = (productIds: string[], categorySlug: string) => {
    const url = encodeURIComponent(generateShareUrl(productIds, categorySlug))
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank', 'width=600,height=400')
  }

  const shareToTwitter = (productIds: string[], categorySlug: string) => {
    const url = encodeURIComponent(generateShareUrl(productIds, categorySlug))
    const text = encodeURIComponent('我正在比較這幾款家電，你覺得哪個好？')
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
  }

  // Load products from shared URL
  const loadSharedCompare = (): (Dehumidifier | Product)[] => {
    if (compareIdsFromUrl.value.length === 0) return []
    return compareIdsFromUrl.value
      .map(id => allProducts.value.find(p => p.id === id))
      .filter(Boolean) as (Dehumidifier | Product)[]
  }

  return {
    compareIdsFromUrl,
    categoryFromUrl,
    generateShareUrl,
    copyShareLink,
    shareToFacebook,
    shareToLine,
    shareToTwitter,
    loadSharedCompare
  }
}
