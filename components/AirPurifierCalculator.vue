<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Calculator, Home, Wind } from 'lucide-vue-next'
import { formatPrice, getDisplayBrand } from '~/utils/product'

const props = defineProps<{
  products: any[]
}>()

const emit = defineEmits<{
  close: []
}>()

const step = ref(1)
const roomSize = ref<number | null>(null)
const roomType = ref<'bedroom' | 'living' | 'office'>('living')

// 根據坪數計算建議 CADR
// 公式：CADR = 坪數 × 3.3(平方公尺) × 5(每小時換氣次數)
const recommendedCADR = computed(() => {
  if (!roomSize.value) return null

  // 基本公式：每坪約需 CADR 16-17
  const baseCADR = roomSize.value * 16.5

  // 不同空間調整係數
  const multiplier = roomType.value === 'office' ? 1.2 : 1

  return Math.ceil(baseCADR * multiplier)
})

// 建議的 CADR 範圍
const cadrRange = computed(() => {
  if (!recommendedCADR.value) return null
  const min = Math.max(recommendedCADR.value - 50, 100)
  const max = recommendedCADR.value + 100
  return { min, max }
})

// 符合建議的商品
const matchingProducts = computed(() => {
  if (!cadrRange.value) return []

  return props.products
    .filter(p => {
      const cadr = p.specs?.cadr ?? 0
      return cadr >= cadrRange.value!.min && cadr <= cadrRange.value!.max
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
})

const roomTypeOptions = [
  { value: 'bedroom', label: '臥室', icon: '🛏️', desc: '睡眠空間' },
  { value: 'living', label: '客廳', icon: '🛋️', desc: '一般起居' },
  { value: 'office', label: '辦公室', icon: '💼', desc: '需要更高換氣' }
]

const nextStep = () => {
  if (step.value < 2) step.value++
}

const prevStep = () => {
  if (step.value > 1) step.value--
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

    <!-- Modal -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-500">
        <div class="flex items-center gap-2 text-white">
          <Calculator :size="24" />
          <h2 class="text-lg font-semibold">空氣清淨機坪數計算</h2>
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
                class="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    ? 'border-green-500 bg-green-50'
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
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            ]"
            @click="nextStep"
          >
            計算推薦 CADR
          </button>
        </div>

        <!-- Step 2: Results -->
        <div v-else class="space-y-6">
          <!-- Recommendation -->
          <div class="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <div class="flex items-center justify-center gap-2 mb-2">
              <Home :size="20" class="text-green-600" />
              <span class="text-gray-600">{{ roomSize }} 坪 {{ roomTypeOptions.find(o => o.value === roomType)?.label }}</span>
            </div>
            <div class="flex items-center justify-center gap-2 text-3xl font-bold text-green-600">
              <Wind :size="32" />
              建議 CADR {{ recommendedCADR }}+
            </div>
            <p class="mt-2 text-sm text-gray-500">
              建議選擇 CADR {{ cadrRange?.min }}-{{ cadrRange?.max }} m³/h 的清淨機
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
                />
                <div class="flex-1 min-w-0">
                  <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500">{{ getDisplayBrand(product) }}</p>
                  <p class="font-medium text-gray-900 truncate">
                    {{ product.specs?.cadr ? `CADR ${product.specs.cadr}` : '' }} {{ product.model }}
                  </p>
                  <p class="text-green-600 font-semibold">NT$ {{ formatPrice(product.price) }}</p>
                </div>
              </a>
            </div>
          </div>

          <div v-else class="text-center py-4 text-gray-500">
            <p>目前沒有完全符合 CADR 範圍的商品</p>
            <p class="text-sm">建議查看全部商品列表</p>
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
              class="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
              @click="emit('close')"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
