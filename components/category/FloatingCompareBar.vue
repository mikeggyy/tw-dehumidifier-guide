<script setup lang="ts">
import { GitCompare, X } from 'lucide-vue-next'
import type { Product } from '~/types'

const props = defineProps<{
  compareList: Product[]
}>()

const emit = defineEmits<{
  remove: [id: string]
  clear: []
  compare: []
}>()

const getDisplayBrand = (product: Product): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="compareList.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-4"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <GitCompare :size="20" class="text-blue-600" />
          <span class="font-medium text-gray-900">
            已選 {{ compareList.length }} / 4 項商品
          </span>
          <div class="hidden sm:flex items-center gap-2">
            <div
              v-for="product in compareList"
              :key="product.id"
              class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span class="truncate max-w-[100px]">{{ getDisplayBrand(product) || product.model }}</span>
              <button
                class="text-gray-400 hover:text-red-500"
                @click="emit('remove', product.id)"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="text-sm text-gray-500 hover:text-gray-700"
            @click="emit('clear')"
          >
            清除全部
          </button>
          <button
            :disabled="compareList.length < 2"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              compareList.length >= 2
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            ]"
            @click="emit('compare')"
          >
            比較 ({{ compareList.length }})
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
