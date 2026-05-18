import { reactive } from 'vue'

// Simple comments store persisted in localStorage
const STORAGE_KEY = 'gazik-film-comments'

function load() {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    return json ? JSON.parse(json) : {}
  } catch {
    return {}
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const state = reactive(load())

export function useCommentsStore() {
  const getComments = (movieId) => {
    return state[movieId] ?? []
  }

  const addComment = (movieId, { author, text }) => {
    const comment = {
      id: Date.now(),
      author,
      text,
      date: new Date().toLocaleString()
    }
    const list = state[movieId] ?? []
    list.push(comment)
    state[movieId] = list
    save(state)
  }

  return { getComments, addComment }
}
