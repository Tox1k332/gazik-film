import { supabase, isConfigured } from './supabase'
import { favoritesService as localService } from './favorites'

export const supabaseFavorites = {
  isConfigured,

  async getAll() {
    if (!isConfigured) {
      return localService.getAll()
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error, falling back to local:', error)
      return localService.getAll()
    }

    return data.map(f => ({
      id: f.id,
      movieId: f.movie_id,
      movieType: f.movie_type,
      movieTitle: f.movie_title,
      moviePoster: f.movie_poster,
      movieRating: f.movie_rating,
      time: f.created_at
    }))
  },

  async add(movie) {
    if (!isConfigured) {
      return localService.add(movie)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        movie_id: movie.id,
        movie_type: movie.type || 'movie',
        movie_title: movie.title,
        movie_poster: movie.poster,
        movie_rating: movie.rating
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'Already in favorites' }
      }
      return { error: error.message }
    }

    return {
      id: data.id,
      movieId: data.movie_id,
      movieType: data.movie_type,
      movieTitle: data.movie_title,
      moviePoster: data.movie_poster,
      movieRating: data.movie_rating,
      time: data.created_at
    }
  },

  async remove(movieId) {
    if (!isConfigured) {
      return localService.remove(movieId)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    return !error
  },

  async isFavorite(movieId) {
    if (!isConfigured) {
      return localService.isFavorite(movieId)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single()

    return !!data
  }
}