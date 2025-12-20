<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Keyboard, X } from 'lucide-vue-next'

const isOpen = ref(false)

const shortcuts = [
  { keys: ['J'], description: '向下滾動' },
  { keys: ['K'], description: '向上滾動' },
  { keys: ['G'], description: '回到頂部' },
  { keys: ['Shift', 'G'], description: '到底部' },
  { keys: ['/'], description: '搜尋' },
  { keys: ['F'], description: '開啟篩選' },
  { keys: ['H'], description: '回首頁' },
  { keys: ['←'], description: '上一個商品' },
  { keys: ['→'], description: '下一個商品' },
  { keys: ['S'], description: '分享' },
  { keys: ['Backspace'], description: '返回上頁' },
  { keys: ['?'], description: '顯示此說明' },
]

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === '?' && e.shiftKey) {
    e.preventDefault()
    isOpen.value = !isOpen.value
  }
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Modal (按 ? 開啟) -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="isOpen = false"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <!-- Modal Content -->
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Keyboard :size="20" class="text-blue-500" />
              鍵盤快捷鍵
            </h2>
            <button
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="isOpen = false"
            >
              <X :size="20" class="text-gray-500" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 overflow-y-auto max-h-[60vh]">
            <div class="space-y-2">
              <div
                v-for="shortcut in shortcuts"
                :key="shortcut.description"
                class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span class="text-gray-600 dark:text-gray-300">{{ shortcut.description }}</span>
                <div class="flex items-center gap-1">
                  <kbd
                    v-for="key in shortcut.keys"
                    :key="key"
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-mono rounded border border-gray-200 dark:border-gray-500"
                  >
                    {{ key }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
              按 <kbd class="px-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd> 或點擊外部關閉
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
