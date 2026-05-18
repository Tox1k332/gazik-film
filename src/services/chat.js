const CHAT_KEY = 'film_haven_chat'
const MESSAGE_LIFETIME = 24 * 60 * 60 * 1000

const getChat = () => {
  const data = localStorage.getItem(CHAT_KEY)
  if (!data) return []
  const messages = JSON.parse(data)
  const now = Date.now()
  return messages.filter(m => now - new Date(m.time).getTime() < MESSAGE_LIFETIME)
}

const saveChat = (messages) => {
  const now = Date.now()
  const filtered = messages.filter(m => now - new Date(m.time).getTime() < MESSAGE_LIFETIME)
  localStorage.setItem(CHAT_KEY, JSON.stringify(filtered))
}

export const chatService = {
  getAll: () => {
    return getChat()
  },

  addMessage: (author, avatar, text) => {
    const messages = getChat()
    const newMessage = {
      id: Date.now(),
      author: author.username || author,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username || author}`,
      text,
      time: new Date().toISOString(),
      likes: 0,
      likedBy: []
    }
    messages.push(newMessage)
    saveChat(messages)
    return newMessage
  },

  editMessage: (id, newText) => {
    const messages = getChat()
    const message = messages.find(m => m.id === parseInt(id))
    if (message) {
      message.text = newText
      message.edited = true
      message.editedAt = new Date().toISOString()
      saveChat(messages)
    }
    return message
  },

  deleteMessage: (id) => {
    const messages = getChat()
    const index = messages.findIndex(m => m.id === parseInt(id))
    if (index !== -1) {
      messages.splice(index, 1)
      saveChat(messages)
    }
    return messages
  },

  toggleLike: (id, userId) => {
    const messages = getChat()
    const message = messages.find(m => m.id === parseInt(id))
    if (message) {
      const likedIndex = message.likedBy.indexOf(userId)
      if (likedIndex === -1) {
        message.likedBy.push(userId)
        message.likes++
      } else {
        message.likedBy.splice(likedIndex, 1)
        message.likes--
      }
      saveChat(messages)
    }
    return message
  },

  clear: () => {
    localStorage.removeItem(CHAT_KEY)
  }
}