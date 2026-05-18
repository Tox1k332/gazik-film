<script setup>
defineProps({
  count: { type: Number, default: 8 },
  height: { type: String, default: '400px' }
})
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="n in count" :key="n" class="skeleton-card">
      <div class="skeleton-poster shimmer"></div>
      <div class="skeleton-info">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-meta shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.skeleton-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-poster {
  aspect-ratio: 2/3;
  width: 100%;
}

.skeleton-info {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 20px;
  width: 80%;
  border-radius: 4px;
}

.skeleton-meta {
  height: 14px;
  width: 50%;
  border-radius: 4px;
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
</style>