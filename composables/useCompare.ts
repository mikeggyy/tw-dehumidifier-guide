import { ref, computed, type Ref } from 'vue'
import { COMPARE } from '~/utils/constants'
import type { ComparableProduct } from '~/types'

// 全域比較清單狀態（支援 Product 和 Dehumidifier）
const compareList: Ref<ComparableProduct[]> = ref([])

// 目前比較的品類（確保只比較同品類商品）
const currentCategory: Ref<string | null> = ref(null)

/**
 * 商品比較功能 composable
 * 支援 Product 和 Dehumidifier 類型
 *
 * @example
 * ```ts
 * const { compareList, toggleCompare, isInCompare, canCompare } = useCompare()
 * toggleCompare(product)
 * ```
 */
export function useCompare() {
  /**
   * 取得商品的品類
   */
  const getCategorySlug = (product: ComparableProduct): string => {
    return product.category_slug || 'dehumidifier'
  }

  /**
   * 切換比較狀態
   */
  const toggleCompare = (product: ComparableProduct) => {
    const index = compareList.value.findIndex(p => p.id === product.id)
    if (index === -1) {
      // 新增時檢查品類
      const productCategory = getCategorySlug(product)
      if (compareList.value.length > 0 && currentCategory.value !== productCategory) {
        // 品類不同，清空後新增
        compareList.value = [product]
        currentCategory.value = productCategory
      } else if (compareList.value.length < COMPARE.MAX_ITEMS) {
        compareList.value.push(product)
        if (!currentCategory.value) {
          currentCategory.value = productCategory
        }
      }
    } else {
      compareList.value.splice(index, 1)
      // 清空後重置品類
      if (compareList.value.length === 0) {
        currentCategory.value = null
      }
    }
  }

  /**
   * 新增到比較清單
   */
  const addToCompare = (product: ComparableProduct): boolean => {
    if (compareList.value.length >= COMPARE.MAX_ITEMS) {
      return false
    }
    const productCategory = getCategorySlug(product)
    // 檢查品類是否相同
    if (compareList.value.length > 0 && currentCategory.value !== productCategory) {
      return false
    }
    if (!isInCompare(product.id)) {
      compareList.value.push(product)
      if (!currentCategory.value) {
        currentCategory.value = productCategory
      }
      return true
    }
    return false
  }

  /**
   * 從比較清單移除
   */
  const removeFromCompare = (productId: string) => {
    compareList.value = compareList.value.filter(p => p.id !== productId)
  }

  /**
   * 檢查是否在比較清單中
   */
  const isInCompare = (productId: string): boolean => {
    return compareList.value.some(p => p.id === productId)
  }

  /**
   * 清空比較清單
   */
  const clearCompare = () => {
    compareList.value = []
    currentCategory.value = null
  }

  /**
   * 比較清單數量
   */
  const compareCount = computed(() => compareList.value.length)

  /**
   * 是否可以進行比較（至少 2 項）
   */
  const canCompare = computed(() => compareList.value.length >= COMPARE.MIN_ITEMS)

  /**
   * 是否已達上限
   */
  const isAtLimit = computed(() => compareList.value.length >= COMPARE.MAX_ITEMS)

  /**
   * 最大比較數量
   */
  const maxItems = COMPARE.MAX_ITEMS

  /**
   * 最小比較數量
   */
  const minItems = COMPARE.MIN_ITEMS

  /**
   * 檢查商品是否可以加入比較（品類檢查）
   */
  const canAddToCompare = (product: ComparableProduct): boolean => {
    if (compareList.value.length >= COMPARE.MAX_ITEMS) {
      return false
    }
    if (compareList.value.length === 0) {
      return true
    }
    return getCategorySlug(product) === currentCategory.value
  }

  return {
    compareList,
    currentCategory,
    toggleCompare,
    addToCompare,
    removeFromCompare,
    isInCompare,
    clearCompare,
    compareCount,
    canCompare,
    isAtLimit,
    canAddToCompare,
    maxItems,
    minItems,
  }
}

