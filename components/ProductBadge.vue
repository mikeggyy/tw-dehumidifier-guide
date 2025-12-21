<script setup lang="ts">
import type { ProductBadge } from '~/composables/useProductBadges'

defineProps<{
  badge: ProductBadge
}>()
</script>

<template>
  <span
    :class="[
      badge.bgClass,
      'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-white rounded-full shadow-sm',
      badge.animate ? 'animate-pulse-badge' : ''
    ]"
  >
    <span>{{ badge.icon }}</span>
    <span>{{ badge.label }}</span>
  </span>
</template>

<style scoped>
@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}
.animate-pulse-badge {
  animation: pulse-badge 2s ease-in-out infinite;
}
</style>
