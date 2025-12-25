import { ref } from 'vue'
import { storageLogger as logger } from '~/utils/logger'

/**
 * 安全的 localStorage 操作 composable
 *
 * 提供容量檢查、錯誤處理、過期清理等功能
 *
 * @example
 * ```ts
 * const { getItem, setItem, removeItem } = useSafeStorage()
 * setItem('favorites', ['id1', 'id2'])
 * const favorites = getItem<string[]>('favorites', [])
 * ```
 */
export function useSafeStorage() {
  const isAvailable = ref(true)

  // 檢查 localStorage 是否可用
  const checkAvailability = (): boolean => {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  // 初始化檢查
  if (typeof window !== 'undefined') {
    isAvailable.value = checkAvailability()
  }

  /**
   * 安全地取得 localStorage 項目
   * @param key 儲存鍵名
   * @param defaultValue 預設值
   */
  const getItem = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined' || !isAvailable.value) {
      return defaultValue
    }

    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item) as T
    } catch {
      logger.warn(`Failed to parse item: ${key}`)
      return defaultValue
    }
  }

  /**
   * 安全地設定 localStorage 項目
   * @param key 儲存鍵名
   * @param value 要儲存的值
   * @returns 是否成功
   */
  const setItem = <T>(key: string, value: T): boolean => {
    if (typeof window === 'undefined' || !isAvailable.value) {
      return false
    }

    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      // QuotaExceededError - 容量超出
      if (error instanceof DOMException && error.code === 22) {
        logger.warn('Storage quota exceeded, attempting cleanup...')

        // 嘗試清理舊資料
        if (cleanupOldEntries()) {
          try {
            localStorage.setItem(key, JSON.stringify(value))
            return true
          } catch {
            logger.error('Still failed after cleanup')
          }
        }
      }
      return false
    }
  }

  /**
   * 移除 localStorage 項目
   * @param key 儲存鍵名
   */
  const removeItem = (key: string): void => {
    if (typeof window === 'undefined' || !isAvailable.value) {
      return
    }

    try {
      localStorage.removeItem(key)
    } catch {
      logger.warn(`Failed to remove item: ${key}`)
    }
  }

  /**
   * 清理舊的快取項目
   * 優先清理最近瀏覽記錄等可再生資料
   */
  const cleanupOldEntries = (): boolean => {
    const cleanableKeys = [
      'recently-viewed',
      'recently-viewed-dehumidifier',
      'recently-viewed-air-purifier',
      'recently-viewed-air-conditioner',
      'recently-viewed-heater',
      'recently-viewed-fan',
    ]

    try {
      for (const key of cleanableKeys) {
        const item = localStorage.getItem(key)
        if (item) {
          try {
            const parsed = JSON.parse(item)
            if (Array.isArray(parsed) && parsed.length > 5) {
              // 保留最新 5 筆
              localStorage.setItem(key, JSON.stringify(parsed.slice(0, 5)))
            }
          } catch {
            // 無效資料直接刪除
            localStorage.removeItem(key)
          }
        }
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * 取得目前使用的儲存空間（bytes）
   */
  const getUsedSpace = (): number => {
    if (typeof window === 'undefined' || !isAvailable.value) {
      return 0
    }

    let total = 0
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage.getItem(key)?.length || 0
        }
      }
    } catch {
      // ignore
    }
    return total * 2 // UTF-16 uses 2 bytes per character
  }

  return {
    isAvailable,
    getItem,
    setItem,
    removeItem,
    cleanupOldEntries,
    getUsedSpace,
  }
}
