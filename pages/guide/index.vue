<script setup lang="ts">
import { useHead } from '#imports'
import { Book } from 'lucide-vue-next'
import { useGuideConfig } from '~/composables/useGuideConfig'
import { useStructuredData } from '~/composables/useStructuredData'
import GuideCard from '~/components/GuideCard.vue'
import SiteHeader from '~/components/SiteHeader.vue'

const { getAllGuides } = useGuideConfig()
const { SITE_URL, SITE_NAME } = useStructuredData()

const guides = getAllGuides()

// SEO
useHead({
  title: `選購指南 | ${SITE_NAME}`,
  meta: [
    { name: 'description', content: '家電選購完整指南，教你看懂除濕機、空氣清淨機、冷氣等家電的規格與選購要點。' },
    { property: 'og:title', content: `選購指南 | ${SITE_NAME}` },
    { property: 'og:description', content: '家電選購完整指南，教你看懂各種家電規格與選購要點。' },
    { property: 'og:url', content: `${SITE_URL}/guide` },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'canonical', href: `${SITE_URL}/guide` }
  ]
})
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
