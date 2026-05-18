const AVATAR_KEY = 'film_haven_avatar'

export const avatarService = {
  get: () => {
    return localStorage.getItem(AVATAR_KEY)
  },

  set: (base64Image) => {
    localStorage.setItem(AVATAR_KEY, base64Image)
  },

  clear: () => {
    localStorage.removeItem(AVATAR_KEY)
  }
}