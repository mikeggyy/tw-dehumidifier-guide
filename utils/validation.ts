/**
 * 輕量級資料驗證工具
 * 用於驗證 API 回應和 JSON 資料
 */

import type { Product, Dehumidifier } from '~/types'

// 驗證結果類型
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

/**
 * 驗證商品資料
 */
export function validateProduct(data: unknown): ValidationResult<Product> {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['資料必須是物件'] }
  }

  const obj = data as Record<string, unknown>

  // 必要欄位檢查
  if (!obj.id || typeof obj.id !== 'string') {
    errors.push('id 必須是字串')
  }

  if (!obj.brand || typeof obj.brand !== 'string') {
    errors.push('brand 必須是字串')
  }

  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('name 必須是字串')
  }

  if (typeof obj.price !== 'number' || obj.price < 0) {
    errors.push('price 必須是正數')
  }

  if (!obj.image_url || typeof obj.image_url !== 'string') {
    errors.push('image_url 必須是字串')
  }

  if (!obj.affiliate_url || typeof obj.affiliate_url !== 'string') {
    errors.push('affiliate_url 必須是字串')
  }

  // 可選欄位類型檢查
  if (obj.original_price !== undefined && obj.original_price !== null) {
    if (typeof obj.original_price !== 'number' || obj.original_price < 0) {
      errors.push('original_price 必須是正數或 null')
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    data: data as Product,
  }
}

/**
 * 驗證除濕機資料
 */
export function validateDehumidifier(data: unknown): ValidationResult<Dehumidifier> {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['資料必須是物件'] }
  }

  const obj = data as Record<string, unknown>

  // 必要欄位檢查
  if (!obj.id || typeof obj.id !== 'string') {
    errors.push('id 必須是字串')
  }

  if (!obj.brand || typeof obj.brand !== 'string') {
    errors.push('brand 必須是字串')
  }

  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('name 必須是字串')
  }

  if (typeof obj.price !== 'number' || obj.price < 0) {
    errors.push('price 必須是正數')
  }

  if (!obj.image_url || typeof obj.image_url !== 'string') {
    errors.push('image_url 必須是字串')
  }

  if (!obj.affiliate_url || typeof obj.affiliate_url !== 'string') {
    errors.push('affiliate_url 必須是字串')
  }

  // 規格欄位檢查（允許 null）
  const numericFields = ['daily_capacity', 'tank_capacity', 'noise_level', 'power_consumption']
  for (const field of numericFields) {
    if (obj[field] !== undefined && obj[field] !== null) {
      if (typeof obj[field] !== 'number') {
        errors.push(`${field} 必須是數字或 null`)
      }
    }
  }

  // 能效等級檢查
  if (obj.energy_efficiency !== undefined && obj.energy_efficiency !== null) {
    const validLevels = [1, 2, 3, 4, 5]
    if (!validLevels.includes(obj.energy_efficiency as number)) {
      errors.push('energy_efficiency 必須是 1-5 的數字或 null')
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    data: data as Dehumidifier,
  }
}

/**
 * 批量驗證商品陣列
 */
export function validateProductArray(data: unknown): ValidationResult<Product[]> {
  if (!Array.isArray(data)) {
    return { success: false, errors: ['資料必須是陣列'] }
  }

  const validProducts: Product[] = []
  const allErrors: string[] = []

  data.forEach((item, index) => {
    const result = validateProduct(item)
    if (result.success && result.data) {
      validProducts.push(result.data)
    } else if (result.errors) {
      allErrors.push(`項目 ${index}: ${result.errors.join(', ')}`)
    }
  })

  // 允許部分資料有效
  if (validProducts.length === 0 && allErrors.length > 0) {
    return { success: false, errors: allErrors }
  }

  return {
    success: true,
    data: validProducts,
    errors: allErrors.length > 0 ? allErrors : undefined,
  }
}

/**
 * 批量驗證除濕機陣列
 */
export function validateDehumidifierArray(data: unknown): ValidationResult<Dehumidifier[]> {
  if (!Array.isArray(data)) {
    return { success: false, errors: ['資料必須是陣列'] }
  }

  const validProducts: Dehumidifier[] = []
  const allErrors: string[] = []

  data.forEach((item, index) => {
    const result = validateDehumidifier(item)
    if (result.success && result.data) {
      validProducts.push(result.data)
    } else if (result.errors) {
      allErrors.push(`項目 ${index}: ${result.errors.join(', ')}`)
    }
  })

  // 允許部分資料有效
  if (validProducts.length === 0 && allErrors.length > 0) {
    return { success: false, errors: allErrors }
  }

  return {
    success: true,
    data: validProducts,
    errors: allErrors.length > 0 ? allErrors : undefined,
  }
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T>(
  json: string,
  validator?: (data: unknown) => ValidationResult<T>
): ValidationResult<T> {
  try {
    const data = JSON.parse(json)

    if (validator) {
      return validator(data)
    }

    return { success: true, data: data as T }
  } catch (e) {
    return {
      success: false,
      errors: [`JSON 解析失敗: ${e instanceof Error ? e.message : '未知錯誤'}`],
    }
  }
}

/**
 * 驗證 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 驗證圖片 URL（支援 data URI）
 */
export function isValidImageUrl(url: string): boolean {
  if (url.startsWith('data:image/')) {
    return true
  }
  return isValidUrl(url)
}
