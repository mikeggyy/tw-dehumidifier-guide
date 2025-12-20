import { ref, computed } from 'vue'
import { COMPARE } from '~/utils/constants'

// 泛型比較清單狀態
const compareList = ref<any[]>([])

/**
 * 商品比較功能 composable
 *
 * @example
 * ```ts
 * const { compareList, toggleCompare, isInCompare, canCompare } = useCompare<Product>()
 * ```
 */
export function useCompare<T extends { id: string }>() {
  /**
   * 切換比較狀態
   */
  const toggleCompare = (product: T) => {
    const index = compareList.value.findIndex(p => p.id === product.id)
    if (index === -1) {
      if (compareList.value.length < COMPARE.MAX_ITEMS) {
        compareList.value.push(product)
      }
    } else {
      compareList.value.splice(index, 1)
    }
  }

  /**
   * 新增到比較清單
   */
  const addToCompare = (product: T): boolean => {
    if (compareList.value.length >= COMPARE.MAX_ITEMS) {
      return false
    }
    if (!isInCompare(product.id)) {
      compareList.value.push(product)
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

  return {
    compareList: compareList as typeof compareList & { value: T[] },
    toggleCompare,
    addToCompare,
    removeFromCompare,
    isInCompare,
    clearCompare,
    compareCount,
    canCompare,
    isAtLimit,
    maxItems,
    minItems,
  }
}
