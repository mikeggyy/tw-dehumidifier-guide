<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  ArrowLeft,
  Droplets,
  Volume2,
  Zap,
  Box,
  Star,
  Check,
  ExternalLink
} from 'lucide-vue-next'
import { useProducts } from '~/composables/useProducts'
import { useRoute, useHead, createError } from '#imports'

const route = useRoute()
const { loadProducts, getProductBySlug, getProductSlug, allProducts } = useProducts()

// Get product from slug
const slug = computed(() => route.params.model as string)

// 載入產品資料
const isReady = ref(false)
const product = ref<ReturnType<typeof getProductBySlug>>(undefined)

onMounted(async () => {
  await loadProducts()
  product.value = getProductBySlug(slug.value)
  isReady.value = true

  // 如果產品不存在，顯示錯誤
  if (!product.value) {
    throw createError({
      statusCode: 404,
      statusMessage: '找不到此產品'
    })
  }
})

// Format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

// Energy label text
const energyLabel = computed(() => {
  const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
  return labels[product.value?.energy_efficiency || 1]
})

const energyColor = computed(() => {
  const colors: Record<number, string> = {
    1: 'bg-green-500',
    2: 'bg-lime-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500'
  }
  return colors[product.value?.energy_efficiency || 1] || 'bg-gray-500'
})

// Recommended room size based on capacity (rough estimate)
const recommendedArea = computed(() => {
  if (!product.value) return ''
  const capacity = product.value.daily_capacity ?? 0
  if (capacity <= 10) return '5-10 坪'
  if (capacity <= 14) return '10-15 坪'
  if (capacity <= 18) return '15-20 坪'
  return '20 坪以上'
})

// Related products (same brand, different model)
const relatedProducts = computed(() => {
  if (!product.value) return []
  return allProducts.value.filter(
    p => p.brand === product.value!.brand && p.id !== product.value!.id
  ).slice(0, 3)
})

// Schema.org JSON-LD structured data
const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: `${product.value?.brand} ${product.value?.model} 除濕機`,
  image: product.value?.image_url,
  description: `${product.value?.brand} ${product.value?.model} 除濕機，日除濕量 ${product.value?.daily_capacity}L，噪音 ${product.value?.noise_level}dB，${energyLabel.value}`,
  brand: {
    '@type': 'Brand',
    name: product.value?.brand
  },
  offers: {
    '@type': 'Offer',
    price: product.value?.price,
    priceCurrency: 'TWD',
    availability: 'https://schema.org/InStock',
    url: product.value?.affiliate_url
  },
  additionalProperty: [
    {
      '@type': 'PropertyValue',
      name: '日除濕量',
      value: `${product.value?.daily_capacity} L/日`
    },
    {
      '@type': 'PropertyValue',
      name: '噪音值',
      value: `${product.value?.noise_level} dB`
    },
    {
      '@type': 'PropertyValue',
      name: '能源效率',
      value: energyLabel.value
    }
  ]
}))

// Dynamic SEO
useHead({
  title: `${product.value?.brand} ${product.value?.model} 除濕機評價：優缺點、規格與價格懶人包 (2025)`,
  meta: [
    {
      name: 'description',
      content: `還在猶豫 ${product.value?.brand} ${product.value?.model} 嗎？這裡整理了它的日除濕量 ${product.value?.daily_capacity}L、噪音 ${product.value?.noise_level}dB 以及最適合的坪數。點擊查看 MOMO 最新優惠。`
    },
    {
      property: 'og:title',
      content: `${product.value?.brand} ${product.value?.model} 除濕機評價 (2025)`
    },
    {
      property: 'og:description',
      content: `日除濕量 ${product.value?.daily_capacity}L | 噪音 ${product.value?.noise_level}dB | ${energyLabel.value} | NT$ ${formatPrice(product.value?.price || 0)}`
    },
    {
      property: 'og:image',
      content: product.value?.image_url
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd.value)
    }
  ]
})

// Specs table data
const specsTable = computed(() => {
  if (!product.value) return []
  return [
    { label: '品牌', value: product.value.brand },
    { label: '型號', value: product.value.model },
    { label: '日除濕量', value: `${product.value.daily_capacity} 公升/日` },
    { label: '水箱容量', value: `${product.value.tank_capacity} 公升` },
    { label: '適用坪數', value: recommendedArea.value },
    { label: '噪音值', value: `${product.value.noise_level} dB` },
    { label: '消耗功率', value: `${product.value.power_consumption} W` },
    { label: '能源效率', value: energyLabel.value },
    { label: '參考價格', value: `NT$ ${formatPrice(product.value.price)}` }
  ]
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="!isReady" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-500">載入中...</p>
  </div>

  <div v-else-if="product" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-xl font-bold text-blue-600">除濕機比較</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft :size="16" />
          返回產品列表
        </NuxtLink>
      </nav>

      <div class="lg:flex lg:gap-8">
        <!-- Main Content -->
        <div class="flex-1">
          <!-- Product Header -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div class="md:flex">
              <!-- Image -->
              <div class="md:w-2/5 bg-gray-50">
                <div class="aspect-square relative">
                  <img
                    :src="product.image_url"
                    :alt="`${product.brand} ${product.model} 除濕機`"
                    class="w-full h-full object-cover"
                  />
                  <span
                    :class="[energyColor, 'absolute top-4 left-4 text-white text-sm font-medium px-3 py-1 rounded-full']"
                  >
                    {{ energyLabel }}
                  </span>
                </div>
              </div>

              <!-- Info -->
              <div class="md:w-3/5 p-6">
                <p class="text-gray-500 mb-1">{{ product.brand }}</p>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {{ product.model }} 除濕機
                </h1>

                <!-- Key Highlights -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Droplets class="text-blue-600" :size="24" />
                    <div>
                      <p class="text-xs text-gray-500">日除濕量</p>
                      <p class="font-semibold text-gray-900">{{ product.daily_capacity }}L</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Volume2 class="text-blue-600" :size="24" />
                    <div>
                      <p class="text-xs text-gray-500">噪音值</p>
                      <p class="font-semibold text-gray-900">{{ product.noise_level }}dB</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Box class="text-blue-600" :size="24" />
                    <div>
                      <p class="text-xs text-gray-500">適用坪數</p>
                      <p class="font-semibold text-gray-900">{{ recommendedArea }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Zap class="text-blue-600" :size="24" />
                    <div>
                      <p class="text-xs text-gray-500">消耗功率</p>
                      <p class="font-semibold text-gray-900">{{ product.power_consumption }}W</p>
                    </div>
                  </div>
                </div>

                <!-- Price -->
                <div class="mb-6">
                  <p class="text-sm text-gray-500 mb-1">參考價格</p>
                  <p class="text-3xl font-bold text-blue-600">
                    NT$ {{ formatPrice(product.price) }}
                  </p>
                </div>

                <!-- CTA Button (Desktop) -->
                <a
                  :href="product.affiliate_url"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="hidden md:flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  查看最新優惠價格
                  <ExternalLink :size="18" />
                </a>
              </div>
            </div>
          </div>

          <!-- Features Section -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star class="text-yellow-500" :size="24" />
              主要功能特色
            </h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <div
                v-for="feature in product.features"
                :key="feature"
                class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <Check class="text-green-500 flex-shrink-0" :size="20" />
                <span class="text-gray-700">{{ feature }}</span>
              </div>
            </div>
          </div>

          <!-- Specs Table -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">完整規格表</h2>
            <div class="overflow-x-auto">
              <table class="w-full">
                <tbody>
                  <tr
                    v-for="(spec, index) in specsTable"
                    :key="spec.label"
                    :class="index % 2 === 0 ? 'bg-gray-50' : 'bg-white'"
                  >
                    <td class="px-4 py-3 font-medium text-gray-600 w-1/3">
                      {{ spec.label }}
                    </td>
                    <td class="px-4 py-3 text-gray-900">
                      {{ spec.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- AI Summary Placeholder -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">AI 評價摘要</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-600 leading-relaxed">
                {{ product.brand }} {{ product.model }} 是一款適合
                {{ recommendedArea }}空間使用的除濕機，每日除濕量達到 {{ product.daily_capacity ?? '-' }} 公升。
                在噪音控制方面，運轉時僅 {{ product.noise_level ?? '-' }} dB，
                {{ (product.noise_level ?? 50) <= 40 ? '屬於安靜機型，適合臥室使用' : '適合客廳或較大空間使用' }}。
              </p>
              <p class="text-gray-600 leading-relaxed mt-3">
                能效表現為{{ energyLabel }}，消耗功率 {{ product.power_consumption ?? '-' }}W，
                {{ product.energy_efficiency === 1 ? '是市面上最省電的等級' : '能效表現符合標準' }}。
                水箱容量 {{ product.tank_capacity ?? '-' }} 公升，
                {{ (product.tank_capacity ?? 0) >= 4.5 ? '大容量設計減少倒水頻率' : '需要較頻繁清空水箱' }}。
              </p>
              <p class="text-gray-500 text-sm mt-4 italic">
                * 以上為 AI 自動生成的產品摘要，實際使用體驗可能因環境而異。
              </p>
            </div>
          </div>

          <!-- Related Products -->
          <div v-if="relatedProducts.length > 0" class="mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">同品牌其他型號</h2>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <NuxtLink
                v-for="related in relatedProducts"
                :key="related.id"
                :to="`/product/${getProductSlug(related)}`"
                class="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <p class="text-sm text-gray-500">{{ related.brand }}</p>
                <p class="font-semibold text-gray-900">{{ related.model }}</p>
                <p class="text-blue-600 font-medium mt-1">
                  NT$ {{ formatPrice(related.price) }}
                </p>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Sticky Sidebar (Desktop) -->
        <aside class="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <div class="sticky top-24">
            <div class="bg-white rounded-xl border border-gray-200 p-6">
              <p class="text-gray-500 mb-1">{{ product.brand }}</p>
              <h3 class="font-bold text-gray-900 mb-2">{{ product.model }}</h3>
              <p class="text-2xl font-bold text-blue-600 mb-4">
                NT$ {{ formatPrice(product.price) }}
              </p>
              <a
                :href="product.affiliate_url"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow hover:shadow-md"
              >
                前往購買
                <ExternalLink :size="16" />
              </a>
              <p class="text-xs text-gray-400 text-center mt-3">
                點擊前往 MOMO 購物網
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Sticky CTA (Mobile) -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-50">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-gray-500">{{ product.brand }} {{ product.model }}</p>
          <p class="text-lg font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</p>
        </div>
        <a
          :href="product.affiliate_url"
          target="_blank"
          rel="noopener noreferrer nofollow"
          class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow"
        >
          前往購買
          <ExternalLink :size="16" />
        </a>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16 pb-24 md:pb-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500 text-sm">
          <p>© 2025 除濕機比較. 本站包含聯盟行銷連結。</p>
          <p class="mt-1">價格與規格僅供參考，請以官方公告為準。</p>
        </div>
      </div>
    </footer>
  </div>
</template>
