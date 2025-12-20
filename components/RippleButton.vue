<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  color?: string
  disabled?: boolean
}>(), {
  color: 'rgba(255, 255, 255, 0.4)',
  disabled: false
})

const buttonRef = ref<HTMLElement | null>(null)
const ripples = ref<{ id: number; x: number; y: number; size: number }[]>([])
let rippleId = 0

const createRipple = (e: MouseEvent) => {
  if (props.disabled || !buttonRef.value) return

  const rect = buttonRef.value.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2

  const id = ++rippleId
  ripples.value.push({ id, x, y, size })

  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
}
</script>

<template>
  <button
    ref="buttonRef"
    class="relative overflow-hidden"
    :disabled="disabled"
    @mousedown="createRipple"
  >
    <slot />
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="absolute rounded-full pointer-events-none animate-ripple"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
        backgroundColor: color
      }"
    />
  </button>
</template>

<style scoped>
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s ease-out forwards;
}
</style>
