<script setup lang="ts">
import { X, Trophy, ExternalLink, Eye } from 'lucide-vue-next'
import type { ComparableProduct } from '~/types'
import {
  getTrackedAffiliateUrl,
  getOptimizedCtaText,
  getDiscountPercent,
  getSavingsAmount,
} from '~/utils/product'

interface SpecItem {
  key: string
  label: string
  format: (p: ComparableProduct) => string
}

const props = defineProps<{
  products: ComparableProduct[]
  specs: SpecItem[]
  isBestValue: (product: ComparableProduct, key: string) => boolean
  getDisplayBrand: (product: ComparableProduct) => string
  showOnlyDifferences: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const getCtaInfo = (product: ComparableProduct) => {
  return getOptimizedCtaText(getDiscountPercent(product), getSavingsAmount(product))
}
</script>

<template>
  <div class="flex-1 overflow-auto">
    <table class="w-full">
      <!-- Product Headers -->
      <thead class="sticky top-0 bg-white dark:bg-gray-800 z-10">
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="p-4 text-left w-32 bg-gray-50 dark:bg-gray-900">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">規格項目</span>
          </th>
          <th
            v-for="product in products"
            :key="product.id"
            class="p-4 text-center min-w-[180px]"
          >
            <div class="relative">
              <button
                class="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                @click="emit('remove', product.id)"
              >
                <X :size="16" />
              </button>
              <img
                :src="product.image_url"
                :alt="product.name"
                class="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                loading="lazy"
                decoding="async"
              />
              <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ getDisplayBrand(product) }}</p>
              <p class="font-medium text-gray-900 dark:text-white text-xs line-clamp-2 leading-tight" :title="product.name">
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
          class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <td class="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
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
                  ? 'text-green-600 dark:text-green-400 font-semibold'
                  : 'text-gray-900 dark:text-white'
              ]"
            >
              <Trophy v-if="isBestValue(product, spec.key)" :size="14" class="text-yellow-500" />
              {{ spec.format(product) }}
            </span>
          </td>
        </tr>
      </tbody>

      <!-- CTA Row -->
      <tfoot class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <tr>
          <td class="p-4 bg-gray-50 dark:bg-gray-900"></td>
          <td
            v-for="product in products"
            :key="product.id"
            class="p-4 text-center"
          >
            <a
              :href="getTrackedAffiliateUrl(product.affiliate_url, 'comparison', product.id)"
              target="_blank"
              rel="noopener noreferrer nofollow"
              :class="[
                'inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors',
                getCtaInfo(product).urgent
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              ]"
            >
              {{ getCtaInfo(product).text }}
              <ExternalLink :size="14" />
            </a>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Legend -->
  <div class="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1">
        <Trophy :size="12" class="text-yellow-500" />
        表示該項目為最佳值
      </span>
      <span v-if="showOnlyDifferences" class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
        <Eye :size="12" />
        目前只顯示有差異的規格
      </span>
    </div>
  </div>
</template>
