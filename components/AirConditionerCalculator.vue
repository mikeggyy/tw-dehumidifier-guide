<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Calculator, Snowflake, Sun, Building2, ThermometerSun, Info } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { formatPrice } from '~/utils/product'

const props = defineProps<{
  products: readonly Dehumidifier[]
}>()

const emit = defineEmits<{
  close: []
}>()

// 輸入值
const roomArea = ref<number>(10)
const ceilingHeight = ref<'normal' | 'high'>('normal')
const sunExposure = ref<'low' | 'medium' | 'high'>('medium')
const roomType = ref<'bedroom' | 'living' | 'office'>('bedroom')

// 計算建議冷氣容量
const calculation = computed(() => {
  // 基礎計算：每坪約需要 0.4-0.5 kW (約 400-500W)
  let baseKw = roomArea.value * 0.45

  // 天花板高度調整
  if (ceilingHeight.value === 'high') {
    baseKw *= 1.15 // 挑高多 15%
  }

  // 日曬程度調整
  const sunFactors = {
    low: 0.9,
    medium: 1.0,
    high: 1.2,
  }
  baseKw *= sunFactors[sunExposure.value]

  // 房間類型調整
  const typeFactors = {
    bedroom: 1.0,
    living: 1.1, // 客廳人多
    office: 1.05, // 辦公室設備多
  }
  baseKw *= typeFactors[roomType.value]

  // 計算冷氣噸數 (1噸 ≈ 3.517 kW)
  const tonnage = baseKw / 3.517

  // 建議範圍
  const minKw = baseKw * 0.9
  const maxKw = baseKw * 1.1

  // 對應的 BTU (1 kW ≈ 3412 BTU)
  const btu = baseKw * 3412

  return {
    kw: baseKw.toFixed(1),
    minKw: minKw.toFixed(1),
    maxKw: maxKw.toFixed(1),
    tonnage: tonnage.toFixed(2),
    btu: Math.round(btu),
    label: getTonnageLabel(tonnage),
  }
})

function getTonnageLabel(tonnage: number): string {
  if (tonnage < 0.8) return '小於 1 噸'
  if (tonnage < 1.2) return '約 1 噸'
  if (tonnage < 1.6) return '約 1.3 噸'
  if (tonnage < 2.0) return '約 1.5-1.8 噸'
  if (tonnage < 2.5) return '約 2 噸'
  if (tonnage < 3.0) return '約 2.5 噸'
  return '3 噸以上'
}

// 推薦符合的產品
const matchingProducts = computed(() => {
  const targetKw = parseFloat(calculation.value.kw)
  const minKw = parseFloat(calculation.value.minKw)
  const maxKw = parseFloat(calculation.value.maxKw)

  // 基於名稱中的關鍵字過濾
  return props.products
    .filter(p => {
      const name = p.name.toLowerCase()
      // 嘗試從產品名稱中提取 kW 或噸數資訊
      // 這裡簡化處理，實際應該從規格中取
      return true
    })
    .slice(0, 4)
})

const getProductSlug = (product: any) => {
  if (product.slug) return product.slug
  return `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-cyan-600 to-blue-500 text-white p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calculator :size="24" />
            </div>
            <div>
              <h2 class="text-xl font-bold">冷氣噸數計算器</h2>
              <p class="text-cyan-100 text-sm">輸入坪數，算出需要的冷氣大小</p>
            </div>
          </div>
          <button
            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            @click="emit('close')"
          >
            <X :size="20" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <!-- 坪數輸入 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            房間坪數
          </label>
          <div class="flex items-center gap-4">
            <input
              v-model.number="roomArea"
              type="range"
              min="3"
              max="30"
              step="1"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div class="w-20 text-center">
              <span class="text-2xl font-bold text-cyan-600">{{ roomArea }}</span>
              <span class="text-gray-500 text-sm"> 坪</span>
            </div>
          </div>
        </div>

        <!-- 選項 -->
        <div class="grid grid-cols-1 gap-4 mb-6">
          <!-- 天花板高度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <Building2 :size="16" class="inline mr-1" />
              天花板高度
            </label>
            <div class="flex gap-2">
              <button
                :class="[
                  'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  ceilingHeight === 'normal'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="ceilingHeight = 'normal'"
              >
                一般高度 (2.4-2.8m)
              </button>
              <button
                :class="[
                  'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  ceilingHeight === 'high'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="ceilingHeight = 'high'"
              >
                挑高 (3m 以上)
              </button>
            </div>
          </div>

          <!-- 日曬程度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <Sun :size="16" class="inline mr-1" />
              西曬/日照程度
            </label>
            <div class="flex gap-2">
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  sunExposure === 'low'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="sunExposure = 'low'"
              >
                少曬
              </button>
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  sunExposure === 'medium'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="sunExposure = 'medium'"
              >
                普通
              </button>
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  sunExposure === 'high'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="sunExposure = 'high'"
              >
                西曬
              </button>
            </div>
          </div>

          <!-- 房間類型 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <ThermometerSun :size="16" class="inline mr-1" />
              空間類型
            </label>
            <div class="flex gap-2">
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  roomType === 'bedroom'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="roomType = 'bedroom'"
              >
                臥室
              </button>
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  roomType === 'living'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="roomType = 'living'"
              >
                客廳
              </button>
              <button
                :class="[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  roomType === 'office'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="roomType = 'office'"
              >
                辦公室
              </button>
            </div>
          </div>
        </div>

        <!-- 計算結果 -->
        <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-200">
          <div class="flex items-center gap-2 text-cyan-700 mb-3">
            <Snowflake :size="20" />
            <span class="font-semibold">建議冷氣容量</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white rounded-lg p-3 text-center">
              <div class="text-3xl font-bold text-cyan-600">{{ calculation.label }}</div>
              <div class="text-sm text-gray-500 mt-1">建議噸數</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center">
              <div class="text-3xl font-bold text-cyan-600">{{ calculation.kw }} <span class="text-lg">kW</span></div>
              <div class="text-sm text-gray-500 mt-1">建議冷房能力</div>
            </div>
          </div>

          <div class="mt-3 text-sm text-gray-600 flex items-start gap-2">
            <Info :size="16" class="flex-shrink-0 mt-0.5 text-cyan-600" />
            <span>
              建議範圍 {{ calculation.minKw }}-{{ calculation.maxKw }} kW
              (約 {{ calculation.btu.toLocaleString() }} BTU)
            </span>
          </div>
        </div>

        <!-- 推薦商品 -->
        <div v-if="matchingProducts.length > 0" class="mt-6">
          <h3 class="font-semibold text-gray-900 mb-3">推薦冷氣</h3>
          <div class="space-y-2">
            <NuxtLink
              v-for="product in matchingProducts"
              :key="product.id"
              :to="`/air-conditioner/${getProductSlug(product)}`"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all"
              @click="emit('close')"
            >
              <img
                :src="product.image_url"
                :alt="product.name"
                class="w-14 h-14 object-cover rounded-lg bg-gray-100"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 line-clamp-1">{{ product.name }}</div>
                <div class="text-cyan-600 font-bold">NT$ {{ formatPrice(product.price) }}</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
