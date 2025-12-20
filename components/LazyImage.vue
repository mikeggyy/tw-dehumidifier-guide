<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  alt: string
  class?: string
  aspectRatio?: string
  blurPlaceholder?: boolean
}>(), {
  aspectRatio: 'aspect-square',
  blurPlaceholder: true,
})

const isLoaded = ref(false)
const hasError = ref(false)
const imageRef = ref<HTMLImageElement | null>(null)
const thumbnailLoaded = ref(false)

// Generate a tiny placeholder color based on the image URL
const placeholderColor = computed(() => {
  let hash = 0
  for (let i = 0; i < props.src.length; i++) {
    hash = props.src.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 25%, 92%)`
})

// Generate gradient placeholder based on URL hash
const placeholderGradient = computed(() => {
  let hash = 0
  for (let i = 0; i < props.src.length; i++) {
    hash = props.src.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = hash % 360
  const hue2 = (hash * 2) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 20%, 90%) 0%, hsl(${hue2}, 25%, 85%) 100%)`
})

// Create tiny thumbnail URL (if CDN supports it)
const thumbnailSrc = computed(() => {
  // For momo images, we can't resize on the fly
  // Return original src - blur effect will be CSS only
  return props.src
})

const onLoad = () => {
  isLoaded.value = true
}

const onError = () => {
  hasError.value = true
}

const onThumbnailLoad = () => {
  thumbnailLoaded.value = true
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
    <!-- Blur placeholder using tiny version -->
    <img
      v-if="blurPlaceholder && !isLoaded && !hasError"
      :src="thumbnailSrc"
      :alt="alt"
      class="absolute inset-0 w-full h-full object-cover blur-placeholder"
      loading="eager"
      @load="onThumbnailLoad"
    />

    <!-- Shimmer overlay -->
    <div
      v-if="!isLoaded && !hasError"
      class="absolute inset-0 shimmer"
    />

    <!-- Actual image -->
    <img
      ref="imageRef"
      :src="src"
      :alt="alt"
      :class="[
        'w-full h-full object-cover transition-all duration-700 ease-out',
        isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm',
        props.class
      ]"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    />

    <!-- Error state -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.blur-placeholder {
  filter: blur(20px);
  transform: scale(1.1);
  opacity: 0.8;
}

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
