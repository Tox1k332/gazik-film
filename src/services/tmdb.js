const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

const getImage = (path, size = 'w500') => path ? `${IMAGE_BASE}/${size}${path}` : null

const fetchTMDB = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.append('api_key', API_KEY)
  url.searchParams.append('language', 'ru-RU')

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value)
    }
  })

  const res = await fetch(url.toString(), {
    mode: 'cors',
    credentials: 'omit'
  })
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`)
  return res.json()
}

export const tmdb = {
getPopularMovies: async (page = 1) => {
    const data = await fetchTMDB('/movie/popular', { page })
    return data.results
      .filter(movie => !(movie.genre_ids || []).includes(16))
      .map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        year: movie.release_date?.split('-')[0] || '',
        rating: movie.vote_average?.toFixed(1),
        genre: movie.genre_ids?.[0],
        type: 'movie',
        poster: getImage(movie.poster_path),
        backdrop: getImage(movie.backdrop_path, 'original'),
        overview: movie.overview
      }))
  },

  getTrendingMovies: async (page = 1) => {
    const data = await fetchTMDB('/trending/movie/week', { page })
    return data.results
      .filter(movie => !(movie.genre_ids || []).includes(16))
      .map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        year: movie.release_date?.split('-')[0] || '',
        rating: movie.vote_average?.toFixed(1),
        type: 'movie',
        poster: getImage(movie.poster_path),
        backdrop: getImage(movie.backdrop_path, 'original')
      }))
  },

  getPopularTV: async (page = 1) => {
    const data = await fetchTMDB('/tv/popular', { page })
    return data.results.map(tv => ({
      id: tv.id,
      title: tv.name,
      originalTitle: tv.original_name,
      year: tv.first_air_date?.split('-')[0] || '',
      rating: tv.vote_average?.toFixed(1),
      genre: tv.genre_ids?.[0],
      type: 'tv',
      poster: getImage(tv.poster_path),
      backdrop: getImage(tv.backdrop_path, 'original'),
      overview: tv.overview
    }))
  },

  getAnime: async (page = 1) => {
    const data = await fetchTMDB('/discover/tv', {
      page,
      with_genres: 16,
      sort_by: 'popularity.desc'
    })
    return data.results.map(anime => ({
      id: anime.id,
      title: anime.name,
      originalTitle: anime.original_name,
      year: anime.first_air_date?.split('-')[0] || '',
      rating: anime.vote_average?.toFixed(1),
      genre: anime.genre_ids?.[0],
      type: 'anime',
      poster: getImage(anime.poster_path),
      backdrop: getImage(anime.backdrop_path, 'original'),
      overview: anime.overview
    }))
  },

  getCartoons: async (page = 1) => {
    const data = await fetchTMDB('/discover/movie', {
      page,
      with_genres: 16,
      sort_by: 'popularity.desc'
    })
    return data.results.map(cartoon => ({
      id: cartoon.id,
      title: cartoon.title,
      originalTitle: cartoon.original_title,
      year: cartoon.release_date?.split('-')[0] || '',
      rating: cartoon.vote_average?.toFixed(1),
      genre: cartoon.genre_ids?.[0],
      type: 'cartoon',
      poster: getImage(cartoon.poster_path),
      backdrop: getImage(cartoon.backdrop_path, 'original'),
      overview: cartoon.overview
    }))
  },

  search: async (query, page = 1) => {
    const data = await fetchTMDB('/search/multi', { query, page })
    return data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => ({
        id: item.id,
        title: item.title || item.name,
        originalTitle: item.original_title || item.original_name,
        year: (item.release_date || item.first_air_date)?.split('-')[0] || '',
        rating: item.vote_average?.toFixed(1),
        type: item.media_type === 'tv' ? 'tv' : 'movie',
        genre: item.genre_ids?.[0],
        poster: getImage(item.poster_path),
        backdrop: getImage(item.backdrop_path, 'original')
      }))
  },

  getGenres: async () => {
    const [movieGenres, tvGenres] = await Promise.all([
      fetchTMDB('/genre/movie/list'),
      fetchTMDB('/genre/tv/list')
    ])
    const merged = [
      ...(movieGenres.genres || []),
      ...(tvGenres.genres || []).filter(tg =>
        !(movieGenres.genres || []).some(mg => mg.id === tg.id)
      )
    ]
    return merged
    .filter(g => ![
      'боевики и приключения',
      'детский',
      'война и политика',
      'мыльная опера',
      'новости',
      'нф и фентези',
      'реалити-шоу',
      'ток-шоу'
    ].includes(g.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  },

  getMovieDetails: async (id) => {
    const data = await fetchTMDB(`/movie/${id}`, { append_to_response: 'genres,collection' })
    return {
      id: data.id,
      title: data.title,
      originalTitle: data.original_title,
      year: data.release_date?.split('-')[0] || '',
      rating: data.vote_average?.toFixed(1),
      voteCount: data.vote_count,
      genres: (data.genres || []).map(g => g.name),
      runtime: data.runtime,
      overview: data.overview,
      tagline: data.tagline,
      poster: getImage(data.poster_path, 'w500'),
      backdrop: getImage(data.backdrop_path, 'original'),
      budget: data.budget,
      revenue: data.revenue,
      status: data.status,
      language: data.original_language,
      homepage: data.homepage,
      type: 'movie',
      collection: data.belongs_to_collection ? {
        id: data.belongs_to_collection.id,
        name: data.belongs_to_collection.name,
        poster: getImage(data.belongs_to_collection.poster_path, 'w500'),
        backdrop: getImage(data.belongs_to_collection.backdrop_path, 'original')
      } : null
    }
  },

  getTVDetails: async (id) => {
    const data = await fetchTMDB(`/tv/${id}`, { append_to_response: 'genres' })
    return {
      id: data.id,
      title: data.name,
      originalTitle: data.original_name,
      year: data.first_air_date?.split('-')[0] || '',
      rating: data.vote_average?.toFixed(1),
      voteCount: data.vote_count,
      genres: (data.genres || []).map(g => g.name),
      episodes: data.number_of_episodes,
      seasons: data.number_of_seasons,
      overview: data.overview,
      tagline: '',
      poster: getImage(data.poster_path, 'w500'),
      backdrop: getImage(data.backdrop_path, 'original'),
      status: data.status,
      language: data.original_language,
      homepage: data.homepage,
      type: 'tv'
    }
  },

  getAnimeDetails: async (id) => {
    const data = await fetchTMDB(`/tv/${id}`, { append_to_response: 'genres' })
    return {
      id: data.id,
      title: data.name,
      originalTitle: data.original_name,
      year: data.first_air_date?.split('-')[0] || '',
      rating: data.vote_average?.toFixed(1),
      voteCount: data.vote_count,
      genres: (data.genres || []).map(g => g.name),
      episodes: data.number_of_episodes,
      seasons: data.number_of_seasons,
      overview: data.overview,
      tagline: '',
      poster: getImage(data.poster_path, 'w500'),
      backdrop: getImage(data.backdrop_path, 'original'),
      status: data.status,
      language: data.original_language,
      homepage: data.homepage,
      type: 'anime'
    }
  },

  getCartoonDetails: async (id) => {
    const data = await fetchTMDB(`/movie/${id}`, { append_to_response: 'genres,collection' })
    return {
      id: data.id,
      title: data.title,
      originalTitle: data.original_title,
      year: data.release_date?.split('-')[0] || '',
      rating: data.vote_average?.toFixed(1),
      voteCount: data.vote_count,
      genres: (data.genres || []).map(g => g.name),
      runtime: data.runtime,
      overview: data.overview,
      tagline: data.tagline,
      poster: getImage(data.poster_path, 'w500'),
      backdrop: getImage(data.backdrop_path, 'original'),
      budget: data.budget,
      revenue: data.revenue,
      status: data.status,
      language: data.original_language,
      homepage: data.homepage,
      type: 'cartoon',
      collection: data.belongs_to_collection ? {
        id: data.belongs_to_collection.id,
        name: data.belongs_to_collection.name,
        poster: getImage(data.belongs_to_collection.poster_path, 'w500'),
        backdrop: getImage(data.belongs_to_collection.backdrop_path, 'original')
      } : null
    }
  },

  getCredits: async (id, type = 'movie') => {
    const endpoint = type === 'tv' || type === 'anime' ? `/tv/${id}/credits` : `/movie/${id}/credits`
    const data = await fetchTMDB(endpoint)
    return {
      cast: (data.cast || []).slice(0, 15).map(person => ({
        id: person.id,
        name: person.name,
        character: person.character || '',
        profile: getImage(person.profile_path, 'w185')
      })),
      crew: (data.crew || []).filter(c => c.job === 'Director' || c.job === 'Producer' || c.job === 'Writer').slice(0, 5).map(person => ({
        id: person.id,
        name: person.name,
        job: person.job
      }))
    }
  },

getSimilar: async (id, type = 'movie', page = 1) => {
     let endpoint
     if (type === 'tv' || type === 'anime') {
       endpoint = `/tv/${id}/similar`
     } else {
       endpoint = `/movie/${id}/similar`
     }
     const ANIME_GENRE = 16
     const data = await fetchTMDB(endpoint, { page })
return (data.results || []).slice(0, 12).map(item => {
       const genreIds = item.genre_ids || []
       const mediaType = item.media_type
       let resolvedType
       if (mediaType === 'tv') {
         resolvedType = genreIds.includes(ANIME_GENRE) ? 'anime' : 'tv'
       } else if (mediaType === 'movie') {
         resolvedType = genreIds.includes(ANIME_GENRE) ? 'cartoon' : 'movie'
       } else {
         const isTvEndpoint = type === 'tv' || type === 'anime'
         resolvedType = genreIds.includes(ANIME_GENRE)
           ? (isTvEndpoint ? 'anime' : 'cartoon')
           : (isTvEndpoint ? 'tv' : 'movie')
       }
       return {
         id: item.id,
         title: item.title || item.name,
         originalTitle: item.original_title || item.original_name,
         year: (item.release_date || item.first_air_date)?.split('-')[0] || '',
         rating: item.vote_average?.toFixed(1),
         poster: getImage(item.poster_path),
         backdrop: getImage(item.backdrop_path),
         overview: item.overview,
         type: resolvedType,
         genre: genreIds[0]
       }
     })
   },

  getByGenre: async (type, page = 1, genreId = null) => {
    let endpoint
    if (type === 'tv' || type === 'anime') {
      endpoint = '/discover/tv'
    } else {
      endpoint = '/discover/movie'
    }
    const params = { page, sort_by: 'popularity.desc' }
    if (genreId && genreId !== 'all') params.with_genres = genreId
    const data = await fetchTMDB(endpoint, params)
    return {
      results: data.results.map(item => ({
        id: item.id,
        title: item.title || item.name,
        originalTitle: item.original_title || item.original_name,
        year: (item.release_date || item.first_air_date)?.split('-')[0] || '',
        rating: item.vote_average?.toFixed(1),
        genre: item.genre_ids?.[0],
        type,
        poster: getImage(item.poster_path),
        backdrop: getImage(item.backdrop_path, 'original'),
        overview: item.overview
      })),
      total_pages: data.total_pages
    }
  },

  getVideos: async (id, type = 'movie') => {
    const endpoint = type === 'tv' || type === 'anime' ? `/tv/${id}/videos` : `/movie/${id}/videos`
    try {
      const data = await fetchTMDB(endpoint)
      return (data.results || []).filter(v => v.type === 'Trailer' || v.type === 'Teaser').slice(0, 3)
    } catch {
      return []
    }
  },

  getCollection: async (collectionId) => {
    try {
      const data = await fetchTMDB(`/collection/${collectionId}`)
      return {
        id: data.id,
        name: data.name,
        overview: data.overview,
        poster: getImage(data.poster_path, 'w500'),
        backdrop: getImage(data.backdrop_path, 'original'),
        parts: (data.parts || []).map(part => ({
          id: part.id,
          title: part.title,
          originalTitle: part.original_title,
          year: part.release_date?.split('-')[0] || '',
          rating: part.vote_average?.toFixed(1),
          poster: getImage(part.poster_path, 'w500'),
          overview: part.overview,
          type: 'movie'
        })).sort((a, b) => (a.year || '').localeCompare(b.year || ''))
      }
    } catch {
      return null
    }
  },

  getRandomMovie: async (minRating = 5.5) => {
    const allMovies = []
    const pagesToFetch = 50
    
    const pagesToLoad = 5
    const selectedPages = []
    while (selectedPages.length < pagesToLoad) {
      const p = Math.floor(Math.random() * pagesToFetch) + 1
      if (!selectedPages.includes(p)) selectedPages.push(p)
    }
    
    for (const page of selectedPages) {
      const data = await fetchTMDB('/discover/movie', {
        page,
        sort_by: 'vote_count.desc',
        'vote_average.gte': minRating,
        'vote_count.gte': 100
      })
      
      const movies = (data.results || [])
        .filter(movie => movie.vote_average >= minRating && movie.poster_path)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          originalTitle: movie.original_title,
          year: movie.release_date?.split('-')[0] || '',
          rating: movie.vote_average?.toFixed(1),
          type: 'movie',
          poster: getImage(movie.poster_path),
          backdrop: getImage(movie.backdrop_path, 'original')
        }))
      
      allMovies.push(...movies)
    }
    
    if (allMovies.length === 0) {
      return null
    }
    
    const randomIndex = Math.floor(Math.random() * allMovies.length)
    return allMovies[randomIndex]
  }
}

export { getImage }