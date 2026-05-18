<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { discussionsService } from '../services/discussions'
import { avatarService } from '../services/avatar'
import { ArrowLeft, Lock, Send, Heart, Edit2, Trash2, MoreVertical } from 'lucide-vue-next'
import EmojiPicker from '../components/EmojiPicker.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user.value)

const discussion = ref(null)
const replies = ref([])
const newReply = ref('')
const loading = ref(true)
const currentAvatar = computed(() => avatarService.get())
const showReplyMenu = ref(null)
const replyMenuPos = ref(null)
const replyMenuJustOpened = ref(false)

onMounted(() => {
  const id = route.params.id
  discussion.value = discussionsService.getById(id)
  
  if (!discussion.value) {
    router.push('/discussions')
    return
  }
  
  replies.value = discussionsService.getReplies(id)
  loading.value = false
  
  document.addEventListener('click', (e) => {
    if (replyMenuJustOpened.value) return
    if (!e.target.closest('.floating-menu') && !e.target.closest('.menu-trigger')) {
      showReplyMenu.value = null
    }
  })
})

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

const submitReply = () => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  
  if (!newReply.value.trim()) return
  
  const customAvatar = avatarService.get()
  const avatar = customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.value.username}`
  const newReplies = discussionsService.addReply(
    discussion.value.id,
    currentUser.value,
    avatar,
    newReply.value.trim()
  )
  
  replies.value = newReplies
  discussion.value = discussionsService.getById(discussion.value.id)
  newReply.value = ''
}

const startEditReply = (reply) => {
  editingReplyId.value = reply.id
  editReplyText.value = reply.text
  showReplyMenu.value = null
}

const saveEditReply = () => {
  if (!editReplyText.value.trim()) return
  discussionsService.editReply(discussion.value.id, editingReplyId.value, editReplyText.value.trim())
  replies.value = discussionsService.getReplies(discussion.value.id)
  editingReplyId.value = null
  editReplyText.value = ''
}

const cancelEditReply = () => {
  editingReplyId.value = null
  editReplyText.value = ''
}

const toggleReplyMenu = (replyId, event) => {
  event.stopPropagation()
  event.preventDefault()
  
  if (showReplyMenu.value === replyId) {
    showReplyMenu.value = null
    return
  }
  
  const btn = event.currentTarget
  const rect = btn.getBoundingClientRect()
  replyMenuPos.value = {
    top: rect.bottom + 8 + 'px',
    left: Math.min(rect.left, window.innerWidth - 180) + 'px'
  }
  showReplyMenu.value = replyId
  replyMenuJustOpened.value = true
  setTimeout(() => { replyMenuJustOpened.value = false }, 100)
}

const deleteReply = (replyId) => {
  discussionsService.deleteReply(discussion.value.id, replyId)
  replies.value = discussionsService.getReplies(discussion.value.id)
  discussion.value = discussionsService.getById(discussion.value.id)
  showReplyMenu.value = null
}

const toggleReplyLike = (reply) => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  discussionsService.toggleReplyLike(discussion.value.id, reply.id, currentUser.value.username)
  replies.value = discussionsService.getReplies(discussion.value.id)
}

const isReplyLiked = (reply) => {
  return currentUser.value && reply.likedBy?.includes(currentUser.value.username)
}

const isOwnReply = (reply) => {
  return currentUser.value && reply.author === currentUser.value.username
}

const toggleTopicLike = () => {
  if (!currentUser.value) {
    router.push('/auth')
    return
  }
  discussionsService.toggleLike(discussion.value.id, currentUser.value.username)
  discussion.value = discussionsService.getById(discussion.value.id)
}

const isTopicLiked = computed(() => {
  return currentUser.value && discussion.value?.likedBy?.includes(currentUser.value.username)
})
</script>

<template>
  <div class="topic-page">
    <div class="container">
      <button class="back-btn" @click="router.push('/discussions')">
        <ArrowLeft :size="18" />
        Назад к обсуждениям
      </button>
      
      <div v-if="loading" class="loading">Загрузка...</div>
      
      <template v-else-if="discussion">
        <div class="topic-header">
          <img :src="discussion.avatar" :alt="discussion.author" class="author-avatar" />
          <div class="topic-info">
            <h1>{{ discussion.title }}</h1>
            <div class="topic-meta">
              <span class="author">@{{ discussion.author }}</span>
              <span class="time">{{ formatTime(discussion.time) }}</span>
              <button 
                class="like-btn" 
                :class="{ liked: isTopicLiked }"
                @click="toggleTopicLike"
              >
                <Heart :size="18" :fill="isTopicLiked ? 'currentColor' : 'none'" />
                <span>{{ discussion.likes || 0 }}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="replies-section">
          <h2>Ответы ({{ replies.length }})</h2>
          
          <div v-if="replies.length" class="replies-list">
            <div 
              v-for="reply in replies" 
              :key="reply.id" 
              class="reply-card"
              @mouseenter="hoveredReply = reply.id"
              @mouseleave="hoveredReply = null"
            >
              <img :src="reply.avatar" :alt="reply.author" class="reply-avatar" />
              <div class="reply-content">
                <div class="reply-header">
                  <span class="reply-author" :class="{ own: isOwnReply(reply) }">@{{ reply.author }}</span>
                  <span class="reply-time">{{ formatTime(reply.time) }}</span>
                </div>
                <template v-if="editingReplyId === reply.id">
                  <div class="edit-form">
                    <textarea 
                      v-model="editReplyText" 
                      class="edit-textarea"
                      rows="2"
                    ></textarea>
                    <div class="edit-actions">
                      <button @click="saveEditReply" class="save-btn">Сохранить</button>
                      <button @click="cancelEditReply" class="cancel-btn">Отмена</button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <p class="reply-text">
                    {{ reply.text }}
                    <span v-if="reply.edited" class="edited-label">(ред.)</span>
                  </p>
                </template>
                <div class="reply-actions">
                  <button 
                    class="action-btn like-btn" 
                    :class="{ liked: isReplyLiked(reply) }"
                    @click="toggleReplyLike(reply)"
                  >
                    <Heart :size="14" :fill="isReplyLiked(reply) ? 'currentColor' : 'none'" />
                    <span v-if="reply.likes">{{ reply.likes }}</span>
                  </button>
                  <button 
                    v-if="isOwnReply(reply)" 
                    class="action-btn menu-trigger"
                    @click="toggleReplyMenu(reply.id, $event)"
                  >
                    <MoreVertical :size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="showReplyMenu" class="floating-menu" :style="replyMenuPos">
            <button @click="startEditReply(replies.find(r => r.id === showReplyMenu))">
              <Edit2 :size="14" /> Изменить
            </button>
            <button @click="deleteReply(showReplyMenu)" class="delete-btn">
              <Trash2 :size="14" /> Удалить
            </button>
          </div>
          
          <div v-if="!replies.length" class="empty-replies">
            Пока нет ответов. Будьте первым!
          </div>
        </div>
        
        <div class="reply-form">
          <template v-if="currentUser">
            <div class="reply-header">
              <img v-if="currentAvatar" :src="currentAvatar" :alt="currentUser.username" class="reply-avatar-preview" />
              <img v-else :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`" :alt="currentUser.username" class="reply-avatar-preview" />
              <span>Ваш ответ</span>
            </div>
            <textarea 
              v-model="newReply" 
              placeholder="Напишите ответ..."
              rows="3"
            ></textarea>
            <div class="reply-footer">
              <EmojiPicker v-model="newReply" />
            </div>
            <button class="btn btn-primary" @click="submitReply" :disabled="!newReply.trim()">
              <Send :size="16" />
              Отправить
            </button>
          </template>
          <template v-else>
            <div class="login-prompt">
              <Lock :size="20" />
              <span>Войдите, чтобы отвечать</span>
              <button @click="router.push('/auth')" class="btn btn-primary">Войти</button>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.topic-page {
  padding: 40px 20px;
  min-height: calc(100vh - 70px);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: 24px;
  padding: 8px 0;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: var(--text-primary);
}

.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}

.topic-header {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 32px;
}

.author-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.topic-info {
  flex: 1;
}

.topic-info h1 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.topic-meta .like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.topic-meta .like-btn:hover {
  background: var(--bg-tertiary);
}

.topic-meta .like-btn.liked {
  color: #ef4444;
}

.replies-section {
  margin-bottom: 32px;
}

.replies-section h2 {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  position: relative;
}

.reply-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-author {
  font-weight: 600;
  font-size: 0.95rem;
}

.reply-author.own {
  color: var(--accent-primary);
}

.reply-time {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.reply-text {
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.edited-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-left: 6px;
}

.reply-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
}

.action-btn.liked {
  color: #ef4444;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  padding: 10px;
  color: var(--text-primary);
  resize: none;
  font-family: inherit;
}

.edit-textarea:focus {
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.save-btn, .cancel-btn {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn {
  background: var(--success);
  color: #fff;
}

.save-btn:hover {
  filter: brightness(1.1);
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background: var(--bg-hover);
}

.reply-menu-container {
  position: relative;
  flex-shrink: 0;
}

.menu-btn {
  background: var(--bg-hover);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-card:hover .menu-btn {
  opacity: 1;
}

.menu-btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.menu-trigger {
  opacity: 0;
  transition: opacity 0.2s;
}

.reply-card:hover .menu-trigger {
  opacity: 1;
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
}

.floating-menu button:hover {
  background: var(--bg-hover);
}

.floating-menu .delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.empty-replies {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.reply-form {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: var(--radius-md);
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-weight: 600;
}

.reply-avatar-preview {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.reply-form textarea {
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

.reply-footer {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.reply-form textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.reply-form .btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-form .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: var(--text-secondary);
}

.login-prompt .btn {
  margin-left: 8px;
}
</style>