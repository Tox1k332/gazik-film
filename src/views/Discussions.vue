<script setup>
import { MessageCircle, Lock, Heart, Search, X, Edit2, Trash2, MoreVertical, ChevronDown, TrendingUp, Clock, AlertTriangle, Send } from 'lucide-vue-next'
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { discussionsService, CATEGORIES } from '../services/discussions'
import { chatService } from '../services/chat'
import { avatarService } from '../services/avatar'
import EmojiPicker from '../components/EmojiPicker.vue'

const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user.value)

const discussions = ref([])
const filteredDiscussions = ref([])
const newTopic = ref('')
const selectedCategory = ref('all')
const searchQuery = ref('')
const showCategoryDropdown = ref(false)

const chatMessages = ref([])
const newChatMessage = ref('')
const editingMessageId = ref(null)
const editMessageText = ref('')
const showMessageMenu = ref(null)
const hoveredMessage = ref(null)
const isTyping = ref(false)
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

const botNames = ['MovieGeek', 'SerialViewer', 'AnimeAddict', 'CinephilePro', 'FilmFan99', 'TVShowHunter']
const botMessages = [
  'Согласен полностью!',
  'Кто-то ещё смотрит это?',
  'Отличный выбор!',
  'Советую посмотреть "Начало" - не пожалеете',
  'А я бы добавил ещё один фильм в список',
  'Это просто невероятно!',
  'Наконец-то нормальное кино',
  'Ждал этого давно',
  'Кто смотрел всё части?',
  'Лучшее, что я видел за этот год',
  'Такое редко встретишь',
  'Нужно посмотреть на выходных',
]

const categoryIcon = computed(() => {
  const cat = CATEGORIES.find(c => c.id === selectedCategory.value)
  return cat?.icon || '💬'
})

const sortBy = ref('newest')
const visibleCount = ref(5)
const showAll = ref(false)

const sortedDiscussions = computed(() => {
  const filtered = filteredDiscussions.value
  let sorted
  if (sortBy.value === 'popular') {
    sorted = [...filtered].sort((a, b) => {
      const scoreA = a.likes + a.replies * 2
      const scoreB = b.likes + b.replies * 2
      return scoreB - scoreA
    })
  } else {
    sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  return sorted
})

const visibleDiscussions = computed(() => {
  if (showAll.value) return sortedDiscussions.value
  return sortedDiscussions.value.slice(0, visibleCount.value)
})

const loadMore = () => {
  visibleCount.value += 5
}

const scrollToBottom = () => {
  nextTick(() => {
    const chatContainer = document.querySelector('.chat-messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
}

watch([searchQuery, selectedCategory, sortBy], () => {
  filterDiscussions()
})

const filterDiscussions = () => {
  let result = discussions.value
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(d => d.category === selectedCategory.value)
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(d => 
      d.title.toLowerCase().includes(query) ||
      d.author.toLowerCase().includes(query)
    )
  }
  
  filteredDiscussions.value = result
}

const getCategoryLabel = (categoryId) => {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  return cat ? `${cat.icon} ${cat.label}` : categoryId
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`
  return date.toLocaleDateString('ru-RU')
}

const addChatMessage = () => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  if (!newChatMessage.value.trim()) return
  
  const customAvatar = avatarService.get()
  chatService.addMessage(
    currentUser.value,
    customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value.username}`,
    newChatMessage.value.trim()
  )
  chatMessages.value = chatService.getAll()
  newChatMessage.value = ''
  scrollToBottom()
}

const startEditMessage = (msg) => {
  editingMessageId.value = msg.id
  editMessageText.value = msg.text
  showMessageMenu.value = null
}

const saveEditMessage = () => {
  if (!editMessageText.value.trim()) return
  chatService.editMessage(editingMessageId.value, editMessageText.value.trim())
  chatMessages.value = chatService.getAll()
  editingMessageId.value = null
  editMessageText.value = ''
}

const cancelEditMessage = () => {
  editingMessageId.value = null
  editMessageText.value = ''
}

const deleteMessage = (id) => {
  chatService.deleteMessage(id)
  chatMessages.value = chatService.getAll()
  showMessageMenu.value = null
}

const menuPosition = ref({ top: '0px', left: '0px' })
const menuJustOpened = ref(false)

const toggleMessageMenu = (msgId, event) => {
  event.stopPropagation()
  event.preventDefault()
  
  if (showMessageMenu.value === msgId) {
    showMessageMenu.value = null
    return
  }
  
  const btn = event.currentTarget
  const rect = btn.getBoundingClientRect()
  menuPosition.value = {
    top: rect.bottom + 8 + 'px',
    left: Math.min(rect.left, window.innerWidth - 180) + 'px'
  }
  showMessageMenu.value = msgId
  menuJustOpened.value = true
  setTimeout(() => { menuJustOpened.value = false }, 100)
}

const toggleMessageLike = (msg) => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  chatService.toggleLike(msg.id, currentUser.value.username)
  chatMessages.value = chatService.getAll()
}

const isMessageLiked = (msg) => {
  return currentUser.value && msg.likedBy?.includes(currentUser.value.username)
}

const sendBotMessage = () => {
  const randomBot = botNames[Math.floor(Math.random() * botNames.length)]
  const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)]
  
  chatService.addMessage(
    randomBot,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomBot}`,
    randomMsg
  )
  chatMessages.value = chatService.getAll()
  scrollToBottom()
}

const openTopic = (id) => {
  router.push(`/discussions/${id}`)
}

const createTopic = () => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  
  if (!newTopic.value.trim()) return
  
  const customAvatar = avatarService.get()
  const avatar = customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value.username}`
  const category = selectedCategory.value === 'all' ? 'general' : selectedCategory.value
  discussionsService.create(newTopic.value, currentUser.value, avatar, category)
  discussions.value = discussionsService.getAll()
  filterDiscussions()
  newTopic.value = ''
}

const toggleTopicLike = (topic, event) => {
  event.stopPropagation()
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  discussionsService.toggleLike(topic.id, currentUser.value.username)
  discussions.value = discussionsService.getAll()
  filterDiscussions()
}

const isTopicOwner = (topic) => {
  return currentUser.value && topic.author === currentUser.value.username
}

const isTopicLiked = (topic) => {
  return currentUser.value && topic.likedBy?.includes(currentUser.value.username)
}

const openDeleteModal = (id) => {
  console.log('Opening delete modal for id:', id)
  deleteTargetId.value = id
  showDeleteModal.value = true
  console.log('deleteTargetId:', deleteTargetId.value)
}

const confirmDelete = () => {
  console.log('Deleting topic:', deleteTargetId.value)
  const idToDelete = deleteTargetId.value
  discussionsService.delete(idToDelete)
  discussions.value = discussionsService.getAll()
  filteredDiscussions.value = discussions.value.filter(d => 
    selectedCategory.value === 'all' || d.category === selectedCategory.value
  )
  showDeleteModal.value = false
  deleteTargetId.value = null
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

let botInterval = null

onMounted(() => {
  discussions.value = discussionsService.getAll()
  filterDiscussions()
  chatMessages.value = chatService.getAll()
  scrollToBottom()
  
  botInterval = setInterval(() => {
    if (Math.random() > 0.4) {
      sendBotMessage()
    }
  }, 4000)

  document.addEventListener('click', (e) => {
    if (menuJustOpened.value) return
    if (!e.target.closest('.floating-menu') && !e.target.closest('.menu-trigger')) {
      showMessageMenu.value = null
    }
  })
})

const isOwnMessage = (msg) => {
  return currentUser.value && msg.author === currentUser.value.username
}
</script>

<template>
  <div class="discussions">
    <div class="container">
      <h1 class="page-title">Обсуждения</h1>
      <p class="page-subtitle">Общайтесь с другими киноманами</p>
      
      <div class="discussions-layout">
        <div class="discussions-list">
          <div class="create-post">
            <template v-if="currentUser">
              <div class="category-select">
                <button class="category-btn" @click="showCategoryDropdown = !showCategoryDropdown">
                  {{ categoryIcon }} {{ getCategoryLabel(selectedCategory) }}
                  <ChevronDown :size="16" />
                </button>
                <div v-if="showCategoryDropdown" class="category-dropdown">
                  <button 
                    v-for="cat in [{ id: 'all', label: 'Все категории', icon: '📋' }, ...CATEGORIES]"
                    :key="cat.id"
                    @click="selectedCategory = cat.id; showCategoryDropdown = false"
                    :class="{ active: selectedCategory === cat.id }"
                  >
                    {{ cat.icon }} {{ cat.label }}
                  </button>
                </div>
              </div>
              <textarea v-model="newTopic" placeholder="Начните обсуждение..." rows="2"></textarea>
              <div class="textarea-footer">
                <EmojiPicker v-model="newTopic" />
              </div>
              <button class="btn btn-primary" @click="createTopic" :disabled="!newTopic.trim()">
                Создать тему
              </button>
            </template>
            <template v-else>
              <div class="login-prompt">
                <Lock :size="16" />
                <span>Войдите, чтобы создавать темы</span>
                <button @click="router.push('/auth')" class="btn btn-primary btn-sm">Войти</button>
              </div>
            </template>
          </div>
          
          <div class="search-filter-bar">
            <div class="search-bar">
              <Search :size="18" class="search-icon" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Поиск тем..."
                class="search-input"
              />
              <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
                <X :size="16" />
              </button>
            </div>
            <div class="sort-buttons">
              <button 
                class="sort-btn" 
                :class="{ active: sortBy === 'newest' }"
                @click="sortBy = 'newest'"
              >
                <Clock :size="14" /> Новые
              </button>
              <button 
                class="sort-btn" 
                :class="{ active: sortBy === 'popular' }"
                @click="sortBy = 'popular'"
              >
                <TrendingUp :size="14" /> Популярные
              </button>
            </div>
          </div>
          
          <div class="topics">
            <div 
              v-for="topic in visibleDiscussions" 
              :key="topic.id" 
              class="topic-card" 
              :class="{ own: isTopicOwner(topic) }"
            >
              <img :src="topic.avatar" :alt="topic.author" class="avatar" @click="openTopic(topic.id)" />
              <div class="topic-content" @click="openTopic(topic.id)">
                <div class="topic-header">
                  <h3 class="topic-title">{{ topic.title }}</h3>
                  <span class="topic-category">{{ getCategoryLabel(topic.category) }}</span>
                </div>
                <div class="topic-meta">
                  <span class="author">@{{ topic.author }}</span>
                  <span class="time">{{ formatTime(topic.time) }}</span>
                </div>
              </div>
              <div class="topic-actions">
                <div class="topic-stats">
                  <button 
                    class="stat-btn like-btn" 
                    :class="{ liked: isTopicLiked(topic) }"
                    @click="toggleTopicLike(topic, $event)"
                  >
                    <Heart :size="16" :fill="isTopicLiked(topic) ? 'currentColor' : 'none'" />
                    <span>{{ topic.likes }}</span>
                  </button>
                  <span class="replies"><MessageCircle :size="16" /> {{ topic.replies }}</span>
                </div>
                <button 
                  v-if="isTopicOwner(topic)" 
                  class="delete-topic-btn"
                  @click="openDeleteModal(topic.id)"
                  title="Удалить тему"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
            <div v-if="filteredDiscussions.length === 0" class="empty-state">
              <p>Ничего не найдено</p>
            </div>
            <div v-if="sortedDiscussions.length > visibleCount && !showAll" class="load-more">
              <button class="btn btn-secondary" @click="visibleCount += 5">
                Показать ещё ({{ sortedDiscussions.length - visibleCount }})
              </button>
            </div>
            <button v-if="showAll && sortedDiscussions.length > 5" class="btn btn-secondary show-less" @click="showAll = false; visibleCount = 5">
              Свернуть
            </button>
          </div>
        </div>
        
        <div class="chat-section">
          <div class="chat-header">
            <div class="chat-header-left">
              <h3><MessageCircle :size="18" /> Общий чат</h3>
              <span class="online-count">💬 Онлайн</span>
            </div>
            <div class="online-users">
              <img v-for="(msg, i) in chatMessages.slice(-5)" :key="i" :src="msg.avatar" class="online-avatar" :title="msg.author" />
            </div>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div 
              v-for="msg in chatMessages" 
              :key="msg.id" 
              class="message"
              :class="{ own: isOwnMessage(msg) }"
            >
              <img :src="msg.avatar" :alt="msg.author" class="message-avatar" />
              <div class="message-body">
                <div class="message-header">
                  <span class="message-author" :class="{ own: isOwnMessage(msg) }">{{ msg.author }}</span>
                  <span class="message-time">{{ formatTime(msg.time) }}</span>
                </div>
                <div class="message-bubble">
                  <template v-if="editingMessageId === msg.id">
                    <div class="edit-form">
                      <input 
                        v-model="editMessageText" 
                        @keyup.enter="saveEditMessage"
                        @keyup.escape="cancelEditMessage"
                        class="edit-input"
                      />
                      <div class="edit-actions">
                        <button @click="saveEditMessage" class="save-btn">✓</button>
                        <button @click="cancelEditMessage" class="cancel-btn">✕</button>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <p class="message-text">
                      {{ msg.text }}
                      <span v-if="msg.edited" class="edited-label">(ред.)</span>
                    </p>
                  </template>
                </div>
                <div class="message-footer">
                  <button 
                    class="action-btn like-btn" 
                    :class="{ liked: isMessageLiked(msg) }"
                    @click="toggleMessageLike(msg)"
                  >
                    <Heart :size="12" :fill="isMessageLiked(msg) ? 'currentColor' : 'none'" />
                    <span v-if="msg.likes">{{ msg.likes }}</span>
                  </button>
                  <button 
                    v-if="isOwnMessage(msg)" 
                    class="action-btn menu-trigger"
                    @click.stop="toggleMessageMenu(msg.id, $event)"
                  >
                    <MoreVertical :size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="showMessageMenu" class="floating-menu" :style="menuPosition">
            <button @click="startEditMessage(chatMessages.find(m => m.id === showMessageMenu))">
              <Edit2 :size="14" /> Изменить
            </button>
            <button @click="deleteMessage(showMessageMenu)" class="delete-btn">
              <Trash2 :size="14" /> Удалить
            </button>
          </div>
          <div class="chat-input">
            <template v-if="currentUser">
              <div class="chat-input-wrapper">
                <input 
                  v-model="newChatMessage" 
                  type="text" 
                  placeholder="Написать сообщение..."
                  @keyup.enter="addChatMessage"
                />
                <EmojiPicker v-model="newChatMessage" />
                <button @click="addChatMessage" class="send-btn">
                  <Send :size="18" />
                </button>
              </div>
            </template>
            <template v-else>
              <div class="login-prompt">
                <Lock :size="16" />
                <span>Войдите, чтобы писать в чат</span>
                <button @click="router.push('/auth')" class="btn btn-primary btn-sm">Войти</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <Teleport to="body">
    <div v-if="showDeleteModal" class="delete-modal-overlay" @click.self="cancelDelete">
      <div class="delete-modal">
        <div class="delete-modal-icon">
          <AlertTriangle :size="24" />
        </div>
        <h4>Удалить обсуждение?</h4>
        <p>Это действие нельзя отменить. Тема и все ответы будут удалены навсегда.</p>
        <div class="delete-modal-actions">
          <button class="btn btn-cancel" @click="cancelDelete">Отмена</button>
          <button class="btn btn-confirm" @click="confirmDelete">Удалить</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.discussions {
  padding: 40px 0;
}

.discussions-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
}

.create-post {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.category-select {
  position: relative;
  margin-bottom: 12px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  border-color: var(--accent-primary);
}

.category-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  overflow: hidden;
  z-index: 10;
  min-width: 180px;
}

.category-dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.category-dropdown button:hover,
.category-dropdown button.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.create-post textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 12px;
  color: var(--text-primary);
  resize: none;
  margin-bottom: 8px;
  font-family: inherit;
}

.create-post textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.textarea-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.search-bar {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 12px 40px;
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.search-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.sort-buttons {
  display: flex;
  gap: 8px;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.sort-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--bg-primary);
}

.topic-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.topic-card:hover {
  background: var(--bg-tertiary);
  transform: translateX(5px);
}

.topic-card.own {
  border-color: var(--gold-dim, rgba(212, 175, 55, 0.3));
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
}

.topic-content {
  flex: 1;
  min-width: 0;
}

.topic-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.topic-title {
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-category {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 20px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.topic-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.topic-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.topic-stats {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stat-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.stat-btn:hover {
  background: var(--bg-tertiary);
}

.like-btn.liked {
  color: #ef4444;
}

.delete-topic-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  opacity: 0;
}

.topic-card:hover .delete-topic-btn {
  opacity: 1;
}

.delete-topic-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.replies {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.load-more {
  text-align: center;
  padding: 16px;
}

.show-less {
  margin: 0 auto 16px;
  display: block;
}

.chat-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  height: calc(100vh - 300px);
  display: flex;
  flex-direction: column;
  position: relative;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--bg-tertiary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.online-count {
  font-size: 0.8rem;
  color: var(--success);
  padding: 4px 8px;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 12px;
}

.online-users {
  display: flex;
  gap: -8px;
}

.online-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
  margin-left: -8px;
}

.online-avatar:first-child {
  margin-left: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message.own {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-author {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.message-author.own {
  color: var(--accent-primary);
}

.message-time {
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.message-bubble {
  background: var(--bg-tertiary);
  padding: 10px 14px;
  border-radius: 16px;
  border-top-left-radius: 4px;
}

.message.own .message-bubble {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-top-left-radius: 16px;
  border-top-right-radius: 4px;
}

.message-text {
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.edited-label {
  font-size: 0.7rem;
  opacity: 0.7;
  margin-left: 6px;
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.like-btn.liked {
  color: #ef4444;
}

.menu-trigger {
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .menu-trigger {
  opacity: 1;
}

.menu-trigger:hover {
  background: var(--bg-tertiary);
}

.floating-menu {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  overflow: hidden;
  z-index: 1000;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.floating-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.floating-menu button:hover {
  background: var(--bg-hover);
}

.floating-menu .delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  padding-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.message {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
  position: relative;
}

.message:hover {
  background: rgba(255, 255, 255, 0.03);
}

.message.own {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-input {
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.edit-input:focus {
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.save-btn, .cancel-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.save-btn {
  background: var(--success);
  color: #fff;
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid var(--bg-tertiary);
}

.chat-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.chat-input input {
  flex: 1;
  height: 40px;
  background: var(--bg-tertiary);
  border: none;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.chat-input input:focus {
  outline: none;
}

.send-btn {
  background: var(--accent-primary);
  color: var(--bg-primary);
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
}

.send-btn:hover {
  background: var(--accent-secondary);
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
}

.login-prompt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.login-prompt .btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .discussions-layout {
    grid-template-columns: 1fr;
  }
  
  .chat-section {
    height: 450px;
  }
}

.delete-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.delete-modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 28px;
  max-width: 380px;
  width: 90%;
  text-align: center;
  border: 1px solid var(--border-color);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.delete-modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #ef4444;
}

.delete-modal h4 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.delete-modal p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

.delete-modal-actions {
  display: flex;
  gap: 12px;
}

.delete-modal-actions .btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-confirm {
  background: #ef4444;
  color: white;
}

.btn-confirm:hover {
  background: #dc2626;
}
</style>