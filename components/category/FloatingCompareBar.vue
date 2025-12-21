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
      class="fixed left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 px-4 py-3 bottom-[60px] md:bottom-0 safe-area-bottom"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-2 min-w-0">
          <GitCompare :size="18" class="text-blue-600 flex-shrink-0" />
          <span class="font-medium text-gray-900 dark:text-white text-sm whitespace-nowrap">
            已選 {{ compareList.length }}/4
          </span>
          <div class="hidden sm:flex items-center gap-2 ml-2">
            <div
              v-for="product in compareList"
              :key="product.id"
              class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
            >
              <span class="truncate max-w-[100px] text-gray-700 dark:text-gray-200">{{ getDisplayBrand(product) || product.model }}</span>
              <button
                class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                @click="emit('remove', product.id)"
              >
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 flex-shrink-0">
          <button
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap px-2 py-1"
            @click="emit('clear')"
          >
            清除
          </button>
          <button
            :disabled="compareList.length < 2"
            :class="[
              'px-5 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap',
              compareList.length >= 2
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            ]"
            @click="emit('compare')"
          >
            比較
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

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
