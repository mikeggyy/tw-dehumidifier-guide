<script setup lang="ts">
import { computed } from 'vue'
import { Droplets, Volume2, Zap, Box, Wind, Home, Shield } from 'lucide-vue-next'
import type { Dehumidifier, Product } from '~/types'

const props = defineProps<{
  product: Dehumidifier | Product
  categorySlug?: string
}>()

// 取得規格值（支援兩種資料結構）
const getSpec = (key: string) => {
  const p = props.product as any
  return p?.[key] ?? p?.specs?.[key] ?? null
}

// 除濕機規格
const dailyCapacity = computed(() => getSpec('daily_capacity'))
const noiseLevel = computed(() => getSpec('noise_level'))
const powerConsumption = computed(() => getSpec('power_consumption'))
const tankCapacity = computed(() => getSpec('tank_capacity'))

// 空氣清淨機規格
const cadr = computed(() => getSpec('cadr'))
const coverageArea = computed(() => getSpec('coverage_area'))
const filterType = computed(() => getSpec('filter_type'))

const isDehumidifier = computed(() => {
  return props.categorySlug === 'dehumidifier' || dailyCapacity.value !== null
})

const isAirPurifier = computed(() => {
  return props.categorySlug === 'air-purifier' || cadr.value !== null || coverageArea.value !== null
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64 pointer-events-none">
    <h4 class="font-semibold text-gray-900 text-sm mb-3 line-clamp-1">快速規格</h4>

    <!-- 除濕機規格 -->
    <div v-if="isDehumidifier" class="space-y-2">
      <div v-if="dailyCapacity" class="flex items-center gap-2 text-sm">
        <Droplets :size="16" class="text-blue-500" />
        <span class="text-gray-600">日除濕量</span>
        <span class="ml-auto font-semibold text-gray-900">{{ dailyCapacity }}L</span>
      </div>
      <div v-if="noiseLevel" class="flex items-center gap-2 text-sm">
        <Volume2 :size="16" class="text-gray-500" />
        <span class="text-gray-600">噪音</span>
        <span class="ml-auto font-semibold text-gray-900">{{ noiseLevel }}dB</span>
      </div>
      <div v-if="powerConsumption" class="flex items-center gap-2 text-sm">
        <Zap :size="16" class="text-yellow-500" />
        <span class="text-gray-600">功率</span>
        <span class="ml-auto font-semibold text-gray-900">{{ powerConsumption }}W</span>
      </div>
      <div v-if="tankCapacity" class="flex items-center gap-2 text-sm">
        <Box :size="16" class="text-cyan-500" />
        <span class="text-gray-600">水箱</span>
        <span class="ml-auto font-semibold text-gray-900">{{ tankCapacity }}L</span>
      </div>
    </div>

    <!-- 空氣清淨機規格 -->
    <div v-else-if="isAirPurifier" class="space-y-2">
      <div v-if="cadr" class="flex items-center gap-2 text-sm">
        <Wind :size="16" class="text-emerald-500" />
        <span class="text-gray-600">CADR</span>
        <span class="ml-auto font-semibold text-gray-900">{{ cadr }} m³/h</span>
      </div>
      <div v-if="coverageArea" class="flex items-center gap-2 text-sm">
        <Home :size="16" class="text-orange-500" />
        <span class="text-gray-600">適用坪數</span>
        <span class="ml-auto font-semibold text-gray-900">{{ coverageArea }}坪</span>
      </div>
      <div v-if="filterType" class="flex items-center gap-2 text-sm">
        <Shield :size="16" class="text-purple-500" />
        <span class="text-gray-600">濾網</span>
        <span class="ml-auto font-semibold text-gray-900">{{ filterType }}</span>
      </div>
    </div>

    <!-- 無規格時顯示 -->
    <p v-else class="text-sm text-gray-400">點擊查看詳細規格</p>
  </div>
</template>
