<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

const pageNumbers = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const pages: number[] = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 3) {
    pages.push(1, 2, 3, 4, 5)
  } else if (current >= total - 2) {
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    for (let i = current - 2; i <= current + 2; i++) pages.push(i)
  }

  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div v-if="totalPages > 1">
    <nav
      class="flex items-center justify-center gap-2 mt-8"
      role="navigation"
      aria-label="分頁導覽"
    >
      <button
        class="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage === 1"
        aria-label="上一頁"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft :size="20" class="text-gray-600" aria-hidden="true" />
      </button>

      <template v-if="pageNumbers[0] > 1">
        <button
          class="w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
          aria-label="第 1 頁"
          @click="goToPage(1)"
        >
          1
        </button>
        <span v-if="pageNumbers[0] > 2" class="text-gray-400" aria-hidden="true">...</span>
      </template>

      <button
        v-for="page in pageNumbers"
        :key="page"
        :class="[
          'w-10 h-10 rounded-lg border font-medium',
          page === currentPage
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
        ]"
        :aria-label="`第 ${page} 頁`"
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <template v-if="pageNumbers[pageNumbers.length - 1] < totalPages">
        <span v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1" class="text-gray-400" aria-hidden="true">...</span>
        <button
          class="w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium"
          :aria-label="`第 ${totalPages} 頁`"
          @click="goToPage(totalPages)"
        >
          {{ totalPages }}
        </button>
      </template>

      <button
        class="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage === totalPages"
        aria-label="下一頁"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRight :size="20" class="text-gray-600" aria-hidden="true" />
      </button>
    </nav>

    <div class="text-center text-sm text-gray-500 mt-4" aria-live="polite">
      第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
    </div>
  </div>
</template>
