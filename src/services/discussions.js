const DISCUSSIONS_KEY = 'film_haven_discussions'

export const CATEGORIES = [
  { id: 'films', label: 'Фильмы', icon: '🎬' },
  { id: 'series', label: 'Сериалы', icon: '📺' },
  { id: 'anime', label: 'Аниме', icon: '🎌' },
  { id: 'cartoons', label: 'Мультфильмы', icon: '🎨' },
  { id: 'general', label: 'Общее', icon: '💬' },
  { id: 'help', label: 'Помощь', icon: '❓' }
]

const getDiscussions = () => {
  const data = localStorage.getItem(DISCUSSIONS_KEY)
  return data ? JSON.parse(data) : []
}

const saveDiscussions = (discussions) => {
  localStorage.setItem(DISCUSSIONS_KEY, JSON.stringify(discussions))
}

export const discussionsService = {
  getAll: () => {
    return getDiscussions()
  },

  getById: (id) => {
    const discussions = discussionsService.getAll()
    return discussions.find(d => d.id === parseInt(id))
  },

  getByCategory: (category) => {
    const discussions = getDiscussions()
    return discussions.filter(d => d.category === category)
  },

  search: (query) => {
    const discussions = getDiscussions()
    const lowerQuery = query.toLowerCase()
    return discussions.filter(d =>
      d.title.toLowerCase().includes(lowerQuery) ||
      d.author.toLowerCase().includes(lowerQuery)
    )
  },

  create: (title, author, avatar, category = 'general') => {
    const discussions = getDiscussions()
    const newDiscussion = {
      id: Date.now(),
      title,
      author: author.username,
      replies: 0,
      likes: 0,
      likedBy: [],
      time: new Date().toISOString(),
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`,
      category,
      createdAt: new Date().toISOString()
    }
    discussions.unshift(newDiscussion)
    saveDiscussions(discussions)
    return newDiscussion
  },

  toggleLike: (id, userId) => {
    const discussions = getDiscussions()
    const discussion = discussions.find(d => d.id === parseInt(id))
    if (discussion) {
      const likedIndex = discussion.likedBy.indexOf(userId)
      if (likedIndex === -1) {
        discussion.likedBy.push(userId)
        discussion.likes++
      } else {
        discussion.likedBy.splice(likedIndex, 1)
        discussion.likes--
      }
      saveDiscussions(discussions)
    }
    return discussion
  },

  delete: (id) => {
    const discussions = getDiscussions()
    const index = discussions.findIndex(d => d.id === parseInt(id))
    if (index !== -1) {
      discussions.splice(index, 1)
      saveDiscussions(discussions)
    }
    return discussions
  },

  addReply: (discussionId, author, avatar, text) => {
    const discussions = getDiscussions()
    const discussion = discussions.find(d => d.id === parseInt(discussionId))
    
    if (!discussion) return null
    
    const replies = discussion.repliesList || []
    replies.push({
      id: Date.now(),
      author: author.username,
      text,
      time: new Date().toISOString(),
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`,
      likes: 0,
      likedBy: [],
      edited: false
    })
    
    discussion.repliesList = replies
    discussion.replies = replies.length
    
    saveDiscussions(discussions)
    return replies
  },

  editReply: (discussionId, replyId, newText) => {
    const discussions = getDiscussions()
    const discussion = discussions.find(d => d.id === parseInt(discussionId))
    
    if (!discussion) return null
    
    const reply = discussion.repliesList?.find(r => r.id === parseInt(replyId))
    if (reply) {
      reply.text = newText
      reply.edited = true
      reply.editedAt = new Date().toISOString()
      saveDiscussions(discussions)
    }
    return discussion.repliesList
  },

  deleteReply: (discussionId, replyId) => {
    const discussions = getDiscussions()
    const discussion = discussions.find(d => d.id === parseInt(discussionId))
    
    if (!discussion) return null
    
    if (discussion.repliesList) {
      const index = discussion.repliesList.findIndex(r => r.id === parseInt(replyId))
      if (index !== -1) {
        discussion.repliesList.splice(index, 1)
        discussion.replies = discussion.repliesList.length
        saveDiscussions(discussions)
      }
    }
    return discussion.repliesList
  },

  toggleReplyLike: (discussionId, replyId, userId) => {
    const discussions = getDiscussions()
    const discussion = discussions.find(d => d.id === parseInt(discussionId))
    
    if (!discussion) return null
    
    const reply = discussion.repliesList?.find(r => r.id === parseInt(replyId))
    if (reply) {
      const likedIndex = reply.likedBy.indexOf(userId)
      if (likedIndex === -1) {
        reply.likedBy.push(userId)
        reply.likes++
      } else {
        reply.likedBy.splice(likedIndex, 1)
        reply.likes--
      }
      saveDiscussions(discussions)
    }
    return reply
  },

  getReplies: (discussionId) => {
    const discussion = discussionsService.getById(discussionId)
    return discussion?.repliesList || []
  }
}