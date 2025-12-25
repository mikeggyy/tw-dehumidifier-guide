<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHead } from '#imports'
import { HelpCircle, Droplets, Wind, Snowflake, Flame, Fan, ChevronDown, Search } from 'lucide-vue-next'
import { useFaqConfig, type FAQItem, type FAQCategory } from '~/composables/useFaqConfig'
import { useStructuredData } from '~/composables/useStructuredData'
import SiteHeader from '~/components/SiteHeader.vue'

const { getAllFaqs, getFaqCategories, getCategoryName } = useFaqConfig()
const { SITE_URL, SITE_NAME, setBreadcrumbStructuredData } = useStructuredData()

const allFaqs = getAllFaqs()
const categories = getFaqCategories()

// State
const selectedCategory = ref<string>('all')
const searchQuery = ref('')
const expandedQuestions = ref<Set<number>>(new Set())

// Filtered FAQs
const filteredFaqs = computed(() => {
  let result = allFaqs

  // Filter by category
  if (selectedCategory.value !== 'all') {
    result = result.filter(faq => faq.category === selectedCategory.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    )
  }

  return result
})

// Toggle question expansion
const toggleQuestion = (index: number) => {
  if (expandedQuestions.value.has(index)) {
    expandedQuestions.value.delete(index)
  } else {
    expandedQuestions.value.add(index)
  }
}

// Get icon component by category
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    HelpCircle,
    Droplets,
    Wind,
    Snowflake,
    Flame,
    Fan
  }
  return icons[iconName] || HelpCircle
}

// SEO
const pageTitle = `常見問題 FAQ | ${SITE_NAME}`
const pageDescription = '家電選購常見問題解答：除濕機、空氣清淨機、冷氣、電暖器、電風扇的選購疑問一次解答。'
const ogImage = `${SITE_URL}/og-image.png`

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: `${SITE_URL}/guide/faq` },
    { property: 'og:image', content: ogImage },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: ogImage },
  ],
  link: [
    { rel: 'canonical', href: `${SITE_URL}/guide/faq` }
  ],
  // FAQPage Schema.org structured data
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: allFaqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      })
    }
  ]
})

// Breadcrumb
setBreadcrumbStructuredData([
  { name: '首頁', url: SITE_URL },
  { name: '選購指南', url: `${SITE_URL}/guide` },
  { name: '常見問題', url: `${SITE_URL}/guide/faq` }
])
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <SiteHeader />

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <NuxtLink to="/" class="hover:text-blue-600">首頁</NuxtLink>
        <span>/</span>
        <NuxtLink to="/guide" class="hover:text-blue-600">選購指南</NuxtLink>
        <span>/</span>
        <span class="text-gray-900 dark:text-white">常見問題</span>
      </nav>

      <!-- Page Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <HelpCircle :size="32" class="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          常見問題 FAQ
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          家電選購的疑問，這裡一次解答
        </p>
      </div>

      <!-- Search Bar -->
      <div class="relative mb-6">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋問題..."
          class="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          @click="selectedCategory = 'all'"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          ]"
        >
          全部 ({{ allFaqs.length }})
        </button>
        <button
          v-for="cat in categories"
          :key="cat.slug"
          @click="selectedCategory = cat.slug"
          :class="[
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selectedCategory === cat.slug
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
          ]"
        >
          <component :is="getIconComponent(cat.icon)" :size="16" />
          {{ cat.name }}
        </button>
      </div>

      <!-- FAQ List -->
      <div class="space-y-4">
        <div
          v-for="(faq, index) in filteredFaqs"
          :key="index"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <button
            @click="toggleQuestion(index)"
            class="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <div class="flex items-start gap-3">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <component
                  :is="getIconComponent(categories.find(c => c.slug === faq.category)?.icon || 'HelpCircle')"
                  :size="16"
                  class="text-blue-600 dark:text-blue-400"
                />
              </span>
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  {{ getCategoryName(faq.category) }}
                </span>
                <h2 class="font-medium text-gray-900 dark:text-white">
                  {{ faq.question }}
                </h2>
              </div>
            </div>
            <ChevronDown
              :size="20"
              :class="[
                'flex-shrink-0 text-gray-400 transition-transform',
                expandedQuestions.has(index) ? 'rotate-180' : ''
              ]"
            />
          </button>

          <div
            v-show="expandedQuestions.has(index)"
            class="px-5 pb-5 pt-0"
          >
            <div class="pl-11 text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ faq.answer }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredFaqs.length === 0"
          class="text-center py-12"
        >
          <HelpCircle :size="48" class="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p class="text-gray-500 dark:text-gray-400">
            找不到相關問題，請嘗試其他關鍵字
          </p>
        </div>
      </div>

      <!-- Still Have Questions -->
      <div class="mt-12 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-center">
        <h3 class="text-xl font-bold mb-2">還有其他問題？</h3>
        <p class="text-blue-100 mb-4">
          查看我們的詳細選購指南，獲得更完整的資訊
        </p>
        <NuxtLink
          to="/guide"
          class="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
        >
          瀏覽選購指南
        </NuxtLink>
      </div>

      <!-- Back Link -->
      <div class="text-center mt-8">
        <NuxtLink
          to="/guide"
          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 返回選購指南
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
