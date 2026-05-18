const COMMENTS_KEY = 'film_haven_comments'

const getComments = () => {
  const data = localStorage.getItem(COMMENTS_KEY)
  return data ? JSON.parse(data) : []
}

const saveComments = (comments) => {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments))
}

export const commentsService = {
  getAll: () => {
    return getComments()
  },

  getByMovie: (movieId) => {
    const comments = getComments()
    return comments.filter(c => c.movieId === movieId).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  },

  add: (movieId, movieTitle, moviePoster, author, avatar, text, rating) => {
    const comments = getComments()
    const newComment = {
      id: Date.now(),
      movieId,
      movieTitle,
      moviePoster,
      author: author.username,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`,
      text,
      rating: rating || 0,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      edited: false
    }
    comments.unshift(newComment)
    saveComments(comments)
    return newComment
  },

  edit: (commentId, newText) => {
    const comments = getComments()
    const comment = comments.find(c => c.id === parseInt(commentId))
    if (comment) {
      comment.text = newText
      comment.edited = true
      comment.editedAt = new Date().toISOString()
      saveComments(comments)
    }
    return comment
  },

  delete: (commentId) => {
    const comments = getComments()
    const index = comments.findIndex(c => c.id === parseInt(commentId))
    if (index !== -1) {
      comments.splice(index, 1)
      saveComments(comments)
    }
    return comments
  },

  toggleLike: (commentId, userId) => {
    const comments = getComments()
    const comment = comments.find(c => c.id === parseInt(commentId))
    if (comment) {
      const likedIndex = comment.likedBy.indexOf(userId)
      if (likedIndex === -1) {
        comment.likedBy.push(userId)
        comment.likes++
      } else {
        comment.likedBy.splice(likedIndex, 1)
        comment.likes--
      }
      saveComments(comments)
    }
    return comment
  },

  getStats: (movieId) => {
    const comments = getComments()
    const movieComments = comments.filter(c => c.movieId === movieId)
    const totalLikes = movieComments.reduce((sum, c) => sum + c.likes, 0)
    const avgRating = movieComments.length > 0 
      ? (movieComments.reduce((sum, c) => sum + c.rating, 0) / movieComments.length).toFixed(1)
      : 0
    return {
      count: movieComments.length,
      totalLikes,
      avgRating: parseFloat(avgRating)
    }
  }
}