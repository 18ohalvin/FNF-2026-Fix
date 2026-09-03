<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        id="download-epass-modal-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
      >
        <div
          class="modal-sheet"
          id="download-epass-modal-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-epass-modal-title"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :style="{ transform: translateY > 0 ? `translateY(${translateY}px)` : '' }"
        >
          <!-- Drag Handle for Mobile (matches Global Design System) -->
          <div class="sheet-drag-handle-container" @click="handleClose">
            <div class="sheet-drag-handle"></div>
          </div>

          <!-- Content Section -->
          <div class="modal-body">
            <h2 id="download-epass-modal-title" class="modal-title">
              DIDN'T RECEIVE THE EMAIL?
            </h2>
            <p class="modal-description">
              You can download a digital PDF copy of your E-Pass directly to your device or update your email address to resend it.
            </p>
          </div>

          <!-- Primary Action Button: DOWNLOAD E-PASS (PDF) -->
          <button
            type="button"
            id="download-epass-pdf-btn"
            class="modal-close-button"
            :disabled="isDownloading"
            @click="handleDownload"
          >
            <span class="close-text">
              {{ isDownloading ? 'GENERATING PDF...' : 'DOWNLOAD E-PASS (PDF)' }}
            </span>
          </button>

          <!-- Secondary Sub-Action: Update Email Address -->
          <div class="secondary-action-container">
            <button
              type="button"
              id="download-epass-update-email-btn"
              class="secondary-action-btn"
              @click="handleOpenUpdateEmail"
            >
              Update Email Address
            </button>
          </div>

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
  isDownloading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'download', 'open-update-email'])

const translateY = ref(0)
let startY = 0
let currentY = 0
let isDragging = false

const handleClose = () => {
  translateY.value = 0
  emit('close')
}

const handleDownload = () => {
  emit('download')
}

const handleOpenUpdateEmail = () => {
  emit('open-update-email')
  handleClose()
}

// Touch swipe-to-dismiss gesture handling (matches Global Design System)
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
  padding: 12px 0 6px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.sheet-drag-handle {
  width: 36px;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}

.modal-body {
  padding: 24px 24px 36px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.3;
}

.modal-description {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 15px;
  font-weight: 300;
  line-height: 22px;
  color: #000000;
  letter-spacing: -0.01em;
  margin: 0;
}

.modal-close-button {
  width: 100%;
  height: 64px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  user-select: none;
  transition: opacity 0.2s ease;
}

.modal-close-button:hover:not(:disabled) {
  opacity: 0.85;
}

.modal-close-button:disabled {
  opacity: 0.5;
  cursor: wait;
}

.close-text {
  line-height: 1;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.secondary-action-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 0 16px 0;
  background-color: #f2f2f2;
}

.secondary-action-btn {
  background: transparent;
  border: none;
  color: #666666;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 400;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 12px;
  outline: none;
  transition: color 0.15s ease;
}

.secondary-action-btn:hover {
  color: #000000;
}

/* Modal Transition */
.modal-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-leave-active {
  transition: opacity 0.25s ease-in;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-sheet {
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-leave-active .modal-sheet {
  transition: transform 0.25s ease-in;
}

.modal-fade-enter-from .modal-sheet,
.modal-fade-leave-to .modal-sheet {
  transform: translateY(100%);
}
</style>
