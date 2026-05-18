<script setup>
import { ref, computed, onMounted } from 'vue'
import { Film, Shuffle, User, LogOut } from 'lucide-vue-next'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { tmdb } from './services/tmdb'
import { useAuthStore } from './store/auth'

const router = useRouter()
const randomLoading = ref(false)

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user.value)

const goRandom = async () => {
  randomLoading.value = true
  try {
    const movie = await tmdb.getRandomMovie(5.5)
    if (movie) {
      router.push(`/movie/${movie.id}`)
    }
  } catch (e) {
    console.error(e)
  } finally {
    randomLoading.value = false
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container header-content">
        <RouterLink to="/" class="logo">
          <Film :size="22" class="logo-icon" />
          <span class="logo-text">GazikFilm</span>
        </RouterLink>

        <nav class="nav">
          <RouterLink to="/" class="nav-link">Главная</RouterLink>
          <RouterLink to="/movies" class="nav-link">Фильмы</RouterLink>
          <RouterLink to="/cartoons" class="nav-link">Мультфильмы</RouterLink>
          <RouterLink to="/tv" class="nav-link">Сериалы</RouterLink>
          <RouterLink to="/anime" class="nav-link">Аниме</RouterLink>
          <RouterLink to="/discussions" class="nav-link">Обсуждения</RouterLink>
        </nav>

        <div class="header-actions">
          <button class="btn btn-random" @click="goRandom" :disabled="randomLoading">
            <Shuffle :size="16" />
            <span>Найти случайное</span>
          </button>
          <template v-if="currentUser">
            <RouterLink to="/profile" class="btn btn-profile">
              <User :size="16" />
              <span>{{ currentUser.username }}</span>
            </RouterLink>
            <button class="btn btn-logout" @click="logout" title="Выйти">
              <LogOut :size="16" />
            </button>
          </template>
          <template v-else>
            <RouterLink to="/auth" class="btn btn-primary">Вход</RouterLink>
          </template>
        </div>
      </div>
    </header>

<main class="main">
       <RouterView :key="$route.fullPath" />
     </main>

    <footer class="footer">
      <div class="container">
        <p>© 2026 GazikFilm. Все права защищены.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(15, 15, 20, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-primary);
  text-decoration: none;
  transition: color 0.3s;
}

.logo:hover {
  color: var(--text-primary);
}

.logo-icon {
  font-size: 1.8rem;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-random {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-random:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-random:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-profile {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-profile:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-logout {
  display: flex;
  align-items: center;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.main {
  flex: 1;
  padding-top: 70px;
}

.footer {
  padding: 40px 0 30px;
  text-align: center;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 60px;
}

.footer p {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .nav {
    display: none;
  }

  .btn-random span {
    display: none;
  }

  .btn-random {
    padding: 8px;
  }

  .header-content {
    justify-content: space-between;
  }
}
</style>