const USERS_KEY = 'film_haven_users'
const CURRENT_USER_KEY = 'film_haven_current_user'

const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : []
}

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

const getHistoryKey = (userId) => `film_haven_history_${userId}`

export const auth = {
  register: (username, email, password) => {
    const users = getUsers()
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email уже используется' }
    }
    
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Имя пользователя уже занято' }
    }
    
    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    saveUsers(users)
    
    const { password: _, ...userWithoutPassword } = newUser
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
    
    return { success: true, user: userWithoutPassword }
  },

  login: (email, password) => {
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return { success: false, error: 'Неверный email или пароль' }
    }
    
    const { password: _, ...userWithoutPassword } = user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
    
    return { success: true, user: userWithoutPassword }
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY)
  },

  getCurrentUser: () => {
    const user = localStorage.getItem(CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(CURRENT_USER_KEY)
  },

  updateProfile: (updates) => {
    const users = getUsers()
    const currentUser = auth.getCurrentUser()
    
    if (!currentUser) return { success: false, error: 'Пользователь не найден' }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id)
    if (userIndex === -1) return { success: false, error: 'Пользователь не найден' }
    
    if (updates.username && updates.username !== currentUser.username) {
      if (users.find(u => u.username === updates.username && u.id !== currentUser.id)) {
        return { success: false, error: 'Имя пользователя уже занято' }
      }
    }
    
    users[userIndex] = { ...users[userIndex], ...updates }
    saveUsers(users)
    
    const { password, ...userWithoutPassword } = users[userIndex]
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))
    
    return { success: true, user: userWithoutPassword }
  },

  changePassword: (oldPassword, newPassword) => {
    const users = getUsers()
    const currentUser = auth.getCurrentUser()
    
    if (!currentUser) return { success: false, error: 'Пользователь не найден' }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id)
    if (userIndex === -1) return { success: false, error: 'Пользователь не найден' }
    
    if (users[userIndex].password !== oldPassword) {
      return { success: false, error: 'Неверный текущий пароль' }
    }
    
    users[userIndex].password = newPassword
    saveUsers(users)
    
    return { success: true }
  }
}

export const viewHistory = {
  add: (movie, userId) => {
    if (!userId) return
    const key = getHistoryKey(userId)
    const existing = localStorage.getItem(key)
    const history = existing ? JSON.parse(existing) : []
    
    const existingIndex = history.findIndex(m => m.id === movie.id)
    
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1)
    }
    
    history.unshift({
      ...movie,
      viewedAt: new Date().toISOString()
    })
    
    const limited = history.slice(0, 50)
    localStorage.setItem(key, JSON.stringify(limited))
  },

  getAll: (userId) => {
    if (!userId) return []
    const key = getHistoryKey(userId)
    const history = localStorage.getItem(key)
    return history ? JSON.parse(history) : []
  },

  clear: (userId) => {
    if (!userId) return
    localStorage.removeItem(getHistoryKey(userId))
  },

  remove: (movieId, userId) => {
    if (!userId) return
    const key = getHistoryKey(userId)
    const existing = localStorage.getItem(key)
    if (!existing) return
    const history = JSON.parse(existing)
    const filtered = history.filter(m => m.id !== movieId)
    localStorage.setItem(key, JSON.stringify(filtered))
  }
}