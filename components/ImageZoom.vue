<script setup lang="ts">
import { ref, computed } from 'vue'
import { ZoomIn, ZoomOut, X } from 'lucide-vue-next'

const props = defineProps<{
  src: string
  alt: string
}>()

const isZoomed = ref(false)
const zoomLevel = ref(1)
const position = ref({ x: 50, y: 50 })

const handleMouseMove = (e: MouseEvent) => {
  if (!isZoomed.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  position.value = {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100
  }
}

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value
  if (!isZoomed.value) {
    zoomLevel.value = 1
    position.value = { x: 50, y: 50 }
  }
}

const increaseZoom = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.5
  }
}

const decreaseZoom = () => {
  if (zoomLevel.value > 1) {
    zoomLevel.value -= 0.5
  }
}

const transformStyle = computed(() => {
  if (!isZoomed.value) return {}
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: `${position.value.x}% ${position.value.y}%`
  }
})
</script>

<template>
  <div class="relative group">
    <!-- Main image container -->
    <div
      class="relative overflow-hidden rounded-lg cursor-zoom-in bg-gray-100"
      :class="{ 'cursor-zoom-out': isZoomed }"
      @click="toggleZoom"
      @mousemove="handleMouseMove"
      @mouseleave="isZoomed && (position = { x: 50, y: 50 })"
    >
      <img
        :src="src"
        :alt="alt"
        class="w-full h-full object-cover transition-transform duration-200"
        :style="transformStyle"
      />

      <!-- Zoom hint -->
      <div
        v-if="!isZoomed"
        class="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
      >
        <ZoomIn :size="14" />
        點擊放大
      </div>
    </div>

    <!-- Zoom controls (when zoomed) -->
    <Transition name="fade">
      <div
        v-if="isZoomed"
        class="absolute top-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-1"
      >
        <button
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          :disabled="zoomLevel <= 1"
          :class="{ 'opacity-50 cursor-not-allowed': zoomLevel <= 1 }"
          @click.stop="decreaseZoom"
        >
          <ZoomOut :size="18" />
        </button>
        <span class="text-sm font-medium px-2">{{ Math.round(zoomLevel * 100) }}%</span>
        <button
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          :disabled="zoomLevel >= 3"
          :class="{ 'opacity-50 cursor-not-allowed': zoomLevel >= 3 }"
          @click.stop="increaseZoom"
        >
          <ZoomIn :size="18" />
        </button>
        <button
          class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          @click.stop="toggleZoom"
        >
          <X :size="18" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
