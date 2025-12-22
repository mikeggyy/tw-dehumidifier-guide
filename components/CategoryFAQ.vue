<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, HelpCircle } from 'lucide-vue-next'
import type { FAQItem } from '~/composables/useCategoryConfig'

defineProps<{
  faqs: FAQItem[]
  categoryName: string
}>()

const openIndex = ref<number | null>(0) // 預設展開第一個

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <section class="mt-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <HelpCircle :size="22" class="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ categoryName }}常見問題
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            選購前必看的 {{ faqs.length }} 個 FAQ
          </p>
        </div>
      </div>
    </div>

    <!-- FAQ List -->
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      <div
        v-for="(faq, index) in faqs"
        :key="index"
        class="group"
      >
        <button
          class="w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          :aria-expanded="openIndex === index"
          :aria-controls="`faq-answer-${index}`"
          @click="toggle(index)"
        >
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center mt-0.5">
            {{ index + 1 }}
          </span>
          <span class="flex-1 font-medium text-gray-900 dark:text-white pr-4">
            {{ faq.question }}
          </span>
          <ChevronDown
            :size="20"
            :class="[
              'flex-shrink-0 text-gray-400 transition-transform duration-200 mt-0.5',
              openIndex === index ? 'rotate-180' : ''
            ]"
          />
        </button>

        <div
          :id="`faq-answer-${index}`"
          :class="[
            'overflow-hidden transition-all duration-200',
            openIndex === index ? 'max-h-96' : 'max-h-0'
          ]"
        >
          <div class="px-6 pb-5 pl-16">
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ faq.answer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
