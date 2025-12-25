import { ref, computed } from 'vue'

/**
 * 商品圖片處理 composable
 * 提供圖片載入錯誤處理和 fallback 功能
 *
 * @example
 * ```ts
 * const { imageError, handleImageError, getImageSrc, fallbackImage } = useProductImage(product.brand)
 * ```
 */
export function useProductImage(brandName?: string) {
  const imageError = ref(false)

  /**
   * 處理圖片載入錯誤
   */
  const handleImageError = () => {
    imageError.value = true
  }

  /**
   * 重置錯誤狀態（用於圖片 URL 變更時）
   */
  const resetError = () => {
    imageError.value = false
  }

  /**
   * 產生 fallback SVG 圖片
   */
  const generateFallbackSvg = (text: string): string => {
    // 截取前 4 個字元作為顯示文字
    const displayText = text.slice(0, 4)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect fill="#e2e8f0" width="300" height="300"/>
      <text x="150" y="150" fill="#64748b" font-family="system-ui, sans-serif" font-size="24" font-weight="500" text-anchor="middle" dominant-baseline="middle">${displayText}</text>
    </svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }

  /**
   * Fallback 圖片（使用 inline SVG data URI）
   */
  const fallbackImage = computed(() => {
    return generateFallbackSvg(brandName || '商品')
  })

  /**
   * 取得圖片來源（考慮錯誤狀態）
   */
  const getImageSrc = (originalUrl: string): string => {
    return imageError.value ? fallbackImage.value : originalUrl
  }

  /**
   * 取得優化的 MOMO 圖片 URL
   * 支援指定尺寸和格式
   */
  const getOptimizedImageUrl = (
    url: string,
    options: {
      width?: number
      height?: number
      format?: 'webp' | 'jpg' | 'png'
    } = {}
  ): string => {
    const { width = 300, height = 300, format = 'webp' } = options

    // 檢查是否為 MOMO 圖片
    if (url.includes('momo.com') || url.includes('momoshop')) {
      // MOMO 圖片 API 支援動態尺寸
      // 格式: https://i.momo.com/xxx_300x300.jpg
      const sizePattern = /_\d+x\d+\./
      if (sizePattern.test(url)) {
        return url.replace(sizePattern, `_${width}x${height}.`)
      }
    }

    return url
  }

  return {
    imageError,
    handleImageError,
    resetError,
    fallbackImage,
    getImageSrc,
    getOptimizedImageUrl,
    generateFallbackSvg,
  }
}

/**
 * 建立靜態 fallback 圖片（不需要響應式）
 */
export function createFallbackImage(brandName: string): string {
  const displayText = brandName.slice(0, 4)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect fill="#e2e8f0" width="300" height="300"/>
    <text x="150" y="150" fill="#64748b" font-family="system-ui, sans-serif" font-size="24" font-weight="500" text-anchor="middle" dominant-baseline="middle">${displayText}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
