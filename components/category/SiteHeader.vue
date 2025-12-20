<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronRight,
  ChevronDown,
  Home,
  Droplets,
  Wind,
  Snowflake,
  Flame,
  Fan,
} from 'lucide-vue-next'

const props = defineProps<{
  categorySlug: string
  categoryName: string
}>()

// 品類圖示對應
const categoryIcons: Record<string, any> = {
  dehumidifier: Droplets,
  'air-purifier': Wind,
  'air-conditioner': Snowflake,
  heater: Flame,
  fan: Fan,
}

const CategoryIcon = computed(() => categoryIcons[props.categorySlug] || Droplets)

// 品類導覽列表
const allCategories = [
  { slug: 'dehumidifier', name: '除濕機', icon: Droplets, isActive: true },
  { slug: 'air-purifier', name: '空氣清淨機', icon: Wind, isActive: true },
  { slug: 'air-conditioner', name: '冷氣', icon: Snowflake, isActive: true },
  { slug: 'heater', name: '電暖器', icon: Flame, isActive: true },
  { slug: 'fan', name: '電風扇', icon: Fan, isActive: true },
]

// 品類選擇器下拉狀態
const showCategoryDropdown = ref(false)
</script>

<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/favicon.svg" alt="比比看" class="w-8 h-8" />
          <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">比比看</span>
        </NuxtLink>

        <!-- Category Selector (Desktop) -->
        <div class="hidden sm:flex items-center gap-1">
          <NuxtLink
            to="/"
            class="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Home :size="16" />
            <span class="text-sm">全部品類</span>
          </NuxtLink>
          <ChevronRight :size="16" class="text-gray-300" />
          <!-- Current Category Dropdown -->
          <div class="relative">
            <button
              class="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm"
              @click="showCategoryDropdown = !showCategoryDropdown"
            >
              <component :is="CategoryIcon" :size="16" />
              {{ categoryName }}
              <ChevronDown :size="16" :class="['transition-transform', showCategoryDropdown ? 'rotate-180' : '']" />
            </button>
            <!-- Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="showCategoryDropdown"
                class="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                @mouseleave="showCategoryDropdown = false"
              >
                <NuxtLink
                  v-for="cat in allCategories"
                  :key="cat.slug"
                  :to="cat.isActive ? `/${cat.slug}` : '#'"
                  :class="[
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    cat.slug === categorySlug
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : cat.isActive
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="showCategoryDropdown = false"
                >
                  <component :is="cat.icon" :size="18" />
                  {{ cat.name }}
                  <span v-if="!cat.isActive" class="ml-auto text-xs text-gray-400">敬請期待</span>
                </NuxtLink>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Mobile: Back to Home -->
        <NuxtLink
          to="/"
          class="sm:hidden flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-blue-600"
        >
          <Home :size="18" />
          <span class="text-sm">品類</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
