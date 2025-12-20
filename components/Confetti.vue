<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  particleCount?: number
  duration?: number
  colors?: string[]
}>(), {
  particleCount: 50,
  duration: 3000,
  colors: () => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe']
})

const particles = ref<{
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
  velocityX: number
  velocityY: number
  rotationSpeed: number
  shape: 'square' | 'circle' | 'triangle'
}[]>([])

const isActive = ref(false)

const trigger = () => {
  if (isActive.value) return
  isActive.value = true
  particles.value = []

  for (let i = 0; i < props.particleCount; i++) {
    particles.value.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50,
      color: props.colors[Math.floor(Math.random() * props.colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      velocityX: (Math.random() - 0.5) * 15,
      velocityY: -10 - Math.random() * 10,
      rotationSpeed: (Math.random() - 0.5) * 20,
      shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle'
    })
  }

  setTimeout(() => {
    isActive.value = false
    particles.value = []
  }, props.duration)
}

defineExpose({ trigger })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isActive"
      class="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
    >
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="absolute confetti-particle"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          backgroundColor: particle.shape !== 'triangle' ? particle.color : 'transparent',
          borderLeft: particle.shape === 'triangle' ? '5px solid transparent' : undefined,
          borderRight: particle.shape === 'triangle' ? '5px solid transparent' : undefined,
          borderBottom: particle.shape === 'triangle' ? `10px solid ${particle.color}` : undefined,
          borderRadius: particle.shape === 'circle' ? '50%' : '2px',
          width: particle.shape !== 'triangle' ? '10px' : '0',
          height: particle.shape !== 'triangle' ? '10px' : '0',
          transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
          '--vx': particle.velocityX,
          '--vy': particle.velocityY,
          '--rs': particle.rotationSpeed,
          animationDuration: `${duration}ms`
        }"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.confetti-particle {
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(calc(var(--vx) * 30px)) translateY(calc(var(--vy) * -50px + 100vh)) rotate(calc(var(--rs) * 20deg));
  }
}
</style>
