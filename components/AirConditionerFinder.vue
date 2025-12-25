<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, ChevronRight, ChevronLeft, Sparkles, Snowflake, Zap } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { formatPrice } from '~/utils/product'

const props = defineProps<{
  products: readonly Dehumidifier[]
}>()

const emit = defineEmits<{
  close: []
}>()

const step = ref(1)
const totalSteps = 4

// User answers
const roomSize = ref<string | null>(null)
const roomType = ref<string | null>(null)
const features = ref<string | null>(null)
const budget = ref<string | null>(null)

// 坪數對應的建議冷氣噸數
const tonnageRecommendation = computed(() => {
  const recommendations: Record<string, { min: number; max: number; label: string; kw: string }> = {
    'tiny': { min: 0, max: 2.5, label: '1噸以下', kw: '2.2-2.8kW' },
    'small': { min: 2.0, max: 3.5, label: '1-1.5噸', kw: '2.8-4.0kW' },
    'medium': { min: 3.0, max: 5.0, label: '1.5-2噸', kw: '4.0-5.6kW' },
    'large': { min: 4.5, max: 8.0, label: '2噸以上', kw: '5.6kW+' },
  }
  return recommendations[roomSize.value || ''] || null
})

// 空間選項（單獨定義以獲得正確類型）
const roomSizeOptions = [
  { value: 'tiny', label: '小坪數', desc: '3-5坪 (小臥室、書房)', emoji: '🛏️', ton: '1噸以下' },
  { value: 'small', label: '中小坪數', desc: '5-8坪 (臥室)', emoji: '🏠', ton: '1-1.5噸' },
  { value: 'medium', label: '中坪數', desc: '8-12坪 (客廳)', emoji: '🏡', ton: '1.5-2噸' },
  { value: 'large', label: '大坪數', desc: '12坪以上 (大客廳)', emoji: '🏢', ton: '2噸以上' },
] as const

const questions = [
  {
    step: 1,
    title: '你的空間有多大？ 📐',
    subtitle: '幫你算出需要的冷氣噸數',
    options: roomSizeOptions,
    answer: roomSize
  },
  {
    step: 2,
    title: '安裝環境是？ 🏠',
    subtitle: '不同環境適合不同機型',
    options: [
      { value: 'split', label: '分離式', desc: '室內機室外機分開', emoji: '🔲' },
      { value: 'window', label: '窗型', desc: '安裝在窗戶上', emoji: '🪟' },
      { value: 'portable', label: '移動式', desc: '免安裝可移動', emoji: '🛞' },
      { value: 'any', label: '都可以', desc: '幫我推薦', emoji: '🤷' },
    ],
    answer: roomType
  },
  {
    step: 3,
    title: '你重視什麼功能？ ⭐',
    subtitle: '選擇最在意的功能',
    options: [
      { value: 'inverter', label: '變頻省電', desc: '長期省電費', emoji: '⚡' },
      { value: 'quiet', label: '安靜運轉', desc: '低噪音舒眠', emoji: '🤫' },
      { value: 'smart', label: '智慧功能', desc: 'WiFi 遠端控制', emoji: '📱' },
      { value: 'cooling', label: '冷房效果', desc: '快速降溫', emoji: '❄️' },
    ],
    answer: features
  },
  {
    step: 4,
    title: '你的預算範圍？ 💰',
    subtitle: '選擇適合的價位',
    options: [
      { value: 'budget', label: '經濟實惠', desc: 'NT$ 20,000 以下', emoji: '💵' },
      { value: 'mid', label: '中等價位', desc: 'NT$ 20,000-35,000', emoji: '💳' },
      { value: 'premium', label: '中高價位', desc: 'NT$ 35,000-50,000', emoji: '💎' },
      { value: 'luxury', label: '頂級旗艦', desc: 'NT$ 50,000 以上', emoji: '👑' },
    ],
    answer: budget
  }
]

const currentQuestion = computed(() => questions[step.value - 1])

const canGoNext = computed(() => {
  const q = currentQuestion.value
  return q.answer.value !== null
})

const nextStep = () => {
  if (step.value < totalSteps && canGoNext.value) {
    step.value++
  }
}

const prevStep = () => {
  if (step.value > 1) {
    step.value--
  }
}

const selectOption = (value: string) => {
  currentQuestion.value.answer.value = value
  if (step.value < totalSteps) {
    setTimeout(() => nextStep(), 300)
  }
}

// 使用評分制推薦商品，確保總是有結果
const recommendedProducts = computed(() => {
  const scored = props.products.map(product => {
    let score = 0
    const name = product.name.toLowerCase()
    const price = product.price ?? 0

    // === 預算匹配 (權重: 35分) ===
    if (budget.value) {
      const budgetRanges: Record<string, { min: number; max: number; ideal: number }> = {
        'budget': { min: 0, max: 20000, ideal: 15000 },
        'mid': { min: 15000, max: 35000, ideal: 25000 },
        'premium': { min: 30000, max: 50000, ideal: 40000 },
        'luxury': { min: 45000, max: 150000, ideal: 70000 },
      }
      const range = budgetRanges[budget.value]
      if (range) {
        if (price >= range.min && price <= range.max) {
          score += 35
        } else {
          const diff = price < range.min ? range.min - price : price - range.max
          if (diff <= 5000) score += 25
          else if (diff <= 10000) score += 15
          else score += 5
        }
      }
    }

    // === 安裝類型匹配 (權重: 20分) ===
    if (roomType.value && roomType.value !== 'any') {
      const typeKeywords: Record<string, string[]> = {
        'split': ['分離式', '分離'],
        'window': ['窗型', '窗'],
        'portable': ['移動式', '移動', '可攜'],
      }
      const keywords = typeKeywords[roomType.value] || []
      if (keywords.some(k => name.includes(k))) {
        score += 20
      } else {
        score += 5 // 沒匹配到也給基本分
      }
    }

    // === 功能偏好匹配 (權重: 25分) ===
    if (features.value === 'inverter') {
      if (name.includes('變頻')) score += 25
      else score += 5
    } else if (features.value === 'quiet') {
      if (name.includes('靜音') || name.includes('安靜') || name.includes('舒眠')) score += 25
      else score += 5
    } else if (features.value === 'smart') {
      if (name.includes('wifi') || name.includes('智慧') || name.includes('app') || name.includes('iot')) score += 25
      else score += 5
    } else if (features.value === 'cooling') {
      // 快速冷房 - 用功率判斷
      score += 15 // 基本分，大多數冷氣都有基本冷房效果
    }

    // === 品牌加分 (權重: 15分) ===
    const premiumBrands = ['panasonic', '國際牌', 'daikin', '大金', 'hitachi', '日立', 'mitsubishi', '三菱']
    const midBrands = ['lg', '樂金', 'samsung', '三星', 'sharp', '夏普', 'teco', '東元', 'heran', '禾聯']
    if (premiumBrands.some(b => product.brand.toLowerCase().includes(b))) {
      score += 15
    } else if (midBrands.some(b => product.brand.toLowerCase().includes(b))) {
      score += 10
    } else {
      score += 5
    }

    // === 折扣加分 (額外最多 5分) ===
    const discount = product.original_price
      ? Math.round((1 - price / product.original_price) * 100)
      : 0
    score += Math.min(discount / 4, 5)

    return { product, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(s => s.product)
})

const showResults = computed(() => step.value === totalSteps && budget.value !== null)

const getProductSlug = (product: any) => {
  if (product.slug) return product.slug
  return `${product.brand.toLowerCase()}-${product.id}`.replace(/[\s_]/g, '-')
}

const restart = () => {
  step.value = 1
  roomSize.value = null
  roomType.value = null
  features.value = null
  budget.value = null
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
              <Snowflake :size="24" />
            </div>
            <div>
              <h2 class="text-xl font-bold">冷氣幫我選</h2>
              <p class="text-cyan-100 text-sm">4 個問題，找到最適合的冷氣</p>
            </div>
          </div>
          <button
            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            @click="emit('close')"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Progress -->
        <div class="mt-4 flex gap-2">
          <div
            v-for="i in totalSteps"
            :key="i"
            :class="[
              'h-1.5 flex-1 rounded-full transition-all',
              i <= step ? 'bg-white' : 'bg-white/30'
            ]"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        <template v-if="!showResults">
          <!-- Question -->
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">{{ currentQuestion.title }}</h3>
            <p class="text-gray-500 mt-1">{{ currentQuestion.subtitle }}</p>
          </div>

          <!-- Tonnage Recommendation (show after step 1) -->
          <div
            v-if="step === 1 && tonnageRecommendation"
            class="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-xl"
          >
            <div class="flex items-center gap-2 text-cyan-700">
              <Zap :size="18" />
              <span class="font-medium">建議冷氣容量：{{ tonnageRecommendation.label }}</span>
              <span class="text-cyan-600 text-sm">({{ tonnageRecommendation.kw }})</span>
            </div>
          </div>

          <!-- Options -->
          <div class="space-y-3">
            <button
              v-for="option in currentQuestion.options"
              :key="option.value"
              :class="[
                'w-full p-4 rounded-xl border-2 text-left transition-all',
                currentQuestion.answer.value === option.value
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
              ]"
              @click="selectOption(option.value)"
            >
              <div class="flex items-center gap-4">
                <span class="text-3xl">{{ option.emoji }}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-900">{{ option.label }}</div>
                  <div class="text-sm text-gray-500">{{ option.desc }}</div>
                  <div v-if="'ton' in option" class="text-xs text-cyan-600 mt-1">
                    建議：{{ (option as { ton: string }).ton }}
                  </div>
                </div>
                <div
                  :class="[
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    currentQuestion.answer.value === option.value
                      ? 'border-cyan-500 bg-cyan-500'
                      : 'border-gray-300'
                  ]"
                >
                  <div v-if="currentQuestion.answer.value === option.value" class="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            </button>
          </div>
        </template>

        <!-- Results -->
        <template v-else>
          <div class="text-center mb-6">
            <div class="text-5xl mb-3">🎉</div>
            <h3 class="text-2xl font-bold text-gray-900">為你推薦這些冷氣！</h3>
            <p class="text-gray-500 mt-1">根據你的需求精選 {{ recommendedProducts.length }} 款</p>
          </div>

          <div v-if="recommendedProducts.length > 0" class="space-y-3">
            <NuxtLink
              v-for="product in recommendedProducts"
              :key="product.id"
              :to="`/air-conditioner/${getProductSlug(product)}`"
              class="block p-4 rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all"
              @click="emit('close')"
            >
              <div class="flex gap-4">
                <img
                  :src="product.image_url"
                  :alt="product.name"
                  class="w-20 h-20 object-cover rounded-lg bg-gray-100"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 line-clamp-2">{{ product.name }}</div>
                  <div class="text-cyan-600 font-bold mt-1">NT$ {{ formatPrice(product.price) }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full">{{ product.brand }}</span>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>

          <div v-else class="text-center py-8">
            <div class="text-4xl mb-3">😅</div>
            <p class="text-gray-500">找不到完全符合的商品，試試調整條件？</p>
          </div>

          <button
            class="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            @click="restart"
          >
            重新選擇
          </button>
        </template>
      </div>

      <!-- Footer Navigation -->
      <div v-if="!showResults" class="p-4 border-t border-gray-200 flex justify-between">
        <button
          v-if="step > 1"
          class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          @click="prevStep"
        >
          <ChevronLeft :size="20" />
          上一步
        </button>
        <div v-else />

        <button
          v-if="step < totalSteps"
          :disabled="!canGoNext"
          :class="[
            'flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all',
            canGoNext
              ? 'bg-cyan-600 text-white hover:bg-cyan-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
          @click="nextStep"
        >
          下一步
          <ChevronRight :size="20" />
        </button>

        <button
          v-else
          :disabled="!canGoNext"
          :class="[
            'flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all',
            canGoNext
              ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white hover:from-cyan-700 hover:to-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
          @click="() => {}"
        >
          <Sparkles :size="18" />
          查看推薦
        </button>
      </div>
    </div>
  </div>
</template>
