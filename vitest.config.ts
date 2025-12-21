import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['utils/**/*.ts', 'composables/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '#imports': resolve(__dirname, './.nuxt/imports.d.ts'),
    },
  },
})
