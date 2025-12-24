<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  alt: string
  class?: string
  aspectRatio?: string
  width?: number
  height?: number
  // SEO 改進: 響應式圖片和載入優先級
  sizes?: string
  fetchpriority?: 'high' | 'low' | 'auto'
  // 是否為首屏圖片 (LCP 優化)
  priority?: boolean
}>(), {
  aspectRatio: 'aspect-square',
  width: 300,
  height: 300,
  sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px',
  fetchpriority: 'auto',
  priority: false,
})

// 根據原始圖片 URL 生成不同尺寸的 srcset
// MOMO 圖片支援調整尺寸參數
const srcset = computed(() => {
  if (!props.src) return ''

  // 如果是 MOMO 圖片，可以透過 URL 參數調整尺寸
  // 格式: https://i.momo.com.tw/xxx.jpg
  const sizes = [150, 300, 450, 600]

  // 對於一般圖片，返回原始尺寸
  // 未來可以接入圖片 CDN 進行動態調整
  return sizes
    .map(size => `${props.src} ${size}w`)
    .join(', ')
})

// 首屏圖片不使用 lazy loading
const loadingStrategy = computed(() => props.priority ? 'eager' : 'lazy')
const priorityValue = computed(() => props.priority ? 'high' : props.fetchpriority)

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
      :srcset="srcset"
      :sizes="sizes"
      :class="[
        'w-full h-full object-cover transition-all duration-700 ease-out',
        isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm',
        props.class
      ]"
      :loading="loadingStrategy"
      :fetchpriority="priorityValue"
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
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite, pulse-blur 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse-blur {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* Blur transition utility */
.blur-0 {
  filter: blur(0);
}

.blur-sm {
  filter: blur(4px);
}
</style>
