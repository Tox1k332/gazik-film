<template>
  <div class="catalog">
    <div class="container">
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-subtitle">{{ subtitle }}</p>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="btn btn-primary">Найти</button>
      </div>

      <div class="filters" v-if="!searchQuery">
<div class="filter-group" v-if="filteredGenres.length">
           <label>Жанр:</label>
           <select v-model="genreFilter">
             <option value="all">Все жанры</option>
             <option
               v-for="genre in filteredGenres"
               :key="genre.id"
               :value="genre.id"
             >
               {{ genre.name.toLowerCase() }}
             </option>
           </select>
         </div>

        <div class="filter-group">
          <label>Сортировка:</label>
          <select v-model="sortBy">
            <option value="default">По умолчанию</option>
            <option value="rating">По рейтингу</option>
            <option value="year-new">По году (новые)</option>
            <option value="year-old">По году (старые)</option>
          </select>
        </div>
      </div>

<!-- Skeleton для любой загрузки -->
      <div v-if="isFirstLoading || isPageLoading" class="movies-grid">
        <SkeletonCard :count="24" />
      </div>

      <template v-else>
        <!-- Загрузка доп. страницы -->
        <div v-if="isLoadingMore && allMovies.length" class="loading-more">
          <span class="loader-small"></span>
          <p>Загрузка следующей страницы...</p>
        </div>

        <!-- Ошибка -->
        <div v-if="error && !allMovies.length" class="error">
          <p>{{ error }}</p>
          <button @click="retry" class="btn btn-primary" style="margin-top: 16px;">Повторить</button>
        </div>

        <!-- Карточки -->
        <div v-if="paginatedMovies.length" ref="gridRef" class="movies-grid">
          <MovieCard
            v-for="(movie, index) in paginatedMovies"
            :key="movie.id"
            :movie="{ ...movie, genre: getGenreName(movie.genre) }"
            @open-modal="goToMovie"
            class="fade-in"
            :style="{ animationDelay: `${index * 0.04}s` }"
          />
        </div>

        <!-- Пусто -->
        <div v-else class="empty">
          <p>Ничего не найдено. Попробуйте изменить фильтры.</p>
        </div>

        <!-- Пагинация: показываем когда есть данные и есть больше 1 страницы -->
        <div v-if="allMovies.length && totalPages > 1" class="pagination">
          <button
            :disabled="currentPage <= 1 || isLoadingMore"
            @click="goToPage(currentPage - 1)"
          >
            ← Назад
          </button>
          <span class="page-info">
            Страница {{ currentPage }} из {{ totalPages }}
          </span>
          <button
            :disabled="currentPage >= totalPages || isLoadingMore"
            @click="goToPage(currentPage + 1)"
          >
            Вперёд →
          </button>
        </div>

        <div v-if="allLoaded && !error" class="all-loaded">
          <p><Star :size="14" style="margin-right:6px" /> Все доступные фильмы загружены</p>
        </div>
      </template>
     </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MovieCard from '../components/MovieCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { Star } from 'lucide-vue-next'
import { tmdb } from '../services/tmdb'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  type: { type: String, default: 'movie' }
})

const PAGE_SIZE = 24
const PREFETCH_COUNT = 2

const genreFilter = ref('all')
const searchQuery = ref('')
const sortBy = ref('default')
const currentPage = ref(1)
const totalPages = ref(1)

const pageCache = ref({})
const loadedPages = ref([])

const genres = ref([])
const blockedGenres = ['боевики и приключения','детский','война и политика','мыльная опера','новости','нф и фентези','реалити-шоу','ток-шоу']
const filteredGenres = computed(() => genres.value.filter(g => !blockedGenres.includes(g.name.toLowerCase())))
const isFirstLoading = ref(true)
const isPageLoading = ref(false)
const isLoadingMore = ref(false)
const error = ref(null)
const allLoaded = ref(false)

const gridRef = ref(null)

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

const titleMap = {
  movie: 'Фильмы',
  cartoon: 'Мультфильмы',
  tv: 'Сериалы',
  anime: 'Аниме'
}

const subtitleMap = {
  movie: 'Популярные фильмы со всего мира',
  cartoon: 'Лучшие мультфильмы для всей семьи',
  tv: 'Популярные сериалы для бинге-марадонов',
  anime: 'Лучшее аниме в одном месте'
}

const title = computed(() => titleMap[props.type] || 'Каталог')
const subtitle = computed(() => subtitleMap[props.type] || 'Найдите что-то интересное')
const searchPlaceholder = computed(() => {
  const map = {
    movie: 'Поиск фильма...',
    cartoon: 'Поиск мультфильма...',
    tv: 'Поиск сериала...',
    anime: 'Поиск аниме...'
  }
  return map[props.type] || 'Поиск...'
})

// Все карточки из кеша в порядке страниц
const allMovies = computed(() => {
   const result = []
   for (const pageNum of loadedPages.value) {
     const cacheKey = getCacheKey(pageNum)
     const cached = pageCache.value[cacheKey]
     if (cached && cached.length) {
       result.push(...cached)
     }
   }
   return result
 })

const getGenreName = (genreId) => {
  if (!genreId) return ''
  const genre = genres.value.find(g => g.id === genreId)
  return genre ? genre.name : ''
}

const sortedMovies = computed(() => {
  const sorted = [...allMovies.value]
  switch (sortBy.value) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'year-new':
      return sorted.sort((a, b) => (b.year || 0) - (a.year || 0))
    case 'year-old':
      return sorted.sort((a, b) => (a.year || 0) - (b.year || 0))
    default:
      return sorted
  }
})

// Вычисляем реальное число страниц на основе загруженных данных
const computedTotalPages = computed(() => {
  if (searchQuery.value) return 1
  return totalPages.value
})

const paginatedMovies = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return sortedMovies.value.slice(start, end)
})

// ===== API =====

async function fetchFromAPI(page) {
    let data
    if (searchQuery.value) {
      data = await tmdb.search(searchQuery.value, page)
      totalPages.value = 1
    } else if (genreFilter.value !== 'all') {
      const genreData = await tmdb.getByGenre(props.type, page, genreFilter.value)
      totalPages.value = genreData.total_pages || 20
      data = genreData.results
    } else {
      switch (props.type) {
        case 'movie': data = await tmdb.getPopularMovies(page); break
        case 'cartoon': data = await tmdb.getCartoons(page); break
        case 'tv': data = await tmdb.getPopularTV(page); break
        case 'anime': data = await tmdb.getAnime(page); break
        default: data = await tmdb.getPopularMovies(page); break
      }
    }
    // Filter out excluded genres
    const blockedNames = ['боевики и приключения','детский','война и политика','мыльная опера','новости','нф и фентези','реалити-шоу','ток-шоу']
    const excludedIds = genres.value
      .filter(g => blockedNames.includes(g.name.toLowerCase()))
      .map(g => g.id)
    if (Array.isArray(data) && excludedIds.length > 0) {
      data = data.filter(item => !excludedIds.includes(item.genre))
    }
     return data
   }

 function updateTotalPages() {
   totalPages.value = searchQuery.value ? 1 : 20
 }

 // ===== Кеш-ориентированная загрузка =====

 function getCacheKey(page) {
   return `${props.type}_${genreFilter.value}_${page}`
 }

async function loadPage(page, { append = false } = {}) {
   const cacheKey = getCacheKey(page)
   // Уже в кеше — мгновенный переход
   if (pageCache.value[cacheKey] && pageCache.value[cacheKey].length > 0) {
     currentPage.value = page
     prefetchNeighbors(page)
     return
   }

   if (append) {
     isLoadingMore.value = true
   } else {
     isPageLoading.value = true
   }

   try {
     const data = await fetchFromAPI(page)
     if (!pageCache.value[cacheKey]) {
       pageCache.value[cacheKey] = data
       if (!loadedPages.value.includes(page)) {
         loadedPages.value.push(page)
         loadedPages.value.sort((a, b) => a - b)
       }
     }
     currentPage.value = page
     updateTotalPages()

     // Проверяем, достигли ли конца
     if (typeof data === 'object' && 'length' in data) {
       // data is an array
       if (data.length < PAGE_SIZE || currentPage.value >= totalPages.value) {
         allLoaded.value = true
       }
     } else if (data < PAGE_SIZE || currentPage.value >= totalPages.value) {
       allLoaded.value = true
     }
   } catch (e) {
     error.value = 'Не удалось загрузить данные: ' + e.message
     console.error('API Error:', e)
   } finally {
     if (append) {
       isLoadingMore.value = false
     } else {
       isPageLoading.value = false
       isFirstLoading.value = false
     }
   }

   if (!searchQuery.value && !error.value) {
     prefetchNeighbors(page)
   }
 }

 async function prefetchNeighbors(fromPage) {
   const promises = []
   for (let i = 1; i <= PREFETCH_COUNT; i++) {
     const p = fromPage + i
     const cacheKey = getCacheKey(p)
     if (p <= totalPages.value && !pageCache.value[cacheKey]) {
       promises.push(
         fetchFromAPI(p).then(data => {
           if (!pageCache.value[cacheKey]) {
             pageCache.value[cacheKey] = Array.isArray(data) ? data : data.results
             if (!loadedPages.value.includes(p)) {
               loadedPages.value.push(p)
               loadedPages.value.sort((a, b) => a - b)
             }
           }
         }).catch(() => {})
       )
     }
   }
   if (promises.length) {
     await Promise.allSettled(promises)
   }
 }

function goToPage(page) {
  if (page < 1 || page > totalPages.value || isLoadingMore.value) return
  loadPage(page, { append: true }).then(() => {
    nextTick(() => {
      gridRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

function handleSearch() {
  currentPage.value = 1
  pageCache.value = {}
  loadedPages.value = []
  allLoaded.value = false
  error.value = null
  loadPage(1, { append: false })
}

function retry() {
  error.value = null
  pageCache.value = {}
  loadedPages.value = []
  allLoaded.value = false
  currentPage.value = 1
  loadPage(1, { append: false })
}

// ===== Watchers =====

watch(() => props.type, () => {
  pageCache.value = {}
  loadedPages.value = []
  currentPage.value = 1
  allLoaded.value = false
  genreFilter.value = 'all'
  searchQuery.value = ''
  sortBy.value = 'default'
  isFirstLoading.value = true
  loadPage(1, { append: false })
})

watch(genreFilter, () => {
   currentPage.value = 1
   pageCache.value = {}
   loadedPages.value = []
   allLoaded.value = false
   loadPage(1, { append: false })
 })

watch(searchQuery, () => {
  if (searchQuery.value.trim()) {
    currentPage.value = 1
    pageCache.value = {}
    loadedPages.value = []
    allLoaded.value = false
    loadPage(1, { append: false })
  }
})

onMounted(() => {
  loadGenres()

  // Если есть параметр ?q= в URL — включаем поиск
  if (route.query.q) {
    searchQuery.value = route.query.q
  }

  // loadPage вызовется автоматически через watch(searchQuery)
  // Вызываем вручную только если searchQuery пустой
  if (!searchQuery.value) {
    loadPage(1, { append: false })
  }
})

// Следим за изменением URL (прямой переход или навигация)
watch(() => route.query.q, (newQ) => {
  if (newQ) {
    searchQuery.value = newQ
  } else if (searchQuery.value) {
    searchQuery.value = ''
  }
})

async function loadGenres() {
  try {
    genres.value = await tmdb.getGenres()
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}
</script>

<style scoped>
.catalog {
  padding: 80px 0;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-bar input {
  flex: 1;
  min-width: 200px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-group select {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--bg-tertiary);
  padding: 10px 36px 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 160px;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239898a8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.filter-group select:hover {
  border-color: var(--accent-primary);
}

.filter-group select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(230, 168, 85, 0.1);
}

.loading {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.loading-more {
  text-align: center;
  padding: 32px 20px;
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

.loader-small {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid var(--bg-tertiary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty,
.error {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.error {
  color: var(--error);
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  padding-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 48px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.pagination button {
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  font-size: 0.9rem;
}

.pagination button:hover:not(:disabled) {
  background: var(--accent-primary);
  color: #0f0f14;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.all-loaded {
  text-align: center;
  padding: 24px 20px;
  color: var(--text-secondary);
  opacity: 0.6;
}

@media (max-width: 768px) {
  .catalog {
    padding: 60px 0;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-bar input {
    min-width: auto;
  }

  .filters {
    flex-direction: column;
    gap: 12px;
  }

  .filter-group select {
    min-width: 100%;
  }

  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .movies-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>