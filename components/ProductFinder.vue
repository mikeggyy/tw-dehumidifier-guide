<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, ChevronRight, ChevronLeft, Sparkles, Droplets } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'
import { formatPrice, getDisplayBrand } from '~/utils/product'

const props = defineProps<{
  products: readonly Dehumidifier[]
}>()

const emit = defineEmits<{
  close: []
}>()

const step = ref(1)
const totalSteps = 4

// User answers
const lifestyle = ref<string | null>(null)
const concern = ref<string | null>(null)
const personality = ref<string | null>(null)
const budget = ref<string | null>(null)

// 預算選項（單獨定義以獲得正確類型）
const budgetOptions = [
  { value: 'budget', label: '小資首選', desc: '5千以內搞定', emoji: '🌱', max: 5000 },
  { value: 'mid', label: '願意投資', desc: '5千到1萬', emoji: '⭐', min: 5000, max: 10000 },
  { value: 'premium', label: '品質至上', desc: '1萬以上也OK', emoji: '👑', min: 10000 },
] as const

const questions = [
  {
    step: 1,
    title: '你住在什麼樣的空間？ 🏠',
    subtitle: '選最接近你的情況',
    options: [
      { value: 'cozy', label: '小窩', desc: '套房或小臥室', emoji: '🛏️', size: 'small' },
      { value: 'family', label: '一般住家', desc: '客廳或主臥室', emoji: '🏡', size: 'medium' },
      { value: 'spacious', label: '大坪數', desc: '開放空間或透天厝', emoji: '🏢', size: 'large' },
    ],
    answer: lifestyle
  },
  {
    step: 2,
    title: '你最受不了什麼？ 😫',
    subtitle: '選一個最困擾你的',
    options: [
      { value: 'moldy', label: '發霉星人', desc: '衣服、牆壁常發霉', emoji: '🦠', priority: 'power' },
      { value: 'sticky', label: '黏黏怪', desc: '身體總是濕黏不舒服', emoji: '💦', priority: 'power' },
      { value: 'sleepy', label: '淺眠族', desc: '睡覺怕吵不能有噪音', emoji: '😴', priority: 'quiet' },
      { value: 'laundry', label: '曬衣困難戶', desc: '室內晾衣服乾不了', emoji: '👕', priority: 'dry' },
    ],
    answer: concern
  },
  {
    step: 3,
    title: '你是哪種人？ 🎭',
    subtitle: '這會影響推薦結果喔',
    options: [
      { value: 'lazy', label: '懶人派', desc: '最好自動搞定一切', emoji: '🦥', trait: 'auto' },
      { value: 'saver', label: '省電達人', desc: '電費帳單斤斤計較', emoji: '⚡', trait: 'efficient' },
      { value: 'techy', label: '科技控', desc: '愛用 APP 遙控家電', emoji: '📱', trait: 'smart' },
      { value: 'practical', label: '務實派', desc: '好用耐操最重要', emoji: '💪', trait: 'value' },
    ],
    answer: personality
  },
  {
    step: 4,
    title: '預算大概多少？ 💰',
    subtitle: '誠實回答找到最適合的',
    options: budgetOptions,
    answer: budget
  }
]

const currentQuestion = computed(() => questions[step.value - 1])

// 根據回答生成個人化描述
const userProfile = computed(() => {
  const profiles: string[] = []

  if (lifestyle.value === 'cozy') profiles.push('小空間')
  else if (lifestyle.value === 'family') profiles.push('一般住家')
  else if (lifestyle.value === 'spacious') profiles.push('大坪數')

  if (concern.value === 'moldy') profiles.push('抗霉需求')
  else if (concern.value === 'sticky') profiles.push('除濕需求')
  else if (concern.value === 'sleepy') profiles.push('靜音需求')
  else if (concern.value === 'laundry') profiles.push('乾衣需求')

  return profiles.join(' + ')
})

// 推薦結果的個人化標語
const resultMessage = computed(() => {
  const messages: Record<string, string> = {
    'moldy': '這幾款除濕力超強，跟發霉說 bye bye！',
    'sticky': '快速除濕，讓你告別黏膩感～',
    'sleepy': '超靜音設計，睡覺開整晚也不怕吵！',
    'laundry': '有乾衣功能，室內曬衣也能乾爽！',
  }
  return messages[concern.value || ''] || '根據你的需求精心挑選！'
})

// Filter and rank products based on answers
const recommendedProducts = computed(() => {
  let filtered = [...props.products]

  // 根據空間大小篩選
  if (lifestyle.value === 'cozy') {
    filtered = filtered.filter(p => (p.daily_capacity ?? 0) <= 10)
  } else if (lifestyle.value === 'family') {
    filtered = filtered.filter(p => {
      const cap = p.daily_capacity ?? 0
      return cap >= 8 && cap <= 16
    })
  } else if (lifestyle.value === 'spacious') {
    filtered = filtered.filter(p => (p.daily_capacity ?? 0) >= 14)
  }

  // 根據預算篩選
  const budgetOption = budgetOptions.find(o => o.value === budget.value)
  if (budgetOption) {
    if ('max' in budgetOption && budgetOption.max) {
      filtered = filtered.filter(p => p.price <= budgetOption.max)
    }
    if ('min' in budgetOption && budgetOption.min) {
      filtered = filtered.filter(p => p.price >= budgetOption.min)
    }
  }

  // 根據需求排序
  if (concern.value === 'sleepy') {
    // 靜音優先
    filtered.sort((a, b) => (a.noise_level ?? 99) - (b.noise_level ?? 99))
  } else if (concern.value === 'moldy' || concern.value === 'sticky') {
    // 除濕力優先
    filtered.sort((a, b) => (b.daily_capacity ?? 0) - (a.daily_capacity ?? 0))
  } else if (concern.value === 'laundry') {
    // 有乾衣功能優先，然後除濕力
    filtered.sort((a, b) => {
      const aHasDry = a.features?.some((f: string) => f.includes('乾衣')) ? 1 : 0
      const bHasDry = b.features?.some((f: string) => f.includes('乾衣')) ? 1 : 0
      if (bHasDry !== aHasDry) return bHasDry - aHasDry
      return (b.daily_capacity ?? 0) - (a.daily_capacity ?? 0)
    })
  }

  // 根據個性微調
  if (personality.value === 'lazy') {
    // 自動功能優先
    filtered.sort((a, b) => {
      const aAuto = a.features?.some((f: string) => f.includes('自動')) ? 1 : 0
      const bAuto = b.features?.some((f: string) => f.includes('自動')) ? 1 : 0
      return bAuto - aAuto
    })
  } else if (personality.value === 'saver') {
    // 能效優先（假設有 energy_factor 或用價格/容量比）
    filtered.sort((a, b) => {
      const aEff = (a.daily_capacity ?? 0) / (a.power_consumption || 1)
      const bEff = (b.daily_capacity ?? 0) / (b.power_consumption || 1)
      return bEff - aEff
    })
  } else if (personality.value === 'techy') {
    // 智慧功能優先
    filtered.sort((a, b) => {
      const aHasApp = a.features?.some((f: string) => f.includes('APP') || f.includes('WiFi') || f.includes('智慧')) ? 1 : 0
      const bHasApp = b.features?.some((f: string) => f.includes('APP') || f.includes('WiFi') || f.includes('智慧')) ? 1 : 0
      return bHasApp - aHasApp
    })
  } else if (personality.value === 'practical') {
    // CP值優先（容量/價格比）
    filtered.sort((a, b) => {
      const aValue = (a.daily_capacity ?? 0) / (a.price || 1)
      const bValue = (b.daily_capacity ?? 0) / (b.price || 1)
      return bValue - aValue
    })
  }

  return filtered.slice(0, 3)
})

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
  lifestyle.value = null
  concern.value = null
  personality.value = null
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
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
        <div class="flex items-center gap-2 text-white">
          <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles :size="18" />
          </div>
          <div>
            <h2 class="text-lg font-bold">除濕機配對</h2>
            <p class="text-xs text-white/80">找到最適合你的那一台</p>
          </div>
        </div>
        <button @click="emit('close')" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-all">
          <X :size="18" />
        </button>
      </div>

      <!-- Progress Bar -->
      <div v-if="step <= totalSteps" class="h-1.5 bg-gray-100">
        <div
          class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
          :style="{ width: `${(step / totalSteps) * 100}%` }"
        />
      </div>

      <!-- Question Content -->
      <div v-if="step <= totalSteps" class="p-6">
        <!-- Question -->
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-gray-900">{{ currentQuestion.title }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ currentQuestion.subtitle }}</p>
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <button
            v-for="option in currentQuestion.options"
            :key="option.value"
            :class="[
              'w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 group',
              currentQuestion.answer.value === option.value
                ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-md'
                : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01]'
            ]"
            @click="selectAnswer(option.value)"
          >
            <span class="text-4xl transform group-hover:scale-110 transition-transform">{{ option.emoji }}</span>
            <div class="flex-1">
              <p class="font-bold text-gray-900">{{ option.label }}</p>
              <p class="text-sm text-gray-500">{{ option.desc }}</p>
            </div>
            <ChevronRight
              :class="[
                'transition-all',
                currentQuestion.answer.value === option.value
                  ? 'text-blue-500 translate-x-1'
                  : 'text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1'
              ]"
              :size="20"
            />
          </button>
        </div>

        <!-- Back Button -->
        <button
          v-if="step > 1"
          class="mt-6 flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors mx-auto"
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
              i === step ? 'w-6 bg-blue-500' : i < step ? 'bg-blue-300' : 'bg-gray-200'
            ]"
          />
        </div>
      </div>

      <!-- Results -->
      <div v-else class="p-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mb-4 shadow-lg">
            <Droplets :size="40" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900">配對完成！</h3>
          <div class="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-50 rounded-full">
            <span class="text-sm text-blue-700">{{ userProfile }}</span>
          </div>
          <p class="text-sm text-gray-500 mt-3">{{ resultMessage }}</p>
        </div>

        <!-- No Results -->
        <div v-if="recommendedProducts.length === 0" class="text-center py-8">
          <p class="text-6xl mb-4">🤔</p>
          <p class="text-gray-600 font-medium mb-2">哎呀，條件有點嚴格</p>
          <p class="text-gray-500 text-sm mb-4">找不到完全符合的商品</p>
          <button
            class="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            @click="restart"
          >
            重新配對
          </button>
        </div>

        <!-- Product List -->
        <div v-else class="space-y-3">
          <a
            v-for="(product, index) in recommendedProducts"
            :key="product.id"
            :href="product.affiliate_url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            :class="[
              'flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02]',
              index === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200' : 'bg-gray-50 hover:bg-gray-100'
            ]"
          >
            <!-- Medal -->
            <span class="text-3xl">{{ medals[index] }}</span>

            <img
              :src="product.image_url"
              :alt="product.name"
              class="w-16 h-16 object-cover rounded-xl flex-shrink-0 shadow-sm"
              loading="lazy"
              decoding="async"
            />

            <div class="flex-1 min-w-0">
              <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 font-medium">{{ getDisplayBrand(product) }}</p>
              <p class="font-bold text-gray-900 truncate">
                {{ product.daily_capacity }}L {{ product.model }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-blue-600 font-bold">NT$ {{ formatPrice(product.price) }}</span>
                <span
                  v-if="getDiscountPercent(product)"
                  class="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium"
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
            class="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            @click="restart"
          >
            🔄 重新配對
          </button>
          <button
            class="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md"
            @click="emit('close')"
          >
            完成 ✨
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
