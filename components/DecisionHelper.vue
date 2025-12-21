<script setup lang="ts">
import { ref, computed } from 'vue'
import { HelpCircle, ChevronRight, RotateCcw, Sparkles } from 'lucide-vue-next'
import type { Dehumidifier } from '~/types'

const props = defineProps<{
  products: Dehumidifier[]
}>()

const emit = defineEmits<{
  recommend: [product: Dehumidifier]
}>()

interface Question {
  id: string
  text: string
  options: {
    label: string
    emoji: string
    weight: { price: number; capacity: number; noise: number; efficiency: number }
  }[]
}

const questions: Question[] = [
  {
    id: 'budget',
    text: '你的預算考量？',
    options: [
      { label: '越便宜越好', emoji: '💰', weight: { price: 50, capacity: 20, noise: 15, efficiency: 15 } },
      { label: '適中就好', emoji: '⚖️', weight: { price: 25, capacity: 25, noise: 25, efficiency: 25 } },
      { label: '品質優先', emoji: '✨', weight: { price: 10, capacity: 30, noise: 30, efficiency: 30 } }
    ]
  },
  {
    id: 'space',
    text: '使用空間大小？',
    options: [
      { label: '小套房/臥室', emoji: '🛏️', weight: { price: 25, capacity: 15, noise: 40, efficiency: 20 } },
      { label: '客廳/一般房間', emoji: '🏠', weight: { price: 25, capacity: 30, noise: 25, efficiency: 20 } },
      { label: '大坪數/透天', emoji: '🏢', weight: { price: 20, capacity: 50, noise: 10, efficiency: 20 } }
    ]
  },
  {
    id: 'timing',
    text: '主要使用時段？',
    options: [
      { label: '晚上睡覺時', emoji: '🌙', weight: { price: 20, capacity: 20, noise: 50, efficiency: 10 } },
      { label: '白天在家時', emoji: '☀️', weight: { price: 25, capacity: 35, noise: 25, efficiency: 15 } },
      { label: '外出時運轉', emoji: '🚶', weight: { price: 25, capacity: 35, noise: 10, efficiency: 30 } }
    ]
  }
]

const currentStep = ref(0)
const answers = ref<number[]>([])
const showResult = ref(false)

const isStarted = computed(() => answers.value.length > 0 || showResult.value)

const selectOption = (optionIndex: number) => {
  answers.value[currentStep.value] = optionIndex

  if (currentStep.value < questions.length - 1) {
    currentStep.value++
  } else {
    showResult.value = true
  }
}

const reset = () => {
  currentStep.value = 0
  answers.value = []
  showResult.value = false
}

// 計算加權後的最佳推薦
const recommendation = computed(() => {
  if (!showResult.value || answers.value.length !== questions.length) return null

  // 合併所有答案的權重
  const totalWeight = { price: 0, capacity: 0, noise: 0, efficiency: 0 }
  answers.value.forEach((ansIdx, qIdx) => {
    const w = questions[qIdx].options[ansIdx].weight
    totalWeight.price += w.price
    totalWeight.capacity += w.capacity
    totalWeight.noise += w.noise
    totalWeight.efficiency += w.efficiency
  })

  // 正規化
  const sum = totalWeight.price + totalWeight.capacity + totalWeight.noise + totalWeight.efficiency
  const normalizedWeight = {
    price: totalWeight.price / sum * 100,
    capacity: totalWeight.capacity / sum * 100,
    noise: totalWeight.noise / sum * 100,
    efficiency: totalWeight.efficiency / sum * 100
  }

  // 計算每個商品的分數
  const prods = props.products
  const scores = prods.map(p => {
    let score = 0

    // 價格分數 (越低越好)
    const prices = prods.map(x => x.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceScore = maxPrice > minPrice
      ? 100 - ((p.price - minPrice) / (maxPrice - minPrice) * 100)
      : 100
    score += priceScore * normalizedWeight.price / 100

    // 除濕力分數 (越高越好)
    const capacities = prods.map(x => x.daily_capacity ?? 0)
    const maxCap = Math.max(...capacities)
    const capScore = maxCap > 0 && p.daily_capacity
      ? (p.daily_capacity / maxCap) * 100
      : 50
    score += capScore * normalizedWeight.capacity / 100

    // 安靜度分數 (越低越好)
    const noises = prods.map(x => x.noise_level ?? 50)
    const minNoise = Math.min(...noises)
    const maxNoise = Math.max(...noises)
    const noiseScore = maxNoise > minNoise && p.noise_level
      ? 100 - ((p.noise_level - minNoise) / (maxNoise - minNoise) * 100)
      : 50
    score += noiseScore * normalizedWeight.noise / 100

    // 能效分數 (越低級數越好)
    const effScore = p.energy_efficiency
      ? (6 - p.energy_efficiency) * 20
      : 50
    score += effScore * normalizedWeight.efficiency / 100

    return { product: p, score }
  })

  const best = scores.sort((a, b) => b.score - a.score)[0]

  // 生成推薦理由
  const reasons: string[] = []
  if (normalizedWeight.price > 30 && best.product.price === Math.min(...prods.map(p => p.price))) {
    reasons.push('價格最實惠')
  }
  if (normalizedWeight.capacity > 30 && best.product.daily_capacity === Math.max(...prods.map(p => p.daily_capacity ?? 0))) {
    reasons.push('除濕力最強')
  }
  if (normalizedWeight.noise > 30 && best.product.noise_level === Math.min(...prods.map(p => p.noise_level ?? 99))) {
    reasons.push('運轉最安靜')
  }
  if (normalizedWeight.efficiency > 30 && best.product.energy_efficiency === Math.min(...prods.map(p => p.energy_efficiency ?? 5))) {
    reasons.push('能效等級最佳')
  }

  return {
    product: best.product,
    score: Math.round(best.score),
    reasons: reasons.length > 0 ? reasons : ['綜合表現最符合您的需求']
  }
})
</script>

<template>
  <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-4">
      <div class="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
        <Sparkles :size="20" class="text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">幫我決定</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">回答 3 個問題，找出最適合你的商品</p>
      </div>
      <button
        v-if="isStarted"
        @click="reset"
        class="ml-auto p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
        title="重新開始"
      >
        <RotateCcw :size="16" />
      </button>
    </div>

    <!-- Question Flow -->
    <div v-if="!showResult">
      <!-- Progress -->
      <div class="flex gap-1 mb-4">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          :class="[
            'h-1 flex-1 rounded-full transition-colors',
            idx < currentStep ? 'bg-purple-500' :
            idx === currentStep ? 'bg-purple-300 dark:bg-purple-600' :
            'bg-gray-200 dark:bg-gray-700'
          ]"
        />
      </div>

      <!-- Current Question -->
      <div class="mb-4">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ questions[currentStep].text }}
        </p>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="(option, idx) in questions[currentStep].options"
            :key="idx"
            @click="selectOption(idx)"
            :class="[
              'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
              answers[currentStep] === idx
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
            ]"
          >
            <span class="text-xl">{{ option.emoji }}</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ option.label }}</span>
            <ChevronRight :size="16" class="ml-auto text-gray-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div v-else-if="recommendation" class="space-y-4">
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-400 text-sm font-medium mb-3">
          <Sparkles :size="16" />
          最適合你的選擇
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <img
            :src="recommendation.product.image_url"
            :alt="recommendation.product.name"
            class="w-16 h-16 object-cover rounded-lg"
          />
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ recommendation.product.brand }}</p>
            <p class="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
              {{ recommendation.product.name }}
            </p>
            <p class="text-blue-600 dark:text-blue-400 font-semibold mt-1">
              NT$ {{ recommendation.product.price.toLocaleString() }}
            </p>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ recommendation.score }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">匹配度</div>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="reason in recommendation.reasons"
              :key="reason"
              class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full"
            >
              {{ reason }}
            </span>
          </div>
        </div>
      </div>

      <button
        @click="emit('recommend', recommendation.product)"
        class="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        查看此商品
      </button>
    </div>
  </div>
</template>
