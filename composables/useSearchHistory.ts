import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'search-history'
const MAX_HISTORY = 5

const searchHistory = ref<string[]>([])

export function useSearchHistory() {
  // 載入歷史記錄
  const loadHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          searchHistory.value = JSON.parse(stored)
        }
      } catch {
        searchHistory.value = []
      }
    }
  }

  // 儲存歷史記錄
  const saveHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory.value))
    }
  }

  // 添加搜尋記錄
  const addToHistory = (query: string) => {
    if (!query || query.trim().length < 2) return

    const trimmed = query.trim()
    // 移除重複項
    searchHistory.value = searchHistory.value.filter(h => h !== trimmed)
    // 添加到開頭
    searchHistory.value.unshift(trimmed)
    // 限制數量
    if (searchHistory.value.length > MAX_HISTORY) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY)
    }
    saveHistory()
  }

  // 移除單一記錄
  const removeFromHistory = (query: string) => {
    searchHistory.value = searchHistory.value.filter(h => h !== query)
    saveHistory()
  }

  // 清空歷史記錄
  const clearHistory = () => {
    searchHistory.value = []
    saveHistory()
  }

  // 初始化時載入
  onMounted(() => {
    loadHistory()
  })

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    loadHistory,
  }
}
