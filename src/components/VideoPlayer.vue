<template>
  <div v-if="show" class="player-overlay" @click.self="close">
    <div class="player-modal">
      <button class="player-close" @click="close">
        <X :size="24" />
      </button>
      <div ref="playerContainer" class="plyr-container">
        <iframe
          v-if="isYouTube"
          :src="embedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
        <video
          v-else
          ref="videoEl"
          :src="src"
          :poster="poster"
          playsinline
        ></video>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import Plyr from 'plyr'
import { X } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  src: { type: String, default: '' },
  poster: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const playerContainer = ref(null)
const videoEl = ref(null)
let player = null

function handleKeydown(e) {
  if (e.key === 'Escape') close()
}

watch(() => props.show, (val) => {
  if (val) {
    document.addEventListener('keydown', handleKeydown)
    setTimeout(initPlayer, 100)
  } else {
    document.removeEventListener('keydown', handleKeydown)
    if (player) {
      player.destroy()
      player = null
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (player) {
    player.destroy()
    player = null
  }
})

const isYouTube = computed(() => props.src && (props.src.includes('youtube') || props.src.includes('youtu.be')))

const embedUrl = computed(() => {
  if (!props.src) return ''
  const url = new URL(props.src)
  const videoId = url.searchParams.get('v') || props.src.split('/').pop().split('?')[0]
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
})

function initPlayer() {
  if (player) {
    player.destroy()
    player = null
  }
  if (!playerContainer.value) return

  if (isYouTube.value) return

  const el = playerContainer.value.querySelector('video')
  if (!el) return

  player = new Plyr(el, {
    controls: ['play-large', 'play', 'rewind', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'fullscreen'],
    settings: ['quality', 'speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    tooltips: { controls: true, seek: true },
    keyboard: { focused: true, global: false },
    i18n: {
      play: 'Воспроизвести',
      pause: 'Пауза',
      rewind: 'Назад',
      fastForward: 'Вперёд',
      seek: 'Искать',
      played: 'Воспроизведено',
      buffered: 'Буфер',
      currentTime: 'Текущее время',
      duration: 'Длительность',
      volume: 'Громкость',
      mute: 'Без звука',
      unmute: 'Со звуком',
      captions: 'Субтитры',
      settings: 'Настройки',
      speed: 'Скорость',
      quality: 'Качество',
      fullscreen: 'Полный экран',
      exitFullscreen: 'Выйти из полного экрана'
    }
  })

  player.on('ready', () => {
    player.play()
  })
}

function close() {
  emit('close')
}

watch(() => props.show, (val) => {
  if (val) {
    setTimeout(initPlayer, 100)
  } else {
    if (player) {
      player.destroy()
      player = null
    }
  }
})
</script>

<style>
.player-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.player-modal {
  position: relative;
  width: 100%;
  max-width: 1200px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.player-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.player-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

.plyr-container {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.plyr-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.plyr-container video {
  width: 100%;
  height: 100%;
}

:root {
  --plyr-color-main: #e6a855;
  --plyr-font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --plyr-font-size-base: 14px;
  --plyr-control-radius: 6px;
  --plyr-control-spacing: 10px;
  --plyr-video-control-color: rgba(255, 255, 255, 0.8);
  --plyr-video-control-color-hover: #fff;
  --plyr-video-background: #1a1a1a;
  --plyr-range-track-height: 4px;
  --plyr-range-fill-background: #e6a855;
  --plyr-range-thumb-height: 14px;
  --plyr-range-thumb-background: #e6a855;
  --plyr-badge-background: #e6a855;
  --plyr-badge-text-color: #000;
}

.plyr--video .plyr__control--overlaid {
  background: rgba(230, 168, 85, 0.9);
}

.plyr--video .plyr__control--overlaid:hover {
  background: #e6a855;
}

.plyr__menu__container {
  background: #2a2a2a;
  border-radius: 8px;
}

.plyr__menu__container .plyr__control {
  color: #fff;
}

.plyr__menu__container .plyr__control:hover {
  background: rgba(255, 255, 255, 0.1);
}

.plyr__menu__container .plyr__menu__value {
  color: #e6a855;
}
</style>