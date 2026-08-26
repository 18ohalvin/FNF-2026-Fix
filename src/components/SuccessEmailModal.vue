<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        id="success-email-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
      >
        <div
          class="modal-sheet"
          id="success-email-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-email-title"
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
            <h2 id="success-email-title" class="modal-title">
              SUCCESS. PLEASE CHECK YOUR INBOX.
            </h2>

            <!-- Displayed Updated Email -->
            <div class="email-display-container">
              <p class="displayed-email">{{ email }}</p>
            </div>

            <!-- Data Concern Notice -->
            <div class="modal-notice-row">
              <div class="info-icon-holder">
                <img src="../assets/icon-info.svg" alt="Information" class="info-icon" />
              </div>
              <p class="modal-notice-text">
                If your e-pass doesn't arrive shortly, check your spam folder or try entering a different email address.
              </p>
            </div>
          </div>

          <!-- Done Action Button -->
          <button
            type="button"
            id="success-email-done-btn"
            class="modal-action-button"
            @click="handleClose"
          >
            <span class="action-text">DONE</span>
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
  email: {
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

// Touch swipe gesture handling
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
  padding: 0;
}

.modal-sheet {
  width: 100%;
  max-width: var(--max-content-width, 440px);
  background-color: #f2f2f2;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  will-change: transform;
  transition: transform 0.2s ease-out;
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
  padding: 24px 24px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.4;
}

.email-display-container {
  width: 100%;
  padding: 6px 0;
}

.displayed-email {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 24px;
  font-weight: 400;
  color: #000000;
  line-height: normal;
  margin: 0;
  word-break: break-all;
}

.modal-notice-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 4px;
}

.info-icon-holder {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon {
  width: 22px;
  height: 22px;
  display: block;
}

.modal-notice-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 300;
  line-height: 20px;
  color: #000000;
  margin: 0;
  flex: 1;
}

.modal-action-button {
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
}

.action-text {
  line-height: 1;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
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

@media (max-width: 360px) {
  .displayed-email {
    font-size: 18px;
  }
}
</style>
