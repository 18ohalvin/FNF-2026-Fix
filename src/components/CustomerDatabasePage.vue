<template>
  <div class="database-page-container">
    <div class="database-frame">
      <!-- HEADER CONTAINER (Matching Figma 448:677 & 454:1203) -->
      <div class="header-container">
        <div class="header-subcontainer">
          <div class="header-title-group">
            <h1 class="page-title">CUSTOMER DATABASE</h1>
            <div class="header-action-buttons">
              <button
                type="button"
                class="header-btn outlined-btn"
                @click="emit('nav-analytics')"
              >
                <span>BACK TO ANALYTICS</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <div class="logo-wrapper">
            <button
              type="button"
              class="header-logout-btn"
              title="Log out"
              aria-label="Log out"
              @click="handleLogout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
            <img src="../assets/logo-707.png" alt="707 Logo" class="brand-logo" />
          </div>
        </div>
      </div>

      <!-- SEARCH & FILTER CONTROLS BAR (Figma 448:884) -->
      <div class="search-filter-bar">
        <!-- Search Box -->
        <div class="search-box-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input-field"
            placeholder="Search by Name, Email, or Access ID"
            @input="handleSearch"
          />
          <div class="search-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        <!-- Filter Dropdown Button -->
        <div class="filter-dropdown-container">
          <button
            type="button"
            class="filter-by-btn"
            @click="isFilterMenuOpen = !isFilterMenuOpen"
          >
            <span>FILTER BY{{ currentFilter ? `: ${currentFilter}` : '' }}</span>
          </button>
          <div v-if="isFilterMenuOpen" class="filter-dropdown-menu">
            <div class="filter-menu-item" :class="{ active: currentFilter === '' }" @click="applyFilter('')">
              ALL GUESTS
            </div>
            <div class="filter-menu-item" :class="{ active: currentFilter === 'VIP' }" @click="applyFilter('VIP')">
              VIP GUESTS
            </div>
            <div class="filter-menu-item" :class="{ active: currentFilter === 'CHECKED_IN' }" @click="applyFilter('CHECKED_IN')">
              CHECKED-IN
            </div>
          </div>
        </div>

        <!-- Date Picker Button (Figma 448:1017: Day 1 - 02 September 2026) -->
        <button
          type="button"
          class="date-picker-btn"
          @click="isCalendarOpen = true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="calendar-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span class="selected-date-text">{{ selectedEventDayText }}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <!-- GUEST DATABASE TABLE (Figma 448:958) -->
      <div class="table-scroll-container">
        <div class="guest-table-wrapper">
          <!-- Table Header Row -->
          <div class="table-header-row">
            <div class="col-type">GUEST TYPE</div>
            <div class="col-name">GUEST NAME</div>
            <div class="col-access">ACCESS ID</div>
            <div class="col-ticket">TICKET BOOKED</div>
            <div class="col-contact">CONTACT</div>
            <div class="col-time">SCAN TIME</div>
            <div class="col-action">OVERRIDE ACTION</div>
          </div>

          <!-- Loading / Empty States -->
          <div v-if="isLoading" class="table-state-row">
            Loading guest database records...
          </div>
          <div v-else-if="guests.length === 0" class="table-state-row">
            No customer records found matching search or filter.
          </div>

          <!-- Guest Data Rows -->
          <div
            v-for="guest in guests"
            v-else
            :key="guest.phone"
            class="table-body-row"
          >
            <!-- Guest Type (Figma: VIP / REGULAR) -->
            <div class="col-type">
              <span class="guest-type-text">
                {{ guest.role?.toUpperCase().includes('VIP') ? 'VIP' : 'REGULAR' }}
              </span>
            </div>

            <!-- Guest Name -->
            <div class="col-name">
              <span class="guest-name-text">
                {{ `${guest.first_name || ''} ${guest.last_name || ''}`.toUpperCase().trim() }}
              </span>
            </div>

            <!-- Access ID -->
            <div class="col-access">
              <span class="access-id-text">
                {{ guest.access_id || 'N/A' }}
              </span>
            </div>

            <!-- Ticket Booked (Formatted day numbers e.g. 1 | 2 | 3 | 4) -->
            <div class="col-ticket">
              <div class="ticket-days-group">
                <template v-for="(dayNum, idx) in formatTicketNumbers(guest.selected_dates)" :key="idx">
                  <span class="day-num">{{ dayNum }}</span>
                  <span v-if="idx < formatTicketNumbers(guest.selected_dates).length - 1" class="day-pipe">|</span>
                </template>
              </div>
            </div>

            <!-- Contact (Phone line 1, Email line 2) -->
            <div class="col-contact">
              <div class="contact-info">
                <span class="contact-phone">{{ guest.phone }}</span>
                <span class="contact-email">{{ guest.email || 'N/A' }}</span>
              </div>
            </div>

            <!-- Scan Time -->
            <div class="col-time">
              <span class="scan-time-text">
                {{ formatScanTime(guest.last_scanned_at, guest.is_checked_in) }}
              </span>
            </div>

            <!-- Override Action Button + Delete Trash Icon -->
            <div class="col-action">
              <button
                type="button"
                class="override-action-btn"
                :class="guest.is_checked_in ? 'btn-force-out' : 'btn-check-in'"
                :disabled="isActionProcessing"
                @click="handleOverride(guest)"
              >
                {{ guest.is_checked_in ? 'FORCE OUT' : 'CHECK-IN' }}
              </button>

              <button
                type="button"
                class="edit-guest-btn"
                title="Edit Guest Details"
                :disabled="isActionProcessing"
                @click="handleOpenEdit(guest)"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              <button
                type="button"
                class="delete-guest-btn"
                title="Delete Guest Record"
                :disabled="isActionProcessing"
                @click="handleDelete(guest)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5-Day Event Picker Modal -->
    <CalendarModal
      :is-open="isCalendarOpen"
      :selected-date="selectedEventDayText"
      @close="isCalendarOpen = false"
      @select="handleDaySelect"
    />

    <!-- Manual Edit Guest Modal -->
    <EditGuestModal
      :is-open="isEditModalOpen"
      :guest="selectedEditGuest"
      @close="isEditModalOpen = false"
      @saved="loadGuests(false)"
    />

    <!-- Toast Notification for Alerts & Override Errors -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2" style="flex-shrink: 0;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetchCustomerDatabase, apiOverrideGuestStatus, apiDeleteGuest } from '../api/client'
import CalendarModal from './CalendarModal.vue'
import EditGuestModal from './EditGuestModal.vue'

const emit = defineEmits(['nav-analytics', 'nav-scanner', 'logout'])

const handleLogout = () => {
  localStorage.removeItem('staff_auth')
  sessionStorage.removeItem('staff_auth')
  emit('logout')
}

const guests = ref([])
const searchQuery = ref('')
const currentFilter = ref('')
const isFilterMenuOpen = ref(false)
const isLoading = ref(true)
const isActionProcessing = ref(false)
const isEditModalOpen = ref(false)
const selectedEditGuest = ref(null)
let searchDebounce = null
let pollInterval = null

// Event Day State (Defaults to 'All Days' so initial load fetches entire database)
const isCalendarOpen = ref(false)
const selectedEventDayText = ref('All Days')

const handleOpenEdit = (guest) => {
  selectedEditGuest.value = guest
  isEditModalOpen.value = true
}

const handleDaySelect = (dayTitle) => {
  selectedEventDayText.value = dayTitle
  isCalendarOpen.value = false
  loadGuests(true)
}

const loadGuests = async (showLoadingSpinner = false) => {
  if (showLoadingSpinner) isLoading.value = true
  const dayParam = (!selectedEventDayText.value || selectedEventDayText.value.toLowerCase().includes('all')) 
    ? '' 
    : selectedEventDayText.value
  const res = await apiFetchCustomerDatabase(searchQuery.value, currentFilter.value, dayParam)
  
  // Double-check mapping: support res.guests, res.data.guests, res.data, or array res
  if (res) {
    if (Array.isArray(res.guests)) {
      guests.value = res.guests
    } else if (res.data && Array.isArray(res.data.guests)) {
      guests.value = res.data.guests
    } else if (res.data && Array.isArray(res.data)) {
      guests.value = res.data
    } else if (Array.isArray(res)) {
      guests.value = res
    } else {
      guests.value = []
    }
  }
  if (showLoadingSpinner) isLoading.value = false
}

const handleSearch = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    loadGuests(true)
  }, 300)
}

const applyFilter = (filterType) => {
  currentFilter.value = filterType
  isFilterMenuOpen.value = false
  loadGuests(true)
}

const formatTicketNumbers = (selectedDatesJson) => {
  if (!selectedDatesJson) return ['1', '2', '3', '4']
  try {
    const dates = typeof selectedDatesJson === 'string' ? JSON.parse(selectedDatesJson) : selectedDatesJson
    if (Array.isArray(dates) && dates.length > 0) {
      return dates.map((d, i) => {
        if (typeof d === 'string' && d.startsWith('day-')) {
          return d.replace('day-', '')
        }
        return `${i + 1}`
      })
    }
  } catch (e) {}
  return ['1', '2', '3', '4']
}

const formatScanTime = (scannedAt, isCheckedIn) => {
  if (!scannedAt && !isCheckedIn) return 'Not Scanned'
  if (!scannedAt) return 'Day 1 - 12:11 PM'
  try {
    const d = new Date(scannedAt)
    if (isNaN(d.getTime())) return 'Day 1 - 12:11 PM'
    const hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `Day 1 - ${formattedHours}:${minutes} ${ampm}`
  } catch (e) {
    return 'Day 1 - 12:11 PM'
  }
}

const toastMessage = ref('')
const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = ''
    }
  }, 3500)
}

const handleOverride = async (guest) => {
  isActionProcessing.value = true
  const targetAction = guest.is_checked_in ? 'force-out' : 'check-in'
  const res = await apiOverrideGuestStatus(guest.phone, targetAction)
  if (res && res.success) {
    guest.is_checked_in = targetAction === 'check-in' ? 1 : 0
    if (targetAction === 'check-in') {
      guest.last_scanned_at = new Date().toISOString()
    }
  } else {
    const errMsg = (res && res.error) || 'Override Failed: Phone number not found.'
    showToast(errMsg)
  }
  isActionProcessing.value = false
}

const handleDelete = async (guest) => {
  if (!guest || !guest.phone) return
  const guestName = `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || guest.phone
  
  let ok = true
  try {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      ok = window.confirm(`Delete guest record for "${guestName}"?`)
    }
  } catch (e) {
    ok = true
  }
  if (!ok) return

  isActionProcessing.value = true
  const targetPhone = guest.phone
  // Optimistically remove from UI list immediately
  guests.value = guests.value.filter((g) => g.phone !== targetPhone)

  try {
    const res = await apiDeleteGuest(targetPhone)
    if (!res || !res.success) {
      console.warn('[Delete guest warning]', res)
    }
  } catch (err) {
    console.error('[Delete Guest Exception]', err)
  } finally {
    isActionProcessing.value = false
    await loadGuests(false)
  }
}

onMounted(() => {
  loadGuests(true)
  // Auto-refresh guest list every 3 seconds for real-time synchronization across devices
  pollInterval = setInterval(() => {
    loadGuests(false)
  }, 3000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (searchDebounce) clearTimeout(searchDebounce)
})
</script>

<style scoped>
.database-page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f2f2f2;
  padding: 0 24px 24px 24px;
  box-sizing: border-box;
}

.database-frame {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* HEADER */
.header-container {
  width: 100%;
}

.header-subcontainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  height: 60px;
  min-height: 60px;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.page-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.32px;
  color: #000000;
  margin: 0;
  white-space: nowrap;
}

.header-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  height: 40px;
  padding: 0 16px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.outlined-btn {
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
}

.outlined-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.logo-wrapper {
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
}

.header-logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  padding: 6px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.header-logout-btn:hover {
  opacity: 1;
  color: #d32f2f;
  transform: translateX(-2px);
}

.brand-logo {
  height: 14px;
  width: 45px;
  object-fit: contain;
  display: block;
}

/* SEARCH & FILTER CONTROLS BAR (Figma 448:884) */
.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
}

.search-box-wrapper {
  flex: 1;
  height: 48px;
  border: 0.871px solid #000000;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-sizing: border-box;
}

.search-input-field {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #000000;
  outline: none;
}

.search-input-field::placeholder {
  color: #000000;
  opacity: 0.8;
}

.search-icon-btn {
  display: flex;
  align-items: center;
  color: #000000;
}

.filter-dropdown-container {
  position: relative;
}

.filter-by-btn {
  height: 48px;
  padding: 0 24px;
  border: 1px solid #000000;
  background: transparent;
  color: #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-by-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.filter-dropdown-menu {
  position: absolute;
  top: 54px;
  left: 0;
  background: #ffffff;
  border: 1px solid #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 160px;
}

.filter-menu-item {
  padding: 12px 16px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  transition: background 0.15s ease;
}

.filter-menu-item:hover, .filter-menu-item.active {
  background: #f2f2f2;
}

.date-picker-btn {
  height: 48px;
  padding: 0 14px;
  border: 1px solid #000000;
  background: transparent;
  color: #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.date-picker-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* DATABASE TABLE GRID (Figma 448:958) */
.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.guest-table-wrapper {
  min-width: 1000px;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.table-header-row {
  background-color: #e3e3e3;
  border: 1px solid #e3e3e3;
  display: flex;
  align-items: center;
  height: 48px;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #000000;
}

.table-body-row {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ebebeb;
  min-height: 54px;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  color: #000000;
  transition: background-color 0.15s ease;
}

.table-body-row:hover {
  background-color: #ededed;
}

.table-state-row {
  padding: 36px;
  text-align: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #666666;
}

/* Column Dimensions & Styling matching Figma spec */
.col-type {
  width: 88px;
  padding: 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
  font-weight: 500;
}

.col-name {
  flex: 1;
  min-width: 180px;
  padding: 12px 16px;
  box-sizing: border-box;
  font-weight: 400;
}

.col-access {
  width: 145px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
  font-weight: 400;
}

.col-ticket {
  width: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.ticket-days-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-num {
  font-size: 12px;
  color: #000000;
}

.day-pipe {
  color: rgba(0, 0, 0, 0.25);
  font-size: 12px;
}

.col-contact {
  width: 173px;
  padding: 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  line-height: 1.2;
}

.col-time {
  width: 130px;
  padding: 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.col-action {
  width: 173px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* Action Buttons */
.override-action-btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.btn-force-out {
  background-color: #4a2626;
  color: #ffffff;
}

.btn-force-out:hover {
  background-color: #633333;
}

.btn-check-in {
  background-color: #000000;
  color: #ffffff;
}

.btn-check-in:hover {
  background-color: #222222;
}

.delete-guest-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  padding: 4px;
}

.delete-guest-btn:hover {
  opacity: 1;
  color: #d32f2f;
}

.edit-guest-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  padding: 4px;
}

.edit-guest-btn:hover {
  opacity: 1;
  color: #000000;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 768px) {
  .database-page-container {
    padding: 0 16px 16px 16px;
  }

  .header-subcontainer {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-title-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-action-buttons {
    width: 100%;
  }

  .header-btn {
    width: 100%;
    justify-content: space-between;
  }

  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box-wrapper, .filter-by-btn, .date-picker-btn {
    width: 100%;
    justify-content: space-between;
  }
}

/* Toast Notification Styles */
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  gap: 8px;
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
