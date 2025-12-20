/**
 * 全站常數設定
 * 集中管理各種 magic numbers，方便維護和調整
 */

// ============================================================
// 分頁設定
// ============================================================
export const PAGINATION = {
  /** 每頁顯示商品數量 */
  ITEMS_PER_PAGE: 20,
  /** 頁碼顯示數量（例如：1 2 3 4 5） */
  PAGE_NUMBERS_TO_SHOW: 5,
} as const

// ============================================================
// 網路請求設定
// ============================================================
export const REQUEST = {
  /** API 請求超時時間（毫秒） */
  TIMEOUT: 10000,
  /** 重試次數 */
  RETRY_COUNT: 3,
  /** 重試延遲（毫秒） */
  RETRY_DELAY: 1000,
} as const

// ============================================================
// 比較功能設定
// ============================================================
export const COMPARE = {
  /** 最多可比較商品數量 */
  MAX_ITEMS: 4,
  /** 最少需要商品數量才能比較 */
  MIN_ITEMS: 2,
} as const

// ============================================================
// UI 設定
// ============================================================
export const UI = {
  /** 顯示回到頂部按鈕的滾動距離（像素） */
  SCROLL_TOP_THRESHOLD: 500,
  /** 動畫持續時間（毫秒） */
  ANIMATION_DURATION: 300,
  /** 防抖延遲（毫秒） */
  DEBOUNCE_DELAY: 300,
  /** 搜尋自動完成最少字元數 */
  MIN_SEARCH_LENGTH: 1,
  /** 搜尋建議最大顯示數量 */
  MAX_SUGGESTIONS: 8,
} as const

// ============================================================
// 本地儲存 Key
// ============================================================
export const STORAGE_KEYS = {
  FAVORITES: 'dehumidifier-favorites',
  DARK_MODE: 'dark-mode',
  ONBOARDING_COMPLETED: 'onboarding-completed',
  RECENTLY_VIEWED: 'recently-viewed',
} as const

// ============================================================
// 能源效率設定
// ============================================================
export const ENERGY_EFFICIENCY = {
  LABELS: ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效'],
  COLORS: {
    1: 'bg-green-100 text-green-800',
    2: 'bg-lime-100 text-lime-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
  },
} as const

// ============================================================
// 品牌設定
// ============================================================
export const BRANDS = {
  /** 主要品牌（優先顯示） */
  MAJOR: [
    'Panasonic',
    'HITACHI',
    'Mitsubishi',
    'SHARP',
    'LG',
    'SAMPO',
    'HERAN',
    'Whirlpool',
    'DAIKIN',
  ],
} as const

// ============================================================
// 除濕機相關常數
// ============================================================
export const DEHUMIDIFIER = {
  /** 容量分級（升/日） */
  CAPACITY_THRESHOLDS: {
    SMALL: 10,   // 10L 以下
    MEDIUM: 15,  // 10-15L
    // 15L 以上為大容量
  },
  /** 坪數建議對照 */
  CAPACITY_PER_PING: 0.8, // 每坪約需 0.8L 除濕量
} as const
