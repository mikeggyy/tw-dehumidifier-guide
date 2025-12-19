<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowLeft,
  Droplets,
  Volume2,
  Zap,
  Box,
  Star,
  Check,
  ExternalLink,
  Share2,
  Home,
  BedDouble,
  Sofa,
  CircleDollarSign,
  Lightbulb
} from 'lucide-vue-next'
import { useProducts, useProductsSSR } from '~/composables/useProducts'
import { useRoute, useHead, createError } from '#imports'

// SSR 資料預載
await useProductsSSR()

const route = useRoute()
const { getProductBySlug, getProductSlug, allProducts } = useProducts()

// Get product from slug
const slug = computed(() => route.params.model as string)

// 產品資料（SSR 已載入）
const product = computed(() => getProductBySlug(slug.value))
const isReady = computed(() => allProducts.value.length > 0)

// 如果產品不存在，顯示錯誤
if (!product.value && isReady.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '找不到此產品'
  })
}

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

// Display brand - hide "Other", try to extract from name
const displayBrand = computed(() => {
  if (!product.value) return ''
  const brand = product.value.brand
  if (brand && brand !== 'Other') return brand
  const match = product.value.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
})

// 折扣百分比
const discountPercent = computed(() => {
  if (!product.value) return null
  const original = product.value.original_price
  const current = product.value.price
  if (!original || original <= current) return null
  const discount = Math.round((1 - current / original) * 100)
  return discount >= 5 ? discount : null
})

// 分享功能
const shareProduct = async () => {
  if (!product.value) return

  const shareData = {
    title: product.value.name,
    text: `${product.value.name} - NT$ ${formatPrice(product.value.price)}`,
    url: window.location.href
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (err) {
      // 用戶取消分享
    }
  } else {
    // Fallback: 複製連結
    await navigator.clipboard.writeText(window.location.href)
    alert('已複製連結！')
  }
}

// Schema.org JSON-LD structured data
const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.value?.name,
  image: product.value?.image_url,
  description: `${product.value?.name}${product.value?.daily_capacity ? `，日除濕量 ${product.value.daily_capacity}L` : ''}${product.value?.noise_level ? `，噪音 ${product.value.noise_level}dB` : ''}，${energyLabel.value}`,
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
    ...(product.value?.daily_capacity ? [{
      '@type': 'PropertyValue',
      name: '日除濕量',
      value: `${product.value.daily_capacity} L/日`
    }] : []),
    ...(product.value?.noise_level ? [{
      '@type': 'PropertyValue',
      name: '噪音值',
      value: `${product.value.noise_level} dB`
    }] : []),
    {
      '@type': 'PropertyValue',
      name: '能源效率',
      value: energyLabel.value
    }
  ]
}))

// Dynamic SEO
useHead({
  title: `${product.value?.name} - 規格與價格比較 (2025)`,
  meta: [
    {
      name: 'description',
      content: `${product.value?.name} 完整規格介紹。${product.value?.daily_capacity ? `日除濕量 ${product.value.daily_capacity}L` : ''}${product.value?.noise_level ? `、噪音 ${product.value.noise_level}dB` : ''}。點擊查看 MOMO 最新優惠價格。`
    },
    {
      property: 'og:title',
      content: `${product.value?.name} (2025)`
    },
    {
      property: 'og:description',
      content: `${product.value?.daily_capacity ? `日除濕量 ${product.value.daily_capacity}L | ` : ''}${energyLabel.value} | NT$ ${formatPrice(product.value?.price || 0)}`
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

// 除濕量視覺化 (500ml 礦泉水瓶數)
const waterBottles = computed(() => {
  if (!product.value?.daily_capacity) return 0
  return Math.round(product.value.daily_capacity * 2) // 1L = 2 瓶 500ml
})

// 噪音比較參考
const noiseComparison = computed(() => {
  const level = product.value?.noise_level
  if (!level) return null
  if (level <= 30) return { text: '比圖書館還安靜', icon: '📚', color: 'text-green-600' }
  if (level <= 40) return { text: '如同輕聲細語', icon: '🤫', color: 'text-green-500' }
  if (level <= 45) return { text: '類似安靜辦公室', icon: '💼', color: 'text-blue-500' }
  if (level <= 50) return { text: '一般冷氣運轉聲', icon: '❄️', color: 'text-blue-600' }
  return { text: '正常對話音量', icon: '💬', color: 'text-yellow-600' }
})

// 每月電費估算 (假設每天運轉 8 小時，電價 3.5 元/度)
const monthlyElectricity = computed(() => {
  const watts = product.value?.power_consumption
  if (!watts) return null
  const dailyKwh = (watts * 8) / 1000 // 每天耗電度數
  const monthlyKwh = dailyKwh * 30
  const cost = Math.round(monthlyKwh * 3.5)
  return { kwh: monthlyKwh.toFixed(1), cost }
})

// 適用空間情境
const roomSuitability = computed(() => {
  const capacity = product.value?.daily_capacity ?? 0
  const noise = product.value?.noise_level ?? 50
  return [
    {
      name: '臥室',
      icon: BedDouble,
      suitable: capacity <= 14 && noise <= 42,
      reason: noise <= 42 ? '安靜適合睡眠' : '運轉聲稍大'
    },
    {
      name: '客廳',
      icon: Sofa,
      suitable: capacity >= 10,
      reason: capacity >= 10 ? '除濕力足夠' : '建議選大容量'
    },
    {
      name: '整層住家',
      icon: Home,
      suitable: capacity >= 16,
      reason: capacity >= 16 ? '大坪數適用' : '適合單一空間'
    }
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
            <span class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">比比看</span>
            <span class="text-sm text-gray-500 hidden sm:inline">除濕機</span>
          </NuxtLink>
          <button
            class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            @click="shareProduct"
          >
            <Share2 :size="18" />
            <span class="hidden sm:inline text-sm">分享</span>
          </button>
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
                  <!-- 折扣標籤 -->
                  <span
                    v-if="discountPercent"
                    class="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full"
                  >
                    -{{ discountPercent }}%
                  </span>
                </div>
              </div>

              <!-- Info -->
              <div class="md:w-3/5 p-6">
                <p v-if="displayBrand" class="text-gray-500 mb-1">{{ displayBrand }}</p>
                <h1 class="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                  {{ product.name }}
                </h1>

                <!-- Key Highlights (只顯示有值的) -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div v-if="product.daily_capacity" class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Droplets class="text-blue-600" :size="24" />
                    <div>
                      <p class="text-xs text-gray-500">日除濕量</p>
                      <p class="font-semibold text-gray-900">{{ product.daily_capacity }}L</p>
                    </div>
                  </div>
                  <div v-if="product.noise_level" class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
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
                  <div v-if="product.power_consumption" class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
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
                  <p v-if="product.original_price && product.original_price > product.price" class="text-sm text-gray-400 line-through mb-1">
                    市售價 NT$ {{ formatPrice(product.original_price) }}
                  </p>
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

          <!-- Features Section (只在有功能特色時顯示) -->
          <div v-if="product.features && product.features.length > 0" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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

          <!-- 這款商品適合你嗎？視覺化區塊 -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lightbulb class="text-yellow-500" :size="24" />
              這款商品適合你嗎？
            </h2>

            <div class="space-y-6">
              <!-- 除濕量視覺化 -->
              <div v-if="product.daily_capacity" class="p-4 bg-blue-50 rounded-xl">
                <div class="flex items-center gap-3 mb-3">
                  <Droplets class="text-blue-600" :size="20" />
                  <span class="font-medium text-gray-900">每日除濕量</span>
                </div>
                <div class="flex items-end gap-2 mb-2">
                  <span class="text-4xl font-bold text-blue-600">{{ product.daily_capacity }}</span>
                  <span class="text-lg text-gray-600 mb-1">公升/天</span>
                </div>
                <p class="text-sm text-gray-500">
                  相當於 <span class="font-semibold text-blue-600">{{ waterBottles }}</span> 瓶 500ml 礦泉水 🍶
                </p>
              </div>

              <!-- 噪音比較 -->
              <div v-if="noiseComparison" class="p-4 bg-gray-50 rounded-xl">
                <div class="flex items-center gap-3 mb-3">
                  <Volume2 class="text-gray-600" :size="20" />
                  <span class="font-medium text-gray-900">運轉噪音</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-3xl">{{ noiseComparison.icon }}</span>
                  <div>
                    <p class="text-lg font-semibold" :class="noiseComparison.color">
                      {{ product.noise_level }} dB
                    </p>
                    <p class="text-sm text-gray-600">{{ noiseComparison.text }}</p>
                  </div>
                </div>
                <!-- 噪音刻度條 -->
                <div class="mt-4">
                  <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>安靜</span>
                    <span>吵雜</span>
                  </div>
                  <div class="h-2 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 rounded-full relative">
                    <div
                      class="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full -top-0.5 transform -translate-x-1/2"
                      :style="{ left: `${Math.min(Math.max((product.noise_level - 20) / 40 * 100, 0), 100)}%` }"
                    ></div>
                  </div>
                  <div class="flex justify-between text-xs text-gray-400 mt-1">
                    <span>20dB</span>
                    <span>40dB</span>
                    <span>60dB</span>
                  </div>
                </div>
              </div>

              <!-- 電費估算 -->
              <div v-if="monthlyElectricity" class="p-4 bg-green-50 rounded-xl">
                <div class="flex items-center gap-3 mb-3">
                  <CircleDollarSign class="text-green-600" :size="20" />
                  <span class="font-medium text-gray-900">每月電費預估</span>
                </div>
                <div class="flex items-end gap-2 mb-2">
                  <span class="text-3xl font-bold text-green-600">≈ ${{ monthlyElectricity.cost }}</span>
                  <span class="text-sm text-gray-500 mb-1">/ 月</span>
                </div>
                <p class="text-xs text-gray-400">
                  * 以每天運轉 8 小時、電價 3.5 元/度估算 ({{ monthlyElectricity.kwh }} 度/月)
                </p>
              </div>

              <!-- 適用空間 -->
              <div class="p-4 bg-orange-50 rounded-xl">
                <div class="flex items-center gap-3 mb-4">
                  <Home class="text-orange-600" :size="20" />
                  <span class="font-medium text-gray-900">適用空間</span>
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div
                    v-for="room in roomSuitability"
                    :key="room.name"
                    class="text-center p-3 rounded-lg transition-all"
                    :class="room.suitable ? 'bg-white shadow-sm' : 'bg-orange-50/50 opacity-60'"
                  >
                    <component
                      :is="room.icon"
                      :size="28"
                      class="mx-auto mb-2"
                      :class="room.suitable ? 'text-orange-500' : 'text-gray-400'"
                    />
                    <p class="text-sm font-medium" :class="room.suitable ? 'text-gray-900' : 'text-gray-500'">
                      {{ room.name }}
                    </p>
                    <p v-if="room.suitable" class="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                      <Check :size="12" /> {{ room.reason }}
                    </p>
                    <p v-else class="text-xs text-gray-400 mt-1">
                      {{ room.reason }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Summary (只在有足夠資料時顯示) -->
          <div v-if="product.daily_capacity || product.noise_level" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">AI 評價摘要</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-600 leading-relaxed">
                <span v-if="displayBrand">{{ displayBrand }} </span>{{ product.model }} 是一款適合{{ recommendedArea }}空間使用的除濕機<span v-if="product.daily_capacity">，每日除濕量達到 {{ product.daily_capacity }} 公升</span>。
                <span v-if="product.noise_level">
                  在噪音控制方面，運轉時僅 {{ product.noise_level }} dB，
                  {{ product.noise_level <= 40 ? '屬於安靜機型，適合臥室使用' : '適合客廳或較大空間使用' }}。
                </span>
              </p>
              <p v-if="product.energy_efficiency || product.tank_capacity" class="text-gray-600 leading-relaxed mt-3">
                <span v-if="product.energy_efficiency">
                  能效表現為{{ energyLabel }}，{{ product.energy_efficiency === 1 ? '是市面上最省電的等級' : '能效表現符合標準' }}。
                </span>
                <span v-if="product.tank_capacity">
                  水箱容量 {{ product.tank_capacity }} 公升，
                  {{ product.tank_capacity >= 4.5 ? '大容量設計減少倒水頻率' : '建議定期清空水箱' }}。
                </span>
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
              <p v-if="displayBrand" class="text-gray-500 mb-1">{{ displayBrand }}</p>
              <h3 class="font-bold text-gray-900 mb-2 text-sm">{{ product.name }}</h3>
              <p v-if="product.original_price && product.original_price > product.price" class="text-sm text-gray-400 line-through">
                NT$ {{ formatPrice(product.original_price) }}
              </p>
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
        <div class="flex-1 min-w-0">
          <p v-if="displayBrand" class="text-sm text-gray-500 truncate">{{ displayBrand }}</p>
          <p v-if="product.original_price && product.original_price > product.price" class="text-xs text-gray-400 line-through">NT$ {{ formatPrice(product.original_price) }}</p>
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
          <p>© 2025 比比看. 本站包含聯盟行銷連結。</p>
          <p class="mt-1">價格與規格僅供參考，請以官方公告為準。</p>
        </div>
      </div>
    </footer>
  </div>
</template>
