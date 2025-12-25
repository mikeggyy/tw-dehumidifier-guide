# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 Programmatic SEO (pSEO) site for comparing home appliance specifications. It's designed as an affiliate marketing site targeting the Taiwan market with Traditional Chinese content.

| 項目 | 值 |
|------|-----|
| 網站名稱 | 比比看 |
| 網站 URL | https://www.jiadian-tw.work |
| GA ID | G-P32TQ7V2SZ |
| 目標市場 | 台灣 |
| 語言 | 繁體中文 |

**支援品類**: 除濕機、空氣清淨機、冷氣、電暖器、電風扇

## Commands

```bash
# Development
npm run dev       # Start development server (port 3000, kills existing process first)
npm run dev:fast  # Start dev server without killing existing process

# Build
npm run build     # Build for production (SSR)
npm run generate  # Generate static site for deployment
npm run preview   # Preview production build locally

# Testing
npm run test           # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Run tests with coverage report

# Single test file
npx vitest run tests/useProducts.test.ts
```

## Known Windows Issue

There is a Nuxt bug with Windows drive letter paths (e.g., `d:/project/test/`) that causes build errors locally. The project builds correctly on Linux-based CI/CD (Vercel, GitHub Actions). For local Windows development, use WSL.

## Environment Variables

**必須設定（無預設值）：**

```bash
# .env（本地開發）或 Vercel 環境變數（生產環境）
NUXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NUXT_PUBLIC_SITE_URL=https://www.jiadian-tw.work
```

| 變數 | 說明 |
|------|------|
| `NUXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名金鑰 |
| `NUXT_PUBLIC_SITE_URL` | 網站正式 URL（SEO 用） |

## Daily Scraper Workflow (重要!)

爬蟲專案位於: `d:\project\tw-dehumidifier-scraper`

### 排程時間
每天台灣時間早上 6 點 (UTC 22:00) 由 GitHub Actions 自動執行

### 執行流程
1. **爬取商品資料** - 使用 Playwright 爬 MOMO 購物網各品類商品
   - `momo_dehumidifier.py` - 除濕機
   - `momo_air_purifier.py` - 空氣清淨機
   - (其他品類待擴充)

2. **產生聯盟連結** - 對於新商品，使用 `ichannels_affiliate.py` 爬蟲自動產生 iChannels 推薦連結

3. **同步到 Supabase** - `sync_category_to_supabase.py all` 將資料上傳到資料庫
   - 新商品: 新增到資料庫
   - 下架商品: 從資料庫刪除
   - 價格變動: 更新資料庫

4. **Nuxt 網站讀取** - 本專案從 Supabase 讀取商品資料顯示

### 聯盟連結 (非常重要!)
- 每個商品都有 `affiliate_url` 欄位，這是透過 iChannels 產生的推薦連結
- **用戶點擊「前往購買」按鈕時，連到的是 affiliate_url (推薦連結)，不是原始 MOMO 連結**
- 這樣用戶購買後我們才能獲得聯盟行銷佣金

### 相關檔案
```
tw-dehumidifier-scraper/
├── .github/workflows/daily-scrape.yml  # GitHub Actions 排程設定
├── scraper/
│   ├── momo_dehumidifier.py           # 除濕機爬蟲
│   ├── momo_air_purifier.py           # 空氣清淨機爬蟲
│   ├── momo_air_conditioner.py        # 冷氣爬蟲
│   ├── momo_heater.py                 # 電暖器爬蟲
│   ├── momo_fan.py                    # 電風扇爬蟲
│   ├── ichannels_affiliate.py         # 聯盟連結產生器
│   └── sync_category_to_supabase.py   # 同步到 Supabase
```

## Architecture

### Data Flow
- **Primary**: Supabase 資料庫 (products table, 由爬蟲每日更新)
- **Fallback**: `data/*.json` 檔案作為備援資料 (Supabase 連線失敗時使用)
- **Type Definitions**: `types/index.ts` - 使用 `Dehumidifier` 類型 (向後相容), 新商品使用 `Product` 類型
- **No State Management**: All filtering/sorting lives in composables, no Vuex/Pinia

### Auto-Imports Disabled
Due to Windows path bugs, Nuxt auto-imports are disabled in `nuxt.config.ts`. All imports must be explicit.

**Vue core:**
```typescript
import { ref, computed, watch, watchEffect, onMounted, onUnmounted, nextTick } from 'vue'
```

**Nuxt functions:**
```typescript
import { useRoute, useRouter, useHead, useSeoMeta, useRuntimeConfig, useAsyncData, createError, navigateTo } from '#imports'
```

**Project composables:**
```typescript
// 資料載入
import { useProducts, useProductsSSR } from '~/composables/useProducts'

// 品類設定
import { useCategoryConfig, categoryConfigs, categoryList } from '~/composables/useCategoryConfig'

// 功能
import { useCompare } from '~/composables/useCompare'
import { useFavorites } from '~/composables/useFavorites'
import { useDarkMode } from '~/composables/useDarkMode'
import { useUrlFilters } from '~/composables/useUrlFilters'
import { useStructuredData } from '~/composables/useStructuredData'

// 內容設定
import { useBrandConfig } from '~/composables/useBrandConfig'
import { useGuideConfig } from '~/composables/useGuideConfig'
```

**Types:**
```typescript
import type { Product, Dehumidifier, Category, SortOption, FilterState } from '~/types'
import type { SpecConfig, CategoryConfig, QuickTag } from '~/composables/useCategoryConfig'
import type { FAQItem, FAQCategory } from '~/composables/useFaqConfig'
```

**Components (must be explicitly imported):**
```typescript
import ProductCard from '~/components/ProductCard.vue'
import ProductFilters from '~/components/category/ProductFilters.vue'
```

### Multi-Category System
品類設定集中在 `composables/useCategoryConfig.ts`:
- `CategoryConfig` 定義每個品類的規格欄位、篩選器、排序選項
- 新增品類: 在 `categoryConfigs` 物件加入設定, 在 `categoryList` 加入選項
- 品類 slug: `dehumidifier`, `air-purifier`, `air-conditioner`, `heater`, `fan`

### Static Site Generation
- 使用 `crawlLinks: true` 自動發現所有頁面
- 品類頁面會被預渲染，商品頁面由 crawler 自動發現
- 不需要手動維護 slug 列表

### URL Structure
| 頁面 | URL |
|------|-----|
| 首頁 | `/` |
| 品類列表 | `/{category}` (如 `/dehumidifier`, `/air-purifier`) |
| 商品詳情 | `/{category}/{brand}-{id}` (如 `/dehumidifier/panasonic-14425700`) |
| 購買指南 | `/guide/{category}-buying-guide` |
| 品牌頁面 | `/brand/{brand}` |
| 比較頁面 | `/compare` |

## Key Files

**Config**
- `nuxt.config.ts` - Sitemap, prerender routes, SEO meta, runtime config

**Pages** (dynamic routing)
- `pages/index.vue` - 首頁 (品類卡片導覽)
- `pages/[category]/index.vue` - 品類列表頁 (含篩選器、排序、比較功能)
- `pages/[category]/[slug].vue` - 商品詳情頁

**Core Composables**
- `composables/useProducts.ts` - 從 Supabase/JSON 載入資料, filtering, sorting
- `composables/useCategoryConfig.ts` - 各品類的設定 (篩選器、規格欄位等)
- `composables/useCompare.ts` - 商品比較功能 (localStorage 持久化)
- `composables/useFavorites.ts` - 收藏功能
- `composables/useDarkMode.ts` - 深色模式切換
- `composables/useStructuredData.ts` - SEO Schema.org 結構化資料
- `composables/useUrlFilters.ts` - URL 篩選狀態同步
- `composables/useBrandConfig.ts` - 品牌設定
- `composables/useGuideConfig.ts` - 購買指南設定

**useProducts API:**
```typescript
const {
  allProducts,       // Ref<Product[]> - 所有商品
  isLoading,         // Ref<boolean> - 載入狀態
  loadProducts,      // () => Promise<Product[]>
  getAllBrands,      // () => string[]
  getPriceRange,     // () => { min, max }
  filterProducts,    // (filters: FilterState) => Product[]
  sortProducts,      // (products, option) => Product[]
  getProductBySlug,  // (slug: string) => Product | undefined
  getProductSlug,    // (product: Product) => string
} = useProducts()
```

**Data**
- `data/*.json` - 各品類商品資料 (Supabase 備援用)
- `types/index.ts` - TypeScript 類型定義

## UI Components

- **Icons**: 使用 `lucide-vue-next` (e.g., `<Droplets />`, `<Wind />`)
- **Styling**: Tailwind CSS with dark mode support
- **Component imports**: 必須明確 import，沒有 auto-import

**Category icons:**
- 除濕機: `Droplets`
- 空氣清淨機: `Wind`
- 冷氣: `Snowflake`
- 電暖器: `Flame`
- 電風扇: `Fan`

**Compare Components** (`components/compare/`):
- `CompareDesktopTable.vue` - 桌面版比較表
- `CompareMobileCard.vue` - 手機版比較卡片
- `CompareProductCard.vue` - 商品卡片
- `CompareSpecRow.vue` - 規格行
- `CompareToolbar.vue` - 工具列
- `CompareWeightPanel.vue` - 權重設定面板
- `CompareConclusionPanel.vue` - 結論面板

**Finder Components** (各品類專屬推薦器):
- `ProductFinder.vue` - 除濕機 Finder
- `AirPurifierFinder.vue` - 空氣清淨機 Finder
- `AirConditionerFinder.vue` - 冷氣 Finder
- `HeaterFinder.vue` - 電暖器 Finder
- `FanFinder.vue` - 電風扇 Finder

**Calculator Components** (計算機元件):
- `RoomCalculator.vue` - 計算房間坪數
- `AirPurifierCalculator.vue` - 計算所需 CADR 值
- `AirConditionerCalculator.vue` - 計算所需冷氣噸數

**Other Recommender Components**:
- `ScenarioRecommender.vue` - 情境推薦
- `DecisionHelper.vue` - 決策輔助
- `SimilarProducts.vue` - 相似商品
- `SameBrandProducts.vue` - 同品牌商品

## Affiliate Integration (聯盟行銷)

**重要**: 這是網站營收來源!

- 每個商品都有 `affiliate_url` 欄位，這是 iChannels 聯盟連結
- 用戶點擊購買按鈕 → 連到 `affiliate_url` → 用戶購買 → 我們獲得佣金
- CTA 按鈕使用 `target="_blank"` with `rel="noopener noreferrer nofollow"`
- 聯盟連結由爬蟲專案的 `ichannels_affiliate.py` 自動產生
