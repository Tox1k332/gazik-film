import { supabase, isConfigured } from './supabase'
import { chatService as localService } from './chat'

export const supabaseChat = {
  isConfigured,

  async getAll() {
    if (!isConfigured) {
      return localService.getAll()
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error, falling back to local:', error)
      return localService.getAll()
    }

    return data.map(m => ({
      id: m.id,
      author: m.author,
      authorId: m.author_id,
      avatar: m.avatar,
      text: m.text,
      likes: m.likes,
      likedBy: m.liked_by || [],
      edited: m.edited,
      editedAt: m.edited_at,
      time: m.created_at
    }))
  },

  async addMessage(author, avatar, text) {
    if (!isConfigured) {
      return localService.addMessage(author, avatar, text)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        author_id: user.id,
        author: author.username || author,
        avatar: avatar,
        text
      })
      .select()
      .single()

    if (error) return { error: error.message }

    return {
      id: data.id,
      author: data.author,
      authorId: data.author_id,
      avatar: data.avatar,
      text: data.text,
      likes: 0,
      likedBy: [],
      edited: false,
      time: data.created_at
    }
  },

  async editMessage(id, newText) {
    if (!isConfigured) {
      return localService.editMessage(id, newText)
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({ 
        text: newText, 
        edited: true, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', id)

    return !error
  },

  async deleteMessage(id) {
    if (!isConfigured) {
      return localService.deleteMessage(id)
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id)

    return !error
  },

  async toggleLike(id, userId) {
    if (!isConfigured) {
      return localService.toggleLike(id, userId)
    }

    const { data, error } = await supabase
      .from('chat_messages')
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
      .from('chat_messages')
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
  },

  subscribeToMessages(callback) {
    if (!isConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }

    return supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          callback({
            id: payload.new.id,
            author: payload.new.author,
            authorId: payload.new.author_id,
            avatar: payload.new.avatar,
            text: payload.new.text,
            likes: 0,
            likedBy: [],
            edited: false,
            time: payload.new.created_at
          })
        }
      )
      .subscribe()
  }
}