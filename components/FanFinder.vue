<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, ChevronRight, ChevronLeft, Sparkles, Fan, Zap } from 'lucide-vue-next'
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
const fanType = ref<string | null>(null)
const motorType = ref<string | null>(null)
const features = ref<string | null>(null)
const budget = ref<string | null>(null)

const questions = [
  {
    step: 1,
    title: '你需要什麼類型的風扇？',
    subtitle: '不同類型適合不同空間',
    options: [
      { value: 'stand', label: '立扇', desc: '最常見的落地型風扇', emoji: '🧍' },
      { value: 'circulator', label: '循環扇', desc: '強力渦流，搭配冷氣更涼爽', emoji: '🌀' },
      { value: 'tower', label: '大廈扇', desc: '直立式，省空間又時尚', emoji: '🗼' },
      { value: 'desk', label: '桌扇', desc: '小巧可愛，放桌上使用', emoji: '🖥️' },
    ],
    answer: fanType
  },
  {
    step: 2,
    title: '你偏好哪種馬達？',
    subtitle: 'DC 變頻更省電靜音',
    options: [
      { value: 'dc', label: 'DC 變頻', desc: '省電、安靜、風量可調', emoji: '⚡' },
      { value: 'ac', label: 'AC 定頻', desc: '價格實惠、風力強勁', emoji: '💨' },
      { value: 'any', label: '都可以', desc: '幫我推薦最適合的', emoji: '🤷' },
    ],
    answer: motorType
  },
  {
    step: 3,
    title: '你重視什麼功能？',
    subtitle: '選擇最在意的功能',
    options: [
      { value: 'quiet', label: '安靜運轉', desc: '睡眠時也能使用', emoji: '🤫' },
      { value: 'remote', label: '遙控功能', desc: '懶人必備，不用起身', emoji: '📱' },
      { value: 'oscillation', label: '擺頭功能', desc: '廣角送風更涼快', emoji: '🔄' },
      { value: 'design', label: '外型設計', desc: '好看也很重要', emoji: '✨' },
    ],
    answer: features
  },
  {
    step: 4,
    title: '你的預算範圍？',
    subtitle: '選擇適合的價位',
    options: [
      { value: 'budget', label: '經濟實惠', desc: 'NT$ 1,500 以下', emoji: '💵' },
      { value: 'mid', label: '中等價位', desc: 'NT$ 1,500-3,000', emoji: '💳' },
      { value: 'premium', label: '中高價位', desc: 'NT$ 3,000-6,000', emoji: '💎' },
      { value: 'luxury', label: '頂級旗艦', desc: 'NT$ 6,000 以上', emoji: '👑' },
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

// Filter and rank products
const recommendedProducts = computed(() => {
  // 使用評分系統而非嚴格篩選
  const scored = props.products.map(product => {
    let score = 0
    const specs = product.specs || {}
    // features 存在於 Product 類型，但 Dehumidifier 沒有此屬性
    const productFeatures = (product as unknown as { features?: readonly string[] }).features || []
    const name = product.name.toLowerCase()

    // 風扇類型偏好評分 (不排除，只加分)
    if (fanType.value && fanType.value !== 'any') {
      if (specs.fan_type === fanType.value) {
        score += 50
      } else {
        // 從名稱判斷
        const typeKeywords: Record<string, string[]> = {
          'stand': ['立扇', '電風扇'],
          'circulator': ['循環扇', '循環'],
          'tower': ['大廈扇', '塔扇', '直立扇'],
          'desk': ['桌扇', '桌上', '小風扇'],
        }
        const keywords = typeKeywords[fanType.value] || []
        if (keywords.some(k => name.includes(k))) {
          score += 40
        }
      }
    }

    // 馬達類型偏好評分
    if (motorType.value && motorType.value !== 'any') {
      if (specs.motor_type === motorType.value) {
        score += 40
      } else if (motorType.value === 'dc' && (name.includes('dc') || name.includes('直流') || name.includes('變頻'))) {
        score += 35
      } else if (motorType.value === 'ac' && !name.includes('dc') && !name.includes('直流')) {
        score += 30
      }
    }

    // 預算偏好評分 (在範圍內加分最多，接近範圍也加分)
    if (budget.value) {
      const budgetRanges: Record<string, { min: number; max: number; ideal: number }> = {
        'budget': { min: 0, max: 1500, ideal: 1000 },
        'mid': { min: 1000, max: 3000, ideal: 2000 },
        'premium': { min: 2500, max: 6000, ideal: 4000 },
        'luxury': { min: 5000, max: 50000, ideal: 8000 },
      }
      const range = budgetRanges[budget.value]
      if (range) {
        if (product.price >= range.min && product.price <= range.max) {
          score += 40
          // 接近理想價格加更多分
          const priceDiff = Math.abs(product.price - range.ideal)
          score += Math.max(0, 20 - (priceDiff / 100))
        } else if (product.price < range.min * 1.5 || product.price > range.max * 0.7) {
          score += 15 // 稍微超出範圍也給分
        }
      }
    }

    // 功能偏好評分
    if (features.value === 'quiet') {
      if (productFeatures.some((f: string) => f.includes('靜音'))) score += 25
      if (specs.motor_type === 'dc' || name.includes('dc') || name.includes('直流')) score += 20
    }
    if (features.value === 'remote') {
      if (specs.remote_control) score += 30
      if (productFeatures.some((f: string) => f.includes('遙控')) || name.includes('遙控')) score += 20
    }
    if (features.value === 'oscillation') {
      if (specs.oscillation) score += 30
      if (productFeatures.some((f: string) => f.includes('擺頭') || f.includes('3D')) || name.includes('擺頭')) score += 20
    }
    if (features.value === 'design') {
      const designBrands = ['dyson', 'balmuda', 'plus minus zero', '正負零', 'xiaomi', '小米']
      if (designBrands.some(b => product.brand.toLowerCase().includes(b))) {
        score += 35
      }
    }

    // DC 馬達一般加分
    if (specs.motor_type === 'dc' || name.includes('dc') || name.includes('直流') || name.includes('變頻')) {
      score += 10
    }

    // 知名品牌加分
    const popularBrands = ['panasonic', '國際牌', 'dyson', 'balmuda', 'xiaomi', '小米', 'iris', 'chimei', '奇美', 'sampo', '聲寶', 'heran', '禾聯']
    if (popularBrands.some(b => product.brand.toLowerCase().includes(b))) {
      score += 15
    }

    // 折扣加分
    const discount = product.original_price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0
    score += Math.min(discount, 20)

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
  fanType.value = null
  motorType.value = null
  features.value = null
  budget.value = null
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-500 text-white p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Fan :size="24" />
            </div>
            <div>
              <h2 class="text-xl font-bold">電風扇幫我選</h2>
              <p class="text-indigo-100 text-sm">4 個問題，找到最適合的電風扇</p>
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

          <!-- DC Motor Info (show on step 2) -->
          <div
            v-if="step === 2"
            class="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl"
          >
            <div class="flex items-center gap-2 text-indigo-700">
              <Zap :size="18" />
              <span class="font-medium text-sm">DC 變頻馬達比 AC 定頻省電約 50%，且運轉更安靜</span>
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
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              ]"
              @click="selectOption(option.value)"
            >
              <div class="flex items-center gap-4">
                <span class="text-3xl">{{ option.emoji }}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-900">{{ option.label }}</div>
                  <div class="text-sm text-gray-500">{{ option.desc }}</div>
                </div>
                <div
                  :class="[
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    currentQuestion.answer.value === option.value
                      ? 'border-indigo-500 bg-indigo-500'
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
            <h3 class="text-2xl font-bold text-gray-900">為你推薦這些電風扇！</h3>
            <p class="text-gray-500 mt-1">根據你的需求精選 {{ recommendedProducts.length }} 款</p>
          </div>

          <div v-if="recommendedProducts.length > 0" class="space-y-3">
            <NuxtLink
              v-for="product in recommendedProducts"
              :key="product.id"
              :to="`/fan/${getProductSlug(product)}`"
              class="block p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
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
                  <div class="text-indigo-600 font-bold mt-1">NT$ {{ formatPrice(product.price) }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{{ product.brand }}</span>
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
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
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
              ? 'bg-gradient-to-r from-indigo-600 to-purple-500 text-white hover:from-indigo-700 hover:to-purple-600'
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
