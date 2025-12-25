<script setup lang="ts">
import { Trophy, ExternalLink } from 'lucide-vue-next'
import type { ComparableProduct } from '~/types'
import {
  formatPrice,
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
  product: ComparableProduct
  specs: SpecItem[]
  isBestValue: (product: ComparableProduct, key: string) => boolean
  getDisplayBrand: (product: ComparableProduct) => string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const discount = getDiscountPercent(props.product)
const savings = getSavingsAmount(props.product)
const ctaInfo = getOptimizedCtaText(discount, savings)
const trackedUrl = getTrackedAffiliateUrl(props.product.affiliate_url, 'comparison', props.product.id)
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 pb-6">
    <!-- Product Header -->
    <div class="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <img
        :src="product.image_url"
        :alt="product.name"
        class="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        loading="lazy"
      />
      <div class="flex-1 min-w-0">
        <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ getDisplayBrand(product) }}
        </p>
        <p class="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
          {{ product.name }}
        </p>
        <button
          class="mt-2 text-xs text-red-500 hover:text-red-600"
          @click="emit('remove', product.id)"
        >
          移除比較
        </button>
      </div>
    </div>

    <!-- Specs List -->
    <div class="space-y-3">
      <div
        v-for="spec in specs"
        :key="spec.key"
        class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
      >
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ spec.label }}</span>
        <span
          :class="[
            'text-sm font-medium flex items-center gap-1',
            isBestValue(product, spec.key)
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-white'
          ]"
        >
          <Trophy v-if="isBestValue(product, spec.key)" :size="14" class="text-yellow-500" />
          {{ spec.format(product) }}
        </span>
      </div>
    </div>

    <!-- CTA Button -->
    <a
      :href="trackedUrl"
      target="_blank"
      rel="noopener noreferrer nofollow"
      :class="[
        'mt-4 flex items-center justify-center gap-2 w-full py-3 text-white font-medium rounded-lg transition-colors',
        ctaInfo.urgent
          ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
          : 'bg-blue-600 hover:bg-blue-700'
      ]"
    >
      {{ ctaInfo.text }}
      <ExternalLink :size="16" />
    </a>
  </div>
</template>
