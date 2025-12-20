import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '~/utils/constants'

// 全域狀態（跨組件共享）
const favorites = ref<Set<string>>(new Set())
let isInitialized = false

/**
 * 收藏功能 composable
 *
 * @example
 * ```ts
 * const { favorites, toggleFavorite, isFavorite, favoritesCount } = useFavorites()
 * ```
 */
export function useFavorites() {
  /**
   * 初始化收藏清單（從 localStorage 載入）
   */
  const init = () => {
    if (isInitialized || typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES)
      if (saved) {
        favorites.value = new Set(JSON.parse(saved))
      }
      isInitialized = true
    } catch (e) {
      console.error('Failed to load favorites:', e)
    }
  }

  /**
   * 儲存收藏清單到 localStorage
   */
  const save = () => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(
        STORAGE_KEYS.FAVORITES,
        JSON.stringify([...favorites.value])
      )
    } catch (e) {
      console.error('Failed to save favorites:', e)
    }
  }

  /**
   * 切換收藏狀態
   */
  const toggleFavorite = (productId: string) => {
    if (favorites.value.has(productId)) {
      favorites.value.delete(productId)
    } else {
      favorites.value.add(productId)
    }
    // 觸發響應式更新
    favorites.value = new Set(favorites.value)
    save()
  }

  /**
   * 新增收藏
   */
  const addFavorite = (productId: string) => {
    if (!favorites.value.has(productId)) {
      favorites.value.add(productId)
      favorites.value = new Set(favorites.value)
      save()
    }
  }

  /**
   * 移除收藏
   */
  const removeFavorite = (productId: string) => {
    if (favorites.value.has(productId)) {
      favorites.value.delete(productId)
      favorites.value = new Set(favorites.value)
      save()
    }
  }

  /**
   * 檢查是否已收藏
   */
  const isFavorite = (productId: string): boolean => {
    return favorites.value.has(productId)
  }

  /**
   * 清除所有收藏
   */
  const clearAll = () => {
    favorites.value = new Set()
    save()
  }

  /**
   * 收藏數量
   */
  const favoritesCount = computed(() => favorites.value.size)

  /**
   * 是否有任何收藏
   */
  const hasFavorites = computed(() => favorites.value.size > 0)

  /**
   * 取得所有收藏的 ID
   */
  const favoriteIds = computed(() => [...favorites.value])

  return {
    favorites,
    init,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearAll,
    favoritesCount,
    hasFavorites,
    favoriteIds,
  }
}
