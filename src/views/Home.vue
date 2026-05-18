<template>
  <div class="home">
    <!-- Динамический фон -->
    <div class="dynamic-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="gradient-orb orb-4"></div>
    </div>

    <!-- Частицы -->
    <div class="particles" aria-hidden="true">
      <span class="particle" style="--dx: -40px; --dy: -60px; --dur: 6s; --delay: 0s; --size: 4px;"></span>
      <span class="particle" style="--dx: 60px; --dy: -80px; --dur: 8s; --delay: 1s; --size: 3px;"></span>
      <span class="particle" style="--dx: -80px; --dy: 40px; --dur: 7s; --delay: 0.5s; --size: 5px;"></span>
      <span class="particle" style="--dx: 30px; --dy: 70px; --dur: 5s; --delay: 2s; --size: 3px;"></span>
      <span class="particle" style="--dx: -60px; --dy: -30px; --dur: 9s; --delay: 1.5s; --size: 4px;"></span>
      <span class="particle" style="--dx: 80px; --dy: 20px; --dur: 6.5s; --delay: 0.8s; --size: 3px;"></span>
      <span class="particle" style="--dx: -20px; --dy: -90px; --dur: 7.5s; --delay: 2.5s; --size: 5px;"></span>
      <span class="particle" style="--dx: 50px; --dy: 50px; --dur: 8.5s; --delay: 3s; --size: 4px;"></span>
      <span class="particle" style="--dx: -70px; --dy: 60px; --dur: 6.2s; --delay: 1.2s; --size: 3px;"></span>
      <span class="particle" style="--dx: 90px; --dy: -40px; --dur: 5.8s; --delay: 0.3s; --size: 4px;"></span>
      <span class="particle" style="--dx: 10px; --dy: 80px; --dur: 7.2s; --delay: 2.2s; --size: 3px;"></span>
      <span class="particle" style="--dx: -50px; --dy: -70px; --dur: 6.8s; --delay: 1.8s; --size: 5px;"></span>
    </div>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-video">
        <video autoplay muted loop playsinline>
          <source src="https://assets.codepen.io/3364143/main.mp4" type="video/mp4">
        </video>
      </div>
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <h1 class="hero-title">
          <span class="title-glow">Открой мир кино</span>
        </h1>
        <p class="hero-subtitle">
          Фильмы, мультфильмы, сериалы и аниме со всего мира — в одном месте
        </p>
        <div class="hero-actions">
          <RouterLink to="/movies" class="btn btn-primary pulse">Исследовать фильмы</RouterLink>
          <RouterLink to="/anime" class="btn btn-outline">Смотреть аниме</RouterLink>
        </div>

        <!-- Статистика -->
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-number">25 000+</span>
            <span class="stat-label">Фильмов</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-number">5 000+</span>
            <span class="stat-label">Сериалов</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-number">3 000+</span>
            <span class="stat-label">Аниме</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <span class="stat-number">1 500+</span>
            <span class="stat-label">Мультфильмов</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Быстрые категории -->
    <section class="quick-categories">
      <div class="container">
        <h2 class="section-subtitle">Выбирай категорию</h2>
        <div class="category-chips">
          <RouterLink to="/movies" class="chip chip-movie">
            <Film :size="16" style="margin-right:6px" /> Фильмы
          </RouterLink>
          <RouterLink to="/cartoons" class="chip chip-cartoon">
            <Film :size="16" style="margin-right:6px" /> Мультфильмы
          </RouterLink>
          <RouterLink to="/tv" class="chip chip-tv">
            <Tv :size="16" style="margin-right:6px" /> Сериалы
          </RouterLink>
          <RouterLink to="/anime" class="chip chip-anime">
            <Star :size="16" style="margin-right:6px" /> Аниме
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Поиск прямо на главной -->
    <section class="search-section">
      <div class="container">
        <div class="search-hero">
          <h2 class="search-title">Найдите что-то интересное</h2>
          <div class="search-box">
            <input
              v-model="searchValue"
              type="text"
              placeholder="Начните вводить название..."
              @keyup.enter="goSearch"
            />
            <button class="btn btn-search" @click="goSearch">
              <Search :size="18" />
              Найти
            </button>
          </div>
          <p class="search-hint" v-if="searchValue">
            Результаты по запросу: <strong>"{{ searchValue }}"</strong>
            <RouterLink :to="`/catalog?q=${encodeURIComponent(searchValue)}`" class="search-link">Показать →</RouterLink>
          </p>
        </div>
      </div>
    </section>

    <!-- Популярные фильмы -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title"><Film :size="18" style="margin-right:8px" /> Популярные фильмы</h2>
          <RouterLink to="/movies" class="see-all">Смотреть все →</RouterLink>
        </div>
        <div v-if="loadingMovies && !popularMovies.length">
          <SkeletonCard :count="8" />
        </div>
        <div v-else-if="errorMovies" class="error">{{ errorMovies }}</div>
        <div v-else class="movies-grid">
          <MovieCard
            v-for="(movie, index) in popularMovies"
            :key="movie.id"
            :movie="movie"
            @open-modal="goToMovie"
            class="fade-in"
            :style="{ animationDelay: `${index * 0.08}s` }"
          />
        </div>
      </div>
    </section>

    <!-- Сериалы -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title section-tv"><Tv :size="18" style="margin-right:8px" /> Популярные сериалы</h2>
          <RouterLink to="/tv" class="see-all">Смотреть все →</RouterLink>
        </div>
        <div v-if="loadingTv && !tvShows.length">
          <SkeletonCard :count="8" />
        </div>
        <div v-else-if="errorTv" class="error">{{ errorTv }}</div>
        <div v-else class="movies-grid">
          <MovieCard
            v-for="(movie, index) in tvShows"
            :key="movie.id"
            :movie="movie"
            @open-modal="goToMovie"
            class="fade-in"
            :style="{ animationDelay: `${index * 0.08}s` }"
          />
        </div>
      </div>
    </section>

    <!-- Аниме -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title section-anime"><Star :size="18" style="margin-right:8px" /> Популярное аниме</h2>
          <RouterLink to="/anime" class="see-all">Смотреть все →</RouterLink>
        </div>
<div v-if="loadingAnime && !anime.length">
          <SkeletonCard :count="10" />
        </div>
        <div v-else-if="errorAnime" class="error">{{ errorAnime }}</div>
        <div v-else class="movies-grid">
          <MovieCard
            v-for="(movie, index) in anime"
            :key="movie.id"
            :movie="movie"
            @open-modal="goToMovie"
            class="fade-in"
            :style="{ animationDelay: `${index * 0.08}s` }"
          />
        </div>
      </div>
    </section>

    <!-- CTA внизу -->
    <section class="cta-bottom">
      <div class="container">
        <div class="cta-card">
          <h2>Ещё не выбрали?</h2>
          <p>Мы собрали лучшие фильмы и сериалы — найдите что-то для себя</p>
          <RouterLink to="/movies" class="btn btn-primary">Начать просмотр</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Film, Tv, Star, Search } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import MovieCard from '../components/MovieCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { tmdb } from '../services/tmdb'

const router = useRouter()

const goToMovie = (movie) => {
  const typeMap = {
    movie: '/movie',
    cartoon: '/cartoon',
    tv: '/tv',
    anime: '/anime'
  }
  const path = typeMap[movie.type] || '/movie'
  router.push(`${path}/${movie.id}`)
}

const popularMovies = ref([])
const tvShows = ref([])
const anime = ref([])

const loadingMovies = ref(true)
const loadingTv = ref(true)
const loadingAnime = ref(true)

const errorMovies = ref(null)
const errorTv = ref(null)
const errorAnime = ref(null)

const searchValue = ref('')

const goSearch = () => {
  if (searchValue.value.trim()) {
    router.push(`/catalog?q=${encodeURIComponent(searchValue.value)}`)
  }
}

async function loadAll() {
  loadingMovies.value = true
  loadingTv.value = true
  loadingAnime.value = true
  errorMovies.value = null
  errorTv.value = null
  errorAnime.value = null

  const results = await Promise.allSettled([
    tmdb.getPopularMovies(1).then(r => r.slice(0, 12)),
    tmdb.getPopularTV(1).then(r => r.slice(0, 12)),
    tmdb.getAnime(1).then(r => r.slice(0, 12))
  ])

  if (results[0].status === 'fulfilled') {
    popularMovies.value = results[0].value
  } else {
    errorMovies.value = results[0].reason?.message || 'Ошибка загрузки'
  }

  if (results[1].status === 'fulfilled') {
    tvShows.value = results[1].value
  } else {
    errorTv.value = results[1].reason?.message || 'Ошибка загрузки'
  }

  if (results[2].status === 'fulfilled') {
    anime.value = results[2].value
  } else {
    errorAnime.value = results[2].reason?.message || 'Ошибка загрузки'
  }

  loadingMovies.value = false
  loadingTv.value = false
  loadingAnime.value = false
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* ===== Dynamic Background ===== */
.dynamic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: orbFloat 20s ease-in-out infinite alternate;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #e6a855 0%, transparent 70%);
  top: -10%;
  left: -5%;
  animation-duration: 25s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #7c5cff 0%, transparent 70%);
  top: 50%;
  right: -10%;
  animation-duration: 22s;
  animation-delay: -5s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #4ade80 0%, transparent 70%);
  bottom: -5%;
  left: 30%;
  animation-duration: 28s;
  animation-delay: -10s;
}

.orb-4 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #f87171 0%, transparent 70%);
  top: 20%;
  left: 60%;
  animation-duration: 20s;
  animation-delay: -8s;
}

@keyframes orbFloat {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(80px, -60px) scale(1.1); }
  66% { transform: translate(-40px, 80px) scale(0.9); }
  100% { transform: translate(60px, 40px) scale(1.05); }
}

/* ===== Particles ===== */
.particles {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(230, 168, 85, 0.4);
  width: var(--size);
  height: var(--size);
  top: 50%;
  left: 50%;
  animation: particleFloat var(--dur) var(--delay) ease-in-out infinite alternate;
}

@keyframes particleFloat {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(0.3);
    opacity: 0;
  }
}

/* ===== Hero ===== */
.hero {
  position: relative;
  height: 75vh;
  min-height: 500px;
  display: flex;
  align-items: center;
  margin-top: -70px;
  overflow: hidden;
  z-index: 2;
}

.hero-video {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-video video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(15, 15, 20, 0.85) 0%,
    rgba(15, 15, 20, 0.4) 50%,
    rgba(15, 15, 20, 0.85) 100%
  );
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 20px;
  animation: fadeInUp 1s ease forwards;
}

.title-glow {
  background: linear-gradient(135deg, #fff 0%, var(--accent-primary) 50%, var(--accent-secondary) 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 4s ease infinite, glowPulse 3s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 30px rgba(230, 168, 85, 0.3));
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes glowPulse {
  0% { filter: drop-shadow(0 0 20px rgba(230, 168, 85, 0.2)); }
  100% { filter: drop-shadow(0 0 50px rgba(230, 168, 85, 0.5)); }
}

.hero-subtitle {
  font-size: 1.4rem;
  color: var(--text-secondary);
  margin-bottom: 40px;
  animation: fadeInUp 1s ease 0.3s forwards;
  opacity: 0;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeInUp 1s ease 0.6s forwards;
  opacity: 0;
  margin-bottom: 50px;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1rem;
  border: 2px solid var(--accent-primary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  text-decoration: none;
  backdrop-filter: blur(10px);
}

.btn-outline:hover {
  background: var(--accent-primary);
  color: #0f0f14;
  box-shadow: 0 6px 20px rgba(230, 168, 85, 0.3);
  transform: translateY(-2px);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.btn.pulse {
  animation: pulse 2s infinite;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Hero Stats ===== */
.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-top: 40px;
  animation: fadeInUp 1s ease 1s forwards;
  opacity: 0;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-sep {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
}

/* ===== Quick Categories ===== */
.quick-categories {
  padding: 40px 0 20px;
  position: relative;
  z-index: 2;
}

.section-subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 24px;
  font-weight: 500;
}

.category-chips {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.chip {
  padding: 10px 24px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.chip-movie {
  background: linear-gradient(135deg, rgba(230, 168, 85, 0.15), rgba(230, 168, 85, 0.05));
  color: var(--accent-primary);
  border-color: rgba(230, 168, 85, 0.3);
}

.chip-movie:hover {
  background: linear-gradient(135deg, rgba(230, 168, 85, 0.3), rgba(230, 168, 85, 0.15));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(230, 168, 85, 0.2);
}

.chip-cartoon {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05));
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
}

.chip-cartoon:hover {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.3), rgba(74, 222, 128, 0.15));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(74, 222, 128, 0.2);
}

.chip-tv {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(250, 204, 21, 0.05));
  color: #facc15;
  border-color: rgba(250, 204, 21, 0.3);
}

.chip-tv:hover {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.3), rgba(250, 204, 21, 0.15));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(250, 204, 21, 0.2);
}

.chip-anime {
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(124, 92, 255, 0.05));
  color: #a78bfa;
  border-color: rgba(124, 92, 255, 0.3);
}

.chip-anime:hover {
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.3), rgba(124, 92, 255, 0.15));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.2);
}

/* ===== Search Section ===== */
.search-section {
  padding: 40px 0;
  position: relative;
  z-index: 2;
}

.search-title {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  gap: 8px;
  max-width: 500px;
  margin: 0 auto 16px;
}

.search-box input {
  flex: 1;
  padding: 14px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(230, 168, 85, 0.1);
}

.btn-search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: var(--accent-primary);
  color: #0f0f14;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  font-size: 1rem;
  white-space: nowrap;
}

.btn-search:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(230, 168, 85, 0.3);
}

.search-hint {
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.search-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
}

.search-link:hover {
  text-decoration: underline;
}

/* ===== Sections ===== */
.section {
  padding: 60px 0;
  position: relative;
  z-index: 2;
}

.section-alt {
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
}

.section-tv {
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-anime {
  background: linear-gradient(135deg, var(--text-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.see-all {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.see-all:hover { opacity: 0.7; }

/* ===== Grid ===== */
.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

/* ===== Skeleton ===== */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  aspect-ratio: 2 / 3;
  animation: shimmer 1.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    #252532 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.loading, .error {
  text-align: center;
  padding: 60px;
  color: var(--text-secondary);
}

.error { color: var(--error); }

/* ===== CTA Bottom ===== */
.cta-bottom {
  padding: 80px 0;
  position: relative;
  z-index: 2;
}

.cta-card {
  background: linear-gradient(135deg, rgba(230, 168, 85, 0.08), rgba(124, 92, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 24px;
  text-align: center;
  padding: 50px 40px;
  backdrop-filter: blur(10px);
}

.cta-card h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-card p {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 28px;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .hero { height: 60vh; min-height: 400px; }
  .hero-title { font-size: 2.5rem; }
  .hero-subtitle { font-size: 1.1rem; }
  .hero-stats { gap: 20px; }
  .stat-number { font-size: 1.3rem; }
  .section { padding: 40px 0; }
  .movies-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
  .loading-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
  .hero-actions { flex-direction: column; align-items: center; }
  .search-box { flex-direction: column; }
  .btn-search { align-self: stretch; }
}

@media (max-width: 480px) {
  .hero-title { font-size: 2rem; }
  .movies-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .loading-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .category-chips { gap: 8px; }
  .chip { padding: 8px 16px; font-size: 0.85rem; }
  .hero-stats { flex-wrap: wrap; gap: 16px; }
}
</style>