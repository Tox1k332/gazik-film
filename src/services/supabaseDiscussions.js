import { supabase, isConfigured } from './supabase'
import { discussionsService as localService, CATEGORIES } from './discussions'

export const supabaseDiscussions = {
  isConfigured,

  async getAll() {
    if (!isConfigured) {
      return localService.getAll()
    }

    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error, falling back to local:', error)
      return localService.getAll()
    }

    return data.map(d => ({
      id: d.id,
      title: d.title,
      author: d.author,
      authorId: d.author_id,
      avatar: d.avatar,
      category: d.category,
      likes: d.likes,
      likedBy: d.liked_by || [],
      replies: d.replies,
      time: d.created_at,
      createdAt: d.created_at
    }))
  },

  async getById(id) {
    if (!isConfigured) {
      return localService.getById(id)
    }

    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return localService.getById(id)

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      authorId: data.author_id,
      avatar: data.avatar,
      category: data.category,
      likes: data.likes,
      likedBy: data.liked_by || [],
      replies: data.replies,
      time: data.created_at,
      createdAt: data.created_at
    }
  },

  async create(title, author, avatar, category = 'general') {
    if (!isConfigured) {
      return localService.create(title, author, avatar, category)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('discussions')
      .insert({
        title,
        author_id: user.id,
        author: author.username || author,
        avatar: avatar,
        category
      })
      .select()
      .single()

    if (error) return { error: error.message }

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      authorId: data.author_id,
      avatar: data.avatar,
      category: data.category,
      likes: data.likes,
      likedBy: [],
      replies: 0,
      time: data.created_at,
      createdAt: data.created_at
    }
  },

  async delete(id) {
    if (!isConfigured) {
      return localService.delete(id)
    }

    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', id)

    if (error) console.error('Delete error:', error)
    return !error
  },

  async toggleLike(id, userId) {
    if (!isConfigured) {
      return localService.toggleLike(id, userId)
    }

    const { data, error } = await supabase
      .from('discussions')
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
      .from('discussions')
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

  async addReply(discussionId, author, avatar, text) {
    if (!isConfigured) {
      return localService.addReply(discussionId, author, avatar, text)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('replies')
      .insert({
        discussion_id: discussionId,
        author_id: user.id,
        author: author.username || author,
        avatar: avatar,
        text
      })
      .select()
      .single()

    if (error) return { error: error.message }

    await supabase.rpc('increment_replies', { discussion_id: discussionId })

    return {
      id: data.id,
      discussionId: data.discussion_id,
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

  async getReplies(discussionId) {
    if (!isConfigured) {
      return localService.getReplies(discussionId)
    }

    const { data, error } = await supabase
      .from('replies')
      .select('*')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })

    if (error) return localService.getReplies(discussionId)

    return data.map(r => ({
      id: r.id,
      discussionId: r.discussion_id,
      author: r.author,
      authorId: r.author_id,
      avatar: r.avatar,
      text: r.text,
      likes: r.likes,
      likedBy: r.liked_by || [],
      edited: r.edited,
      editedAt: r.edited_at,
      time: r.created_at
    }))
  },

  async updateReply(replyId, newText) {
    if (!isConfigured) {
      return localService.updateReply(replyId, newText)
    }

    const { error } = await supabase
      .from('replies')
      .update({ text: newText, edited: true, edited_at: new Date().toISOString() })
      .eq('id', replyId)

    return !error
  },

  async deleteReply(replyId) {
    if (!isConfigured) {
      return localService.deleteReply(replyId)
    }

    const { error } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId)

    return !error
  },

  async toggleReplyLike(replyId, userId) {
    if (!isConfigured) {
      return localService.toggleReplyLike(replyId, userId)
    }

    const { data, error } = await supabase
      .from('replies')
      .select('liked_by')
      .eq('id', replyId)
      .single()

    if (error) return null

    const likedBy = data.liked_by || []
    const isLiked = likedBy.includes(userId)
    const newLikedBy = isLiked
      ? likedBy.filter(u => u !== userId)
      : [...likedBy, userId]
    const newLikes = isLiked ? data.likes - 1 : data.likes + 1

    const { data: updated, error: updateError } = await supabase
      .from('replies')
      .update({ liked_by: newLikedBy, likes: newLikes })
      .eq('id', replyId)
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