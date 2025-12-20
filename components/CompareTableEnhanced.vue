<script setup lang="ts">
import { computed } from 'vue'
import { Check, X, Minus, Crown, ExternalLink } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { formatPrice } from '~/utils/product'

const props = defineProps<{
  products: Dehumidifier[]
  categorySlug?: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

// Specs to compare based on category
const specs = computed(() => {
  if (props.categorySlug === 'air-purifier') {
    return [
      { key: 'cadr', label: 'CADR', unit: 'm³/h', higherBetter: true },
      { key: 'coverage_area', label: '適用坪數', unit: '坪', higherBetter: true },
      { key: 'noise_level', label: '噪音', unit: 'dB', higherBetter: false },
      { key: 'power_consumption', label: '功率', unit: 'W', higherBetter: false },
      { key: 'filter_type', label: '濾網類型', unit: '', higherBetter: null },
    ]
  }
  // Default: dehumidifier
  return [
    { key: 'daily_capacity', label: '日除濕量', unit: 'L', higherBetter: true },
    { key: 'tank_capacity', label: '水箱容量', unit: 'L', higherBetter: true },
    { key: 'noise_level', label: '噪音', unit: 'dB', higherBetter: false },
    { key: 'power_consumption', label: '功率', unit: 'W', higherBetter: false },
    { key: 'energy_efficiency', label: '能效等級', unit: '級', higherBetter: false },
  ]
})

// Find best value for each spec
const bestValues = computed(() => {
  const best: Record<string, { value: number; productId: string }> = {}

  specs.value.forEach(spec => {
    if (spec.higherBetter === null) return

    let bestValue: number | null = null
    let bestProductId: string | null = null

    props.products.forEach(product => {
      const value = getSpecValue(product, spec.key)
      if (value === null) return

      if (bestValue === null) {
        bestValue = value
        bestProductId = product.id
      } else if (spec.higherBetter && value > bestValue) {
        bestValue = value
        bestProductId = product.id
      } else if (!spec.higherBetter && value < bestValue) {
        bestValue = value
        bestProductId = product.id
      }
    })

    if (bestProductId) {
      best[spec.key] = { value: bestValue!, productId: bestProductId }
    }
  })

  return best
})

// Find best price
const bestPrice = computed(() => {
  let minPrice = Infinity
  let bestProductId: string | null = null

  props.products.forEach(product => {
    if (product.price < minPrice) {
      minPrice = product.price
      bestProductId = product.id
    }
  })

  return bestProductId
})

const getSpecValue = (product: Dehumidifier, key: string): number | null => {
  const p = product as any
  const value = p[key] ?? p.specs?.[key]
  return typeof value === 'number' ? value : null
}

const getSpecDisplay = (product: Dehumidifier, spec: typeof specs.value[0]): string => {
  const p = product as any
  const value = p[spec.key] ?? p.specs?.[spec.key]

  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  return `${value}${spec.unit}`
}

const isBest = (product: Dehumidifier, key: string): boolean => {
  return bestValues.value[key]?.productId === product.id
}

const getDisplayBrand = (product: Dehumidifier): string => {
  if (product.brand && product.brand !== 'Other') return product.brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <!-- Header with product images -->
      <thead>
        <tr>
          <th class="p-4 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-32">
            比較項目
          </th>
          <th
            v-for="product in products"
            :key="product.id"
            class="p-4 bg-gray-50 dark:bg-gray-800 text-center min-w-[180px]"
          >
            <div class="relative">
              <button
                class="absolute -top-2 -right-2 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                @click="emit('remove', product.id)"
              >
                <X :size="14" />
              </button>
              <img
                :src="product.image_url"
                :alt="product.name"
                class="w-20 h-20 object-cover rounded-lg mx-auto mb-2 bg-white shadow-sm"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ getDisplayBrand(product) }}</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                {{ product.name }}
              </p>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Price row -->
        <tr class="border-t border-gray-200 dark:border-gray-700">
          <td class="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/50">
            價格
          </td>
          <td
            v-for="product in products"
            :key="product.id"
            class="p-4 text-center"
          >
            <div class="flex items-center justify-center gap-1">
              <span
                class="text-lg font-bold"
                :class="bestPrice === product.id ? 'text-green-600' : 'text-gray-900 dark:text-white'"
              >
                NT$ {{ formatPrice(product.price) }}
              </span>
              <Crown
                v-if="bestPrice === product.id"
                :size="16"
                class="text-yellow-500"
              />
            </div>
            <div v-if="product.original_price && product.original_price > product.price" class="text-xs text-gray-400 line-through">
              NT$ {{ formatPrice(product.original_price) }}
            </div>
          </td>
        </tr>

        <!-- Spec rows -->
        <tr
          v-for="spec in specs"
          :key="spec.key"
          class="border-t border-gray-200 dark:border-gray-700"
        >
          <td class="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/50">
            {{ spec.label }}
          </td>
          <td
            v-for="product in products"
            :key="product.id"
            class="p-4 text-center"
          >
            <div class="flex items-center justify-center gap-1">
              <span
                class="font-medium"
                :class="[
                  isBest(product, spec.key)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-900 dark:text-white'
                ]"
              >
                {{ getSpecDisplay(product, spec) }}
              </span>
              <Crown
                v-if="isBest(product, spec.key)"
                :size="14"
                class="text-yellow-500"
              />
            </div>
          </td>
        </tr>

        <!-- CTA row -->
        <tr class="border-t border-gray-200 dark:border-gray-700">
          <td class="p-4 bg-gray-50/50 dark:bg-gray-800/50"></td>
          <td
            v-for="product in products"
            :key="product.id"
            class="p-4 text-center"
          >
            <a
              :href="product.affiliate_url"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink :size="16" />
              查看優惠
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
