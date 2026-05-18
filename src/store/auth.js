import { ref, watch } from 'vue'
import { auth as localAuthService, viewHistory } from '../services/auth'
import { supabaseAuth, isConfigured as isSupabaseConfigured } from '../services/supabaseAuth'
import { avatarService } from '../services/avatar'

const currentUser = ref(null)
const isLoading = ref(true)
const isSupabaseMode = ref(isSupabaseConfigured)

let authStateUnsubscribe = null

const initAuth = async () => {
  isLoading.value = true
  
  if (isSupabaseConfigured) {
    const user = await supabaseAuth.getCurrentUser()
    if (user) {
      const profile = await supabaseAuth.getProfile(user.id)
      currentUser.value = {
        id: user.id,
        username: profile?.username || user.email?.split('@')[0],
        email: user.email,
        avatar: profile?.avatar_url || avatarService.get()
      }
    }
    
    authStateUnsubscribe = supabaseAuth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await supabaseAuth.getProfile(session.user.id)
        currentUser.value = {
          id: session.user.id,
          username: profile?.username || session.user.email?.split('@')[0],
          email: session.user.email,
          avatar: profile?.avatar_url || avatarService.get()
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser.value = null
      }
    })
  } else {
    currentUser.value = localAuthService.getCurrentUser()
    setInterval(() => {
      currentUser.value = localAuthService.getCurrentUser()
    }, 1000)
  }
  
  isLoading.value = false
}

initAuth()

export const useAuthStore = () => {
  const user = ref(currentUser.value)
  
  const syncUser = () => {
    user.value = currentUser.value
  }
  
  const login = async (email, password) => {
    syncUser()
    
    if (isSupabaseConfigured) {
      const result = await supabaseAuth.signIn(email, password)
      if (result.error) {
        return { success: false, error: result.error }
      }
      return { success: true, user: currentUser.value }
    }
    
    return localAuthService.login(email, password)
  }
  
  const register = async (username, email, password) => {
    syncUser()
    
    if (isSupabaseConfigured) {
      const result = await supabaseAuth.signUp(email, password, username)
      if (result.error) {
        return { success: false, error: result.error }
      }
      return { success: true, user: result.user }
    }
    
    return localAuthService.register(username, email, password)
  }
  
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabaseAuth.signOut()
      currentUser.value = null
    } else {
      localAuthService.logout()
      currentUser.value = null
    }
    syncUser()
  }
  
  const isAuthenticated = () => {
    return !!currentUser.value
  }
  
  const updateProfile = async (updates) => {
    if (isSupabaseConfigured) {
      return await supabaseAuth.updateProfile(updates)
    }
    return localAuthService.updateProfile(updates)
  }
  
  const uploadAvatar = async (file) => {
    if (isSupabaseConfigured) {
      return await supabaseAuth.uploadAvatar(file)
    }
    return avatarService.save(file)
  }
  
  const getAvatar = () => {
    if (isSupabaseConfigured && currentUser.value?.avatar) {
      return currentUser.value.avatar
    }
    return avatarService.get()
  }
  
  watch(currentUser, (newVal) => {
    user.value = newVal
  }, { immediate: true })
  
  return {
    user: currentUser,
    isLoading,
    isSupabaseMode,
    login,
    register,
    logout,
    isAuthenticated,
    updateProfile,
    uploadAvatar,
    getAvatar
  }
}

export { currentUser, viewHistory }