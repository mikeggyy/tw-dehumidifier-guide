<script setup lang="ts">
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  conclusions: {
    summary: string
    recommendations: {
      budget?: { product: { brand: string }; reason: string }
      powerful?: { product: { brand: string }; reason: string }
      value?: { product: { brand: string }; reason: string }
      quiet?: { product: { brand: string }; reason: string }
    }
  }
  showConclusion: boolean
  isMobile?: boolean
}>()

const emit = defineEmits<{
  'update:showConclusion': [value: boolean]
}>()

const toggle = () => {
  emit('update:showConclusion', !props.showConclusion)
}
</script>

<template>
  <div class="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
    <button
      @click="toggle"
      :class="[
        'w-full flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-colors',
        isMobile ? 'p-3' : 'p-4'
      ]"
    >
      <div class="flex items-center gap-2">
        <Lightbulb :size="18" class="text-amber-500" />
        <span class="font-medium text-gray-800 dark:text-gray-200 text-sm">比較結論</span>
      </div>
      <component :is="showConclusion ? ChevronUp : ChevronDown" :size="18" class="text-gray-400" />
    </button>

    <Transition name="slide">
      <div
        v-if="showConclusion"
        :class="[
          'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10',
          isMobile ? 'p-3 max-h-48 overflow-y-auto' : 'p-4'
        ]"
      >
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ conclusions.summary }}</p>

        <div :class="isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-2'">
          <div v-if="conclusions.recommendations.budget" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💰 省錢首選</p>
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.budget.product.brand }}</p>
            <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.budget.reason }}</p>
          </div>
          <div v-if="conclusions.recommendations.powerful" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">💪 最強力</p>
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.powerful.product.brand }}</p>
            <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.powerful.reason }}</p>
          </div>
          <div v-if="conclusions.recommendations.value" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">⭐ CP值王</p>
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.value.product.brand }}</p>
            <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.value.reason }}</p>
          </div>
          <div v-if="conclusions.recommendations.quiet" class="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">🤫 最安靜</p>
            <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{{ conclusions.recommendations.quiet.product.brand }}</p>
            <p class="text-xs text-green-600 dark:text-green-400">{{ conclusions.recommendations.quiet.reason }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
