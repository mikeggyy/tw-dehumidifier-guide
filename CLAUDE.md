# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 Programmatic SEO (pSEO) site for comparing home appliance specifications. It's designed as an affiliate marketing site targeting the Taiwan market with Traditional Chinese content.

**支援品類**: 除濕機、空氣清淨機、冷氣、電暖器、電風扇

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production (SSR)
npm run generate  # Generate static site for deployment
npm run preview   # Preview production build locally
```

## Known Windows Issue

There is a Nuxt bug with Windows drive letter paths (e.g., `d:/project/test/`) that causes build errors locally. The project builds correctly on Linux-based CI/CD (Vercel, GitHub Actions). For local Windows development, use WSL.

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
│   ├── ichannels_affiliate.py         # 聯盟連結產生器
│   └── sync_category_to_supabase.py   # 同步到 Supabase
```

## Architecture

### Data Flow
- **Data Source**: Supabase 資料庫 (由爬蟲每日更新)
- **Local Fallback**: `data/*.json` 檔案作為備援資料
- **Type Definitions**: `types/index.ts` defines `Dehumidifier`, `FilterState`, and `SortOption`
- **Filtering/Sorting**: All logic lives in `useProducts()` composable - no external state management

### Auto-Imports Disabled
Due to Windows path bugs, Nuxt auto-imports are disabled in `nuxt.config.ts`. All Vue/Nuxt imports must be explicit:
```typescript
import { ref, computed } from 'vue'
import { useRoute, useHead, createError } from '#imports'
import { useProducts } from '~/composables/useProducts'
import ProductCard from '~/components/ProductCard.vue'
```

### Static Site Generation
- 使用 `crawlLinks: true` 自動發現所有頁面
- 品類頁面會被預渲染，商品頁面由 crawler 自動發現
- 不需要手動維護 slug 列表

### URL Structure
- 首頁: `/`
- 品類頁: `/{category}` (如 `/dehumidifier`, `/air-purifier`)
- 商品頁: `/{category}/{brand}-{id}` (如 `/dehumidifier/panasonic-14425700`)

## Key Files

- `nuxt.config.ts` - Sitemap config, prerender routes, SEO meta defaults
- `composables/useProducts.ts` - 從 Supabase/JSON 載入資料, filtering, sorting
- `composables/useCategoryConfig.ts` - 各品類的設定 (篩選器、規格欄位等)
- `pages/[category]/index.vue` - 品類列表頁 (含篩選器、排序、比較功能)
- `pages/[category]/[slug].vue` - 商品詳情頁
- `pages/index.vue` - 首頁 (品類卡片導覽)
- `data/*.json` - 各品類商品資料 (備援用)

## Affiliate Integration (聯盟行銷)

**重要**: 這是網站營收來源!

- 每個商品都有 `affiliate_url` 欄位，這是 iChannels 聯盟連結
- 用戶點擊購買按鈕 → 連到 `affiliate_url` → 用戶購買 → 我們獲得佣金
- CTA 按鈕使用 `target="_blank"` with `rel="noopener noreferrer nofollow"`
- 聯盟連結由爬蟲專案的 `ichannels_affiliate.py` 自動產生
