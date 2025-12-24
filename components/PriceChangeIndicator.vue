<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

const props = defineProps<{
  currentPrice: number
  originalPrice?: number | null
  previousPrice?: number | null
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()

// Calculate price change from previous price (if available) or from original price
const priceChange = computed(() => {
  const basePrice = props.previousPrice ?? props.originalPrice
  if (!basePrice || basePrice === props.currentPrice) return null

  const change = props.currentPrice - basePrice
  const percentage = ((change / basePrice) * 100).toFixed(1)

  return {
    amount: Math.abs(change),
    percentage: Math.abs(parseFloat(percentage)),
    direction: change > 0 ? 'up' : 'down'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-[10px] px-1.5 py-0.5 gap-0.5'
    case 'lg':
      return 'text-sm px-2.5 py-1.5 gap-1.5'
    default:
      return 'text-xs px-2 py-1 gap-1'
  }
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 10
    case 'lg': return 16
    default: return 12
  }
})
</script>

<template>
  <div
    v-if="priceChange"
    :class="[
      'inline-flex items-center font-medium rounded-full',
      sizeClasses,
      priceChange.direction === 'down'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    ]"
  >
    <TrendingDown v-if="priceChange.direction === 'down'" :size="iconSize" />
    <TrendingUp v-else :size="iconSize" />
    <span v-if="showPercentage">{{ priceChange.percentage }}%</span>
    <span v-else>NT$ {{ priceChange.amount.toLocaleString() }}</span>
  </div>
</template>
