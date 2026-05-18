<script setup>
import { Star, Film } from 'lucide-vue-next'
import LazyImage from './LazyImage.vue'

const emit = defineEmits(['open-modal'])

defineProps({
  movie: {
    type: Object,
    required: true
  }
})

const getTypeLabel = (type) => {
  const labels = {
    movie: 'Фильм',
    cartoon: 'Мультфильм',
    tv: 'Сериал',
    anime: 'Аниме'
  }
  return labels[type] || 'Фильм'
}

const getTypeColor = (type) => {
  const colors = {
    movie: 'var(--accent-primary)',
    cartoon: 'var(--success)',
    tv: 'var(--accent-primary)',
    anime: 'var(--accent-secondary)'
  }
  return colors[type] || 'var(--accent-primary)'
}

const handleClick = (movie) => {
  emit('open-modal', movie)
}
</script>

<template>
  <div class="movie-card" @click="handleClick(movie)">
    <div class="poster-wrapper">
      <LazyImage
        v-if="movie.poster"
        :src="movie.poster"
        :alt="movie.title"
      />
      <div v-else class="poster-placeholder"><Film :size="48" /></div>
      <div class="type-badge" :style="{ background: getTypeColor(movie.type) }">
        {{ getTypeLabel(movie.type) }}
      </div>
      <div class="rating-badge">
        <Star :size="14" class="star-icon" />
        <span class="rating-value">{{ movie.rating }}</span>
      </div>
    </div>
    <div class="info">
      <h3 class="title">{{ movie.title }}</h3>
      <p class="meta">{{ movie.year }} · {{ movie.genre }}</p>
    </div>
  </div>
</template>



<style scoped>
.movie-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: linear-gradient(145deg, var(--bg-secondary), var(--bg-tertiary));
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.movie-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(230, 168, 85, 0.3);
}

.poster-wrapper {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2/3;
  background: var(--bg-tertiary);
}

.poster-wrapper > :deep(.lazy-image) {
  width: 100%;
  height: 100%;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 3rem;
  color: var(--text-secondary);
}

.type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.movie-card:hover .type-badge {
  transform: scale(1.05);
}

.rating-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 6px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.star {}

.rating-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.info {
  padding: 14px 16px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>