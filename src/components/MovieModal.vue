<template>
  <div class="overlay" @click.self="close">
    <div class="modal" ref="modalRef" tabindex="-1">
<button class="close-btn" @click="close" aria-label="Закрыть">
           <X />
         </button>

      <div class="modal-body">
        <div class="poster-section">
          <div class="poster-wrapper">
            <img
              v-if="movie.poster"
              :src="movie.poster"
              :alt="movie.title"
              class="poster"
              crossorigin="anonymous"
            />
            <div v-else class="poster-placeholder"><FilmIcon :size="48" /></div>
            <span class="type-badge" :style="{ background: typeColor }">
              {{ typeLabel }}
            </span>
            <div class="poster-overlay"></div>
          </div>
          <div class="poster-meta">
            <div class="meta-tags">
              <span class="tag" :style="{ background: typeColor + '22', color: typeColor }">
                {{ typeLabel }}
              </span>
<span class="tag" v-if="movie.genre">
                 {{ movie.genre }}
               </span>
               <span class="tag year-tag">
                 <Calendar :size="12" /> {{ movie.year }}
               </span>
            </div>
            <div class="poster-footer">
              <span class="rating-compact">
                <Star :size="14" class="star-icon" />
                <span class="rating-value">{{ movie.rating }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="details-section">
          <div class="details-header">
            <h2 class="title">{{ movie.title }}</h2>
            <p class="original-title">{{ movie.originalTitle }}</p>
            <span class="genre-tag" :style="genreTagStyle">{{ typeLabel }}</span>
          </div>

          <p class="overview" v-if="movie.overview">{{ movie.overview }}</p>
<p class="overview-placeholder" v-else>Описание недоступно.</p>

          <button class="navigate-btn" @click="goToMovie">
            <ArrowRight :size="16" />
            Перейти на страницу фильма
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { X, ArrowRight, Film as FilmIcon, Star, Calendar } from 'lucide-vue-next'

const props = defineProps({
  movie: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const modalRef = ref(null)
const router = useRouter()

const close = () => emit('close')

const goToMovie = () => {
  const typeMap = {
    movie: '/movie',
    cartoon: '/cartoon',
    tv: '/tv',
    anime: '/anime'
  }
  const path = typeMap[props.movie.type] || '/movie'
  router.push(`${path}/${props.movie.id}`)
}

const typeLabels = { movie: 'Фильм', cartoon: 'Мультфильм', tv: 'Сериал', anime: 'Аниме' }
const typeColorMap = { movie: '#e6a855', cartoon: '#4ade80', tv: '#e6a855', anime: '#7c5cff' }

const typeLabel = computed(() => typeLabels[props.movie.type] || 'Фильм')
const typeColor = computed(() => typeColorMap[props.movie.type] || '#e6a855')

const genreTagStyle = computed(() => {
   const color = typeColorMap[props.movie.type] || '#e6a855'
   return {
     color: color,
     background: color + '1a'
   }
 })

 const handleKeydown = (e) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  nextTick(() => modalRef.value?.focus())
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* ===== Overlay ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== Modal ===== */
.modal {
  background: linear-gradient(160deg, #1a1a24 0%, #14141e 100%);
  border-radius: 20px;
  max-width: 960px;
  width: 100%;
  max-height: 92vh;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 60px 120px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  animation: modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal:focus {
  outline: none;
}

/* ===== Scrollbar ===== */
.modal-body {
  display: flex;
  gap: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #2a2a38 transparent;
  flex: 1;
  min-height: 0;
}

.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-track { background: transparent; }
.modal-body::-webkit-scrollbar-thumb {
  background: #2a2a38;
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb:hover { background: #3a3a4a; }

/* ===== Poster Section ===== */
.poster-section {
  flex: 0 0 320px;
  min-width: 0;
  background: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  position: relative;
}

.poster-section::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent);
}

.poster-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-tertiary);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.poster-wrapper:hover .poster {
  transform: scale(1.05);
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 3.5rem;
  color: var(--text-secondary);
  opacity: 0.5;
}

.type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.poster-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to top, var(--bg-primary) 0%, transparent 100%);
  pointer-events: none;
}

.poster-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  letter-spacing: 0.3px;
}

.year-tag {
  color: var(--text-secondary);
  opacity: 0.8;
}

.poster-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.rating-compact {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(230, 168, 85, 0.15);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(230, 168, 85, 0.2);
}

.star { color: var(--accent-primary); font-size: 1rem; }
.rating-value { font-weight: 700; color: var(--accent-primary); font-size: 0.9rem; }

/* ===== Details Section ===== */
.details-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 28px 28px 24px;
  min-width: 0;
  gap: 12px;
}

.details-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
  margin: 0;
  letter-spacing: -0.02em;
}

.original-title {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
  opacity: 0.8;
  letter-spacing: 0.3px;
}

.genre-tag {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: 0.3px;
}

.overview {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #cccdd4;
  text-align: justify;
  margin: 0;
  flex-shrink: 0;
}

.overview-placeholder {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  margin: 0;
  font-style: italic;
  opacity: 0.7;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  margin: 16px 0;
  flex-shrink: 0;
}

/* ===== Close Button ===== */
.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-secondary);
  cursor: pointer;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  z-index: 10;
  font-size: 1.15rem;
  line-height: 1;
}
.close-btn:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #0f0f14;
  box-shadow: 0 0 24px rgba(230,168,85,0.35);
  transform: rotate(90deg);
}


/* ===== Navigate Button ===== */
.navigate-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent-primary);
  color: #0f0f14;
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  letter-spacing: 0.3px;
  margin-top: 16px;
}
.navigate-btn:hover {
  filter: brightness(1.12);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230,168,85,0.3);
}
.navigate-btn:active { transform: translateY(0); }


/* ===== Mobile ===== */
@media (max-width: 768px) {
  .overlay { padding: 10px; align-items: flex-start; padding-top: 10px; }
  .modal { max-height: 96vh; border-radius: 16px; }
  .modal-body { flex-direction: column; padding: 0; }
  .poster-section { flex: 0 0 auto; padding: 20px 20px 16px; }
  .poster-section::after { display: none; }
  .poster-wrapper { max-width: 240px; margin: 0 auto; aspect-ratio: 2/3; border-radius: 12px; }
  .poster-meta { justify-content: center; padding: 8px 16px; margin-top: 12px; }
  .details-section { padding: 0 20px 24px; gap: 10px; }
  .title { font-size: 1.35rem; }
  .original-title { font-size: 0.9rem; }
  .overview { font-size: 0.9rem; }
  .comments-list { max-height: 200px; }
  .btn-send { align-self: stretch; }
}

@media (max-width: 480px) {
  .overlay { padding: 6px; }
  .poster-wrapper { max-width: 180px; }
  .title { font-size: 1.15rem; }
  .details-section { padding: 0 14px 18px; }
}
</style>