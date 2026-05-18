<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const username = ref('')
const error = ref('')
const loading = ref(false)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''
  loading.value = true
  
  if (!email.value || !password.value) {
    error.value = 'Заполните все поля'
    loading.value = false
    return
  }
  
  if (!isLogin.value && !username.value) {
    error.value = 'Введите имя пользователя'
    loading.value = false
    return
  }
  
  try {
    if (isLogin.value) {
      const result = authStore.login(email.value, password.value)
      if (result.success) {
        router.push('/')
      } else {
        error.value = result.error
      }
    } else {
      const result = authStore.register(username.value, email.value, password.value)
      if (result.success) {
        router.push('/')
      } else {
        error.value = result.error
      }
    }
  } catch (e) {
    error.value = 'Произошла ошибка'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ isLogin ? 'С возвращением!' : 'Присоединяйся' }}</h1>
          <p>{{ isLogin ? 'Войди в свой аккаунт' : 'Создай аккаунт для доступа к кино' }}</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="error" class="error-message">{{ error }}</div>
          
          <div v-if="!isLogin" class="form-group">
            <label>Имя пользователя</label>
            <input v-model="username" type="text" placeholder="Введите имя" />
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="example@mail.ru" />
          </div>
          
          <div class="form-group">
            <label>Пароль</label>
            <input v-model="password" type="password" placeholder="••••••••" />
          </div>
          
          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            {{ loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться') }}
          </button>
        </form>
        
        
        
        <div class="auth-switch">
          <p>
            {{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
            <button @click="toggleMode" class="switch-btn">
              {{ isLogin ? 'Зарегистрироваться' : 'Войти' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: 
    radial-gradient(ellipse at top, rgba(124, 92, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(230, 168, 85, 0.1) 0%, transparent 50%),
    var(--bg-primary);
}

.auth-container {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 40px;
  border: 1px solid var(--bg-tertiary);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.auth-header p {
  color: var(--text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.form-group input {
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-tertiary);
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-group input::placeholder {
  color: var(--text-secondary);
}

.btn-full {
  width: 100%;
  padding: 16px;
  font-size: 1rem;
}

.auth-divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
}

.auth-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--bg-tertiary);
}

.auth-divider span {
  background: var(--bg-secondary);
  padding: 0 16px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  position: relative;
  z-index: 1;
}

.social-buttons {
  display: flex;
  gap: 12px;
}

.social-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.3s ease;
}

.social-btn:hover {
  background: var(--bg-primary);
  transform: translateY(-2px);
}

.auth-switch {
  text-align: center;
  margin-top: 24px;
  color: var(--text-secondary);
}

.switch-btn {
  background: none;
  color: var(--accent-primary);
  font-weight: 600;
  padding: 0;
  margin-left: 4px;
}

.switch-btn:hover {
  text-decoration: underline;
}
</style>