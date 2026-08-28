<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="handleClose">
        <div class="update-email-card" role="dialog" aria-modal="true">
          
          <!-- STATE A: SUCCESS STATE (Figma Node 494:277) -->
          <div v-if="isSuccess" class="success-container">
            <div class="success-title-box">
              <h2 class="success-title">YOUR PASS HAS BEEN SENT TO YOUR NEW EMAIL.</h2>
            </div>
            <div class="success-button-box">
              <button
                type="button"
                id="update-email-done-btn"
                class="btn-done"
                @click="handleSuccessDone"
              >
                DONE
              </button>
            </div>
          </div>

          <!-- STATE B: FORM / INPUT STATE -->
          <div v-else class="form-container">
            <!-- Header -->
            <div class="modal-header">
              <div>
                <h2 class="modal-title">UPDATE EMAIL</h2>
                <p class="modal-subtitle">Enter your valid email address to receive your E-Pass</p>
              </div>
              <button type="button" class="close-btn" @click="handleClose" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Form Body -->
            <form class="modal-form" @submit.prevent="handleSubmit">
              <div class="form-group">
                <label class="field-label" for="guest-email-input">NEW EMAIL ADDRESS</label>
                <input
                  id="guest-email-input"
                  ref="emailInputRef"
                  v-model="emailVal"
                  type="email"
                  required
                  class="form-input"
                  placeholder="e.g. yourname@gmail.com"
                  autocomplete="email"
                  :disabled="isSubmitting"
                />
              </div>

              <!-- Fail-safe Error Alert -->
              <div v-if="errorMessage" class="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{{ errorMessage }}</span>
              </div>

              <!-- Footer Buttons -->
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn-cancel"
                  :disabled="isSubmitting"
                  @click="handleClose"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  class="btn-submit"
                  :disabled="isSubmitting || !isEmailValid"
                >
                  <span v-if="isSubmitting">RESENDING...</span>
                  <span v-else>UPDATE & RESEND</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
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

const isEmailValid = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(emailVal.value.trim())
})

watch(() => props.isOpen, (open) => {
  if (open) {
    emailVal.value = props.currentEmail || ''
    errorMessage.value = ''
    isSuccess.value = false
    nextTick(() => {
      if (emailInputRef.value) {
        emailInputRef.value.focus()
        emailInputRef.value.select()
      }
    })
  }
})

const handleClose = () => {
  if (isSubmitting.value) return
  isSuccess.value = false
  emit('close')
}

const handleSuccessDone = () => {
  const finalEmail = emailVal.value.trim()
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
    const res = await apiUpdateGuestEmail(rawPhone, emailVal.value.trim())

    if (res.success) {
      isSuccess.value = true
    } else {
      errorMessage.value = res.error || 'Failed to update email. Please try again.'
    }
  } catch (err) {
    errorMessage.value = err.message || 'Network error updating email.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.update-email-card {
  background-color: #ffffff;
  width: 100%;
  max-width: 440px;
  border-radius: 0;
  border: 1px solid #000000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

/* SUCCESS STATE (Figma Node 494:277) */
.success-container {
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background-color: #ffffff;
}

.success-title-box {
  width: 100%;
}

.success-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
  word-break: break-word;
}

.success-button-box {
  width: 100%;
  height: 48px;
}

.btn-done {
  width: 100%;
  height: 48px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn-done:hover {
  opacity: 0.88;
}

.btn-done:active {
  opacity: 0.75;
}

/* FORM STATE */
.form-container {
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 24px 24px 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e5e5e5;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  color: #000000;
}

.modal-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #666666;
  margin: 6px 0 0 0;
  line-height: 18px;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  transition: color 0.15s ease;
}

.close-btn:hover {
  color: #000000;
}

.modal-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #000000;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #000000;
  background-color: #ffffff;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s ease;
}

.form-input:focus {
  border-color: #000000;
  box-shadow: 0 0 0 1px #000000;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d32f2f;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 16px;
  background-color: #ffebee;
  padding: 10px 14px;
  border: 1px solid #ffcdd2;
}

.modal-footer {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn-cancel {
  flex: 1;
  height: 48px;
  background-color: transparent;
  border: 1px solid #cccccc;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #f5f5f5;
  color: #000000;
}

.btn-submit {
  flex: 2;
  height: 48px;
  background-color: #000000;
  border: 1px solid #000000;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
