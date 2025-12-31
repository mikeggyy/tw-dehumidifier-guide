<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useHead, createError } from '#imports'
import { Clock, ArrowLeft, ArrowRight, List } from 'lucide-vue-next'
import { useGuideConfig, type Guide } from '~/composables/useGuideConfig'
import { useStructuredData } from '~/composables/useStructuredData'
import { useProductsSSR } from '~/composables/useProducts'
import SiteHeader from '~/components/SiteHeader.vue'
import GuideRecommendedProducts from '~/components/GuideRecommendedProducts.vue'

// SSR 預載商品資料（用於推薦商品區塊）
useProductsSSR()

const route = useRoute()
const { getGuideBySlug, getAllGuides } = useGuideConfig()
const { SITE_URL, SITE_NAME, setBreadcrumbStructuredData } = useStructuredData()

const slug = computed(() => route.params.slug as string)
const guide = computed(() => getGuideBySlug(slug.value))

// 404 if guide not found
if (!guide.value) {
  throw createError({ statusCode: 404, statusMessage: '找不到此指南' })
}

// Get next/prev guides
const allGuides = getAllGuides()
const currentIndex = allGuides.findIndex(g => g.slug === slug.value)
const prevGuide = computed(() => currentIndex > 0 ? allGuides[currentIndex - 1] : null)
const nextGuide = computed(() => currentIndex < allGuides.length - 1 ? allGuides[currentIndex + 1] : null)

// OG Image (使用通用圖片)
const ogImage = `${SITE_URL}/og-image.png`

// SEO
useHead({
  title: guide.value.seoTitle,
  meta: [
    { name: 'description', content: guide.value.seoDescription },
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    // Open Graph
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: guide.value.seoTitle },
    { property: 'og:description', content: guide.value.seoDescription },
    { property: 'og:url', content: `${SITE_URL}/guide/${slug.value}` },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:alt', content: guide.value.title },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'article:published_time', content: guide.value.updatedAt },
    { property: 'article:modified_time', content: guide.value.updatedAt },
    { property: 'article:author', content: '比比看' },
  ],
  link: [
    { rel: 'canonical', href: `${SITE_URL}/guide/${slug.value}` }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.value.title,
        description: guide.value.seoDescription,
        datePublished: guide.value.updatedAt,
        dateModified: guide.value.updatedAt,
        image: ogImage,
        author: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL
        }
      })
    }
  ]
})

// Breadcrumb 結構化資料
setBreadcrumbStructuredData([
  { name: '首頁', url: SITE_URL },
  { name: '選購指南', url: `${SITE_URL}/guide` },
  { name: guide.value.title, url: `${SITE_URL}/guide/${slug.value}` }
])

// Scroll to section
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const getCategoryName = (categorySlug: string): string => {
  const names: Record<string, string> = {
    'dehumidifier': '除濕機',
    'air-purifier': '空氣清淨機',
    'air-conditioner': '冷氣',
    'heater': '電暖器',
    'fan': '電風扇'
  }
  return names[categorySlug] || '家電'
}
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
        <span class="text-gray-900 dark:text-white">{{ guide?.title }}</span>
      </nav>

      <!-- Article Header -->
      <header class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <NuxtLink
            :to="`/${guide?.categorySlug}`"
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            {{ getCategoryName(guide?.categorySlug || '') }}
          </NuxtLink>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ guide?.title }}
        </h1>
        <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1">
            <Clock :size="16" />
            <span>{{ guide?.readingTime }} 分鐘閱讀</span>
          </div>
          <span>更新於 {{ guide?.updatedAt }}</span>
        </div>
      </header>

      <div class="lg:flex lg:gap-8">
        <!-- Table of Contents (Desktop) -->
        <aside class="hidden lg:block w-64 flex-shrink-0">
          <div class="sticky top-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center gap-2 mb-3">
              <List :size="18" class="text-gray-400" />
              <h2 class="font-semibold text-gray-900 dark:text-white">目錄</h2>
            </div>
            <nav class="space-y-2">
              <button
                v-for="section in guide?.sections"
                :key="section.id"
                class="block w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                @click="scrollToSection(section.id)"
              >
                {{ section.title }}
              </button>
            </nav>
          </div>
        </aside>

        <!-- Article Content -->
        <article class="flex-1 min-w-0">
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Mobile TOC -->
            <div class="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700">
              <details class="group">
                <summary class="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                  <List :size="18" />
                  <span class="font-medium">目錄</span>
                </summary>
                <nav class="mt-3 pl-6 space-y-2">
                  <button
                    v-for="section in guide?.sections"
                    :key="section.id"
                    class="block w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600"
                    @click="scrollToSection(section.id)"
                  >
                    {{ section.title }}
                  </button>
                </nav>
              </details>
            </div>

            <!-- Sections -->
            <div class="divide-y divide-gray-100 dark:divide-gray-700">
              <section
                v-for="section in guide?.sections"
                :key="section.id"
                :id="section.id"
                class="p-6 scroll-mt-8"
              >
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {{ section.title }}
                </h2>
                <div
                  class="prose prose-gray dark:prose-invert max-w-none prose-table:w-full prose-th:bg-gray-50 dark:prose-th:bg-gray-900 prose-th:p-3 prose-td:p-3 prose-table:border prose-th:border prose-td:border"
                  v-html="renderMarkdown(section.content)"
                />

                <!-- Tips -->
                <div v-if="section.tips && section.tips.length > 0" class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 class="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 小提示</h4>
                  <ul class="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li v-for="(tip, index) in section.tips" :key="index">
                      • {{ tip }}
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex items-center justify-between mt-8 gap-4">
            <NuxtLink
              v-if="prevGuide"
              :to="`/guide/${prevGuide.slug}`"
              class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <ArrowLeft :size="18" class="text-gray-400" />
              <div class="text-left">
                <div class="text-xs text-gray-500 dark:text-gray-400">上一篇</div>
                <div class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{{ prevGuide.title }}</div>
              </div>
            </NuxtLink>
            <div v-else></div>

            <NuxtLink
              v-if="nextGuide"
              :to="`/guide/${nextGuide.slug}`"
              class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              <div class="text-right">
                <div class="text-xs text-gray-500 dark:text-gray-400">下一篇</div>
                <div class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{{ nextGuide.title }}</div>
              </div>
              <ArrowRight :size="18" class="text-gray-400" />
            </NuxtLink>
          </div>

          <!-- Recommended Products -->
          <GuideRecommendedProducts :category-slug="guide?.categorySlug || ''" :limit="4" />

          <!-- CTA -->
          <div class="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-center">
            <h3 class="text-xl font-bold mb-2">準備好選購了嗎？</h3>
            <p class="text-blue-100 mb-4">比較各品牌規格與價格，找到最適合你的家電</p>
            <NuxtLink
              :to="`/${guide?.categorySlug}`"
              class="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              前往{{ getCategoryName(guide?.categorySlug || '') }}比較
              <ArrowRight :size="18" />
            </NuxtLink>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
  if (!content) return ''

  let html = content

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">$1</h2>')

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-5 space-y-1 my-4">$&</ul>')

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split('|').map((cell: string) => cell.trim())
    const isHeader = cells.every((cell: string) => /^[-:]+$/.test(cell))
    if (isHeader) return ''

    const cellTag = cells[0] === cells[0].toUpperCase() ? 'th' : 'td'
    const cellsHtml = cells.map((cell: string) => `<${cellTag} class="border border-gray-200 dark:border-gray-700 p-2">${cell}</${cellTag}>`).join('')
    return `<tr>${cellsHtml}</tr>`
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="w-full border-collapse my-4"><tbody>$&</tbody></table>')

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<') || !p.trim()) return p
    return `<p class="my-4 text-gray-700 dark:text-gray-300 leading-relaxed">${p}</p>`
  }).join('')

  return html
}

export default {
  methods: {
    renderMarkdown
  }
}
</script>
