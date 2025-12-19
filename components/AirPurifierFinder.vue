<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, ChevronRight, ChevronLeft, Sparkles, Wind } from 'lucide-vue-next'

const props = defineProps<{
  products: any[]
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

const questions = [
  {
    step: 1,
    title: '描述一下你的生活空間 🏠',
    subtitle: '選最接近的情況',
    options: [
      { value: 'cozy', label: '小窩', desc: '套房或小臥室，溫馨剛好', emoji: '🛏️', size: 'small' },
      { value: 'family', label: '家庭客廳', desc: '一家人的活動空間', emoji: '🛋️', size: 'medium' },
      { value: 'openspace', label: '大空間', desc: '開放式格局或辦公室', emoji: '🏢', size: 'large' },
    ],
    answer: lifestyle
  },
  {
    step: 2,
    title: '你最困擾的是... 😤',
    subtitle: '選一個最想解決的',
    options: [
      { value: 'sneeze', label: '哈啾星人', desc: '早上起床就開始打噴嚏', emoji: '🤧', priority: 'allergy' },
      { value: 'smell', label: '鼻子很敏感', desc: '聞到怪味就不舒服', emoji: '👃', priority: 'odor' },
      { value: 'pet', label: '毛小孩的味道', desc: '家裡有毛孩，想維持空氣清新', emoji: '🐱', priority: 'pet' },
      { value: 'pm25', label: '窗外的空氣', desc: '常常空污紫爆很擔心', emoji: '😷', priority: 'dust' },
    ],
    answer: concern
  },
  {
    step: 3,
    title: '你是哪種人？ 🎭',
    subtitle: '這會影響推薦結果喔',
    options: [
      { value: 'sleeper', label: '淺眠者', desc: '一點聲音就睡不著', emoji: '😴', trait: 'quiet' },
      { value: 'techy', label: '科技控', desc: '愛用 APP 遙控一切', emoji: '📱', trait: 'smart' },
      { value: 'lazy', label: '懶人派', desc: '最好都不用保養維護', emoji: '🦥', trait: 'easy' },
      { value: 'practical', label: '務實派', desc: '好用實在最重要', emoji: '💪', trait: 'value' },
    ],
    answer: personality
  },
  {
    step: 4,
    title: '最後，預算大概？ 💰',
    subtitle: '誠實回答才能找到最適合的',
    options: [
      { value: 'budget', label: '小資首選', desc: '5千以內搞定', emoji: '🌱', max: 5000 },
      { value: 'mid', label: '願意投資', desc: '5千到1萬5', emoji: '⭐', min: 5000, max: 15000 },
      { value: 'premium', label: '品質至上', desc: '1萬5以上也OK', emoji: '👑', min: 15000 },
    ],
    answer: budget
  }
]

const currentQuestion = computed(() => questions[step.value - 1])

// 根據回答生成個人化描述
const userProfile = computed(() => {
  const profiles: string[] = []

  if (lifestyle.value === 'cozy') profiles.push('小空間')
  else if (lifestyle.value === 'family') profiles.push('家庭客廳')
  else if (lifestyle.value === 'openspace') profiles.push('大坪數')

  if (concern.value === 'sneeze') profiles.push('抗敏需求')
  else if (concern.value === 'smell') profiles.push('除臭需求')
  else if (concern.value === 'pet') profiles.push('寵物家庭')
  else if (concern.value === 'pm25') profiles.push('抗空污')

  return profiles.join(' + ')
})

// 推薦結果的個人化標語
const resultMessage = computed(() => {
  const messages: Record<string, string> = {
    'sneeze': '這幾款特別適合過敏體質，HEPA 濾網幫你擋住過敏原！',
    'smell': '選了有活性碳濾網的，讓你家空氣清新無異味～',
    'pet': '這些都很適合有毛孩的家庭，毛髮、皮屑 bye bye！',
    'pm25': '高 CADR 值首選，空污再嚴重也不怕！',
  }
  return messages[concern.value || ''] || '根據你的需求精心挑選！'
})

// Filter and rank products
const recommendedProducts = computed(() => {
  let filtered = [...props.products]

  // 根據空間大小篩選
  const sizeMap: Record<string, string> = {
    'cozy': 'small',
    'family': 'medium',
    'openspace': 'large'
  }
  const size = sizeMap[lifestyle.value || '']

  if (size === 'small') {
    filtered = filtered.filter(p => {
      const cadr = p.specs?.cadr ?? 0
      return cadr <= 250 || cadr === 0
    })
  } else if (size === 'medium') {
    filtered = filtered.filter(p => {
      const cadr = p.specs?.cadr ?? 0
      return (cadr >= 150 && cadr <= 450) || cadr === 0
    })
  } else if (size === 'large') {
    filtered = filtered.filter(p => {
      const cadr = p.specs?.cadr ?? 0
      return cadr >= 300 || cadr === 0
    })
  }

  // 根據預算篩選
  const budgetOption = questions[3].options.find(o => o.value === budget.value)
  if (budgetOption) {
    if (budgetOption.max) {
      filtered = filtered.filter(p => p.price <= budgetOption.max!)
    }
    if (budgetOption.min) {
      filtered = filtered.filter(p => p.price >= budgetOption.min!)
    }
  }

  // 根據需求排序
  const concernMap: Record<string, string> = {
    'sneeze': 'allergy',
    'smell': 'odor',
    'pet': 'pet',
    'pm25': 'dust'
  }
  const priority = concernMap[concern.value || '']

  if (priority === 'allergy' || priority === 'dust') {
    // 優先推薦有 HEPA 或高 CADR 的
    filtered.sort((a, b) => {
      const aHasHepa = a.features?.some((f: string) => f.includes('HEPA')) ? 1 : 0
      const bHasHepa = b.features?.some((f: string) => f.includes('HEPA')) ? 1 : 0
      if (bHasHepa !== aHasHepa) return bHasHepa - aHasHepa
      return (b.specs?.cadr ?? 0) - (a.specs?.cadr ?? 0)
    })
  } else if (priority === 'odor' || priority === 'pet') {
    // 優先推薦有除臭功能的
    filtered.sort((a, b) => {
      const aScore = (a.features?.some((f: string) => f.includes('活性碳')) ? 2 : 0) +
                     (a.features?.some((f: string) => f.includes('除臭')) ? 1 : 0)
      const bScore = (b.features?.some((f: string) => f.includes('活性碳')) ? 2 : 0) +
                     (b.features?.some((f: string) => f.includes('除臭')) ? 1 : 0)
      if (bScore !== aScore) return bScore - aScore
      return (b.specs?.cadr ?? 0) - (a.specs?.cadr ?? 0)
    })
  }

  // 根據個性微調
  if (personality.value === 'sleeper') {
    // 安靜款優先
    filtered.sort((a, b) => (a.specs?.noise_level ?? 99) - (b.specs?.noise_level ?? 99))
  } else if (personality.value === 'techy') {
    // 智慧款優先
    filtered.sort((a, b) => {
      const aHasApp = a.features?.some((f: string) => f.includes('APP') || f.includes('WiFi')) ? 1 : 0
      const bHasApp = b.features?.some((f: string) => f.includes('APP') || f.includes('WiFi')) ? 1 : 0
      return bHasApp - aHasApp
    })
  } else if (personality.value === 'practical') {
    // CP值優先（CADR/價格比）
    filtered.sort((a, b) => {
      const aValue = (a.specs?.cadr ?? 0) / (a.price || 1)
      const bValue = (b.specs?.cadr ?? 0) / (b.price || 1)
      return bValue - aValue
    })
  }

  return filtered.slice(0, 3)
})

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('zh-TW').format(price)
}

const getDisplayBrand = (product: any): string => {
  const brand = product.brand
  if (brand && brand !== 'Other') return brand
  const match = product.name.match(/【([^】]+)】/)
  return match ? match[1] : ''
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
  lifestyle.value = null
  concern.value = null
  personality.value = null
  budget.value = null
}

const getDiscountPercent = (product: any): number | null => {
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
      <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
        <div class="flex items-center gap-2 text-white">
          <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles :size="18" />
          </div>
          <div>
            <h2 class="text-lg font-bold">空氣清淨機配對</h2>
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
          class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
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
                ? 'border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md'
                : 'border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-[1.01]'
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
                  ? 'text-emerald-500 translate-x-1'
                  : 'text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1'
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
              i === step ? 'w-6 bg-emerald-500' : i < step ? 'bg-emerald-300' : 'bg-gray-200'
            ]"
          />
        </div>
      </div>

      <!-- Results -->
      <div v-else class="p-6">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4 shadow-lg">
            <Wind :size="40" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900">配對完成！</h3>
          <div class="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-50 rounded-full">
            <span class="text-sm text-emerald-700">{{ userProfile }}</span>
          </div>
          <p class="text-sm text-gray-500 mt-3">{{ resultMessage }}</p>
        </div>

        <!-- No Results -->
        <div v-if="recommendedProducts.length === 0" class="text-center py-8">
          <p class="text-6xl mb-4">🤔</p>
          <p class="text-gray-600 font-medium mb-2">哎呀，條件有點嚴格</p>
          <p class="text-gray-500 text-sm mb-4">找不到完全符合的商品</p>
          <button
            class="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
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
            />

            <div class="flex-1 min-w-0">
              <p v-if="getDisplayBrand(product)" class="text-xs text-gray-500 font-medium">{{ getDisplayBrand(product) }}</p>
              <p class="font-bold text-gray-900 truncate">
                {{ product.model }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-emerald-600 font-bold">NT$ {{ formatPrice(product.price) }}</span>
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
            class="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
            @click="emit('close')"
          >
            完成 ✨
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
