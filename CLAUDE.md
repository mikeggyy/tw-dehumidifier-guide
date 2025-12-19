# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 Programmatic SEO (pSEO) site for comparing dehumidifier specifications. It's designed as an affiliate marketing site targeting the Taiwan market with Traditional Chinese content.

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production (SSR)
npm run generate  # Generate static site for deployment
npm run preview   # Preview production build locally
```

## Known Windows Issue

There is a Nuxt bug with Windows drive letter paths (e.g., `d:/project/test/`) that causes build errors locally. The project builds correctly on Linux-based CI/CD (Vercel, GitHub Actions). For local Windows development, use WSL.

## Architecture

### Data Flow
- **Mock Data Source**: `composables/useProducts.ts` contains 10 hardcoded Taiwan market dehumidifiers
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
Product pages are pre-rendered via `nitro.prerender.routes` in `nuxt.config.ts`. When adding new products:
1. Add product data to `composables/useProducts.ts`
2. Add slug to `productSlugs` array in `nuxt.config.ts`

### URL Slug Format
Product slugs are generated as `{brand}-{model}` lowercased with spaces/underscores replaced by hyphens.
Example: "Panasonic F-Y22EN" → `/product/panasonic-f-y22en`

## Key Files

- `nuxt.config.ts` - Sitemap config, prerender routes, SEO meta defaults
- `composables/useProducts.ts` - Product data, filtering, sorting, slug generation
- `pages/product/[model].vue` - Dynamic product detail with SEO meta tags
- `pages/index.vue` - Homepage with filter sidebar and product grid

## Affiliate Integration
Each product has an `affiliate_url` field pointing to MOMO/Shopee. CTA buttons use `target="_blank"` with `rel="noopener noreferrer nofollow"`.
