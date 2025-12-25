/**
 * 開發環境日誌工具
 * 只在開發環境輸出日誌，生產環境靜默
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  error: (...args: unknown[]) => {
    // 錯誤在所有環境都輸出，但可以選擇性關閉
    if (isDev) {
      console.error(...args)
    }
  },

  // 帶前綴的日誌
  withPrefix: (prefix: string) => ({
    log: (...args: unknown[]) => logger.log(`[${prefix}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${prefix}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${prefix}]`, ...args),
  }),
}

// 預定義的 logger 實例
export const productsLogger = logger.withPrefix('useProducts')
export const storageLogger = logger.withPrefix('useSafeStorage')
export const pwaLogger = logger.withPrefix('usePWA')
export const recentlyViewedLogger = logger.withPrefix('useRecentlyViewed')
export const structuredDataLogger = logger.withPrefix('useStructuredData')
export const productUtilsLogger = logger.withPrefix('productUtils')
