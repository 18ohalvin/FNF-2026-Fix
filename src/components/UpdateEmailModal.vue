<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        id="update-email-modal-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
      >
        <div
          class="modal-sheet"
          id="update-email-modal-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-email-modal-title"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :style="{ transform: translateY > 0 ? `translateY(${translateY}px)` : '' }"
        >
          <!-- Drag Handle for Mobile (matches WhyWeNeedThisModal) -->
          <div class="sheet-drag-handle-container" @click="handleClose">
            <div class="sheet-drag-handle"></div>
          </div>

          <!-- ================= STATE A: SUCCESS STATE (Figma Node 494:277) ================= -->
          <div v-if="isSuccess" class="modal-content-wrapper">
            <div class="modal-body success-body">
              <h2 id="update-email-modal-title" class="modal-title success-title">
                YOUR PASS HAS BEEN SENT TO YOUR NEW EMAIL.
              </h2>
            </div>

            <!-- Done Action Button -->
            <button
              type="button"
              id="update-email-done-btn"
              class="modal-action-button"
              @click="handleSuccessDone"
            >
              <span class="button-text">DONE</span>
            </button>
          </div>

          <!-- ================= STATE B: INPUT FORM (Figma Node 494:63) ================= -->
          <div v-else class="modal-content-wrapper">
            <div class="modal-body form-body">
              <!-- Title (Node 494:67) -->
              <h2 id="update-email-modal-title" class="modal-title">
                UPDATE YOUR EMAIL
              </h2>

              <!-- Subtitle (Node 494:70) -->
              <p class="modal-subtitle">
                Please provide a valid email address. We will resend your E-Pass immediately.
              </p>

              <!-- Email Input (Node 494:273) -->
              <div class="input-container">
                <input
                  id="guest-email-input"
                  ref="emailInputRef"
                  v-model="emailVal"
                  type="email"
                  required
                  class="sheet-input"
                  placeholder="NEW EMAIL ADDRESS*"
                  autocomplete="email"
                  :disabled="isSubmitting"
                  @keydown.enter.prevent="handleSubmit"
                />
              </div>

              <!-- Fail-safe Error Notification -->
              <div v-if="errorMessage" class="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="error-text">{{ errorMessage }}</span>
              </div>
            </div>

            <!-- Resend Action Button (Node 494:83) -->
            <button
              type="button"
              id="update-email-submit-btn"
              class="modal-action-button"
              :disabled="isSubmitting || !isEmailValid"
              @click="handleSubmit"
            >
              <span class="button-text">
                {{ isSubmitting ? 'RESENDING...' : 'RESEND E-PASS' }}
              </span>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { apiUpdateGuestEmail } from '../api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  currentEmail: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'updated'])

const emailVal = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')
const emailInputRef = ref(null)

const translateY = ref(0)
let startY = 0
let currentY = 0
let isDragging = false

const isEmailValid = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(emailVal.value.trim())
})

watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    emailVal.value = props.currentEmail || ''
    errorMessage.value = ''
    isSuccess.value = false
    translateY.value = 0
    nextTick(() => {
      if (emailInputRef.value) {
        emailInputRef.value.focus()
        emailInputRef.value.select()
      }
    })
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

const handleSuccessDone = () => {
  const finalEmail = emailVal.value.trim()
  translateY.value = 0
  isSuccess.value = false
  emit('updated', finalEmail)
  emit('close')
}

const handleSubmit = async () => {
  if (!isEmailValid.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const rawPhone = String(props.phone || '').replace(/\D/g, '')
    const res = await apiUpdateGuestEmail(rawPhone, emailVal.value.trim(), props.currentEmail)

    if (res && res.success) {
      isSuccess.value = true
    } else {
      errorMessage.value = res?.error || 'Failed to update email. Please try again.'
    }
  } catch (err) {
    console.error('[Update Email Exception]', err)
    errorMessage.value = err.message || 'Network error updating email.'
  } finally {
    isSubmitting.value = false
  }
}

// Touch swipe-to-dismiss gesture handling (matches WhyWeNeedThisModal)
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

.modal-content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.modal-body {
  padding: 24px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

.success-body {
  padding: 32px 32px 48px 32px;
}

/* Title (Node 494:67 & 494:281) */
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

/* Subtitle (Node 494:70) */
.modal-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 24px;
  color: #000000;
  letter-spacing: -0.01em;
  margin: 0;
}

/* Input Container & Field (Node 494:273) */
.input-container {
  width: 100%;
  height: 48px;
  background-color: #ededed;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.sheet-input {
  width: 100%;
  height: 100%;
  padding: 0 24px;
  border: none;
  background-color: transparent;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  outline: none;
  box-sizing: border-box;
}

.sheet-input::placeholder {
  color: #a5a5a5;
  font-size: 14px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0;
}

.sheet-input:focus {
  background-color: #ffffff;
  box-shadow: inset 0 0 0 1px #000000;
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

/* Bottom Full-width Action Buttons (Matches WhyWeNeedThisModal) */
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
  user-select: none;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.modal-action-button:hover:not(:disabled) {
  opacity: 0.85;
}

.modal-action-button:active:not(:disabled) {
  opacity: 0.7;
}

.modal-action-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.button-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
}

/* Transitions */
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
