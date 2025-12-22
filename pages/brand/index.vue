<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '#imports'
import { Building2 } from 'lucide-vue-next'
import { useBrandConfig } from '~/composables/useBrandConfig'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useStructuredData } from '~/composables/useStructuredData'
import BrandCard from '~/components/BrandCard.vue'
import SiteHeader from '~/components/SiteHeader.vue'

await useProductsSSR()

const { getAllBrands, getBrandStats } = useBrandConfig()
const { allProducts } = useProducts()
const { SITE_URL, SITE_NAME, setBreadcrumbStructuredData } = useStructuredData()

const brands = getAllBrands()

// Calculate product count for each brand
const brandsWithCount = computed(() => {
  return brands.map(brand => ({
    ...brand,
    productCount: getBrandStats(brand, allProducts.value).totalProducts
  })).filter(b => b.productCount > 0).sort((a, b) => b.productCount - a.productCount)
})

// OG Image
const ogImage = `${SITE_URL}/og-image.png`
const pageTitle = `品牌專頁 | ${SITE_NAME}`
const pageDescription = '瀏覽 Panasonic、HITACHI、SHARP、LG 等知名家電品牌的全系列商品，比較各品牌規格與價格。'

// SEO
useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: `${SITE_URL}/brand` },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: '品牌專頁 - 家電比比看' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@jiadian_tw' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:image:alt', content: '品牌專頁 - 家電比比看' },
  ],
  link: [
    { rel: 'canonical', href: `${SITE_URL}/brand` }
  ]
})

// Breadcrumb 結構化資料
setBreadcrumbStructuredData([
  { name: '首頁', url: SITE_URL },
  { name: '品牌專頁', url: `${SITE_URL}/brand` }
])
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <SiteHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <Building2 :size="32" class="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          品牌專頁
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          探索各大家電品牌的全系列商品
        </p>
      </div>

      <!-- Brands Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <BrandCard
          v-for="brand in brandsWithCount"
          :key="brand.slug"
          :brand="brand"
          :product-count="brand.productCount"
        />
      </div>

      <!-- Empty State -->
      <div v-if="brandsWithCount.length === 0" class="text-center py-16">
        <p class="text-gray-500 dark:text-gray-400">目前沒有品牌資料</p>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-12">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 返回首頁
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
