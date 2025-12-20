<script setup lang="ts">
import ToastContainer from '~/components/ToastContainer.vue'
import KeyboardShortcutsHelp from '~/components/KeyboardShortcutsHelp.vue'
import SkipLink from '~/components/SkipLink.vue'
import ScreenReaderAnnouncer from '~/components/ScreenReaderAnnouncer.vue'
import PWAInstallPrompt from '~/components/PWAInstallPrompt.vue'
import OfflineIndicator from '~/components/OfflineIndicator.vue'
import { useDarkMode } from '~/composables/useDarkMode'
import { usePWA } from '~/composables/usePWA'

// Initialize dark mode
useDarkMode()

// Initialize PWA (registers service worker)
usePWA()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Offline indicator -->
    <OfflineIndicator />

    <!-- Accessibility: Skip link for keyboard users -->
    <SkipLink />

    <!-- Accessibility: Screen reader announcements -->
    <ScreenReaderAnnouncer />

    <NuxtPage />
    <ToastContainer />
    <KeyboardShortcutsHelp />
    <PWAInstallPrompt />
  </div>
</template>

<style>
/* Dark mode base styles */
.dark {
  color-scheme: dark;
}

.dark body {
  background-color: #111827;
  color: #f9fafb;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* Layout transitions */
.layout-enter-active,
.layout-leave-active {
  transition: all 0.25s ease;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}

/* Filter animation for product grid */
.product-grid-enter-active,
.product-grid-leave-active {
  transition: all 0.3s ease;
}

.product-grid-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.product-grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.product-grid-move {
  transition: transform 0.3s ease;
}

/* Staggered animation for cards */
.stagger-enter-active {
  transition: all 0.4s ease;
}

.stagger-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
