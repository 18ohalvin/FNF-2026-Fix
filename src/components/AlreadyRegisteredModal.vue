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

          <!-- ================= STATE A: SUCCESS STATE ================= -->
          <div v-if="isSuccess" class="modal-content-wrapper">
            <div class="modal-body success-body">
              <h2 id="already-registered-modal-title" class="modal-title success-title">
                YOUR PASS HAS BEEN RESENT.
              </h2>
              <p class="modal-description">
                A copy of your E-Pass has been sent to your registered email address.
              </p>
            </div>

            <!-- Done Action Button -->
            <button
              type="button"
              id="already-registered-done-btn"
              class="modal-close-button"
              @click="handleClose"
            >
              <span class="close-text">DONE</span>
            </button>
          </div>

          <!-- ================= STATE B: DEFAULT FORM ================= -->
          <div v-else class="modal-content-wrapper">
            <div class="modal-body">
              <h2 id="already-registered-modal-title" class="modal-title">
                ALREADY REGISTERED
              </h2>
              <p class="modal-description">
                A ticket has already been issued for this number.
              </p>

              <!-- Fail-safe Error Alert -->
              <div v-if="errorMessage" class="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="error-text">{{ errorMessage }}</span>
              </div>
            </div>

            <!-- Primary Action Button: SELECT ANOTHER DAY -->
            <button
              type="button"
              id="already-registered-select-day-btn"
              class="modal-close-button primary-btn"
              @click="handleSelectAnotherDay"
            >
              <span class="close-text">
                SELECT ANOTHER DAY
              </span>
            </button>

            <!-- Secondary Actions: Resend E-Pass & Register New Guest -->
            <div class="secondary-actions-row">
              <button
                type="button"
                id="already-registered-resend-btn"
                class="secondary-action-btn resend-btn"
                :disabled="isSubmitting"
                @click="handleResend"
              >
                {{ isSubmitting ? 'Resending...' : 'Resend my E-Pass' }}
              </button>
              <span class="action-divider">•</span>
              <button
                type="button"
                id="already-registered-new-guest-btn"
                class="secondary-action-btn"
                @click="handleRegisterNew"
              >
                Register new Guest
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { apiResendPass } from '../api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'register-new', 'select-another-day'])

const translateY = ref(0)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')
let startY = 0
let currentY = 0
let isDragging = false

watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    translateY.value = 0
    isSuccess.value = false
    errorMessage.value = ''
  } else {
    document.body.style.overflow = ''
    translateY.value = 0
  }
})

const handleClose = () => {
  if (isSubmitting.value) return
  translateY.value = 0
  isSuccess.value = false
  emit('close')
}

const handleSelectAnotherDay = () => {
  translateY.value = 0
  isSuccess.value = false
  emit('select-another-day')
  emit('close')
}

const handleRegisterNew = () => {
  translateY.value = 0
  isSuccess.value = false
  emit('register-new')
  emit('close')
}

const handleResend = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const rawPhone = String(props.phone || '').replace(/\D/g, '')
    const res = await apiResendPass(rawPhone || props.phone)

    if (res && res.success) {
      isSuccess.value = true
    } else {
      errorMessage.value = res?.error || 'Failed to resend pass. Please try again.'
    }
  } catch (err) {
    console.error('[Resend Pass Exception]', err)
    errorMessage.value = err.message || 'Network error resending pass.'
  } finally {
    isSubmitting.value = false
  }
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

const onKeyDown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

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
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
}

.sheet-drag-handle {
  width: 36px;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}

.modal-content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.modal-body {
  padding: 24px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.success-body {
  padding: 32px 32px 40px 32px;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
  line-height: normal;
  word-break: break-word;
}

.success-title {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;
}

.modal-description {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 24px;
  color: #000000;
  letter-spacing: -0.01em;
  margin: 0;
}

/* Fail-safe Error Alert Box */
.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d32f2f;
  background-color: #ffebee;
  padding: 10px 16px;
  border-radius: 4px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 18px;
  box-sizing: border-box;
}

.error-icon {
  flex-shrink: 0;
}

.error-text {
  flex: 1;
}

/* Primary Action Button (Matches WhyWeNeedThisModal) */
.modal-close-button {
  width: 100%;
  height: 64px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.modal-close-button:hover:not(:disabled) {
  opacity: 0.85;
}

.modal-close-button:active:not(:disabled) {
  opacity: 0.7;
}

.modal-close-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.close-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
}

.secondary-actions-row {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px 0 20px 0;
  background-color: #f2f2f2;
}

.action-divider {
  color: #999999;
  font-size: 12px;
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
  padding: 4px 6px;
  outline: none;
  transition: color 0.15s ease;
}

.secondary-action-btn:hover {
  color: #000000;
}

/* Animations */
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
  transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.modal-fade-enter-from .modal-sheet,
.modal-fade-leave-to .modal-sheet {
  transform: translateY(100%);
}
</style>
