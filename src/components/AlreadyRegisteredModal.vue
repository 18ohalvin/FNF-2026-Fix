<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        id="already-registered-modal-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
      >
        <div
          class="modal-sheet"
          id="already-registered-modal-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="already-registered-modal-title"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :style="{ transform: translateY > 0 ? `translateY(${translateY}px)` : '' }"
        >
          <!-- Drag Handle for Mobile -->
          <div class="sheet-drag-handle-container" @click="handleClose">
            <div class="sheet-drag-handle"></div>
          </div>

          <!-- Content Section -->
          <div class="modal-body">
            <h2 id="already-registered-modal-title" class="modal-title">ALREADY REGISTERED</h2>
            <p class="modal-description">
              {{ message || 'This WhatsApp number or email address has already been registered for the event.' }}
            </p>
            <p class="modal-subdescription">
              Each guest is eligible for <strong>one (1) registration pass only</strong> to prevent duplicate entries. If you need to register for another person, please use a different number and email.
            </p>
          </div>

          <!-- Action Button -->
          <button
            type="button"
            id="already-registered-modal-close-btn"
            class="modal-close-button"
            @click="handleClose"
          >
            <span class="close-text">UNDERSTOOD</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const translateY = ref(0)
let startY = 0
let currentY = 0
let isDragging = false

const handleClose = () => {
  translateY.value = 0
  emit('close')
}

// Touch swipe-to-dismiss gesture handling
const onTouchStart = (e) => {
  startY = e.touches[0].clientY
  isDragging = true
}

const onTouchMove = (e) => {
  if (!isDragging) return
  currentY = e.touches[0].clientY
  const deltaY = currentY - startY
  if (deltaY > 0) {
    translateY.value = deltaY
  }
}

const onTouchEnd = () => {
  if (!isDragging) return
  isDragging = false
  if (translateY.value > 80) {
    handleClose()
  } else {
    translateY.value = 0
  }
}

// Keydown Escape handler
const onKeyDown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    translateY.value = 0
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 9999;
  padding: 0 0 max(16px, env(safe-area-inset-bottom, 16px)) 0;
  box-sizing: border-box;
}

.modal-sheet {
  width: 100%;
  max-width: var(--max-content-width, 440px);
  background-color: #f2f2f2;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.sheet-drag-handle-container {
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
}

.sheet-drag-handle {
  width: 36px;
  height: 4px;
  background-color: #d1d1d1;
  border-radius: 2px;
}

.modal-body {
  padding: 8px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: -0.01em;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
}

.modal-description {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #000000;
  margin: 0;
}

.modal-subdescription {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 19px;
  color: #555555;
  margin: 0;
}

.modal-close-button {
  width: 100%;
  height: 48px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.modal-close-button:hover {
  opacity: 0.85;
}

.modal-close-button:active {
  opacity: 0.7;
}

.close-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .modal-sheet,
.modal-fade-leave-active .modal-sheet {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-sheet,
.modal-fade-leave-to .modal-sheet {
  transform: translateY(100%);
}
</style>
