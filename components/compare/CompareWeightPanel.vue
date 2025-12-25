<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next'
import type { WeightConfig } from '~/composables/useCompareAnalysis'

const props = defineProps<{
  weights: WeightConfig
  primarySpecLabel: string
  rankedProducts: Array<{ product: { id: string; brand: string; model: string }; score: number }>
}>()

const emit = defineEmits<{
  'update:weights': [weights: WeightConfig]
  reset: []
}>()

const updateWeight = (key: keyof WeightConfig, value: number) => {
  emit('update:weights', { ...props.weights, [key]: value })
}
</script>

<template>
  <div class="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">我最在意...</h3>
      <button
        @click="emit('reset')"
        class="text-xs text-purple-600 dark:text-purple-400 hover:underline"
      >
        重置
      </button>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">💰 價格</label>
        <input
          :value="weights.price"
          @input="updateWeight('price', Number(($event.target as HTMLInputElement).value))"
          type="range"
          min="0"
          max="100"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.price }}%</span>
      </div>
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">💪 {{ primarySpecLabel }}</label>
        <input
          :value="weights.capacity"
          @input="updateWeight('capacity', Number(($event.target as HTMLInputElement).value))"
          type="range"
          min="0"
          max="100"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.capacity }}%</span>
      </div>
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 安靜度</label>
        <input
          :value="weights.noise"
          @input="updateWeight('noise', Number(($event.target as HTMLInputElement).value))"
          type="range"
          min="0"
          max="100"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.noise }}%</span>
      </div>
      <div>
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">⚡ 能效</label>
        <input
          :value="weights.efficiency"
          @input="updateWeight('efficiency', Number(($event.target as HTMLInputElement).value))"
          type="range"
          min="0"
          max="100"
          class="w-full accent-purple-500"
        />
        <span class="text-xs text-gray-600 dark:text-gray-400">{{ weights.efficiency }}%</span>
      </div>
    </div>

    <!-- 加權排名結果 -->
    <div v-if="rankedProducts.length > 0" class="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">依您的偏好排序：</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(item, idx) in rankedProducts"
          :key="item.product.id"
          :class="[
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
            idx === 0
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          ]"
        >
          <span v-if="idx === 0">🥇</span>
          <span v-else-if="idx === 1">🥈</span>
          <span v-else-if="idx === 2">🥉</span>
          <span v-else>{{ idx + 1 }}.</span>
          {{ item.product.brand }} {{ item.product.model }}
          <span class="text-gray-400 dark:text-gray-500">({{ Math.round(item.score) }}分)</span>
        </span>
      </div>
    </div>
  </div>
</template>
