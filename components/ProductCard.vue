<script setup lang="ts">
import { computed } from 'vue'
import { Droplets, Volume2, Zap } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { useProducts } from '~/composables/useProducts'

const props = defineProps<{
  product: Dehumidifier
}>()

const { getProductSlug } = useProducts()

const slug = computed(() => getProductSlug(props.product))

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

const energyLabel = computed(() => {
  const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
  return labels[props.product.energy_efficiency]
})

const energyColor = computed(() => {
  const colors: Record<number, string> = {
    1: 'bg-green-500',
    2: 'bg-lime-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500'
  }
  return colors[props.product.energy_efficiency] || 'bg-gray-500'
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
    <!-- Image -->
    <NuxtLink :to="`/product/${slug}`" class="block">
      <div class="relative aspect-square bg-gray-50">
        <img
          :src="product.image_url"
          :alt="`${product.brand} ${product.model} 除濕機`"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <!-- Energy Badge -->
        <span
          :class="[energyColor, 'absolute top-3 left-3 text-white text-xs font-medium px-2 py-1 rounded-full']"
        >
          {{ energyLabel }}
        </span>
      </div>
    </NuxtLink>

    <!-- Content -->
    <div class="p-4">
      <!-- Brand & Model -->
      <NuxtLink :to="`/product/${slug}`" class="block group">
        <p class="text-sm text-gray-500 mb-1">{{ product.brand }}</p>
        <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {{ product.model }}
        </h3>
      </NuxtLink>

      <!-- Price -->
      <div class="mt-2 mb-3">
        <span class="text-2xl font-bold text-blue-600">NT$ {{ formatPrice(product.price) }}</span>
      </div>

      <!-- Key Specs -->
      <div class="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
        <div class="text-center">
          <div class="flex items-center justify-center text-blue-500 mb-1">
            <Droplets :size="18" />
          </div>
          <p class="text-xs text-gray-500">日除濕量</p>
          <p class="text-sm font-medium text-gray-900">{{ product.daily_capacity }}L</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center text-blue-500 mb-1">
            <Volume2 :size="18" />
          </div>
          <p class="text-xs text-gray-500">噪音值</p>
          <p class="text-sm font-medium text-gray-900">{{ product.noise_level }}dB</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center text-blue-500 mb-1">
            <Zap :size="18" />
          </div>
          <p class="text-xs text-gray-500">功率</p>
          <p class="text-sm font-medium text-gray-900">{{ product.power_consumption }}W</p>
        </div>
      </div>

      <!-- CTA Button -->
      <a
        :href="product.affiliate_url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="mt-3 block w-full text-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
        @click.stop
      >
        查看優惠
      </a>
    </div>
  </div>
</template>
