import { ref, onMounted } from 'vue'

export interface RecentProduct {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  image_url: string
  category_slug: string
  viewedAt: number
}

const MAX_ITEMS = 10
const STORAGE_KEY = 'recently-viewed'

const recentlyViewed = ref<RecentProduct[]>([])

export const useRecentlyViewed = () => {
  const load = () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        recentlyViewed.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load recently viewed:', e)
    }
  }

  const save = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed.value))
    } catch (e) {
      console.error('Failed to save recently viewed:', e)
    }
  }

  const add = (product: Omit<RecentProduct, 'viewedAt'>) => {
    // Remove if already exists
    recentlyViewed.value = recentlyViewed.value.filter(p => p.id !== product.id)

    // Add to beginning
    recentlyViewed.value.unshift({
      ...product,
      viewedAt: Date.now()
    })

    // Keep only MAX_ITEMS
    if (recentlyViewed.value.length > MAX_ITEMS) {
      recentlyViewed.value = recentlyViewed.value.slice(0, MAX_ITEMS)
    }

    save()
  }

  const remove = (id: string) => {
    recentlyViewed.value = recentlyViewed.value.filter(p => p.id !== id)
    save()
  }

  const clear = () => {
    recentlyViewed.value = []
    save()
  }

  onMounted(() => {
    load()
  })

  return {
    recentlyViewed,
    add,
    remove,
    clear,
    load,
  }
}
