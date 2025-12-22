<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, ChevronRight } from 'lucide-vue-next'
import type { GenericFilterState } from '~/types'
import { formatPrice } from '~/utils/product'

const props = defineProps<{
  filters: GenericFilterState
  majorBrands: string[]
  otherBrands: string[]
  priceRange: { min: number; max: number }
  showMobile: boolean
  resultCount: number
}>()

const emit = defineEmits<{
  'update:showMobile': [value: boolean]
  toggleBrand: [brand: string]
  'update:priceMin': [value: number]
  'update:priceMax': [value: number]
  reset: []
}>()

// Brand filter
const showAllBrands = ref(false)

const getBrandCount = (brand: string): number => {
  // This will be handled by parent
  return 0
}
</script>

<template>
  <aside
    :class="[
      'fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto',
      'lg:block lg:w-64 lg:flex-shrink-0',
      showMobile ? 'block' : 'hidden'
    ]"
  >
    <div
      class="absolute inset-0 bg-black/50 lg:hidden"
      @click="emit('update:showMobile', false)"
    />

    <div class="absolute right-0 top-0 h-full w-80 lg:w-full lg:relative lg:h-auto bg-white lg:bg-transparent lg:rounded-xl overflow-y-auto">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
        <span class="font-semibold text-gray-900">篩選條件</span>
        <button @click="emit('update:showMobile', false)">
          <X :size="24" class="text-gray-500" />
        </button>
      </div>

      <div class="p-4 lg:p-0 space-y-6">
        <!-- Brand Filter -->
        <div class="bg-white rounded-xl p-4 lg:border lg:border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">品牌</h3>
          <div class="space-y-2">
            <label
              v-for="brand in majorBrands"
              :key="brand"
              class="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                :checked="filters.brands.includes(brand)"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                @change="emit('toggleBrand', brand)"
              />
              <span class="text-gray-700 flex-1">{{ brand }}</span>
            </label>

            <div v-if="otherBrands.length > 0">
              <button
                class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 mb-2"
                @click="showAllBrands = !showAllBrands"
              >
                <ChevronRight
                  :size="16"
                  :class="['transition-transform', showAllBrands ? 'rotate-90' : '']"
                />
                {{ showAllBrands ? '收起' : `其他品牌 (${otherBrands.length})` }}
              </button>

              <div v-show="showAllBrands" class="space-y-2 pl-2 border-l-2 border-gray-100">
                <label
                  v-for="brand in otherBrands"
                  :key="brand"
                  class="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    :checked="filters.brands.includes(brand)"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    @change="emit('toggleBrand', brand)"
                  />
                  <span class="text-gray-600 text-sm flex-1">{{ brand }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Price Range Filter -->
        <div class="bg-white rounded-xl p-4 lg:border lg:border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">價格範圍</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <input
                :value="filters.priceMin"
                type="number"
                :min="priceRange.min"
                :max="filters.priceMax"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="最低"
                @input="emit('update:priceMin', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="text-gray-400">-</span>
              <input
                :value="filters.priceMax"
                type="number"
                :min="filters.priceMin"
                :max="priceRange.max"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="最高"
                @input="emit('update:priceMax', Number(($event.target as HTMLInputElement).value))"
              />
            </div>
            <p class="text-xs text-gray-500">
              NT$ {{ formatPrice(filters.priceMin) }} - NT$ {{ formatPrice(filters.priceMax) }}
            </p>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          class="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          @click="emit('reset')"
        >
          重設篩選條件
        </button>
      </div>

      <div class="p-4 border-t border-gray-200 lg:hidden">
        <button
          class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg"
          @click="emit('update:showMobile', false)"
        >
          套用篩選 ({{ resultCount }} 項結果)
        </button>
      </div>
    </div>
  </aside>
</template>
