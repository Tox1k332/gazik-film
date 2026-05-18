<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  aspectRatio: { type: String, default: '2/3' },
  objectFit: { type: String, default: 'cover' }
})

const containerRef = ref(null)
const isVisible = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)

let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer?.disconnect()
        }
      })
    },
    { rootMargin: '100px', threshold: 0.01 }
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

function onLoad() {
  isLoaded.value = true
}

function onError() {
  hasError.value = true
  isLoaded.value = true
}
</script>

<template>
  <div ref="containerRef" class="lazy-image" :style="{ aspectRatio }">
    <div v-if="!isLoaded" class="placeholder shimmer"></div>
    <img
      v-if="isVisible && !hasError"
      :src="src"
      :alt="alt"
      :class="{ loaded: isLoaded }"
      :style="{ objectFit }"
      @load="onLoad"
      @error="onError"
    />
    <div v-if="hasError" class="error-placeholder">
      <span>?</span>
    </div>
  </div>
</template>

<style scoped>
.lazy-image {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.placeholder {
  position: absolute;
  inset: 0;
}

.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 2rem;
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.lazy-image img {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.lazy-image img.loaded {
  opacity: 1;
}
</style>