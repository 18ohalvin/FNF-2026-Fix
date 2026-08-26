<template>
  <!-- Standalone Admin Sign In Landing Page App (Figma 454:1265) -->
  <template v-if="currentPage === 'login'">
    <AdminLoginPage @login-success="handleLoginSuccess" />
  </template>

  <!-- Standalone Security Scanner Page App -->
  <template v-else-if="currentPage === 'scanner'">
    <ScannerPage
      @nav-analytics="navigateTo('analytics')"
      @logout="handleLogout"
    />
  </template>

  <!-- Standalone Customer Analytics Dashboard Page App -->
  <template v-else-if="currentPage === 'analytics'">
    <AnalyticsPage
      @nav-database="navigateTo('database')"
      @nav-scanner="navigateTo('scanner')"
      @logout="handleLogout"
    />
  </template>

  <!-- Standalone Customer Database Page App -->
  <template v-else-if="currentPage === 'database'">
    <CustomerDatabasePage
      @nav-analytics="navigateTo('analytics')"
      @nav-scanner="navigateTo('scanner')"
      @logout="handleLogout"
    />
  </template>

  <!-- Guest Registration PWA -->
  <div v-else class="app-wrapper">
    <!-- Persistent Static Global Header with 707 Logo for Registration Flow -->
    <AppHeader @home="handleGoHome" />

    <!-- PAGE 0: Landing Page (Node 241:1383) -->
    <template v-if="currentPage === 'landing'">
      <LandingPage
        @start="handleStartAccess"
      />
    </template>

    <!-- PAGE 1: WhatsApp Number Check Screen (Node 211:192) -->
    <template v-else-if="currentPage === 'whatsapp-check'">
      <!-- Main Content Area with WhatsApp Form -->
      <main class="main-content">
        <WhatsappForm
          v-model="phoneNumber"
          :country-code="countryCode"
          @open-why-modal="openWhyModal"
          @open-country-modal="openCountryModal"
        />
      </main>

      <!-- Sticky Bottom CTA Button -->
      <CtaButton
        :active="isPhoneValid"
        :loading="isCheckingDatabase"
        label="NEXT"
        @click="handleCheckNumber"
      />

      <!-- Guidelines Modal ("Why We Need This") -->
      <WhyWeNeedThisModal
        :is-open="isWhyModalOpen"
        @close="isWhyModalOpen = false"
      />

      <!-- Country Code Modal (Node 232:1311) -->
      <CountryCodeModal
        :is-open="isCountryModalOpen"
        :selected="countryCode"
        @close="isCountryModalOpen = false"
        @select="val => countryCode = val"
      />
    </template>

    <!-- PAGE 2: Review Details Screen (Registered VIP / Unregistered Guest) -->
    <template v-else-if="currentPage === 'review-details'">
      <ReviewDetailsPage
        :initial-data="activeUserData"
        @submit="handleDetailsSubmit"
      />
    </template>

    <!-- PAGE 3: Date Selection Screen -->
    <template v-else-if="currentPage === 'select-dates'">
      <SelectDatesPage
        :user-role="activeUserData?.role || 'VIP GUEST'"
        @submit="handleDatesSubmit"
      />
    </template>

    <!-- PAGE 4: Final E-Ticket / Summary Screen (Node 213:794) -->
    <template v-else-if="currentPage === 'ticket-summary'">
      <TicketSummaryPage
        :user-details="activeUserData"
        :selected-date-ids="selectedEventDates"
        @home="handleGoHome"
      />
    </template>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LandingPage from './components/LandingPage.vue'
import AppHeader from './components/AppHeader.vue'
import WhatsappForm from './components/WhatsappForm.vue'
import CtaButton from './components/CtaButton.vue'
import WhyWeNeedThisModal from './components/WhyWeNeedThisModal.vue'
import CountryCodeModal from './components/CountryCodeModal.vue'
import ReviewDetailsPage from './components/ReviewDetailsPage.vue'
import SelectDatesPage from './components/SelectDatesPage.vue'
import TicketSummaryPage from './components/TicketSummaryPage.vue'
import ScannerPage from './components/ScannerPage.vue'
import AnalyticsPage from './components/AnalyticsPage.vue'
import CustomerDatabasePage from './components/CustomerDatabasePage.vue'
import AdminLoginPage from './components/AdminLoginPage.vue'
import { apiCheckPhone, apiSaveGuest, apiCreateReservation } from './api/client'

// Registered Mock Database Record
const REGISTERED_VIP_DATABASE = [
  {
    phoneVariants: ['81707909707', '081707909707', '6281707909707'],
    salutation: 'Mr.',
    firstName: 'ALVIN',
    lastName: 'DECOROUS',
    email: '18ohalvin@gmail.com',
    instagram: '@ohalvin',
    role: 'VIP GUEST'
  }
]

// Navigation & Screen State
const currentPage = ref('landing') // 'landing' | 'whatsapp-check' | 'review-details' | 'select-dates' | 'ticket-summary' | 'scanner' | 'analytics' | 'database' | 'login'
const countryCode = ref('+62')
const phoneNumber = ref('')
const isWhyModalOpen = ref(false)
const isCountryModalOpen = ref(false)
const isCheckingDatabase = ref(false)
const toastMessage = ref('')
const activeUserData = ref(null)
const selectedEventDates = ref(['day-1', 'day-2'])
const intendedAdminPage = ref('scanner')

const isStaffAuthenticated = () => {
  return localStorage.getItem('staff_auth') === 'true' || sessionStorage.getItem('staff_auth') === 'true'
}

// Navigation Helper with HTML5 History API for browser/device back button & URL routing support
const navigateTo = (page, replace = false) => {
  // Protect admin routes with staff login
  if (['scanner', 'analytics', 'database'].includes(page) && !isStaffAuthenticated()) {
    intendedAdminPage.value = page
    currentPage.value = 'login'
    if (replace) {
      history.replaceState({ page: 'login' }, '', '/admin')
    } else {
      history.pushState({ page: 'login' }, '', '/admin')
    }
    return
  }

  currentPage.value = page
  let targetUrl = '/'
  if (page === 'login') targetUrl = '/admin'
  else if (page === 'scanner') targetUrl = '/scanner'
  else if (page === 'analytics') targetUrl = '/analytics'
  else if (page === 'database') targetUrl = '/database'

  if (replace) {
    history.replaceState({ page }, '', targetUrl)
  } else {
    history.pushState({ page }, '', targetUrl)
  }
}

const handleLoginSuccess = () => {
  const target = intendedAdminPage.value || 'scanner'
  navigateTo(target, true)
}

const handleLogout = () => {
  localStorage.removeItem('staff_auth')
  sessionStorage.removeItem('staff_auth')
  currentPage.value = 'login'
  history.replaceState({ page: 'login' }, '', '/admin')
}

const handleStartAccess = () => {
  navigateTo('whatsapp-check')
}

const openWhyModal = () => {
  isWhyModalOpen.value = true
}

const openCountryModal = () => {
  isCountryModalOpen.value = true
}

const handlePopState = (event) => {
  if (isWhyModalOpen.value) {
    isWhyModalOpen.value = false
    return
  }
  if (isCountryModalOpen.value) {
    isCountryModalOpen.value = false
    return
  }
  if (event.state && event.state.page) {
    currentPage.value = event.state.page
  } else if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/login')) {
    currentPage.value = 'login'
  } else if (window.location.pathname.startsWith('/scanner')) {
    if (!isStaffAuthenticated()) {
      intendedAdminPage.value = 'scanner'
      currentPage.value = 'login'
    } else {
      currentPage.value = 'scanner'
    }
  } else if (window.location.pathname.startsWith('/analytics')) {
    if (!isStaffAuthenticated()) {
      intendedAdminPage.value = 'analytics'
      currentPage.value = 'login'
    } else {
      currentPage.value = 'analytics'
    }
  } else if (window.location.pathname.startsWith('/database')) {
    if (!isStaffAuthenticated()) {
      intendedAdminPage.value = 'database'
      currentPage.value = 'login'
    } else {
      currentPage.value = 'database'
    }
  } else {
    currentPage.value = 'landing'
  }
}

onMounted(() => {
  // Direct URL Path Routing check
  const path = window.location.pathname
  if (path.startsWith('/admin') || path.startsWith('/login')) {
    currentPage.value = 'login'
    history.replaceState({ page: 'login' }, '', '/admin')
  } else if (path.startsWith('/scanner')) {
    if (!isStaffAuthenticated()) {
      intendedAdminPage.value = 'scanner'
      currentPage.value = 'login'
      history.replaceState({ page: 'login' }, '', '/admin')
    } else {
      currentPage.value = 'scanner'
      history.replaceState({ page: 'scanner' }, '', '/scanner')
    }
  } else if (path.startsWith('/analytics')) {
    if (!isStaffAuthenticated()) {
      intendedAdminPage.value = 'analytics'
      currentPage.value = 'login'
      history.replaceState({ page: 'login' }, '', '/admin')
    } else {
      currentPage.value = 'analytics'
      history.replaceState({ page: 'analytics' }, '', '/analytics')
    }
  } else if (path.startsWith('/database')) {
    if (!isStaffAuthenticated()) {
      intendedAdminPage.value = 'database'
      currentPage.value = 'login'
      history.replaceState({ page: 'login' }, '', '/admin')
    } else {
      currentPage.value = 'database'
      history.replaceState({ page: 'database' }, '', '/database')
    }
  } else {
    history.replaceState({ page: 'landing' }, '', path)
  }
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})

// Phone validation: Minimum 8 digits
const isPhoneValid = computed(() => {
  const digits = phoneNumber.value.replace(/\D/g, '')
  return digits.length >= 8
})

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = ''
    }
  }, 2800)
}

// Database check logic using API client with fallback
const handleCheckNumber = async () => {
  if (!isPhoneValid.value || isCheckingDatabase.value) return

  isCheckingDatabase.value = true
  const rawDigits = phoneNumber.value.replace(/\D/g, '')

  try {
    const result = await apiCheckPhone(rawDigits)
    isCheckingDatabase.value = false

    if (result.found) {
      activeUserData.value = { ...result.guest, isRegistered: true }
      showToast('Verified: VIP Guest record found.')
    } else {
      activeUserData.value = {
        phone: rawDigits,
        salutation: 'Mr.',
        firstName: '',
        lastName: '',
        email: '',
        instagram: '',
        role: 'VIP GUEST',
        isRegistered: false
      }
      showToast('Unregistered number. Please complete your details.')
    }

    navigateTo('review-details')
  } catch (err) {
    isCheckingDatabase.value = false
    showToast('Notice: Using default profile mode.')
    navigateTo('review-details')
  }
}

const handleDetailsSubmit = async (formData) => {
  const rawPhone = phoneNumber.value.replace(/\D/g, '') || activeUserData.value?.phone || '81707909707'
  const mergedData = { 
    ...activeUserData.value, 
    ...formData, 
    phone: rawPhone,
    firstName: formData.firstName || activeUserData.value?.firstName || 'GUEST',
    lastName: formData.lastName || activeUserData.value?.lastName || '',
    email: formData.email || activeUserData.value?.email || 'guest@707.co.id'
  }
  activeUserData.value = mergedData
  
  // Persist guest details to SQLite backend
  await apiSaveGuest(mergedData)
  navigateTo('select-dates')
}

const generateShortAccessId = (length = 6) => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const handleDatesSubmit = async (dates) => {
  selectedEventDates.value = dates

  // Generate short 5-6 character alphanumeric Access ID (excluding 0, O, 1, I, L)
  const accessId = generateShortAccessId(6)

  const phone = activeUserData.value?.phone || phoneNumber.value.replace(/\D/g, '') || '81707909707'

  // STEP 1: MUST FIRST save/upsert guest profile to POST /api/guests BEFORE reservations
  const guestPayload = {
    phone,
    salutation: activeUserData.value?.salutation || 'Mr.',
    firstName: activeUserData.value?.firstName || activeUserData.value?.first_name || 'GUEST',
    lastName: activeUserData.value?.lastName || activeUserData.value?.last_name || '',
    email: activeUserData.value?.email || 'guest@707.co.id',
    instagram: activeUserData.value?.instagram || '',
    role: activeUserData.value?.role || 'VIP GUEST'
  }
  
  await apiSaveGuest(guestPayload)

  // STEP 2: THEN create reservation with POST /api/reservations
  await apiCreateReservation({
    phone,
    accessId,
    selectedDates: dates
  })

  // Attach access_id to activeUserData for instant real-time sync
  if (activeUserData.value) {
    activeUserData.value.access_id = accessId
    activeUserData.value.phone = phone
  } else {
    activeUserData.value = { ...guestPayload, access_id: accessId }
  }

  showToast('Ticket Pass Generated & Synced!')
  navigateTo('ticket-summary')
}

const handleGoHome = () => {
  if (currentPage.value !== 'landing') {
    navigateTo('landing')
  }
}
</script>

<style scoped>
.app-wrapper.wide-mode {
  max-width: 100% !important;
  width: 100% !important;
  box-shadow: none !important;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding-bottom: 24px;
}

.toast-notification {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000000;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 30px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  z-index: 10000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
