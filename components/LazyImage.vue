<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  alt: string
  class?: string
  aspectRatio?: string
  width?: number
  height?: number
}>(), {
  aspectRatio: 'aspect-square',
  width: 300,
  height: 300,
})

const isLoaded = ref(false)
const hasError = ref(false)
const imageRef = ref<HTMLImageElement | null>(null)

// Generate gradient placeholder based on URL hash (純 CSS，不載入額外圖片)
const placeholderGradient = computed(() => {
  let hash = 0
  for (let i = 0; i < props.src.length; i++) {
    hash = props.src.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = hash % 360
  const hue2 = (hash * 2) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 20%, 90%) 0%, hsl(${hue2}, 25%, 85%) 100%)`
})

const onLoad = () => {
  isLoaded.value = true
}

const onError = () => {
  hasError.value = true
}

onMounted(() => {
  // Check if image is already cached
  if (imageRef.value?.complete && imageRef.value?.naturalHeight !== 0) {
    isLoaded.value = true
  }
})
</script>

<template>
  <div
    :class="['relative overflow-hidden bg-gray-100 dark:bg-gray-800', aspectRatio]"
    :style="{ background: placeholderGradient }"
  >
    <!-- Shimmer overlay (純 CSS 動畫，不載入額外圖片) -->
    <div
      v-if="!isLoaded && !hasError"
      class="absolute inset-0 shimmer"
      aria-hidden="true"
    />

    <!-- Actual image with width/height for CLS prevention -->
    <img
      ref="imageRef"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :class="[
        'w-full h-full object-cover transition-all duration-500 ease-out',
        isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
        props.class
      ]"
      loading="lazy"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />

    <!-- Error state -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
      role="img"
      :aria-label="`圖片載入失敗: ${alt}`"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
