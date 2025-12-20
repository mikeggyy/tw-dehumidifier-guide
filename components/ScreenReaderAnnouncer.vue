<script setup lang="ts">
import { useAccessibility } from '~/composables/useAccessibility'

const { announcements } = useAccessibility()
</script>

<template>
  <!-- Polite announcements -->
  <div
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  >
    <p v-for="(message, index) in announcements" :key="index">
      {{ message }}
    </p>
  </div>

  <!-- Assertive announcements for critical updates -->
  <div
    aria-live="assertive"
    aria-atomic="true"
    class="sr-only"
    role="alert"
  />
</template>
