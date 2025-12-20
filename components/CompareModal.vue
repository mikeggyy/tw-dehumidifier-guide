<script setup lang="ts">
import { computed } from 'vue'
import { X, ExternalLink, Check, Minus, Trophy, Zap, Volume2 } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'

const props = defineProps<{
  products: Dehumidifier[]
}>()

const emit = defineEmits<{
  close: []
  remove: [id: string]
}>()

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

const getDiscountPercent = (product: Dehumidifier): number | null => {
  const original = product.original_price
  if (!original || original <= product.price) return null
  return Math.round((1 - product.price / original) * 100)
}

const getValueScoreNum = (product: Dehumidifier): number | null => {
  const capacity = product.daily_capacity ?? 0
  if (capacity === 0) return null
  return Math.round(product.price / capacity)
}

const getValueScore = (product: Dehumidifier): string => {
  const score = getValueScoreNum(product)
  if (score === null) return '-'
  return `$${formatPrice(score)} 元/1L除濕力`
}

// 找出各項目的最佳值
const bestValues = computed(() => {
  const products = props.products
  if (products.length === 0) return {}

  const prices = products.map(p => p.price)
  const capacities = products.map(p => p.daily_capacity ?? 0).filter(c => c > 0)
  const noises = products.map(p => p.noise_level ?? 99).filter(n => n < 99)
  const discounts = products.map(p => getDiscountPercent(p) ?? 0).filter(d => d > 0)
  const cpValues = products.map(p => getValueScoreNum(p)).filter(v => v !== null) as number[]

  return {
    lowestPrice: Math.min(...prices),
    highestCapacity: capacities.length > 0 ? Math.max(...capacities) : null,
    lowestNoise: noises.length > 0 ? Math.min(...noises) : null,
    highestDiscount: discounts.length > 0 ? Math.max(...discounts) : null,
    lowestCpValue: cpValues.length > 0 ? Math.min(...cpValues) : null
  }
})

// 檢查某個規格是否有任何商品有資料
const hasAnyData = (key: string): boolean => {
  return props.products.some(p => {
    switch (key) {
      case 'price': return true
      case 'original_price': return p.original_price && p.original_price > p.price
      case 'discount': return getDiscountPercent(p) !== null
      case 'daily_capacity': return p.daily_capacity !== null
      case 'value': return p.daily_capacity !== null
      case 'tank_capacity': return p.tank_capacity !== null
      case 'noise_level': return p.noise_level !== null
      case 'power_consumption': return p.power_consumption !== null
      case 'energy_efficiency': return p.energy_efficiency !== null
      default: return false
    }
  })
}

const allSpecs = [
  { key: 'price', label: '促銷價', format: (p: Dehumidifier) => `NT$ ${formatPrice(p.price)}` },
  { key: 'original_price', label: '市售價', format: (p: Dehumidifier) => p.original_price ? `NT$ ${formatPrice(p.original_price)}` : '-' },
  { key: 'discount', label: '折扣', format: (p: Dehumidifier) => { const d = getDiscountPercent(p); return d ? `-${d}%` : '-' } },
  { key: 'daily_capacity', label: '日除濕量', format: (p: Dehumidifier) => p.daily_capacity ? `${p.daily_capacity} L` : '-' },
  { key: 'value', label: 'CP值（越低越划算）', format: getValueScore },
  { key: 'tank_capacity', label: '水箱容量', format: (p: Dehumidifier) => p.tank_capacity ? `${p.tank_capacity} L` : '-' },
  { key: 'noise_level', label: '噪音值', format: (p: Dehumidifier) => p.noise_level ? `${p.noise_level} dB` : '-' },
  { key: 'power_consumption', label: '消耗功率', format: (p: Dehumidifier) => p.power_consumption ? `${p.power_consumption} W` : '-' },
  { key: 'energy_efficiency', label: '能源效率', format: (p: Dehumidifier) => {
    const labels = ['', '一級能效', '二級能效', '三級能效', '四級能效', '五級能效']
    return p.energy_efficiency ? labels[p.energy_efficiency] : '-'
  }}
]

// 過濾掉沒有任何資料的規格
const specs = computed(() => allSpecs.filter(spec => hasAnyData(spec.key)))

const isBestValue = (product: Dehumidifier, key: string): boolean => {
  const bv = bestValues.value
  if (key === 'price') return product.price === bv.lowestPrice
  if (key === 'daily_capacity') return bv.highestCapacity !== null && (product.daily_capacity ?? 0) === bv.highestCapacity
  if (key === 'noise_level') return bv.lowestNoise !== null && (product.noise_level ?? 99) === bv.lowestNoise
  if (key === 'discount') return bv.highestDiscount !== null && getDiscountPercent(product) === bv.highestDiscount
  if (key === 'value') return bv.lowestCpValue !== null && getValueScoreNum(product) === bv.lowestCpValue
  return false
}

// Display brand - hide "Other", try to extract from name
const getDisplayBrand = (product: Dehumidifier): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="compare-modal-title"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50"
      aria-hidden="true"
      @click="emit('close')"
    />

    <!-- Modal -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
        <h2 id="compare-modal-title" class="text-lg font-semibold text-white">
          商品比較 ({{ products.length }}/4)
        </h2>
        <button
          @click="emit('close')"
          class="text-white/80 hover:text-white"
          aria-label="關閉比較視窗"
        >
          <X :size="24" aria-hidden="true" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto">
        <table class="w-full">
          <!-- Product Headers -->
          <thead class="sticky top-0 bg-white z-10">
            <tr class="border-b border-gray-200">
              <th class="p-4 text-left w-32 bg-gray-50">
                <span class="text-sm font-medium text-gray-500">規格項目</span>
              </th>
              <th
                v-for="product in products"
                :key="product.id"
                class="p-4 text-center min-w-[180px]"
              >
                <div class="relative">
                  <button
                    class="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-red-500"
                    @click="emit('remove', product.id)"
                  >
                    <X :size="16" />
                  </button>
                  <img
                    :src="product.image_url"
                    :alt="product.name"
                    class="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                  />
                  <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 mb-1">{{ getDisplayBrand(product) }}</p>
                  <p class="font-medium text-gray-900 text-xs line-clamp-2 leading-tight" :title="product.name">
                    {{ product.name }}
                  </p>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Specs Rows -->
          <tbody>
            <tr
              v-for="spec in specs"
              :key="spec.key"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="p-4 text-sm font-medium text-gray-600 bg-gray-50">
                {{ spec.label }}
              </td>
              <td
                v-for="product in products"
                :key="product.id"
                class="p-4 text-center"
              >
                <span
                  :class="[
                    'inline-flex items-center gap-1',
                    isBestValue(product, spec.key)
                      ? 'text-green-600 font-semibold'
                      : 'text-gray-900'
                  ]"
                >
                  <Trophy v-if="isBestValue(product, spec.key)" :size="14" class="text-yellow-500" />
                  {{ spec.format(product) }}
                </span>
              </td>
            </tr>
          </tbody>

          <!-- CTA Row -->
          <tfoot class="sticky bottom-0 bg-white border-t border-gray-200">
            <tr>
              <td class="p-4 bg-gray-50"></td>
              <td
                v-for="product in products"
                :key="product.id"
                class="p-4 text-center"
              >
                <a
                  :href="product.affiliate_url"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  前往購買
                  <ExternalLink :size="14" />
                </a>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Legend -->
      <div class="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <Trophy :size="12" class="text-yellow-500" />
            表示該項目為最佳值
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
