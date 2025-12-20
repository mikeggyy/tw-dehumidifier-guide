import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { PAGINATION } from '~/utils/constants'

interface UsePaginationOptions<T> {
  /** 要分頁的資料來源 */
  items: Ref<T[]> | ComputedRef<T[]>
  /** 每頁顯示數量（預設使用常數） */
  itemsPerPage?: number
  /** 重設條件（當這些值改變時，重設到第一頁） */
  resetOn?: Ref<any>[]
}

interface UsePaginationReturn<T> {
  /** 當前頁碼（從 1 開始） */
  currentPage: Ref<number>
  /** 總頁數 */
  totalPages: ComputedRef<number>
  /** 當前頁的資料 */
  paginatedItems: ComputedRef<T[]>
  /** 要顯示的頁碼陣列 */
  pageNumbers: ComputedRef<number[]>
  /** 跳轉到指定頁面 */
  goToPage: (page: number) => void
  /** 上一頁 */
  prevPage: () => void
  /** 下一頁 */
  nextPage: () => void
  /** 是否有上一頁 */
  hasPrev: ComputedRef<boolean>
  /** 是否有下一頁 */
  hasNext: ComputedRef<boolean>
  /** 當前顯示範圍（起始索引，從 1 開始） */
  startIndex: ComputedRef<number>
  /** 當前顯示範圍（結束索引） */
  endIndex: ComputedRef<number>
  /** 每頁數量 */
  itemsPerPage: number
}

/**
 * 分頁邏輯 composable
 *
 * @example
 * ```ts
 * const { paginatedItems, currentPage, totalPages, goToPage } = usePagination({
 *   items: filteredProducts,
 *   resetOn: [searchQuery, filters]
 * })
 * ```
 */
export function usePagination<T>(options: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const { items, itemsPerPage = PAGINATION.ITEMS_PER_PAGE, resetOn = [] } = options

  const currentPage = ref(1)

  // 總頁數
  const totalPages = computed(() => {
    return Math.ceil(items.value.length / itemsPerPage)
  })

  // 當前頁資料
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.value.slice(start, end)
  })

  // 計算顯示的頁碼（最多顯示 5 頁）
  const pageNumbers = computed(() => {
    const total = totalPages.value
    const current = currentPage.value
    const maxPages = PAGINATION.PAGE_NUMBERS_TO_SHOW
    const pages: number[] = []

    if (total <= maxPages) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else if (current <= Math.ceil(maxPages / 2)) {
      for (let i = 1; i <= maxPages; i++) pages.push(i)
    } else if (current >= total - Math.floor(maxPages / 2)) {
      for (let i = total - maxPages + 1; i <= total; i++) pages.push(i)
    } else {
      const half = Math.floor(maxPages / 2)
      for (let i = current - half; i <= current + half; i++) pages.push(i)
    }

    return pages
  })

  // 跳轉到指定頁面
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      // 滾動到頁面頂部
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const prevPage = () => goToPage(currentPage.value - 1)
  const nextPage = () => goToPage(currentPage.value + 1)

  const hasPrev = computed(() => currentPage.value > 1)
  const hasNext = computed(() => currentPage.value < totalPages.value)

  // 當前顯示範圍
  const startIndex = computed(() => {
    if (items.value.length === 0) return 0
    return (currentPage.value - 1) * itemsPerPage + 1
  })

  const endIndex = computed(() => {
    return Math.min(currentPage.value * itemsPerPage, items.value.length)
  })

  // 當條件改變時，重設到第一頁
  if (resetOn.length > 0) {
    watch(resetOn, () => {
      currentPage.value = 1
    })
  }

  // 當總頁數變小，確保當前頁不超過總頁數
  watch(totalPages, (newTotal) => {
    if (currentPage.value > newTotal && newTotal > 0) {
      currentPage.value = newTotal
    }
  })

  return {
    currentPage,
    totalPages,
    paginatedItems,
    pageNumbers,
    goToPage,
    prevPage,
    nextPage,
    hasPrev,
    hasNext,
    startIndex,
    endIndex,
    itemsPerPage,
  }
}
