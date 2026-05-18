<template>
  <div class="movie-page">
    <!-- Hero секция с бэкдропом -->
    <section class="hero-section" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="hero-gradient"></div>
      <div class="container hero-content">
        <div class="hero-poster">
          <img :src="movie.poster" :alt="movie.title" v-if="movie.poster" />
          <div class="poster-placeholder" v-else><FilmIcon :size="48" /></div>
        </div>
        <div class="hero-info">
          <p class="hero-type">{{ typeLabel }}</p>
          <h1 class="hero-title">{{ movie.title }}</h1>
          <p class="hero-original" v-if="movie.originalTitle !== movie.title">{{ movie.originalTitle }}</p>
          <div class="hero-meta">
            <span class="meta-item" v-if="movie.year">{{ movie.year }}</span>
            <span class="meta-sep" v-if="movie.year">•</span>
            <span class="meta-item" v-if="movie.runtime">{{ formatRuntime(movie.runtime) }}</span>
            <span class="meta-sep" v-if="movie.runtime && movie.genres.length">•</span>
            <span class="meta-genres">
              <span v-for="(g, i) in movie.genres" :key="g" class="genre-tag">{{ g }}</span>
            </span>
          </div>
          <div class="hero-rating">
            <span class="rating-big">{{ movie.rating }}</span>
            <span class="rating-label">Рейтинг</span>
            <span class="rating-count" v-if="movie.voteCount">({{ formatNumber(movie.voteCount) }})</span>
          </div>
          <p class="hero-tagline" v-if="movie.tagline">{{ movie.tagline }}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" @click="scrollToOverview">Описание</button>
            <button v-if="videos.length" class="btn btn-accent" @click="openPlayer">
              <Play :size="16" /> Смотреть
            </button>
            <button 
              class="btn btn-favorite" 
              :class="{ active: isFavorite }"
              @click="toggleFavorite"
            >
              <Heart :size="16" :fill="isFavorite ? 'currentColor' : 'none'" />
              {{ isFavorite ? 'В избранном' : 'В избранное' }}
            </button>
            <a v-if="movie.homepage" :href="movie.homepage" target="_blank" class="btn btn-outline">Официальный сайт</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Описание -->
    <section class="section" id="overview">
      <div class="container">
        <h2 class="section-title">Описание</h2>
        <p class="overview-text">{{ movie.overview || 'Описание недоступно.' }}</p>

        <div class="info-grid" v-if="movie.budget || movie.revenue || movie.status || movie.language">
          <div class="info-item">
            <span class="info-label">Статус</span>
            <span class="info-value">{{ movie.status || 'Неизвестно' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Язык</span>
            <span class="info-value">{{ movie.language?.toUpperCase() || '—' }}</span>
          </div>
          <div class="info-item" v-if="movie.budget">
            <span class="info-label">Бюджет</span>
            <span class="info-value">{{ formatCurrency(movie.budget) }}</span>
          </div>
          <div class="info-item" v-if="movie.revenue">
            <span class="info-label">Сборы</span>
            <span class="info-value">{{ formatCurrency(movie.revenue) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Трейлеры -->
    <section class="section section-alt" v-if="videos.length">
      <div class="container">
        <h2 class="section-title">Трейлеры</h2>
        <div class="trailers-grid">
          <div class="trailer-card" v-for="v in videos" :key="v.key">
            <iframe
              :src="`https://www.youtube.com/embed/${v.key}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
            <p class="trailer-title">{{ v.name }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Актёры -->
    <section class="section" v-if="cast.length">
      <div class="container">
        <h2 class="section-title">Актёры и создатели</h2>
        <div class="cast-grid">
          <div class="cast-card" v-for="person in cast" :key="person.id">
            <div class="cast-avatar">
              <img :src="person.profile" :alt="person.name" v-if="person.profile" />
              <div class="avatar-placeholder" v-else><User :size="28" /></div>
            </div>
            <p class="cast-name">{{ person.name }}</p>
            <p class="cast-role">{{ person.character || person.job }}</p>
          </div>
          <div class="cast-card creator" v-for="person in crew" :key="'crew-'+person.id">
            <div class="cast-avatar creator-avatar">
              <FilmIcon :size="24" class="creator-icon" />
            </div>
            <p class="cast-name">{{ person.name }}</p>
            <p class="cast-role">{{ person.job }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Комментарии -->
    <section class="section" v-if="movie.id">
      <div class="container">
        <div class="comments-header">
          <h2 class="section-title">Комментарии ({{ comments.length }})</h2>
          <div v-if="commentsStats && commentsStats.avgRating > 0" class="comments-stats">
            <span class="stat-label">Средняя оценка:</span>
            <span class="stat-value">{{ commentsStats.avgRating }} ⭐</span>
          </div>
        </div>
        
        <div v-if="comments.length === 0" class="comments-empty">
          <p>Комментариев пока нет. Будьте первым!</p>
        </div>
        
        <div v-else class="comments-list">
          <div 
            v-for="c in comments" 
            :key="c.id" 
            class="comment"
            @mouseenter="hoveredComment = c.id"
            @mouseleave="hoveredComment = null"
          >
            <img :src="c.avatar" :alt="c.author" class="comment-avatar" />
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-author" :class="{ own: currentUser && isOwnComment(c) }">@{{ c.author }}</span>
                <div class="comment-rating" v-if="c.rating">
                  <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= c.rating }">★</span>
                </div>
                <span class="comment-date">{{ formatTime(c.createdAt) }}</span>
              </div>
              
              <template v-if="editingCommentId === c.id">
                <div class="edit-form">
                  <textarea v-model="editCommentText" class="edit-textarea" rows="3"></textarea>
                  <div class="edit-rating">
                    <span>Оценка:</span>
                    <div class="rating-stars">
                      <button 
                        v-for="n in 5" 
                        :key="n"
                        @click="editCommentRating = n"
                        :class="{ active: n <= editCommentRating }"
                      >★</button>
                    </div>
                  </div>
                  <div class="edit-actions">
                    <button @click="saveEditComment" class="save-btn">Сохранить</button>
                    <button @click="cancelEditComment" class="cancel-btn">Отмена</button>
                  </div>
                </div>
              </template>
              
              <template v-else>
                <p class="comment-text">
                  {{ c.text }}
                  <span v-if="c.edited" class="edited-label">(ред.)</span>
                </p>
              </template>
              
              <div class="comment-actions">
                <button 
                  class="action-btn like-btn" 
                  :class="{ liked: isCommentLiked(c) }"
                  @click="toggleCommentLike(c)"
                >
                  <Heart :size="14" :fill="isCommentLiked(c) ? 'currentColor' : 'none'" />
                  <span v-if="c.likes">{{ c.likes }}</span>
                </button>
              </div>
            </div>
            
            <div v-if="isOwnComment(c) && hoveredComment === c.id" class="comment-menu-container">
              <button class="menu-btn" @click.stop="showCommentMenu = showCommentMenu === c.id ? null : c.id">
                <MoreVertical :size="16" />
              </button>
              <div v-if="showCommentMenu === c.id" class="comment-menu">
                <button @click="startEditComment(c)">
                  <Edit2 :size="14" /> Изменить
                </button>
                <button @click="deleteComment(c.id)" class="delete-btn">
                  <Trash2 :size="14" /> Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="new-comment">
          <template v-if="currentUser">
            <div class="comment-form-header">
              <img v-if="currentAvatar" :src="currentAvatar" :alt="currentUser.username" class="form-avatar" />
              <img v-else :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`" :alt="currentUser.username" class="form-avatar" />
              <span>Оставить отзыв</span>
            </div>
            <div class="rating-input">
              <span>Ваша оценка:</span>
              <div class="rating-stars">
                <button 
                  v-for="n in 5" 
                  :key="n"
                  @click="newRating = n"
                  :class="{ active: n <= newRating }"
                >★</button>
              </div>
            </div>
            <textarea 
              v-model="newCommentText" 
              placeholder="Напишите ваш отзыв..." 
              class="comment-textarea"
              rows="4"
            ></textarea>
            <div class="comment-footer">
              <EmojiPicker v-model="newCommentText" />
            </div>
            <button 
              @click="addComment" 
              class="btn btn-primary"
              :disabled="!newCommentText.trim()"
            >
              <Send :size="16" /> Отправить
            </button>
          </template>
          <template v-else>
            <div class="login-prompt">
              <Lock :size="20" />
              <span>Войдите, чтобы оставлять комментарии</span>
              <button @click="router.push('/auth')" class="btn btn-primary">Войти</button>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Коллекция (части серии) -->
    <section class="section" v-if="collection && collection.parts && collection.parts.length">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            <FilmIcon :size="18" style="margin-right:8px" />
            {{ collection.name }}
          </h2>
          <p v-if="collection.overview" class="collection-overview">{{ collection.overview }}</p>
        </div>
        <div class="collection-grid">
          <RouterLink
            v-for="(part, i) in collection.parts"
            :key="part.id"
            :to="`/movie/${part.id}`"
            class="collection-card fade-in"
            :class="{ active: part.id === movie.id }"
            :style="{ animationDelay: `${i * 0.06}s` }"
          >
            <div class="collection-poster">
              <img v-if="part.poster" :src="part.poster" :alt="part.title" />
              <div v-else class="poster-placeholder"><FilmIcon :size="32" /></div>
              <div v-if="part.id === movie.id" class="current-badge">Сейчас</div>
            </div>
            <div class="collection-info">
              <p class="collection-title">{{ part.title }}</p>
              <p class="collection-year" v-if="part.year">{{ part.year }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Похожие -->
    <section class="section section-alt" v-if="similar.length">
      <div class="container">
        <h2 class="section-title">Похожие</h2>
        <div class="movies-grid">
          <MovieCard
            v-for="(m, i) in similar"
            :key="m.id"
            :movie="m"
            @open-modal="openModal"
            class="fade-in"
            :style="{ animationDelay: `${i * 0.06}s` }"
          />
        </div>
      </div>
    </section>

    <!-- Навигация -->
    <nav class="breadcrumb" v-if="movie.title">
      <div class="container">
        <RouterLink to="/" class="breadcrumb-link">Главная</RouterLink>
        <span class="breadcrumb-sep">›</span>
        <RouterLink :to="categoryPath" class="breadcrumb-link">{{ typeLabel }}</RouterLink>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ movie.title }}</span>
      </div>
    </nav>

    <MovieModal v-if="showModal" :movie="selectedMovie" @close="closeModal" />
    <VideoPlayer v-if="showPlayer" :show="showPlayer" :src="playerSrc" :poster="playerPoster" @close="closePlayer" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tmdb } from '../services/tmdb'
import { commentsService } from '../services/comments'
import { favoritesService } from '../services/favorites'
import { avatarService } from '../services/avatar'
import { auth, viewHistory } from '../services/auth'
import { useAuthStore } from '../store/auth'
import MovieCard from '../components/MovieCard.vue'
import MovieModal from '../components/MovieModal.vue'
import VideoPlayer from '../components/VideoPlayer.vue'
import EmojiPicker from '../components/EmojiPicker.vue'
import { Film as FilmIcon, User, Send, Play, Heart, Lock, Edit2, Trash2, MoreVertical } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user.value)
const currentAvatar = computed(() => avatarService.get())

const movie = ref({
  id: null,
  title: '',
  originalTitle: '',
  year: '',
  rating: '0.0',
  voteCount: 0,
  genres: [],
  runtime: null,
  overview: '',
  tagline: '',
  poster: null,
  backdrop: null,
  budget: 0,
  revenue: 0,
  status: '',
  language: '',
  homepage: '',
  type: 'movie',
  collection: null
})

const cast = ref([])
const crew = ref([])
const similar = ref([])
const videos = ref([])
const collection = ref(null)
const loading = ref(true)
const error = ref(null)

const comments = ref([])
const newCommentText = ref('')
const newRating = ref(0)
const editingCommentId = ref(null)
const editCommentText = ref('')
const editCommentRating = ref(0)
const showCommentMenu = ref(null)
const hoveredComment = ref(null)

const commentsStats = computed(() => {
  if (!movie.value?.id) return { count: 0, avgRating: 0 }
  return commentsService.getStats(movie.value.id)
})

const showModal = ref(false)
const selectedMovie = ref(null)

const showPlayer = ref(false)
const playerSrc = ref('')
const playerPoster = ref('')
const favoriteIds = ref(new Set())

const loadFavorites = () => {
  const favs = favoritesService.getAll()
  favoriteIds.value = new Set(favs.map(f => f.id))
}

const isFavorite = computed(() => {
  return movie.value.id ? favoriteIds.value.has(movie.value.id) : false
})

const toggleFavorite = () => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  
  if (favoriteIds.value.has(movie.value.id)) {
    favoritesService.remove(movie.value.id)
    favoriteIds.value.delete(movie.value.id)
  } else {
    favoritesService.add({
      id: movie.value.id,
      title: movie.value.title,
      originalTitle: movie.value.originalTitle,
      poster: movie.value.poster,
      backdrop: movie.value.backdrop,
      rating: movie.value.rating,
      year: movie.value.year,
      type: movie.value.type
    })
    favoriteIds.value.add(movie.value.id)
  }
  favoriteIds.value = new Set(favoriteIds.value)
}

const openModal = (movie) => {
  selectedMovie.value = movie
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
  selectedMovie.value = null
}

function openPlayer() {
  if (movie.value.trailerUrl) {
    playerSrc.value = movie.value.trailerUrl
    playerPoster.value = movie.value.poster || ''
    showPlayer.value = true
  }
}

function closePlayer() {
  showPlayer.value = false
  playerSrc.value = ''
  playerPoster.value = ''
}

const typeLabel = computed(() => {
  const map = { movie: 'Фильм', cartoon: 'Мультфильм', tv: 'Сериал', anime: 'Аниме' }
  return map[movie.value.type] || 'Контент'
})

const categoryPath = computed(() => {
  const map = {
    movie: '/movies',
    cartoon: '/cartoons',
    tv: '/tv',
    anime: '/anime'
  }
  return map[movie.value.type] || '/movies'
})

const heroStyle = computed(() => ({
  backgroundImage: movie.value.backdrop
    ? `url(${movie.value.backdrop})`
    : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))

function formatRuntime(min) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}ч ${m}мин`
}

function formatNumber(n) {
  if (!n) return '0'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function formatCurrency(n) {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)} млрд`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)} млн`
  return `$${n}`
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`
  return date.toLocaleDateString('ru-RU')
}

function scrollToOverview() {
  const el = document.getElementById('overview')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function loadPage() {
  loading.value = true
  error.value = null

  const id = route.params.id
  const routePath = route.path
  let contentType = 'movie'
  if (routePath.startsWith('/tv/')) contentType = 'tv'
  else if (routePath.startsWith('/anime/')) contentType = 'anime'
  else if (routePath.startsWith('/cartoon/')) contentType = 'cartoon'

  try {
    const [details, credits, similarData, videosData] = await Promise.all([
      getDetailsByType(contentType, id),
      tmdb.getCredits(id, contentType),
      tmdb.getSimilar(id, contentType, 1),
      tmdb.getVideos(id, contentType)
    ])

    movie.value = details
    
    const currentUserData = auth.getCurrentUser()
    if (currentUserData) {
      viewHistory.add({
        id: details.id,
        title: details.title,
        originalTitle: details.originalTitle,
        year: details.year,
        rating: details.rating,
        type: contentType,
        poster: details.poster,
        backdrop: details.backdrop
      }, currentUserData.id)
    }
    
    if (videosData.length) {
      const trailer = videosData.find(v => v.type === 'Trailer') || videosData[0]
      movie.value.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`
    }
    cast.value = credits.cast
    crew.value = credits.crew
    similar.value = similarData
    videos.value = videosData
    if (details.collection) {
      collection.value = await tmdb.getCollection(details.collection.id)
    } else {
      collection.value = null
    }
    
    comments.value = commentsService.getByMovie(id)
  } catch (e) {
    error.value = 'Не удалось загрузить данные: ' + e.message
    console.error('MoviePage Error:', e)
  } finally {
    loading.value = false
  }
}

function getDetailsByType(type, id) {
  switch (type) {
    case 'tv': return tmdb.getTVDetails(id)
    case 'anime': return tmdb.getAnimeDetails(id)
    case 'cartoon': return tmdb.getCartoonDetails(id)
    default: return tmdb.getMovieDetails(id)
  }
}

const addComment = () => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  
if (!newCommentText.value.trim()) return
   
  const customAvatar = avatarService.get()
  const avatar = customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value.username}`
  commentsService.add(
    movie.value.id,
    movie.value.title,
    movie.value.poster,
    currentUser.value,
    avatar,
    newCommentText.value.trim(),
    newRating.value
  )
  
  comments.value = commentsService.getByMovie(movie.value.id)
  newCommentText.value = ''
  newRating.value = 0
}

const startEditComment = (comment) => {
  editingCommentId.value = comment.id
  editCommentText.value = comment.text
  editCommentRating.value = comment.rating || 0
  showCommentMenu.value = null
}

const saveEditComment = () => {
  if (!editCommentText.value.trim()) return
  commentsService.edit(editingCommentId.value, editCommentText.value.trim())
  comments.value = commentsService.getByMovie(movie.value.id)
  editingCommentId.value = null
  editCommentText.value = ''
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editCommentText.value = ''
}

const deleteComment = (id) => {
  commentsService.delete(id)
  comments.value = commentsService.getByMovie(movie.value.id)
  showCommentMenu.value = null
}

const toggleCommentLike = (comment) => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  commentsService.toggleLike(comment.id, currentUser.value.username)
  comments.value = commentsService.getByMovie(movie.value.id)
}

const isCommentLiked = (comment) => {
  return currentUser.value && currentUser.value.username && comment.likedBy?.includes(currentUser.value.username)
}

const isOwnComment = (comment) => {
  return currentUser.value && currentUser.value.username && comment.author === currentUser.value.username
}

onMounted(() => {
  loadPage()
  loadFavorites()
  window.scrollTo(0, 0)
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.comment-menu-container')) {
      showCommentMenu.value = null
    }
  })
})

onUnmounted(() => {
  cast.value = []
  crew.value = []
  similar.value = []
  videos.value = []
  comments.value = []
})

watch(() => route.params.id, () => {
  loadPage()
  window.scrollTo(0, 0)
})
</script>

<style scoped>
/* ===== Hero Section ===== */
.hero-section {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: flex-end;
  padding-bottom: 60px;
  margin-top: -70px;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, var(--bg-primary), transparent);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  display: flex;
  gap: 40px;
  align-items: flex-end;
}

.hero-poster {
  flex: 0 0 260px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.hero-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-poster .poster-placeholder {
  width: 100%;
  height: 390px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  background: var(--bg-tertiary);
}

.hero-info {
  flex: 1;
  max-width: 600px;
  padding-bottom: 20px;
}

.hero-type {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  background: var(--accent-primary);
  color: #0f0f14;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  margin: 0 0 8px;
  color: #fff;
  line-height: 1.15;
}

.hero-original {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0 0 12px;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.meta-item {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.meta-sep {
  color: rgba(255, 255, 255, 0.3);
}

.genre-tag {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-primary);
  margin-right: 4px;
  opacity: 0.9;
}

.hero-rating {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.rating-big {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.rating-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.rating-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  opacity: 0.6;
}

.hero-tagline {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 24px;
  opacity: 0.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-favorite {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.btn-favorite:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-favorite.active {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

/* ===== Sections ===== */
.section {
  padding: 60px 0;
}

.section-alt {
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.section-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 32px;
  color: var(--text-primary);
}

/* ===== Overview ===== */
.overview-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #cccdd4;
  text-align: justify;
  max-width: 800px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 32px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-value {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
}

/* ===== Trailers ===== */
.trailers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.trailer-card iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  border: none;
}

.trailer-title {
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: center;
}

/* ===== Cast ===== */
.cast-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
  scroll-snap-type: x mandatory;
}

.cast-card {
  flex: 0 0 140px;
  text-align: center;
  scroll-snap-align: start;
}

.cast-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 10px;
  background: var(--bg-tertiary);
}

.cast-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.cast-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cast-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.creator-avatar {
  position: relative;
}

.creator-icon {}

/* ===== Movies Grid (Similar) ===== */
.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

/* ===== Comments ===== */
.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.comments-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent-primary);
}

.comments-empty {
  text-align: center;
  padding: 32px 20px;
  color: var(--text-secondary);
  font-style: italic;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
}

.comment {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  position: relative;
}

.comment:hover {
  background: var(--bg-tertiary);
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  font-size: 0.9rem;
}

.comment-author.own {
  color: var(--accent-primary);
}

.comment-rating {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 0.85rem;
  color: var(--text-secondary);
  opacity: 0.4;
}

.star.filled {
  color: var(--accent-primary);
  opacity: 1;
}

.comment-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-left: auto;
}

.comment-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
  word-break: break-word;
}

.edited-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-left: 6px;
}

.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.action-btn.liked {
  color: #ef4444;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  padding: 10px;
  color: var(--text-primary);
  resize: none;
  font-family: inherit;
}

.edit-textarea:focus {
  outline: none;
}

.edit-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-rating span {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.rating-stars {
  display: flex;
  gap: 4px;
}

.rating-stars button {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.rating-stars button.active,
.rating-stars button:hover {
  color: var(--accent-primary);
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.save-btn, .cancel-btn {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn {
  background: var(--success);
  color: #fff;
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.comment-menu-container {
  position: relative;
  flex-shrink: 0;
}

.menu-btn {
  background: var(--bg-hover);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment:hover .menu-btn {
  opacity: 1;
}

.menu-btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.comment-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  overflow: hidden;
  z-index: 100;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.comment-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.comment-menu button:hover {
  background: var(--bg-hover);
}

.comment-menu .delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.new-comment {
  margin-top: 20px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.comment-form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-weight: 600;
}

.form-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.rating-input span {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.comment-textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-sm);
  padding: 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 8px;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: var(--text-secondary);
}

.login-prompt .btn {
  margin-left: 8px;
}

/* ===== Loading ===== */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.loader {
  display: inline-block;
  width: 36px;
  height: 36px;
  border: 3px solid var(--bg-tertiary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 80px 20px;
  color: var(--error);
}

/* ===== Breadcrumb ===== */
.breadcrumb {
  padding: 24px 0;
  background: rgba(255, 255, 255, 0.02);
}

.breadcrumb-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.breadcrumb-link:hover { opacity: 0.7; }

.breadcrumb-sep {
  color: var(--text-secondary);
  margin: 0 8px;
  opacity: 0.5;
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

/* ===== Collection ===== */
.collection-overview {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 8px;
  margin-bottom: 24px;
  line-height: 1.6;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.collection-card {
  text-decoration: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.collection-card.active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 20px rgba(230, 168, 85, 0.2);
}

.collection-poster {
  position: relative;
  aspect-ratio: 2/3;
  background: var(--bg-tertiary);
}

.collection-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-poster .poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.current-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--accent-primary);
  color: #0f0f14;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
}

.collection-info {
  padding: 12px;
}

.collection-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-year {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .hero-section { min-height: 60vh; }

  .hero-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    padding-bottom: 40px;
  }

  .hero-poster {
    flex: none;
    width: 180px;
  }

  .hero-poster .poster-placeholder {
    height: 270px;
  }

  .hero-title { font-size: 2rem; }
  .hero-original { font-size: 0.95rem; }

  .hero-meta { justify-content: center; }
  .hero-rating { justify-content: center; }

  .info-grid { grid-template-columns: 1fr; }
  .trailers-grid { grid-template-columns: 1fr; }
  .movies-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  
  .comments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .hero-title { font-size: 1.6rem; }
  .hero-poster { width: 140px; }
  .hero-poster .poster-placeholder { height: 210px; }
  .cast-card { flex: 0 0 110px; }
  .cast-avatar { width: 80px; height: 80px; }
  .movies-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>