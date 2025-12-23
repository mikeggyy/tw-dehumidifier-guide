<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-vue-next'

const isVisible = ref(false)
const currentStep = ref(0)

const steps = [
  {
    title: '歡迎使用比比看！',
    description: '快速比較家電規格與價格，輕鬆找到最適合你的產品。',
    icon: '👋',
    position: 'center'
  },
  {
    title: '比較＆收藏',
    description: '點擊「加入比較」可比較最多 4 款商品，點擊愛心可收藏喜歡的商品。',
    icon: '⚖️',
    position: 'center'
  },
  {
    title: '開始探索！',
    description: '使用篩選器快速找到想要的商品，祝你找到心儀的家電！',
    icon: '🎉',
    position: 'center'
  }
]

const currentStepData = computed(() => steps[currentStep.value])

const progress = computed(() => ((currentStep.value + 1) / steps.length) * 100)

const checkFirstVisit = () => {
  if (typeof window === 'undefined') return false
  const visited = localStorage.getItem('onboarding-completed')
  return !visited
}

const startTour = () => {
  isVisible.value = true
  currentStep.value = 0
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    completeTour()
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const completeTour = () => {
  isVisible.value = false
  if (typeof window !== 'undefined') {
    localStorage.setItem('onboarding-completed', 'true')
  }
}

const skipTour = () => {
  completeTour()
}

onMounted(() => {
  if (checkFirstVisit()) {
    // Delay to let page load
    setTimeout(() => {
      startTour()
    }, 1000)
  }
})

defineExpose({ startTour })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[9999]"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Content -->
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <!-- Progress bar -->
            <div class="h-1 bg-gray-200 dark:bg-gray-700">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                :style="{ width: `${progress}%` }"
              />
            </div>

            <!-- Header -->
            <div class="p-6 text-center">
              <span class="text-5xl mb-4 block animate-bounce">
                {{ currentStepData.icon }}
              </span>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {{ currentStepData.title }}
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                {{ currentStepData.description }}
              </p>
            </div>

            <!-- Step indicators -->
            <div class="flex justify-center gap-2 pb-4">
              <button
                v-for="(_, index) in steps"
                :key="index"
                class="w-2 h-2 rounded-full transition-all"
                :class="[
                  index === currentStep
                    ? 'w-6 bg-blue-500'
                    : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300 dark:bg-gray-600'
                ]"
                @click="currentStep = index"
              />
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                @click="skipTour"
              >
                跳過導覽
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-if="currentStep > 0"
                  class="flex items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  @click="prevStep"
                >
                  <ChevronLeft :size="18" />
                  上一步
                </button>

                <button
                  class="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  @click="nextStep"
                >
                  {{ currentStep === steps.length - 1 ? '開始使用' : '下一步' }}
                  <ChevronRight v-if="currentStep < steps.length - 1" :size="18" />
                  <Sparkles v-else :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
