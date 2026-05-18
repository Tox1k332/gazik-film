import { supabase, isConfigured } from './supabase'
import { auth as localAuth, viewHistory } from './auth'
import { avatarService } from './avatar'

export { isConfigured }

export const supabaseAuth = {
  isConfigured,

  async signUp(email, password, username) {
    if (!isConfigured) {
      return { error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (error) return { error: error.message }

    return { user: data.user }
  },

  async signIn(email, password) {
    if (!isConfigured) {
      return { error: 'Supabase not configured' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) return { error: error.message }

    return { user: data.user }
  },

  async signOut() {
    if (!isConfigured) {
      return
    }

    await supabase.auth.signOut()
  },

  async getCurrentUser() {
    if (!isConfigured) {
      return null
    }

    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getSession() {
    if (!isConfigured) {
      return null
    }

    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  onAuthStateChange(callback) {
    if (!isConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }

    return supabase.auth.onAuthStateChange(callback)
  },

  async updateProfile(updates) {
    if (!isConfigured) {
      return { error: 'Supabase not configured' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) return { error: error.message }
    return { success: true }
  },

  async uploadAvatar(file) {
    if (!isConfigured) {
      return { error: 'Supabase not configured' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const fileName = `${user.id}/avatar.${file.name.split('.').pop()}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    await supabaseAuth.updateProfile({ avatar_url: publicUrl })

    return { url: publicUrl }
  },

  async getProfile(userId) {
    if (!isConfigured) {
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return null
    return data
  }
}

export const useSupabaseAuth = () => {
  const signUp = (email, password, username) => supabaseAuth.signUp(email, password, username)
  const signIn = (email, password) => supabaseAuth.signIn(email, password)
  const signOut = () => supabaseAuth.signOut()
  const getCurrentUser = () => supabaseAuth.getCurrentUser()
  const getSession = () => supabaseAuth.getSession()
  const updateProfile = (updates) => supabaseAuth.updateProfile(updates)
  const uploadAvatar = (file) => supabaseAuth.uploadAvatar(file)

  return {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getSession,
    updateProfile,
    uploadAvatar,
    isConfigured: supabaseAuth.isConfigured
  }
}