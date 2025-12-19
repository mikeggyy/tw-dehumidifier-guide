<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  alt: string
  class?: string
  aspectRatio?: string
}>(), {
  aspectRatio: 'aspect-square'
})

const isLoaded = ref(false)
const hasError = ref(false)
const imageRef = ref<HTMLImageElement | null>(null)

// Generate a tiny placeholder color based on the image URL
const placeholderColor = computed(() => {
  let hash = 0
  for (let i = 0; i < props.src.length; i++) {
    hash = props.src.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 20%, 90%)`
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
    :class="['relative overflow-hidden bg-gray-100', aspectRatio]"
    :style="{ backgroundColor: placeholderColor }"
  >
    <!-- Shimmer placeholder -->
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
        'w-full h-full object-cover transition-all duration-500',
        isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
        props.class
      ]"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    />

    <!-- Error state -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
