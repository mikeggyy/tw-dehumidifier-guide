<script setup lang="ts">
import { ref } from 'vue'
import { Share2, Link, Check } from 'lucide-vue-next'
import { useShareableCompare } from '~/composables/useShareableCompare'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  productIds: string[]
  categorySlug: string
}>()

const { copyShareLink, shareToFacebook, shareToLine, shareToTwitter } = useShareableCompare()
const toast = useToast()

const showDropdown = ref(false)
const copied = ref(false)

const handleCopyLink = async () => {
  const success = await copyShareLink(props.productIds, props.categorySlug)
  if (success) {
    copied.value = true
    toast.success('已複製連結到剪貼簿')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } else {
    toast.error('複製失敗，請手動複製')
  }
  showDropdown.value = false
}

const handleShareFacebook = () => {
  shareToFacebook(props.productIds, props.categorySlug)
  showDropdown.value = false
}

const handleShareLine = () => {
  shareToLine(props.productIds, props.categorySlug)
  showDropdown.value = false
}

const handleShareTwitter = () => {
  shareToTwitter(props.productIds, props.categorySlug)
  showDropdown.value = false
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// Close dropdown when clicking outside
const closeDropdown = () => {
  showDropdown.value = false
}
</script>

<template>
  <div class="relative" @mouseleave="closeDropdown">
    <!-- Share Button -->
    <button
      class="flex items-center gap-2 px-3 py-1.5 text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      @click="toggleDropdown"
    >
      <Share2 :size="16" />
      <span class="hidden sm:inline">分享比較</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown"
        class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        <!-- Copy Link -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="handleCopyLink"
        >
          <component :is="copied ? Check : Link" :size="18" :class="copied ? 'text-green-500' : 'text-gray-400'" />
          <span>{{ copied ? '已複製！' : '複製連結' }}</span>
        </button>

        <div class="border-t border-gray-100 dark:border-gray-700" />

        <!-- Facebook -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="handleShareFacebook"
        >
          <svg class="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>

        <!-- LINE -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="handleShareLine"
        >
          <svg class="w-5 h-5 text-[#00B900]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          <span>LINE</span>
        </button>

        <!-- Twitter/X -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="handleShareTwitter"
        >
          <svg class="w-5 h-5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>Twitter/X</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
