<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Calculator, Home, Droplets } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { formatPrice, getDisplayBrand } from '~/utils/product'

const props = defineProps<{
  products: readonly Dehumidifier[]
}>()

const emit = defineEmits<{
  close: []
  applyFilter: [capacity: number]
}>()

const step = ref(1)
const roomSize = ref<number | null>(null)
const roomType = ref<'bedroom' | 'living' | 'basement'>('living')

// 根據坪數和房間類型計算建議除濕量
const recommendedCapacity = computed(() => {
  if (!roomSize.value) return null

  // 基本公式：每坪約需 1L/日 除濕量
  // 地下室濕度較高，需要 1.5 倍
  const baseCapacity = roomSize.value
  const multiplier = roomType.value === 'basement' ? 1.5 : 1

  return Math.ceil(baseCapacity * multiplier)
})

// 建議的容量範圍
const capacityRange = computed(() => {
  if (!recommendedCapacity.value) return null
  const min = Math.max(recommendedCapacity.value - 2, 6)
  const max = recommendedCapacity.value + 4
  return { min, max }
})

// 符合建議的商品
const matchingProducts = computed(() => {
  if (!capacityRange.value) return []

  return props.products
    .filter(p => {
      const cap = p.daily_capacity ?? 0
      return cap >= capacityRange.value!.min && cap <= capacityRange.value!.max
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
})

const roomTypeOptions = [
  { value: 'bedroom', label: '臥室', icon: '🛏️', desc: '一般濕度' },
  { value: 'living', label: '客廳', icon: '🛋️', desc: '一般濕度' },
  { value: 'basement', label: '地下室/浴室', icon: '🚿', desc: '高濕度環境' }
]

const nextStep = () => {
  if (step.value < 2) step.value++
}

const prevStep = () => {
  if (step.value > 1) step.value--
}

const applyRecommendation = () => {
  if (recommendedCapacity.value) {
    emit('applyFilter', recommendedCapacity.value)
  }
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

    <!-- Modal -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
        <div class="flex items-center gap-2 text-white">
          <Calculator :size="24" />
          <h2 class="text-lg font-semibold">坪數推薦計算器</h2>
        </div>
        <button @click="emit('close')" class="text-white/80 hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Step 1: Input -->
        <div v-if="step === 1" class="space-y-6">
          <!-- Room Size -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              房間大小（坪）
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="roomSize"
                type="number"
                min="1"
                max="50"
                placeholder="輸入坪數"
                class="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span class="text-gray-500">坪</span>
            </div>
            <p class="mt-2 text-xs text-gray-500">
              不確定坪數？一般臥室約 3-5 坪，客廳約 8-15 坪
            </p>
          </div>

          <!-- Room Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              空間類型
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="option in roomTypeOptions"
                :key="option.value"
                :class="[
                  'p-3 rounded-xl border-2 text-center transition-all',
                  roomType === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                ]"
                @click="roomType = option.value as any"
              >
                <div class="text-2xl mb-1">{{ option.icon }}</div>
                <div class="text-sm font-medium text-gray-900">{{ option.label }}</div>
                <div class="text-xs text-gray-500">{{ option.desc }}</div>
              </button>
            </div>
          </div>

          <!-- Next Button -->
          <button
            :disabled="!roomSize"
            :class="[
              'w-full py-3 rounded-xl font-semibold transition-all',
              roomSize
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            ]"
            @click="nextStep"
          >
            計算推薦
          </button>
        </div>

        <!-- Step 2: Results -->
        <div v-else class="space-y-6">
          <!-- Recommendation -->
          <div class="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div class="flex items-center justify-center gap-2 mb-2">
              <Home :size="20" class="text-blue-600" />
              <span class="text-gray-600">{{ roomSize }} 坪 {{ roomTypeOptions.find(o => o.value === roomType)?.label }}</span>
            </div>
            <div class="flex items-center justify-center gap-2 text-3xl font-bold text-blue-600">
              <Droplets :size="32" />
              建議 {{ recommendedCapacity }}L 以上
            </div>
            <p class="mt-2 text-sm text-gray-500">
              建議選擇 {{ capacityRange?.min }}-{{ capacityRange?.max }}L 的除濕機
            </p>
          </div>

          <!-- Matching Products -->
          <div v-if="matchingProducts.length > 0">
            <h3 class="text-sm font-medium text-gray-700 mb-3">符合條件的推薦商品</h3>
            <div class="space-y-3">
              <a
                v-for="product in matchingProducts"
                :key="product.id"
                :href="product.affiliate_url"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <img
                  :src="product.image_url"
                  :alt="product.name"
                  class="w-16 h-16 object-cover rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
                <div class="flex-1 min-w-0">
                  <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500">{{ getDisplayBrand(product) }}</p>
                  <p class="font-medium text-gray-900 truncate">{{ product.daily_capacity }}L {{ product.model }}</p>
                  <p class="text-blue-600 font-semibold">NT$ {{ formatPrice(product.price) }}</p>
                </div>
              </a>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              class="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              @click="prevStep"
            >
              重新計算
            </button>
            <button
              class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              @click="applyRecommendation"
            >
              查看全部符合商品
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
