<script setup lang="ts">
import { computed } from 'vue'
import { Check, X, Info, AlertTriangle, RotateCcw } from 'lucide-vue-next'
import { useToast } from '~/composables/useToast'

const { toasts, remove } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return Check
    case 'error': return X
    case 'warning': return AlertTriangle
    default: return Info
  }
}

const getColors = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    case 'warning': return 'bg-yellow-500'
    default: return 'bg-blue-500'
  }
}

const getProgressColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-300'
    case 'error': return 'bg-red-300'
    case 'warning': return 'bg-yellow-300'
    default: return 'bg-blue-300'
  }
}

const handleAction = (toast: any) => {
  if (toast.action?.onClick) {
    toast.action.onClick()
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto relative overflow-hidden rounded-xl shadow-lg backdrop-blur-sm min-w-[280px] max-w-[400px]',
            getColors(toast.type),
            'text-white'
          ]"
        >
          <!-- Content -->
          <div class="flex items-center gap-3 px-4 py-3">
            <component :is="getIcon(toast.type)" :size="20" class="flex-shrink-0" />
            <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>

            <!-- Action Button (e.g., Undo) -->
            <button
              v-if="toast.action"
              class="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              @click="handleAction(toast)"
            >
              <RotateCcw :size="12" />
              {{ toast.action.label }}
            </button>

            <!-- Close Button -->
            <button
              class="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
              @click="remove(toast.id)"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Progress Bar -->
          <div
            v-if="toast.duration > 0"
            class="absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear"
            :class="getProgressColor(toast.type)"
            :style="{ width: `${toast.progress || 0}%` }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100px) scale(0.9);
  }
}
</style>
