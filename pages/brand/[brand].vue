<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useHead, createError } from '#imports'
import { ExternalLink, MapPin, ArrowRight } from 'lucide-vue-next'
import { useBrandConfig } from '~/composables/useBrandConfig'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useCategoryConfig } from '~/composables/useCategoryConfig'
import { useStructuredData } from '~/composables/useStructuredData'
import ProductCard from '~/components/ProductCard.vue'
import SiteHeader from '~/components/SiteHeader.vue'
import type { Dehumidifier } from '~/types'

await useProductsSSR()

const route = useRoute()
const { getBrandBySlug, getBrandStats, getProductsByBrandAndCategory } = useBrandConfig()
const { allProducts } = useProducts()
const { categoryList } = useCategoryConfig()
const { SITE_URL, SITE_NAME } = useStructuredData()

const brandSlug = computed(() => route.params.brand as string)
const brandInfo = computed(() => getBrandBySlug(brandSlug.value))

// 404 if brand not found
if (!brandInfo.value) {
  throw createError({ statusCode: 404, statusMessage: '找不到此品牌' })
}

const brandStats = computed(() => {
  if (!brandInfo.value) return null
  return getBrandStats(brandInfo.value, allProducts.value)
})

// Group products by category
const productsByCategory = computed(() => {
  if (!brandInfo.value || !brandStats.value) return []

  return brandStats.value.categories.map(categorySlug => {
    const products = getProductsByBrandAndCategory(brandInfo.value!, allProducts.value, categorySlug)
    const categoryConfig = categoryList.find(c => c.slug === categorySlug)
    return {
      slug: categorySlug,
      name: categoryConfig?.name || categorySlug,
      products: products.slice(0, 8) as Dehumidifier[] // Limit to 8 per category
    }
  }).filter(c => c.products.length > 0)
})

// SEO
useHead({
  title: `${brandInfo.value?.name} 全系列商品 | ${SITE_NAME}`,
  meta: [
    { name: 'description', content: `${brandInfo.value?.name} 家電全系列商品，包含${brandStats.value?.categories.length || 0}個品類、${brandStats.value?.totalProducts || 0}款商品，比較規格與價格。` },
    { property: 'og:title', content: `${brandInfo.value?.name} 全系列商品 | ${SITE_NAME}` },
    { property: 'og:description', content: `探索 ${brandInfo.value?.name} 全系列家電商品，比較規格與價格。` },
    { property: 'og:url', content: `${SITE_URL}/brand/${brandSlug.value}` },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: `${SITE_URL}/brand/${brandSlug.value}` }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <SiteHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <NuxtLink to="/" class="hover:text-blue-600">首頁</NuxtLink>
        <span>/</span>
        <NuxtLink to="/brand" class="hover:text-blue-600">品牌專頁</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 dark:text-white">{{ brandInfo?.name }}</span>
      </nav>

      <!-- Brand Header -->
      <header class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {{ brandInfo?.name }}
            </h1>

            <div v-if="brandInfo?.country" class="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-4">
              <MapPin :size="16" />
              <span>{{ brandInfo.country }}</span>
            </div>

            <p class="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
              {{ brandInfo?.description }}
            </p>

            <!-- Features -->
            <div v-if="brandInfo?.features && brandInfo.features.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="feature in brandInfo.features"
                :key="feature"
                class="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full"
              >
                {{ feature }}
              </span>
            </div>
          </div>

          <div class="flex flex-col items-start md:items-end gap-4">
            <!-- Stats -->
            <div class="flex gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ brandStats?.totalProducts || 0 }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">款商品</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ brandStats?.categories.length || 0 }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">個品類</div>
              </div>
            </div>

            <!-- Official Site Link -->
            <a
              v-if="brandInfo?.officialUrl"
              :href="brandInfo.officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
            >
              <ExternalLink :size="16" />
              官方網站
            </a>
          </div>
        </div>
      </header>

      <!-- Products by Category -->
      <div class="space-y-10">
        <section v-for="category in productsByCategory" :key="category.slug">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ category.name }}
            </h2>
            <NuxtLink
              :to="`/${category.slug}?brand=${brandInfo?.aliases[0]}`"
              class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部
              <ArrowRight :size="16" />
            </NuxtLink>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ProductCard
              v-for="product in category.products"
              :key="product.id"
              :product="product"
              :category-slug="category.slug"
              :show-compare="false"
            />
          </div>
        </section>
      </div>

      <!-- Empty State -->
      <div v-if="productsByCategory.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4">📦</div>
        <p class="text-gray-500 dark:text-gray-400 mb-4">目前沒有此品牌的商品</p>
        <NuxtLink
          to="/brand"
          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 返回品牌列表
        </NuxtLink>
      </div>

      <!-- Back Link -->
      <div class="text-center mt-12">
        <NuxtLink
          to="/brand"
          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 返回品牌列表
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
