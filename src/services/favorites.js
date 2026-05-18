const FAVORITES_KEY = 'film_haven_favorites'

const getFavorites = () => {
  const data = localStorage.getItem(FAVORITES_KEY)
  return data ? JSON.parse(data) : []
}

const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export const favoritesService = {
  getAll: () => {
    return getFavorites()
  },

  add: (movie) => {
    const favorites = getFavorites()
    const exists = favorites.find(f => f.id === movie.id)
    
    if (!exists) {
      favorites.unshift({
        ...movie,
        addedAt: new Date().toISOString()
      })
      saveFavorites(favorites)
    }
    return favorites
  },

  remove: (movieId) => {
    const favorites = getFavorites()
    const index = favorites.findIndex(f => f.id === movieId)
    
    if (index !== -1) {
      favorites.splice(index, 1)
      saveFavorites(favorites)
    }
    return favorites
  },

  isFavorite: (movieId) => {
    const favorites = getFavorites()
    return favorites.some(f => f.id === movieId)
  },

  getByType: (type) => {
    const favorites = getFavorites()
    return favorites.filter(f => f.type === type)
  },

  search: (query) => {
    const favorites = getFavorites()
    const lowerQuery = query.toLowerCase()
    return favorites.filter(f => 
      f.title.toLowerCase().includes(lowerQuery)
    )
  },

  clear: () => {
    localStorage.removeItem(FAVORITES_KEY)
  }
}