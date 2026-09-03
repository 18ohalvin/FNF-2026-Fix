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
  <div v-else class="app-wrapper" :class="{ 'landing-mode': currentPage === 'landing' }">
    <!-- Persistent Static Global Header with 707 Logo & Sponsor Logo for Registration Flow -->
    <AppHeader :is-landing="currentPage === 'landing'" @home="handleGoHome" />

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
        :already-booked-dates="existingBookedDates"
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

    <!-- Already Registered Bottom Sheet Modal (1 Number & 1 Email per Guest) -->
    <AlreadyRegisteredModal
      :is-open="isAlreadyRegisteredOpen"
      :phone="phoneNumber"
      :message="alreadyRegisteredMsg"
      @close="isAlreadyRegisteredOpen = false"
      @register-new="handleRegisterNewGuest"
      @select-another-day="handleSelectAnotherDay"
    />

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'
import LandingPage from './components/LandingPage.vue'
import AppHeader from './components/AppHeader.vue'
import WhatsappForm from './components/WhatsappForm.vue'
import CtaButton from './components/CtaButton.vue'
import WhyWeNeedThisModal from './components/WhyWeNeedThisModal.vue'
import CountryCodeModal from './components/CountryCodeModal.vue'
import AlreadyRegisteredModal from './components/AlreadyRegisteredModal.vue'
import ReviewDetailsPage from './components/ReviewDetailsPage.vue'
import SelectDatesPage from './components/SelectDatesPage.vue'
import TicketSummaryPage from './components/TicketSummaryPage.vue'
import ScannerPage from './components/ScannerPage.vue'
import AnalyticsPage from './components/AnalyticsPage.vue'
import CustomerDatabasePage from './components/CustomerDatabasePage.vue'
import AdminLoginPage from './components/AdminLoginPage.vue'
import {
  apiCheckPhone,
  apiCheckEmail,
  apiSaveGuest,
  apiCreateReservation,
  apiStaffLogout
} from './api/client'

// Navigation & Screen State
const currentPage = ref('landing') // 'landing' | 'whatsapp-check' | 'review-details' | 'select-dates' | 'ticket-summary' | 'scanner' | 'analytics' | 'database' | 'login'
const registrationType = ref('vip') // 'vip' | 'public'
const countryCode = ref('+62')
const phoneNumber = ref('')
const isWhyModalOpen = ref(false)
const isCountryModalOpen = ref(false)
const isAlreadyRegisteredOpen = ref(false)
const alreadyRegisteredMsg = ref('')
const isCheckingDatabase = ref(false)
const toastMessage = ref('')
const activeUserData = ref(null)
const selectedEventDates = ref(['day-1'])
const existingBookedDates = ref([])
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

// Lock scroll strictly when on landing page to ensure single-screen fit without swipe/bounce
watchEffect(() => {
  if (typeof document !== 'undefined') {
    if (currentPage.value === 'landing') {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.overscrollBehavior = 'none'
      document.body.style.overscrollBehavior = 'none'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overscrollBehavior = ''
    }
  }
})

// Navigation Helper with HTML5 History API
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
  // If user is already on ticket-summary, reset state and go to landing
  phoneNumber.value = ''
  activeUserData.value = null
  selectedEventDates.value = registrationType.value === 'public' ? ['day-2'] : ['day-1']
  navigateTo('landing', true)
}

const handleRegisterNewGuest = () => {
  isAlreadyRegisteredOpen.value = false
  phoneNumber.value = ''
  existingBookedDates.value = []
}

const handleSelectAnotherDay = () => {
  isAlreadyRegisteredOpen.value = false
  navigateTo('select-dates')
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
  if (isAlreadyRegisteredOpen.value) {
    isAlreadyRegisteredOpen.value = false
    return
  }

  // Prevent going back from ticket-summary to edit dates (prevents double database entries)
  if (currentPage.value === 'ticket-summary') {
    history.pushState({ page: 'ticket-summary' }, '', window.location.href)
    return
  }

  checkRegistrationTypeFromUrl()

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

// Database check logic with 1 chance to register enforcement
const handleCheckNumber = async () => {
  if (!isPhoneValid.value || isCheckingDatabase.value) return

  isCheckingDatabase.value = true
  const rawDigits = phoneNumber.value.replace(/\D/g, '')
  const defaultRole = registrationType.value === 'public' ? 'PUBLIC ACCESS' : 'VIP GUEST'

  try {
    const result = await apiCheckPhone(rawDigits)
    isCheckingDatabase.value = false

    // If phone number is already registered, trigger reminder modal with add-on options
    if (result.alreadyRegistered) {
      const role = result.guest?.role || defaultRole
      const resv = result.reservation
      let bookedDates = []
      if (resv && resv.selected_dates) {
        try {
          bookedDates = typeof resv.selected_dates === 'string' ? JSON.parse(resv.selected_dates) : resv.selected_dates
        } catch (e) {
          bookedDates = []
        }
      }
      existingBookedDates.value = Array.isArray(bookedDates) ? bookedDates : []
      activeUserData.value = {
        ...result.guest,
        role,
        accessId: resv?.access_id || result.guest?.access_id || '707',
        access_id: resv?.access_id || result.guest?.access_id || '707'
      }
      alreadyRegisteredMsg.value = 'This WhatsApp number is already registered. Select additional event days or resend your E-Pass.'
      isAlreadyRegisteredOpen.value = true
      return
    }

    if (result.found) {
      const role = result.guest?.role || defaultRole
      activeUserData.value = { ...result.guest, role, isRegistered: true }
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
  const enteredEmail = (formData.email || activeUserData.value?.email || '').trim()

  // Check email uniqueness before proceeding to prevent duplicate database entries
  if (enteredEmail && enteredEmail !== 'guest@707.co.id') {
    try {
      const emailCheck = await apiCheckEmail(enteredEmail, rawPhone)
      if (emailCheck && emailCheck.alreadyRegistered) {
        alreadyRegisteredMsg.value = 'This email address is already registered to another guest. Each guest is eligible for 1 registration pass only.'
        isAlreadyRegisteredOpen.value = true
        return
      }
    } catch (e) {
      console.warn('[Email Check Warning]', e)
    }
  }

  const mergedData = { 
    ...activeUserData.value, 
    ...formData, 
    phone: rawPhone,
    firstName: formData.firstName || activeUserData.value?.firstName || 'GUEST',
    lastName: formData.lastName || activeUserData.value?.lastName || '',
    email: enteredEmail || 'guest@707.co.id'
  }
  activeUserData.value = mergedData
  
  // Persist guest details to SQLite backend
  try {
    const saveRes = await apiSaveGuest(mergedData)
    if (saveRes && saveRes.alreadyRegistered) {
      alreadyRegisteredMsg.value = saveRes.error || 'This email address has already been registered for the event.'
      isAlreadyRegisteredOpen.value = true
      return
    }
  } catch (err) {
    console.warn('[Save Guest Warning]', err)
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
  // Preserve existing Access ID if user is adding dates to an existing registration
  const accessId = activeUserData.value?.access_id || activeUserData.value?.accessId || generateShortAccessId(3)

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

  // STEP 2: THEN create/update reservation with POST /api/reservations
  const res = await apiCreateReservation({
    phone,
    accessId,
    selectedDates: dates
  })

  const finalAccessId = res?.accessId || accessId
  let finalDatesArray = dates
  if (res?.selectedDates) {
    try {
      finalDatesArray = typeof res.selectedDates === 'string' ? JSON.parse(res.selectedDates) : res.selectedDates
    } catch (e) {
      finalDatesArray = dates
    }
  }

  selectedEventDates.value = Array.isArray(finalDatesArray) ? finalDatesArray : dates

  // Attach access_id to activeUserData for instant real-time sync
  if (activeUserData.value) {
    activeUserData.value.access_id = finalAccessId
    activeUserData.value.accessId = finalAccessId
    activeUserData.value.phone = phone
  } else {
    activeUserData.value = { ...guestPayload, access_id: finalAccessId, accessId: finalAccessId }
  }

  // Replace history so user cannot navigate back to select-dates from ticket-summary
  navigateTo('ticket-summary', true)
}
</script>

<style scoped>
.app-wrapper.landing-mode {
  height: 100vh !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
  overscroll-behavior: none !important;
}

.app-wrapper.wide-mode {
  max-width: 100% !important;
  width: 100% !important;
  box-shadow: none !important;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Toast Alert Notification */
.toast-notification {
  position: fixed;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000000;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  z-index: 10000;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
