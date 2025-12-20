<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Share2, MessageCircle, Facebook, Link2, Check } from 'lucide-vue-next'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  url?: string
  title?: string
  description?: string
}>()

const { success } = useToast()
const copied = ref(false)
const supportsNativeShare = ref(false)

onMounted(() => {
  supportsNativeShare.value = typeof navigator !== 'undefined' && !!navigator.share
})

const shareUrl = computed(() => {
  if (typeof window === 'undefined') return props.url || ''
  return props.url || window.location.href
})

const shareTitle = computed(() => {
  return props.title || document.title
})

const shareToLine = () => {
  const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=600,height=500')
}

const shareToFacebook = () => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=600,height=500')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    success('已複製連結！')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const nativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle.value,
        text: props.description,
        url: shareUrl.value,
      })
    } catch (e) {
      // User cancelled
    }
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- LINE -->
    <button
      class="flex items-center justify-center w-10 h-10 rounded-full bg-[#00B900] hover:bg-[#00a000] text-white transition-all hover:scale-110 shadow-md"
      title="分享到 LINE"
      @click="shareToLine"
    >
      <MessageCircle :size="20" />
    </button>

    <!-- Facebook -->
    <button
      class="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all hover:scale-110 shadow-md"
      title="分享到 Facebook"
      @click="shareToFacebook"
    >
      <Facebook :size="20" />
    </button>

    <!-- Copy Link -->
    <button
      class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-all hover:scale-110 shadow-md"
      :class="{ 'bg-green-500 hover:bg-green-600': copied }"
      title="複製連結"
      @click="copyLink"
    >
      <Check v-if="copied" :size="20" />
      <Link2 v-else :size="20" />
    </button>

    <!-- Native Share (if supported) -->
    <button
      v-if="supportsNativeShare"
      class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-110 shadow-md"
      title="更多分享選項"
      @click="nativeShare"
    >
      <Share2 :size="20" />
    </button>
  </div>
</template>
