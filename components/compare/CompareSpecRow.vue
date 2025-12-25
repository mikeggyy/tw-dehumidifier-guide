<script setup lang="ts">
import { computed } from 'vue'
import { Trophy } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'

const props = defineProps<{
  spec: {
    key: string
    label: string
    unit?: string
    higherIsBetter?: boolean
  }
  products: Dehumidifier[]
  formatValue: (categorySlug: string, key: string, value: unknown) => string
  categorySlug: string
  showOnlyDifferences?: boolean
}>()

// 取得所有產品的規格值
const values = computed(() => {
  return props.products.map(product => {
    const productRecord = product as unknown as Record<string, unknown>
    const specs = (product as unknown as { specs?: Record<string, unknown> }).specs || {}
    return productRecord[props.spec.key] ?? specs[props.spec.key]
  })
})

// 格式化後的值
const formattedValues = computed(() => {
  return values.value.map(value =>
    value !== null && value !== undefined
      ? props.formatValue(props.categorySlug, props.spec.key, value)
      : '-'
  )
})

// 是否有差異
const hasDifference = computed(() => {
  const validValues = values.value.filter(v => v !== null && v !== undefined)
  if (validValues.length < 2) return false
  return !validValues.every(v => v === validValues[0])
})

// 找出最佳值的索引
const bestIndex = computed(() => {
  if (!hasDifference.value) return -1

  const numericValues = values.value.map(v => {
    if (v === null || v === undefined) return null
    const num = typeof v === 'number' ? v : parseFloat(String(v))
    return isNaN(num) ? null : num
  })

  let best = -1
  let bestValue: number | null = null

  numericValues.forEach((val, index) => {
    if (val === null) return
    if (bestValue === null) {
      bestValue = val
      best = index
      return
    }

    // 根據規格類型判斷高/低更好
    const higherIsBetter = props.spec.higherIsBetter ?? true
    if (higherIsBetter ? val > bestValue : val < bestValue) {
      bestValue = val
      best = index
    }
  })

  return best
})

// 是否應該顯示
const shouldShow = computed(() => {
  if (!props.showOnlyDifferences) return true
  return hasDifference.value
})
</script>

<template>
  <tr
    v-if="shouldShow"
    :class="{ 'bg-yellow-50 dark:bg-yellow-900/10': hasDifference }"
    role="row"
  >
    <!-- Spec Label -->
    <th
      scope="row"
      class="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-left whitespace-nowrap"
    >
      {{ spec.label }}
      <span v-if="spec.unit" class="text-gray-400 text-xs">({{ spec.unit }})</span>
    </th>

    <!-- Product Values -->
    <td
      v-for="(value, index) in formattedValues"
      :key="index"
      :class="[
        'px-4 py-3 text-sm text-center',
        bestIndex === index
          ? 'text-green-600 dark:text-green-400 font-semibold'
          : 'text-gray-600 dark:text-gray-400'
      ]"
      role="cell"
    >
      <span class="flex items-center justify-center gap-1">
        {{ value }}
        <Trophy
          v-if="bestIndex === index && hasDifference"
          :size="14"
          class="text-yellow-500"
          aria-label="此項目最佳"
        />
      </span>
    </td>
  </tr>
</template>
