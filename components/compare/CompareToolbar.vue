<script setup lang="ts">
import { Eye, EyeOff, SlidersHorizontal, Sparkles, FileSpreadsheet, Download, Camera } from 'lucide-vue-next'

const props = defineProps<{
  showOnlyDifferences: boolean
  showWeightPanel: boolean
  showDecisionHelper: boolean
  isCapturing: boolean
}>()

const emit = defineEmits<{
  'update:showOnlyDifferences': [value: boolean]
  'update:showWeightPanel': [value: boolean]
  'update:showDecisionHelper': [value: boolean]
  captureScreenshot: []
  exportToCSV: []
}>()
</script>

<template>
  <div class="flex items-center gap-2 p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
    <!-- 差異模式切換 -->
    <button
      @click="emit('update:showOnlyDifferences', !showOnlyDifferences)"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
        showOnlyDifferences
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      ]"
    >
      <component :is="showOnlyDifferences ? Eye : EyeOff" :size="14" />
      {{ showOnlyDifferences ? '只看差異' : '顯示全部' }}
    </button>

    <!-- 權重設定 -->
    <button
      @click="emit('update:showWeightPanel', !showWeightPanel)"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
        showWeightPanel
          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      ]"
    >
      <SlidersHorizontal :size="14" />
      權重設定
    </button>

    <!-- 幫我決定 -->
    <button
      @click="emit('update:showDecisionHelper', !showDecisionHelper)"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
        showDecisionHelper
          ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      ]"
    >
      <Sparkles :size="14" />
      幫我決定
    </button>

    <!-- CSV 匯出按鈕 -->
    <button
      @click="emit('exportToCSV')"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
    >
      <FileSpreadsheet :size="14" />
      <span class="hidden sm:inline">匯出 CSV</span>
      <span class="sm:hidden">CSV</span>
    </button>

    <!-- 手機截圖按鈕 -->
    <button
      @click="emit('captureScreenshot')"
      :disabled="isCapturing"
      class="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap disabled:opacity-50"
    >
      <Download :size="14" />
      {{ isCapturing ? '處理中' : '圖片' }}
    </button>
  </div>
</template>
