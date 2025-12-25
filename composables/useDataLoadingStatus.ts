import { ref, readonly } from 'vue'

// 資料載入狀態
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'fallback' | 'error'

interface LoadingState {
  status: LoadingStatus
  message: string
  usingFallback: boolean
  failedCategories: string[]
}

const state = ref<LoadingState>({
  status: 'idle',
  message: '',
  usingFallback: false,
  failedCategories: [],
})

/**
 * 資料載入狀態管理 composable
 *
 * 用於追蹤 Supabase 資料載入狀態並通知用戶
 *
 * @example
 * ```ts
 * const { status, message, usingFallback, setStatus, setFallback } = useDataLoadingStatus()
 *
 * // 在 onMounted 中檢查並顯示通知
 * if (usingFallback.value) {
 *   showToast('使用離線資料中')
 * }
 * ```
 */
export function useDataLoadingStatus() {
  const setStatus = (newStatus: LoadingStatus, newMessage: string = '') => {
    state.value.status = newStatus
    state.value.message = newMessage
  }

  const setFallback = (isFallback: boolean, categories: string[] = []) => {
    state.value.usingFallback = isFallback
    state.value.failedCategories = categories
    if (isFallback) {
      state.value.status = 'fallback'
      state.value.message = categories.length > 0
        ? `部分品類使用離線資料: ${categories.join(', ')}`
        : '使用離線資料中'
    }
  }

  const reset = () => {
    state.value = {
      status: 'idle',
      message: '',
      usingFallback: false,
      failedCategories: [],
    }
  }

  return {
    status: readonly(ref(() => state.value.status)),
    message: readonly(ref(() => state.value.message)),
    usingFallback: readonly(ref(() => state.value.usingFallback)),
    failedCategories: readonly(ref(() => state.value.failedCategories)),
    // 直接存取 state（用於模板中）
    state: readonly(state),
    setStatus,
    setFallback,
    reset,
  }
}
