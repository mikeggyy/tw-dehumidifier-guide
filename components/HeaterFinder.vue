<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, ChevronRight, ChevronLeft, Sparkles, Flame, Zap } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'

const props = defineProps<{
  products: Dehumidifier[]
}>()

const emit = defineEmits<{
  close: []
}>()

const step = ref(1)
const totalSteps = 4

// User answers
const roomSize = ref<string | null>(null)
const scenario = ref<string | null>(null)
const heaterType = ref<string | null>(null)
const budget = ref<string | null>(null)

// 坪數對應的建議功率
const wattageRecommendation = computed(() => {
  const recommendations: Record<string, { min: number; max: number; label: string }> = {
    'tiny': { min: 0, max: 500, label: '300-500W' },
    'small': { min: 400, max: 800, label: '500-800W' },
    'medium': { min: 700, max: 1200, label: '800-1200W' },
    'large': { min: 1000, max: 2000, label: '1200W 以上' },
  }
  return recommendations[roomSize.value || ''] || null
})

const questions = [
  {
    step: 1,
    title: '你的空間有多大？ 📐',
    subtitle: '我們幫你算出需要的功率',
    options: [
      { value: 'tiny', label: '迷你空間', desc: '2坪以下 (浴室、書桌)', emoji: '🚿', watt: '300-500W' },
      { value: 'small', label: '小坪數', desc: '2-4坪 (小臥室)', emoji: '🛏️', watt: '500-800W' },
      { value: 'medium', label: '中坪數', desc: '4-6坪 (臥室、書房)', emoji: '🏠', watt: '800-1200W' },
      { value: 'large', label: '大坪數', desc: '6坪以上 (客廳)', emoji: '🏡', watt: '1200W+' },
    ],
    answer: roomSize
  },
  {
    step: 2,
    title: '主要在哪裡使用？ 🏠',
    subtitle: '不同場景適合不同類型',
    options: [
      { value: 'bedroom', label: '臥室睡覺', desc: '需要安靜、整夜使用', emoji: '😴', priority: 'quiet' },
      { value: 'living', label: '客廳活動', desc: '快速暖房、大範圍', emoji: '🛋️', priority: 'power' },
      { value: 'bathroom', label: '浴室洗澡', desc: '防水、快速加熱', emoji: '🚿', priority: 'waterproof' },
      { value: 'office', label: '辦公桌下', desc: '局部取暖、省電', emoji: '💼', priority: 'compact' },
    ],
    answer: scenario
  },
  {
    step: 3,
    title: '偏好哪種電暖器？ 🔥',
    subtitle: '各有優缺點，選最適合的',
    options: [
      { value: 'ceramic', label: '陶瓷電暖器', desc: '快速加熱、體積小', emoji: '⚡', type: 'ceramic' },
      { value: 'oil', label: '葉片式暖爐', desc: '持久保暖、不乾燥', emoji: '🌡️', type: 'oil' },
      { value: 'halogen', label: '鹵素/碳素', desc: '即開即熱、省電', emoji: '💡', type: 'halogen' },
      { value: 'any', label: '都可以', desc: '讓系統推薦最適合', emoji: '🤷', type: 'any' },
    ],
    answer: heaterType
  },
  {
    step: 4,
    title: '預算大概多少？ 💰',
    subtitle: '找到最超值的選擇',
    options: [
      { value: 'budget', label: '平價首選', desc: '2千以內', emoji: '🌱', max: 2000 },
      { value: 'mid', label: '中價位', desc: '2千到5千', emoji: '⭐', min: 2000, max: 5000 },
      { value: 'premium', label: '高品質', desc: '5千以上', emoji: '👑', min: 5000 },
    ],
    answer: budget
  }
]

const currentQuestion = computed(() => questions[step.value - 1])

// 根據回答生成個人化描述
const userProfile = computed(() => {
  const profiles: string[] = []

  if (roomSize.value === 'tiny') profiles.push('迷你空間')
  else if (roomSize.value === 'small') profiles.push('小坪數')
  else if (roomSize.value === 'medium') profiles.push('中坪數')
  else if (roomSize.value === 'large') profiles.push('大坪數')

  if (scenario.value === 'bedroom') profiles.push('臥室用')
  else if (scenario.value === 'living') profiles.push('客廳用')
  else if (scenario.value === 'bathroom') profiles.push('浴室用')
  else if (scenario.value === 'office') profiles.push('辦公用')

  return profiles.join(' + ')
})

// 推薦結果的個人化標語
const resultMessage = computed(() => {
  const messages: Record<string, string> = {
    'bedroom': '這幾款超靜音，睡覺開整晚也不怕！',
    'living': '大功率快速暖房，客廳也能暖呼呼～',
    'bathroom': '防水設計，洗澡前開最適合！',
    'office': '小巧省電，放桌下暖腳超舒服！',
  }
  return messages[scenario.value || ''] || '根據你的需求精心挑選！'
})

// Filter and rank products based on answers
const recommendedProducts = computed(() => {
  let filtered = [...props.products]

  // 確保只篩選電暖器
  filtered = filtered.filter(p => (p as any).category_slug === 'heater')

  // 根據功率需求篩選
  if (wattageRecommendation.value) {
    const { min, max } = wattageRecommendation.value
    filtered = filtered.filter(p => {
      const power = (p as any).specs?.heating_power || 0
      // 允許 ±30% 的彈性
      return power >= min * 0.7 && power <= max * 1.3
    })
  }

  // 根據電暖器類型篩選
  if (heaterType.value && heaterType.value !== 'any') {
    filtered = filtered.filter(p => {
      const type = (p as any).specs?.type || ''
      return type === heaterType.value
    })
  }

  // 根據預算篩選
  const budgetOption = questions[3].options.find(o => o.value === budget.value)
  if (budgetOption) {
    if ((budgetOption as any).max) {
      filtered = filtered.filter(p => p.price <= (budgetOption as any).max)
    }
    if ((budgetOption as any).min) {
      filtered = filtered.filter(p => p.price >= (budgetOption as any).min)
    }
  }

  // 根據使用場景排序
  if (scenario.value === 'bedroom') {
    // 靜音優先，葉片式加分
    filtered.sort((a, b) => {
      const aType = (a as any).specs?.type || ''
      const bType = (b as any).specs?.type || ''
      // 葉片式最安靜
      if (aType === 'oil' && bType !== 'oil') return -1
      if (bType === 'oil' && aType !== 'oil') return 1
      return 0
    })
  } else if (scenario.value === 'living') {
    // 功率優先
    filtered.sort((a, b) => {
      const aPower = (a as any).specs?.heating_power || 0
      const bPower = (b as any).specs?.heating_power || 0
      return bPower - aPower
    })
  } else if (scenario.value === 'bathroom') {
    // 浴室適用、防水功能優先
    filtered.sort((a, b) => {
      const aHasBath = a.features?.some((f: string) =>
        f.includes('浴室') || f.includes('防水') || f.includes('IP')
      ) ? 1 : 0
      const bHasBath = b.features?.some((f: string) =>
        f.includes('浴室') || f.includes('防水') || f.includes('IP')
      ) ? 1 : 0
      return bHasBath - aHasBath
    })
  } else if (scenario.value === 'office') {
    // 體積小、功率低優先
    filtered.sort((a, b) => {
      const aPower = (a as any).specs?.heating_power || 0
      const bPower = (b as any).specs?.heating_power || 0
      // 辦公室用，功率較低但足夠的優先
      return aPower - bPower
    })
  }

  // 如果篩選結果太少，放寬條件
  if (filtered.length < 3) {
    filtered = [...props.products].filter(p => (p as any).category_slug === 'heater')

    // 只按預算篩選
    if (budgetOption) {
      if ((budgetOption as any).max) {
        filtered = filtered.filter(p => p.price <= (budgetOption as any).max * 1.2)
      }
      if ((budgetOption as any).min) {
        filtered = filtered.filter(p => p.price >= (budgetOption as any).min * 0.8)
      }
    }

    // 按價格排序
    filtered.sort((a, b) => a.price - b.price)
  }

  return filtered.slice(0, 3)
})

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

const getDisplayBrand = (product: Dehumidifier): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
}

const getHeaterTypeLabel = (product: Dehumidifier): string => {
  const type = (product as any).specs?.type || ''
  const labels: Record<string, string> = {
    'ceramic': '陶瓷式',
    'oil': '葉片式',
    'halogen': '鹵素/碳素',
    'fan': '暖風機',
  }
  return labels[type] || ''
}

const getHeaterPower = (product: Dehumidifier): number => {
  return (product as any).specs?.heating_power || 0
}

const selectAnswer = (value: string) => {
  currentQuestion.value.answer.value = value as any
  if (step.value < totalSteps) {
    setTimeout(() => step.value++, 300)
  } else {
    setTimeout(() => step.value = totalSteps + 1, 300)
  }
}

const prevStep = () => {
  if (step.value > 1) step.value--
}

const restart = () => {
  step.value = 1
  roomSize.value = null
  scenario.value = null
  heaterType.value = null
  budget.value = null
}

const getDiscountPercent = (product: Dehumidifier): number | null => {
  const original = product.original_price
  if (!original || original <= product.price) return null
  return Math.round((1 - product.price / original) * 100)
}

// 獎牌 emoji
const medals = ['🥇', '🥈', '🥉']
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />

    <!-- Modal -->
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div class="flex items-center gap-2 text-white">
          <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles :size="18" />
          </div>
          <div>
            <h2 class="text-lg font-bold">電暖器推薦</h2>
            <p class="text-xs text-white/80">找到最適合你的暖氣</p>
          </div>
        </div>
        <button @click="emit('close')" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-all">
          <X :size="18" />
        </button>
      </div>

      <!-- Progress Bar -->
      <div v-if="step <= totalSteps" class="h-1.5 bg-gray-100 dark:bg-gray-700">
        <div
          class="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
          :style="{ width: `${(step / totalSteps) * 100}%` }"
        />
      </div>

      <!-- Wattage Indicator (after step 1) -->
      <div v-if="step > 1 && wattageRecommendation" class="mx-6 mt-4 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center gap-3">
        <div class="w-10 h-10 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
          <Zap :size="20" class="text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p class="text-xs text-orange-600 dark:text-orange-400 font-medium">建議功率</p>
          <p class="text-lg font-bold text-orange-700 dark:text-orange-300">{{ wattageRecommendation.label }}</p>
        </div>
      </div>

      <!-- Question Content -->
      <div v-if="step <= totalSteps" class="p-6">
        <!-- Question -->
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentQuestion.title }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ currentQuestion.subtitle }}</p>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <button
            v-for="option in currentQuestion.options"
            :key="option.value"
            :class="[
              'w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 group',
              currentQuestion.answer.value === option.value
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 scale-[1.02] shadow-md'
                : 'border-gray-100 dark:border-gray-600 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 hover:scale-[1.01]'
            ]"
            @click="selectAnswer(option.value)"
          >
            <span class="text-4xl transform group-hover:scale-110 transition-transform">{{ option.emoji }}</span>
            <div class="flex-1">
              <p class="font-bold text-gray-900 dark:text-white">{{ option.label }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ option.desc }}</p>
              <p v-if="(option as any).watt" class="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                建議 {{ (option as any).watt }}
              </p>
            </div>
            <ChevronRight
              :class="[
                'transition-all',
                currentQuestion.answer.value === option.value
                  ? 'text-orange-500 translate-x-1'
                  : 'text-gray-300 dark:text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1'
              ]"
              :size="20"
            />
          </button>
        </div>

        <!-- Back Button -->
        <button
          v-if="step > 1"
          class="mt-6 flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto"
          @click="prevStep"
        >
          <ChevronLeft :size="18" />
          上一題
        </button>

        <!-- Step indicator -->
        <div class="flex justify-center gap-2 mt-6">
          <div
            v-for="i in totalSteps"
            :key="i"
            :class="[
              'w-2 h-2 rounded-full transition-all',
              i === step ? 'w-6 bg-orange-500' : i < step ? 'bg-orange-300' : 'bg-gray-200 dark:bg-gray-600'
            ]"
          />
        </div>
      </div>

      <!-- Results -->
      <div v-else class="p-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4 shadow-lg">
            <Flame :size="40" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white">推薦完成！</h3>
          <div class="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-full">
            <span class="text-sm text-orange-700 dark:text-orange-300">{{ userProfile }}</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">{{ resultMessage }}</p>
        </div>

        <!-- No Results -->
        <div v-if="recommendedProducts.length === 0" class="text-center py-8">
          <p class="text-6xl mb-4">🤔</p>
          <p class="text-gray-600 dark:text-gray-300 font-medium mb-2">哎呀，條件有點嚴格</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">找不到完全符合的商品</p>
          <button
            class="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            @click="restart"
          >
            重新推薦
          </button>
        </div>

        <!-- Product List -->
        <div v-else class="space-y-3">
          <a
            v-for="(product, index) in recommendedProducts"
            :key="product.id"
            :href="product.affiliate_url || (product as any).momo_url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            :class="[
              'flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02]',
              index === 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-700' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            ]"
          >
            <!-- Medal -->
            <span class="text-3xl">{{ medals[index] }}</span>

            <img
              :src="product.image_url"
              :alt="product.name"
              class="w-16 h-16 object-cover rounded-xl flex-shrink-0 shadow-sm bg-white"
              loading="lazy"
            />

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ getDisplayBrand(product) }}</p>
                <span v-if="getHeaterTypeLabel(product)" class="text-xs bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded">
                  {{ getHeaterTypeLabel(product) }}
                </span>
              </div>
              <p class="font-bold text-gray-900 dark:text-white truncate text-sm">
                {{ getHeaterPower(product) ? `${getHeaterPower(product)}W` : '' }} {{ product.model }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-orange-600 dark:text-orange-400 font-bold">NT$ {{ formatPrice(product.price) }}</span>
                <span
                  v-if="getDiscountPercent(product)"
                  class="text-xs bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded font-medium"
                >
                  -{{ getDiscountPercent(product) }}%
                </span>
              </div>
            </div>
          </a>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="restart"
          >
            🔄 重新推薦
          </button>
          <button
            class="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
            @click="emit('close')"
          >
            完成 ✨
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
