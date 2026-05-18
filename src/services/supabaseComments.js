import { supabase, isConfigured } from './supabase'
import { commentsService as localService } from './comments'

export const supabaseComments = {
  isConfigured,

  async getByMovie(movieId, movieType = 'movie') {
    if (!isConfigured) {
      return localService.getByMovie(movieId, movieType)
    }

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('movie_id', movieId)
      .eq('movie_type', movieType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error, falling back to local:', error)
      return localService.getByMovie(movieId, movieType)
    }

    return data.map(c => ({
      id: c.id,
      movieId: c.movie_id,
      movieType: c.movie_type,
      author: c.author,
      authorId: c.author_id,
      avatar: c.avatar,
      text: c.text,
      rating: c.rating,
      likes: c.likes,
      likedBy: c.liked_by || [],
      edited: c.edited,
      editedAt: c.edited_at,
      time: c.created_at
    }))
  },

  async add(movieId, author, avatar, text, rating = 0, movieType = 'movie') {
    if (!isConfigured) {
      return localService.add(movieId, author, avatar, text, rating, movieType)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        movie_id: movieId,
        movie_type: movieType,
        author_id: user.id,
        author: author.username || author,
        avatar: avatar,
        text: text,
        rating: rating
      })
      .select()
      .single()

    if (error) return { error: error.message }

    return {
      id: data.id,
      movieId: data.movie_id,
      movieType: data.movie_type,
      author: data.author,
      authorId: data.author_id,
      avatar: data.avatar,
      text: data.text,
      rating: data.rating,
      likes: 0,
      likedBy: [],
      edited: false,
      time: data.created_at
    }
  },

  async update(id, newText) {
    if (!isConfigured) {
      return localService.update(id, newText)
    }

    const { error } = await supabase
      .from('comments')
      .update({ 
        text: newText, 
        edited: true, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', id)

    return !error
  },

  async delete(id) {
    if (!isConfigured) {
      return localService.delete(id)
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    return !error
  },

  async toggleLike(id, userId) {
    if (!isConfigured) {
      return localService.toggleLike(id, userId)
    }

    const { data, error } = await supabase
      .from('comments')
      .select('liked_by')
      .eq('id', id)
      .single()

    if (error) return null

    const likedBy = data.liked_by || []
    const isLiked = likedBy.includes(userId)
    const newLikedBy = isLiked
      ? likedBy.filter(u => u !== userId)
      : [...likedBy, userId]
    const newLikes = isLiked ? data.likes - 1 : data.likes + 1

    const { data: updated, error: updateError } = await supabase
      .from('comments')
      .update({ liked_by: newLikedBy, likes: newLikes })
      .eq('id', id)
      .select()
      .single()

    if (updateError) return null

    return {
      id: updated.id,
      likes: updated.likes,
      likedBy: updated.liked_by
    }
  }
}