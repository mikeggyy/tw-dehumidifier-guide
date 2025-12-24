<script setup lang="ts">
import { computed } from 'vue'
import ToastContainer from '~/components/ToastContainer.vue'
import KeyboardShortcutsHelp from '~/components/KeyboardShortcutsHelp.vue'
import SkipLink from '~/components/SkipLink.vue'
import ScreenReaderAnnouncer from '~/components/ScreenReaderAnnouncer.vue'
import PWAInstallPrompt from '~/components/PWAInstallPrompt.vue'
import OfflineIndicator from '~/components/OfflineIndicator.vue'
import CookieConsent from '~/components/CookieConsent.vue'
import BackToTop from '~/components/BackToTop.vue'
import PageLoadingBar from '~/components/PageLoadingBar.vue'
import { useDarkMode } from '~/composables/useDarkMode'
import { usePWA } from '~/composables/usePWA'
import { useRuntimeConfig, useHead } from '#imports'

// Initialize dark mode
useDarkMode()

// Initialize PWA (registers service worker)
usePWA()

// SEO: Google Search Console 驗證碼 (可選)
const config = useRuntimeConfig()
const googleVerification = computed(() => config.public.googleSiteVerification as string)

useHead({
  meta: computed(() => {
    const metas: Array<{ name: string; content: string }> = []
    if (googleVerification.value) {
      metas.push({
        name: 'google-site-verification',
        content: googleVerification.value,
      })
    }
    return metas
  }),
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Page Loading Bar -->
    <ClientOnly>
      <PageLoadingBar />
    </ClientOnly>

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
    <CookieConsent />
    <ClientOnly>
      <BackToTop />
    </ClientOnly>
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

/* ========================================
   Keyboard Focus Indicator (Accessibility)
   ======================================== */

/* Remove default outline for mouse users */
*:focus {
  outline: none;
}

/* Show focus ring only for keyboard users (focus-visible) */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Dark mode focus ring */
.dark *:focus-visible {
  outline-color: #60a5fa;
}

/* Special styling for buttons and interactive elements */
button:focus-visible,
a:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.dark button:focus-visible,
.dark a:focus-visible,
.dark [role="button"]:focus-visible,
.dark input:focus-visible,
.dark select:focus-visible,
.dark textarea:focus-visible {
  outline-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2);
}

/* Rounded focus for pill-shaped elements */
.rounded-full:focus-visible {
  border-radius: 9999px;
}

/* Card focus styling */
.group\/card:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 0;
}
</style>
