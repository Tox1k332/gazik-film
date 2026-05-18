<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, viewHistory } from '../services/auth'
import { useAuthStore } from '../store/auth'
import { supabaseFavorites } from '../services/supabaseFavorites'
import { supabaseAuth, isConfigured } from '../services/supabaseAuth'
import { supabase } from '../services/supabase'
import { avatarService } from '../services/avatar'
import { User, Settings, Trash2, Clock, Heart, X, Film, Star, LogOut, Camera, Upload } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user.value)
const userId = computed(() => user.value?.id)
const history = ref([])
const favorites = ref([])
const showSettings = ref(false)
const activeTab = ref('history')
const avatarUrl = ref(null)

const username = ref('')
const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const settingsError = ref('')
const settingsSuccess = ref('')
const showAvatarUpload = ref(false)

const favoritesService = isConfigured ? supabaseFavorites : {
  getAll: () => JSON.parse(localStorage.getItem('film_haven_favorites') || '[]'),
  remove: (id) => {
    const f = JSON.parse(localStorage.getItem('film_haven_favorites') || '[]')
    localStorage.setItem('film_haven_favorites', JSON.stringify(f.filter(m => m.id !== id)))
  },
  clear: () => localStorage.removeItem('film_haven_favorites')
}

onMounted(async () => {
  if (!user.value) {
    router.push('/auth')
    return
  }
  username.value = user.value.username
  email.value = user.value.email
  
  if (userId.value) {
    history.value = viewHistory.getAll(userId.value)
  }
  
  favorites.value = await favoritesService.getAll()
  
  if (user.value?.avatar) {
    avatarUrl.value = user.value.avatar
  } else {
    const savedAvatar = avatarService.get()
    if (savedAvatar) {
      avatarUrl.value = savedAvatar
    }
  }
})

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    settingsError.value = 'Выберите изображение'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    settingsError.value = 'Максимальный размер 5MB'
    return
  }

  settingsLoading.value = true
  
  if (isConfigured && user.value) {
    const result = await supabaseAuth.uploadAvatar(file)
    if (result.error) {
      settingsError.value = result.error
    } else {
      avatarUrl.value = result.url
      settingsSuccess.value = 'Аватар обновлён'
      setTimeout(() => { settingsSuccess.value = '' }, 2000)
    }
  } else {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        avatarService.set(result)
        avatarUrl.value = result
        settingsSuccess.value = 'Аватар обновлён'
        setTimeout(() => { settingsSuccess.value = '' }, 2000)
      }
    }
    reader.readAsDataURL(file)
  }
  
  settingsLoading.value = false
}

const settingsLoading = ref(false)

const removeAvatar = () => {
  avatarService.clear()
  avatarUrl.value = null
  settingsSuccess.value = 'Аватар удалён'
  setTimeout(() => { settingsSuccess.value = '' }, 2000)
}

const goToMovie = (movie) => {
  const typeMap = { movie: '/movie', tv: '/tv', anime: '/anime', cartoon: '/movie' }
  const path = typeMap[movie.type] || '/movie'
  router.push(`${path}/${movie.id}`)
}

const removeFromHistory = (movieId) => {
  if (userId.value) {
    viewHistory.remove(movieId, userId.value)
    history.value = viewHistory.getAll(userId.value)
  }
}

const clearHistory = () => {
  if (confirm('Очистить всю историю просмотров?')) {
    if (userId.value) {
      viewHistory.clear(userId.value)
    }
    history.value = []
  }
}

const removeFromFavorites = async (movieId) => {
  await favoritesService.remove(movieId)
  favorites.value = await favoritesService.getAll()
}

const clearFavorites = async () => {
  if (confirm('Очистить всё избранное?')) {
    await favoritesService.clear()
    favorites.value = []
  }
}

const getTypePath = (type) => {
  const map = { movie: '/movie', tv: '/tv', anime: '/anime', cartoon: '/cartoon' }
  return map[type] || '/movie'
}

const getTypeLabel = (type) => {
  const labels = { movie: 'Фильм', cartoon: 'Мультфильм', tv: 'Сериал', anime: 'Аниме' }
  return labels[type] || type
}

const getTypeColor = (type) => {
  const colors = { movie: '#e6a855', cartoon: '#4ade80', tv: '#e6a855', anime: '#7c5cff' }
  return colors[type] || '#e6a855'
}

const updateProfile = async () => {
  settingsError.value = ''
  settingsSuccess.value = ''
  
  if (!username.value || !email.value) {
    settingsError.value = 'Заполните все поля'
    return
  }
  
  if (isConfigured && user.value) {
    const result = await supabaseAuth.updateProfile({
      username: username.value,
      email: email.value
    })
    if (result.error) {
      settingsError.value = result.error
    } else {
      settingsSuccess.value = 'Профиль обновлён'
      setTimeout(() => { showSettings.value = false }, 1500)
    }
  } else {
    const result = auth.updateProfile({
      username: username.value,
      email: email.value
    })
    if (result.success) {
      settingsSuccess.value = 'Профиль обновлён'
      setTimeout(() => { showSettings.value = false }, 1500)
    } else {
      settingsError.value = result.error
    }
  }
}

const changePassword = async () => {
  settingsError.value = ''
  settingsSuccess.value = ''
  
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    settingsError.value = 'Заполните все поля'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    settingsError.value = 'Пароли не совпадают'
    return
  }
  
  if (newPassword.value.length < 6) {
    settingsError.value = 'Пароль должен быть не менее 6 символов'
    return
  }
  
  if (isConfigured) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })
    
    if (error) {
      settingsError.value = error.message
    } else {
      settingsSuccess.value = 'Пароль изменён'
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    }
  } else {
    const result = auth.changePassword(currentPassword.value, newPassword.value)
    
    if (result.success) {
      settingsSuccess.value = 'Пароль изменён'
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      settingsError.value = result.error
    }
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'short' 
  })
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="profile-page">
    <div class="container">
      <div class="profile-hero">
        <div class="profile-avatar" @click="showSettings = true">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="user?.username" />
          <img v-else :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`" :alt="user?.username" />
          <div class="avatar-edit">
            <Camera :size="20" />
          </div>
        </div>
        <div class="profile-details">
          <h1>{{ user?.username }}</h1>
          <p class="profile-email">{{ user?.email }}</p>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ history.length }}</span>
              <span class="stat-label">Просмотрено</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ favorites.length }}</span>
              <span class="stat-label">В избранном</span>
            </div>
          </div>
        </div>
        <div class="profile-actions">
          <button class="action-btn" @click="showSettings = true">
            <Settings :size="18" />
            Настройки
          </button>
          <button class="action-btn action-btn-danger" @click="logout">
            <LogOut :size="18" />
            Выйти
          </button>
        </div>
      </div>

      <div class="content-section">
        <div class="section-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            <Clock :size="18" />
            История
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'favorites' }"
            @click="activeTab = 'favorites'"
          >
            <Heart :size="18" />
            Избранное
          </button>
        </div>

        <div v-if="activeTab === 'history'" class="content-grid">
          <div v-if="history.length" class="grid-controls">
            <span class="grid-count">{{ history.length }} фильмов</span>
            <button class="btn-clear-text" @click="clearHistory">
              <Trash2 :size="14" /> Очистить всё
            </button>
          </div>
          
          <div v-if="history.length" class="movies-grid">
            <div 
              v-for="movie in history" 
              :key="movie.id" 
              class="movie-card"
              @click="goToMovie(movie)"
            >
              <div class="card-poster">
                <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" />
                <div v-else class="no-poster"><Film :size="32" /></div>
                <div class="card-rating">
                  <Star :size="12" fill="currentColor" />
                  {{ movie.rating }}
                </div>
                <button class="card-remove" @click.stop="removeFromHistory(movie.id)">
                  <X :size="14" />
                </button>
              </div>
              <div class="card-info">
                <h3>{{ movie.title }}</h3>
                <div class="card-meta">
                  <span v-if="movie.year">{{ movie.year }}</span>
                  <span v-if="movie.type" class="card-type" :style="{ color: getTypeColor(movie.type) }">
                    {{ getTypeLabel(movie.type) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">
              <Clock :size="64" />
            </div>
            <h3>История пуста</h3>
            <p>Начните смотреть фильмы, чтобы увидеть их здесь</p>
            <RouterLink to="/" class="btn btn-primary">Смотреть фильмы</RouterLink>
          </div>
        </div>

        <div v-if="activeTab === 'favorites'" class="content-grid">
          <div v-if="favorites.length" class="grid-controls">
            <span class="grid-count">{{ favorites.length }} в избранном</span>
            <button class="btn-clear-text" @click="clearFavorites">
              <Trash2 :size="14" /> Очистить всё
            </button>
          </div>
          
          <div v-if="favorites.length" class="movies-grid">
            <div 
              v-for="movie in favorites" 
              :key="movie.id" 
              class="movie-card"
              @click="router.push(`${getTypePath(movie.type)}/${movie.id}`)"
            >
              <div class="card-poster">
                <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" />
                <div v-else class="no-poster"><Film :size="32" /></div>
                <div class="card-rating">
                  <Star :size="12" fill="currentColor" />
                  {{ movie.rating }}
                </div>
                <button class="card-remove" @click.stop="removeFromFavorites(movie.id)">
                  <X :size="14" />
                </button>
              </div>
              <div class="card-info">
                <h3>{{ movie.title }}</h3>
                <div class="card-meta">
                  <span v-if="movie.year">{{ movie.year }}</span>
                  <span v-if="movie.type" class="card-type" :style="{ color: getTypeColor(movie.type) }">
                    {{ getTypeLabel(movie.type) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">
              <Heart :size="64" />
            </div>
            <h3>Избранное пусто</h3>
            <p>Добавляйте фильмы в избранное на странице фильма</p>
            <RouterLink to="/" class="btn btn-primary">Найти фильмы</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Настройки</h2>
          <button class="close-btn" @click="showSettings = false">
            <X :size="20" />
          </button>
        </div>
        
        <div class="modal-content">
          <div class="settings-section">
            <h3>Аватар</h3>
            <div class="avatar-upload-section">
              <div class="avatar-preview">
                <img v-if="avatarUrl" :src="avatarUrl" alt="Аватар" />
                <img v-else :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`" alt="Аватар" />
              </div>
              <div class="avatar-actions">
                <label class="btn btn-primary upload-btn">
                  <Upload :size="16" />
                  Загрузить фото
                  <input type="file" accept="image/*" @change="handleAvatarUpload" hidden />
                </label>
                <button v-if="avatarUrl" class="btn btn-secondary" @click="removeAvatar">
                  Удалить
                </button>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Профиль</h3>
            <div class="form-group">
              <label>Имя пользователя</label>
              <input v-model="username" type="text" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="email" type="email" />
            </div>
            <button class="btn btn-primary" @click="updateProfile">Сохранить</button>
          </div>
          
          <div class="settings-section">
            <h3>Пароль</h3>
            <div class="form-group">
              <label>Текущий пароль</label>
              <input v-model="currentPassword" type="password" />
            </div>
            <div class="form-group">
              <label>Новый пароль</label>
              <input v-model="newPassword" type="password" />
            </div>
            <div class="form-group">
              <label>Подтвердите пароль</label>
              <input v-model="confirmPassword" type="password" />
            </div>
            <button class="btn btn-secondary" @click="changePassword">Изменить пароль</button>
          </div>
          
          <div v-if="settingsError" class="error-message">{{ settingsError }}</div>
          <div v-if="settingsSuccess" class="success-message">{{ settingsSuccess }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 40px 0;
  min-height: calc(100vh - 70px);
}

.profile-hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 32px;
  align-items: center;
  padding: 40px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-lg);
  margin-bottom: 40px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--accent-primary);
  box-shadow: 0 8px 24px rgba(230, 168, 85, 0.2);
  cursor: pointer;
  position: relative;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
}

.profile-avatar:hover .avatar-edit {
  opacity: 1;
}

.profile-details h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.profile-email {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--bg-tertiary);
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-primary);
}

.action-btn-danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.content-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.section-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--bg-tertiary);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.grid-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.grid-count {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.btn-clear-text {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.btn-clear-text:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.movie-card {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.movie-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
}

.card-poster {
  position: relative;
  aspect-ratio: 2/3;
  background: var(--bg-primary);
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-poster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.card-rating {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-primary);
}

.card-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.movie-card:hover .card-remove {
  opacity: 1;
}

.card-remove:hover {
  background: #ef4444;
}

.card-info {
  padding: 12px;
}

.card-info h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.card-type {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
  color: var(--text-secondary);
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--bg-tertiary);
}

.modal-header h2 {
  font-size: 1.25rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-content {
  padding: 24px;
}

.settings-section {
  margin-bottom: 28px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h3 {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.avatar-upload-section {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-top: 16px;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .profile-hero {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 20px;
    padding: 24px;
  }

  .profile-avatar {
    margin: 0 auto;
  }

  .profile-stats {
    justify-content: center;
  }

  .profile-actions {
    flex-direction: row;
    justify-content: center;
  }

  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .movies-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>