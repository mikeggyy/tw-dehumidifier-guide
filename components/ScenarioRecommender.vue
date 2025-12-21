<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowRight, X } from 'lucide-vue-next'
import { useScenarioConfig, type Scenario } from '~/composables/useScenarioConfig'
import { useProducts } from '~/composables/useProducts'
import ProductCard from '~/components/ProductCard.vue'
import type { Dehumidifier } from '~/types'

const { getAllScenarios, getRecommendedProducts } = useScenarioConfig()
const { allProducts } = useProducts()

const scenarios = getAllScenarios()
const selectedScenario = ref<Scenario | null>(null)
const showResults = ref(false)

const recommendedProducts = computed(() => {
  if (!selectedScenario.value) return []
  return getRecommendedProducts(selectedScenario.value, allProducts.value, 6) as Dehumidifier[]
})

const selectScenario = (scenario: Scenario) => {
  selectedScenario.value = scenario
  showResults.value = true
}

const closeResults = () => {
  showResults.value = false
  selectedScenario.value = null
}

// Get category slug for product card
const getCategorySlug = (product: Dehumidifier): string => {
  return (product as any).category_slug || 'dehumidifier'
}
</script>

<template>
  <div class="mb-8">
    <!-- Scenario Cards -->
    <div v-if="!showResults" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <button
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="group relative bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all text-left"
        @click="selectScenario(scenario)"
      >
        <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
          {{ scenario.emoji }}
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">
          {{ scenario.title }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ scenario.description }}
        </p>
        <ArrowRight
          :size="16"
          class="absolute bottom-3 right-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
        />
      </button>
    </div>

    <!-- Results View -->
    <Transition name="fade">
      <div v-if="showResults && selectedScenario" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Results Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ selectedScenario.emoji }}</span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ selectedScenario.title }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                為您推薦 {{ recommendedProducts.length }} 款商品
              </p>
            </div>
          </div>
          <button
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="closeResults"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Products Grid -->
        <div class="p-4">
          <div v-if="recommendedProducts.length > 0" class="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <ProductCard
              v-for="product in recommendedProducts"
              :key="product.id"
              :product="product"
              :category-slug="getCategorySlug(product)"
              :show-compare="false"
            />
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">目前沒有符合條件的商品</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
