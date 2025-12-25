<script setup lang="ts">
import { useHead } from '#imports'
import { Book, HelpCircle, ArrowRight } from 'lucide-vue-next'
import { useGuideConfig } from '~/composables/useGuideConfig'
import { useFaqConfig } from '~/composables/useFaqConfig'
import { useStructuredData } from '~/composables/useStructuredData'
import GuideCard from '~/components/GuideCard.vue'
import SiteHeader from '~/components/SiteHeader.vue'

const { getAllGuides } = useGuideConfig()
const { getAllFaqs } = useFaqConfig()
const { SITE_URL, SITE_NAME, setBreadcrumbStructuredData } = useStructuredData()

const guides = getAllGuides()
const faqCount = getAllFaqs().length

// OG Image
const ogImage = `${SITE_URL}/og-image.png`
const pageTitle = `選購指南 | ${SITE_NAME}`
const pageDescription = '家電選購完整指南，教你看懂除濕機、空氣清淨機、冷氣等家電的規格與選購要點。'

// SEO
useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: `${SITE_URL}/guide` },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: '選購指南 - 家電比比看' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@jiadian_tw' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:image:alt', content: '選購指南 - 家電比比看' },
  ],
  link: [
    { rel: 'canonical', href: `${SITE_URL}/guide` }
  ]
})

// Breadcrumb 結構化資料
setBreadcrumbStructuredData([
  { name: '首頁', url: SITE_URL },
  { name: '選購指南', url: `${SITE_URL}/guide` }
])
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <SiteHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <Book :size="32" class="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          選購指南
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          完整的家電選購攻略，讓你不再被規格搞得頭昏眼花
        </p>
      </div>

      <!-- Guides Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GuideCard
          v-for="guide in guides"
          :key="guide.slug"
          :guide="guide"
        />
      </div>

      <!-- FAQ Section -->
      <div class="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <HelpCircle :size="24" class="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
                常見問題 FAQ
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                收錄 {{ faqCount }} 個家電選購常見問題，快速找到答案
              </p>
            </div>
          </div>
          <NuxtLink
            to="/guide/faq"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            瀏覽 FAQ
            <ArrowRight :size="18" />
          </NuxtLink>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-12">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 返回首頁
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
