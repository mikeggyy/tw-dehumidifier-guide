<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Share2, MessageCircle, Facebook, Link2, Check, Send } from 'lucide-vue-next'
import { useToast } from '~/composables/useToast'
import { logger } from '~/utils/logger'

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

const shareToWhatsApp = () => {
  const text = `${shareTitle.value}\n${shareUrl.value}`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

const shareToTelegram = () => {
  const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl.value)}&text=${encodeURIComponent(shareTitle.value)}`
  window.open(url, '_blank')
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
    logger.error('Failed to copy:', e)
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

    <!-- WhatsApp -->
    <button
      class="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all hover:scale-110 shadow-md"
      title="分享到 WhatsApp"
      @click="shareToWhatsApp"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </button>

    <!-- Telegram -->
    <button
      class="flex items-center justify-center w-10 h-10 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all hover:scale-110 shadow-md"
      title="分享到 Telegram"
      @click="shareToTelegram"
    >
      <Send :size="20" />
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
