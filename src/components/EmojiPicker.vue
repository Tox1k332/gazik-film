<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const showPicker = ref(false)

const emojiCategories = [
  {
    name: 'Часто используемые',
    emojis: ['😊', '😂', '❤️', '👍', '🎬', '⭐', '🔥', '😎', '🤔', '😢', '🎉', '💯']
  },
  {
    name: 'Эмоции',
    emojis: ['😊', '😄', '😃', '🥰', '😍', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  {
    name: 'Жесты',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏']
  },
  {
    name: 'Фильмы',
    emojis: ['🎬', '🎥', '🎞️', '📽️', '🎭️', '🎪', '🎨', '🖼️', '🎬', '📺', '📷', '📸', '📹', '🎥', '🎬', '🍿', '🎬', '🎭', '🎪', '🎯', '🎳', '🎮', '🕹️', '🎲', '🧩', '♟️', '🎰', '🎱', '🎯', '🏆', '🥇', '🎖️']
  },
  {
    name: 'Природа',
    emojis: ['🌸', '🌹', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🌽', '🌶️', '🥕', '🥦', '🥬', '🥒', '🍅', '🍆', '🥑', '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅']
  },
  {
    name: 'Сердечки',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
  },
  {
    name: 'Звёздочки',
    emojis: ['⭐', '🌟', '✨', '💫', '⚡', '🌠', '🌌', '🌙', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌪️', '💨', '🔥', '💧', '❄️', '🌊', '💥', '🌈']
  },
  {
    name: 'Еда',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍰', '🎂', '🍮', '🍦', '🍨', '🍧', '🧁', '🍪', '🍿', '🥤', '🧃', '🥛', '☕', '🍵', '🧉', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧊']
  },
  {
    name: 'Животные',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦥', '🦦', '🦨', '🦩', '🦚', '🦜', '🦢', '🦩', '🪿', '🦔']
  }
]

const togglePicker = () => {
  showPicker.value = !showPicker.value
}

const selectEmoji = (emoji) => {
  emit('update:modelValue', (props.modelValue || '') + emoji)
  showPicker.value = false
}

const closePicker = () => {
  showPicker.value = false
}
</script>

<template>
  <div class="emoji-picker-wrapper">
    <button type="button" class="emoji-btn" @click.stop="togglePicker" title="Добавить смайлик">
      😊
    </button>
    <div v-if="showPicker" class="emoji-picker" @click.stop>
      <div class="emoji-categories">
        <div v-for="cat in emojiCategories" :key="cat.name" class="emoji-category">
          <div class="category-name">{{ cat.name }}</div>
          <div class="emoji-grid">
            <button 
              v-for="emoji in cat.emojis" 
              :key="emoji" 
              type="button"
              class="emoji-item"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker-wrapper {
  position: relative;
}

.emoji-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  opacity: 0.6;
}

.emoji-btn:hover {
  opacity: 1;
  background: var(--bg-tertiary);
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  width: 320px;
  max-height: 350px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: pickerSlideUp 0.2s ease;
  overflow: hidden;
}

@keyframes pickerSlideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.emoji-picker-header {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.emoji-categories {
  overflow-y: auto;
  flex: 1;
  padding: 8px;
}

.emoji-category {
  margin-bottom: 12px;
}

.emoji-category:last-child {
  margin-bottom: 0;
}

.category-name {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.emoji-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.emoji-item:hover {
  background: var(--bg-tertiary);
  transform: scale(1.2);
}
</style>