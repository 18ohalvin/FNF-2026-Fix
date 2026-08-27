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
        :registration-type="registrationType"
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
        :user-role="activeUserData?.role || (registrationType === 'public' ? 'PUBLIC ACCESS' : 'VIP GUEST')"
        @submit="handleDatesSubmit"
      />
    </template>

    <!-- PAGE 4: Final E-Ticket / Summary Screen (Node 213:794) -->
    <template v-else-if="currentPage === 'ticket-summary'">
      <TicketSummaryPage
        :user-details="activeUserData"
        :selected-dates="selectedEventDates"
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
import { apiCheckPhone, apiSaveGuest, apiCreateReservation, apiStaffLogout } from './api/client'

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
const registrationType = ref('vip') // 'vip' | 'public'
const countryCode = ref('+62')
const phoneNumber = ref('')
const isWhyModalOpen = ref(false)
const isCountryModalOpen = ref(false)
const isCheckingDatabase = ref(false)
const toastMessage = ref('')
const activeUserData = ref(null)
const selectedEventDates = ref(['day-1'])
const intendedAdminPage = ref('scanner')

const isStaffAuthenticated = () => {
  return localStorage.getItem('staff_auth') === 'true' || sessionStorage.getItem('staff_auth') === 'true'
}

const checkRegistrationTypeFromUrl = () => {
  const path = window.location.pathname.toLowerCase()
  const params = new URLSearchParams(window.location.search)
  if (path.startsWith('/public') || params.get('type') === 'public') {
    registrationType.value = 'public'
    selectedEventDates.value = ['day-2']
  } else {
    registrationType.value = 'vip'
    selectedEventDates.value = ['day-1']
  }
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
  else if (registrationType.value === 'public') targetUrl = '/public'
  else if (window.location.pathname.startsWith('/vip')) targetUrl = '/vip'

  if (replace) {
    history.replaceState({ page, type: registrationType.value }, '', targetUrl)
  } else {
    history.pushState({ page, type: registrationType.value }, '', targetUrl)
  }
}

const handleLoginSuccess = () => {
  const target = intendedAdminPage.value || 'scanner'
  navigateTo(target, true)
}

const handleLogout = () => {
  apiStaffLogout()
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

const handleGoHome = () => {
  activeUserData.value = null
  phoneNumber.value = ''
  selectedEventDates.value = registrationType.value === 'public' ? ['day-2'] : ['day-1']
  navigateTo('landing', true)
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
  checkRegistrationTypeFromUrl()

  // Prevent users from going back once arrival dates are selected and pass is issued
  if (currentPage.value === 'ticket-summary') {
    history.pushState({ page: 'ticket-summary' }, '', window.location.pathname)
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
  checkRegistrationTypeFromUrl()

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
    history.replaceState({ page: 'landing', type: registrationType.value }, '', path)
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

// Database check logic with 1-chance registration & duplicate prevention
const handleCheckNumber = async () => {
  if (!isPhoneValid.value || isCheckingDatabase.value) return

  isCheckingDatabase.value = true
  const rawDigits = phoneNumber.value.replace(/\D/g, '')
  const defaultRole = registrationType.value === 'public' ? 'PUBLIC ACCESS' : 'VIP GUEST'

  try {
    const result = await apiCheckPhone(rawDigits)
    isCheckingDatabase.value = false

    // If guest is already registered, load their confirmed ticket pass directly to prevent duplicate records
    if (result.found && (result.isRegistered || result.reservation)) {
      const role = result.guest?.role || defaultRole
      activeUserData.value = {
        ...result.guest,
        role,
        access_id: result.reservation?.access_id || result.guest?.access_id || '707',
        isRegistered: true
      }
      selectedEventDates.value = result.reservation?.selected_dates || result.guest?.selected_dates || ['day-1']
      showToast('Existing pass confirmed for this number. Loading your E-Pass...')
      navigateTo('ticket-summary', true)
      return
    }

    if (result.found) {
      const role = result.guest?.role || defaultRole
      activeUserData.value = { ...result.guest, role, isRegistered: false }
    } else {
      activeUserData.value = {
        phone: rawDigits,
        salutation: 'Mr.',
        firstName: '',
        lastName: '',
        email: '',
        role: defaultRole,
        isRegistered: false
      }
    }

    navigateTo('review-details')
  } catch (err) {
    isCheckingDatabase.value = false
    activeUserData.value = {
      phone: rawDigits,
      salutation: 'Mr.',
      firstName: '',
      lastName: '',
      email: '',
      role: defaultRole,
      isRegistered: false
    }
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
  
  // Persist guest details to SQLite backend with duplicate email verification
  try {
    const saveRes = await apiSaveGuest(mergedData)
    // Only display toast and block if it's an explicit validation error from backend (e.g. duplicate email), ignore raw network fetch errors
    if (saveRes && saveRes.error && saveRes.status === 400 && !saveRes.isNetworkError && saveRes.error !== 'Load failed' && saveRes.error !== 'Failed to fetch') {
      showToast(saveRes.error)
      return
    }
  } catch (err) {
    console.warn('[Save Guest Exception]', err)
  }

  navigateTo('select-dates')
}

const generateShortAccessId = (length = 3) => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const handleDatesSubmit = async (dates) => {
  selectedEventDates.value = dates

  // Generate 3-digit unique alphanumeric Access ID (excluding ambiguous 0, O, 1, I, L)
  const accessId = generateShortAccessId(3)
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
  const res = await apiCreateReservation({
    phone,
    accessId,
    selectedDates: dates
  })

  const finalAccessId = res?.access_id || res?.accessId || accessId

  // Attach access_id to activeUserData for instant real-time sync
  if (activeUserData.value) {
    activeUserData.value.access_id = finalAccessId
    activeUserData.value.phone = phone
    activeUserData.value.isRegistered = true
  } else {
    activeUserData.value = { ...guestPayload, access_id: finalAccessId, isRegistered: true }
  }

  // Once dates are selected, lock into ticket-summary with history replace to prevent navigating back
  navigateTo('ticket-summary', true)
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
