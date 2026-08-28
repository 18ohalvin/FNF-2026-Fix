<template>
  <div class="admin-login-page-container">
    <!-- Header with 707 Logo centered (Figma 454:1266) -->
    <header class="header-container">
      <div class="logo-wrapper">
        <img src="../assets/logo-707.png" alt="707 Logo" class="brand-logo" />
      </div>
    </header>

    <!-- Main Sign In Card (Figma 454:1415) -->
    <main class="login-main-content">
      <div class="login-card">
        <div class="login-header-group">
          <h1 class="login-title">Sign in</h1>
          <p class="login-subtitle">Enter your credentials to access the staff dashboard.</p>
        </div>

        <form class="login-form" @submit.prevent="handleSignIn">
          <!-- Input 1: Store ID / Staff ID -->
          <div class="input-group">
            <input
              v-model="storeId"
              type="text"
              class="underline-input"
              placeholder="Store ID/Staff ID"
              autocomplete="username"
              required
              @input="errorMessage = ''"
            />
          </div>

          <!-- Input 2: PIN -->
          <div class="input-group">
            <input
              v-model="pin"
              type="password"
              class="underline-input"
              placeholder="PIN"
              autocomplete="current-password"
              required
              @input="errorMessage = ''"
            />
          </div>

          <!-- Error Alert Banner -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="sign-in-btn"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">SIGN IN</span>
            <span v-else>VERIFYING...</span>
          </button>
        </form>

        <!-- Footer Help Text -->
        <div class="login-footer-help">
          <span>Can’t access your account? </span>
          <button type="button" class="support-link" @click="handleContactSupport">
            Contact IT Support
          </button>
        </div>
      </div>
    </main>

    <!-- IT Support Info Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isSupportModalOpen" class="support-modal-backdrop" @click.self="isSupportModalOpen = false">
          <div class="support-modal-card">
            <div class="support-modal-header">
              <span class="support-title">IT SUPPORT & ACCESS</span>
              <button type="button" class="close-btn" @click="isSupportModalOpen = false">✕</button>
            </div>
            <div class="support-body">
              <p>For staff dashboard credentials or PIN resets, please contact the event IT support desk.</p>
              <div class="support-details">
                <div class="support-row">
                  <span class="support-label">Support Email:</span>
                  <span class="support-val">support@707.co.id</span>
                </div>
                <div class="support-row">
                  <span class="support-label">Staff Hotline:</span>
                  <span class="support-val">+62 812 7720 8270</span>
                </div>
              </div>
            </div>
            <button type="button" class="support-close-btn" @click="isSupportModalOpen = false">Close</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiStaffLogin } from '../api/client'

const emit = defineEmits(['login-success'])

const storeId = ref('')
const pin = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const isSupportModalOpen = ref(false)

const handleSignIn = async () => {
  errorMessage.value = ''
  isLoading.value = true

  const trimmedId = storeId.value.trim().toUpperCase()
  const trimmedPin = pin.value.trim()

  try {
    const result = await apiStaffLogin(trimmedId, trimmedPin)

    if (result && result.success) {
      // Save authenticated session (token verified server-side)
      localStorage.setItem('staff_auth', 'true')
      sessionStorage.setItem('staff_auth', 'true')
      localStorage.setItem('staff_token', result.token)
      sessionStorage.setItem('staff_token', result.token)
      localStorage.setItem('staff_store_id', trimmedId)
      emit('login-success')
    } else {
      errorMessage.value = result?.error || 'Invalid Store ID or PIN. Please check your credentials.'
    }
  } catch (err) {
    console.error('[Admin Login Error]', err)
    errorMessage.value = err.message || 'Connection error. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleContactSupport = () => {
  isSupportModalOpen.value = true
}
</script>

<style scoped>
.admin-login-page-container {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #f2f2f2;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* HEADER WITH CENTERED 707 LOGO */
.header-container {
  width: 100%;
  height: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  height: 14px;
  width: 45px;
  object-fit: contain;
  display: block;
}

/* MAIN SIGN IN CARD */
.login-main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.login-header-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}

.login-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 33px;
  color: #000000;
  margin: 0 0 4px 0;
}

.login-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 18px;
  color: #000000;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.underline-input {
  width: 100%;
  height: 52px;
  border: none;
  border-bottom: 1px solid #000000;
  background: transparent;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #000000;
  outline: none;
  box-sizing: border-box;
  padding: 16px 0 12px 0;
  transition: border-bottom-color 0.2s ease;
}

.underline-input:focus {
  border-bottom-width: 2px;
}

.underline-input::placeholder {
  color: #ababab;
  font-size: 14px;
}

.error-message {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.08);
  border: 1px solid rgba(211, 47, 47, 0.2);
  padding: 8px 12px;
  border-radius: 4px;
}

.sign-in-btn {
  width: 100%;
  height: 56px;
  background-color: #000000;
  color: #ffffff;
  border: 1px solid #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  transition: all 0.2s ease;
}

.sign-in-btn:hover:not(:disabled) {
  background-color: #222222;
}

.sign-in-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer-help {
  margin-top: 24px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 18px;
  color: #000000;
}

.support-link {
  background: transparent;
  border: none;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #000000;
  text-decoration: underline;
  cursor: pointer;
}

.support-link:hover {
  opacity: 0.7;
}

/* SUPPORT MODAL */
.support-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.support-modal-card {
  background: #ffffff;
  border: 1px solid #000000;
  width: 100%;
  max-width: 380px;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.support-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.support-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #000000;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.support-body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #333333;
}

.support-details {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f7f7f7;
  padding: 12px;
  border: 1px solid #e0e0e0;
}

.support-row {
  display: flex;
  justify-content: space-between;
}

.support-label {
  font-weight: 600;
  color: #000000;
}

.support-val {
  color: #000000;
}

.support-close-btn {
  height: 40px;
  background: #000000;
  color: #ffffff;
  border: 1px solid #000000;
  font-weight: 500;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
