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

        <!-- Download CSV/Excel Export Button (Left beside Filter Button) -->
        <button
          type="button"
          class="download-export-btn"
          title="Download Customer Database as CSV / Excel"
          :disabled="isExporting || guests.length === 0"
          @click="handleExportData"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="download-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>{{ isExporting ? 'EXPORTING...' : 'DOWNLOAD DATA' }}</span>
        </button>

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

      <!-- Bulk Action Bar when 1 or more guests are selected -->
      <Transition name="fade">
        <div v-if="selectedPhones.length > 0" class="bulk-action-bar">
          <div class="bulk-info-left">
            <span class="bulk-count-badge">{{ selectedPhones.length }}</span>
            <span class="bulk-count-text">Guest{{ selectedPhones.length > 1 ? 's' : '' }} Selected</span>
            <button
              type="button"
              class="bulk-select-all-btn"
              @click="toggleSelectAll"
            >
              {{ isAllSelected ? 'Deselect All' : `Select All (${guests.length})` }}
            </button>
          </div>

          <div class="bulk-actions-right">
            <button
              type="button"
              class="bulk-cancel-btn"
              :disabled="isBulkDeleting"
              @click="clearSelection"
            >
              Cancel
            </button>

            <button
              type="button"
              class="bulk-delete-btn"
              :disabled="isBulkDeleting"
              @click="handleBulkDelete"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>{{ isBulkDeleting ? 'DELETING...' : `DELETE SELECTED (${selectedPhones.length})` }}</span>
            </button>
          </div>
        </div>
      </Transition>

      <!-- GUEST DATABASE TABLE (Figma 448:958) -->
      <div class="table-scroll-container">
        <div class="guest-table-wrapper">
          <!-- Table Header Row -->
          <div class="table-header-row">
            <!-- Header Select Checkbox -->
            <div class="col-select">
              <button
                type="button"
                class="header-checkbox-btn"
                :class="{ checked: isAllSelected, indeterminate: isSomeSelected }"
                title="Select / Deselect All"
                @click="toggleSelectAll"
              >
                <svg v-if="isAllSelected" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else-if="isSomeSelected" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

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
            :class="{ 'row-selected': selectedPhones.includes(guest.phone) }"
          >
            <!-- Row Multi-Select Checkbox -->
            <div class="col-select" @click.stop="toggleSelectGuest(guest.phone)">
              <div
                class="row-checkbox"
                :class="{ checked: selectedPhones.includes(guest.phone) }"
              >
                <svg v-if="selectedPhones.includes(guest.phone)" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>

            <!-- Guest Type (Figma: VIP / REGULAR) -->
            <div class="col-type">
              <span class="guest-type-text">
                {{ guest.role?.toUpperCase().includes('VIP') ? 'VIP' : 'PUBLIC' }}
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

            <!-- Override Action Button + View E-Pass + Edit + Delete Trash Icon -->
            <div class="col-action">
              <button
                type="button"
                class="override-action-btn"
                :class="guest.is_checked_in ? 'btn-force-out' : 'btn-check-in'"
                :disabled="isActionProcessing || isBulkDeleting"
                @click="handleOverride(guest)"
              >
                {{ guest.is_checked_in ? 'FORCE OUT' : 'CHECK-IN' }}
              </button>

              <button
                type="button"
                class="view-pass-btn"
                title="View & Download E-Pass"
                :disabled="isActionProcessing || isBulkDeleting"
                @click="handleViewPass(guest)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2a2 2 0 0 0 0 4v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 0 0-4V9z"></path>
                  <line x1="13" y1="6" x2="13" y2="18" stroke-dasharray="2 2"></line>
                </svg>
                <span>PASS</span>
              </button>

              <button
                type="button"
                class="edit-guest-btn"
                title="Edit Guest Details"
                :disabled="isActionProcessing || isBulkDeleting"
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
                :disabled="isActionProcessing || isBulkDeleting"
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
      :show-all-option="true"
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

    <!-- View & Download Customer E-Pass Modal -->
    <ViewEPassModal
      :is-open="isViewEPassOpen"
      :guest="selectedPassGuest"
      @close="isViewEPassOpen = false"
    />

    <!-- Toast Notification for Alerts & Override Errors -->
    <Transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2" style="flex-shrink: 0;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  apiFetchCustomerDatabase,
  apiOverrideGuestStatus,
  apiDeleteGuest,
  apiBulkDeleteGuests
} from '../api/client'
import CalendarModal from './CalendarModal.vue'
import EditGuestModal from './EditGuestModal.vue'
import ViewEPassModal from './ViewEPassModal.vue'

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
const isBulkDeleting = ref(false)
const isEditModalOpen = ref(false)
const selectedEditGuest = ref(null)
const isViewEPassOpen = ref(false)
const selectedPassGuest = ref(null)
const toastMessage = ref('')
const isExporting = ref(false)

// Multi-Selection State
const selectedPhones = ref([])

const isAllSelected = computed(() => {
  return guests.value.length > 0 && selectedPhones.value.length === guests.value.length
})

const isSomeSelected = computed(() => {
  return selectedPhones.value.length > 0 && selectedPhones.value.length < guests.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedPhones.value = []
  } else {
    selectedPhones.value = guests.value.map(g => g.phone).filter(Boolean)
  }
}

const toggleSelectGuest = (phone) => {
  if (!phone) return
  const idx = selectedPhones.value.indexOf(phone)
  if (idx > -1) {
    selectedPhones.value.splice(idx, 1)
  } else {
    selectedPhones.value.push(phone)
  }
}

const clearSelection = () => {
  selectedPhones.value = []
}

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = ''
    }
  }, 3500)
}

const handleViewPass = (guest) => {
  selectedPassGuest.value = guest
  isViewEPassOpen.value = true
}

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
  selectedPhones.value = []
  loadGuests(true)
}

const loadGuests = async (showLoadingSpinner = false) => {
  if (showLoadingSpinner) isLoading.value = true
  const dayParam = (!selectedEventDayText.value || selectedEventDayText.value.toLowerCase().includes('all')) 
    ? '' 
    : selectedEventDayText.value
  const res = await apiFetchCustomerDatabase(searchQuery.value, currentFilter.value, dayParam)
  
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
    selectedPhones.value = []
    loadGuests(true)
  }, 300)
}

const applyFilter = (filterType) => {
  currentFilter.value = filterType
  isFilterMenuOpen.value = false
  selectedPhones.value = []
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
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `Day 1 - ${formattedHours}:${minutes} ${ampm}`
  } catch (e) {
    return 'Day 1 - 12:11 PM'
  }
}

const handleExportData = async () => {
  if (isExporting.value) return
  isExporting.value = true

  try {
    // If specific rows are checked/selected, export those; otherwise export all currently loaded records
    let exportList = []
    if (selectedPhones.value.length > 0) {
      exportList = guests.value.filter(g => selectedPhones.value.includes(g.phone))
    } else {
      exportList = guests.value
    }

    if (!exportList || exportList.length === 0) {
      showToast('No customer records available to export.')
      isExporting.value = false
      return
    }

    // CSV Column Headers
    const headers = [
      'No',
      'Salutation',
      'First Name',
      'Last Name',
      'Full Name',
      'Phone Number',
      'Email',
      'Instagram',
      'Access Type / Role',
      'Access ID',
      'Registered Days',
      'Check-in Status',
      'Last Scanned Time',
      'Registration Date'
    ]

    // Escape CSV cell helper (RFC 4180)
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    // Format registered days helper
    const formatRegisteredDays = (selectedDates) => {
      if (!selectedDates) return 'N/A'
      try {
        const arr = typeof selectedDates === 'string' ? JSON.parse(selectedDates) : selectedDates
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.map(d => {
            const s = String(d).toLowerCase().trim()
            if (s.includes('1')) return 'Day 1 (VIP)'
            if (s.includes('2')) return 'Day 2'
            if (s.includes('3')) return 'Day 3'
            if (s.includes('4')) return 'Day 4'
            if (s.includes('5')) return 'Day 5'
            return String(d)
          }).join(', ')
        }
      } catch (e) {}
      return String(selectedDates)
    }

    const rows = exportList.map((g, idx) => {
      const fullName = `${g.salutation || ''} ${g.first_name || ''} ${g.last_name || ''}`.trim() || 'N/A'
      // Tab prefix ensures Excel treats phone as string without dropping '+' or leading zero
      const phoneFormatted = g.phone ? `\t${g.phone}` : 'N/A'
      const checkInStatus = g.is_checked_in ? 'CHECKED IN' : 'NOT CHECKED IN'
      const days = formatRegisteredDays(g.selected_dates)
      const scannedTime = g.last_scanned_at ? new Date(g.last_scanned_at).toLocaleString('en-GB') : (g.is_checked_in ? 'Checked In' : 'Not Scanned')
      const regTime = g.created_at ? new Date(g.created_at).toLocaleString('en-GB') : 'N/A'

      return [
        idx + 1,
        escapeCsv(g.salutation || 'Mr.'),
        escapeCsv(g.first_name || ''),
        escapeCsv(g.last_name || ''),
        escapeCsv(fullName),
        escapeCsv(phoneFormatted),
        escapeCsv(g.email || 'N/A'),
        escapeCsv(g.instagram || 'N/A'),
        escapeCsv(g.role || (g.role?.toUpperCase().includes('VIP') ? 'VIP GUEST' : 'PUBLIC ACCESS')),
        escapeCsv(g.access_id || 'N/A'),
        escapeCsv(days),
        escapeCsv(checkInStatus),
        escapeCsv(scannedTime),
        escapeCsv(regTime)
      ].join(',')
    })

    // UTF-8 BOM (\uFEFF) for immediate perfect rendering in Microsoft Excel & Apple Numbers
    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const nowStr = new Date().toISOString().slice(0, 10)
    link.setAttribute('href', url)
    link.setAttribute('download', `707-Customer-Database-${nowStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast(`Successfully exported ${exportList.length} customer records.`)
  } catch (err) {
    console.error('Export Error:', err)
    showToast('Failed to export data. Please try again.')
  } finally {
    isExporting.value = false
  }
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
    showToast(`Status updated for ${guest.first_name || guest.phone}`)
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
  guests.value = guests.value.filter((g) => g.phone !== targetPhone)
  selectedPhones.value = selectedPhones.value.filter(p => p !== targetPhone)

  try {
    const res = await apiDeleteGuest(targetPhone)
    if (res && res.success) {
      showToast(`Guest record "${guestName}" deleted.`)
    }
  } catch (err) {
    console.error('[Delete Guest Exception]', err)
  } finally {
    isActionProcessing.value = false
    await loadGuests(false)
  }
}

// Bulk Delete Multiple Guests
const handleBulkDelete = async () => {
  if (selectedPhones.value.length === 0 || isBulkDeleting.value) return
  const count = selectedPhones.value.length

  let ok = true
  try {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      ok = window.confirm(`Are you sure you want to permanently delete ${count} selected guest record(s)? This action cannot be undone.`)
    }
  } catch (e) {
    ok = true
  }
  if (!ok) return

  isBulkDeleting.value = true
  const targets = [...selectedPhones.value]

  // Optimistically remove from UI list immediately
  guests.value = guests.value.filter(g => !targets.includes(g.phone))
  selectedPhones.value = []

  try {
    const res = await apiBulkDeleteGuests(targets)
    if (res && res.success) {
      showToast(`${res.count || count} guest record(s) deleted permanently.`)
    } else {
      showToast(res?.error || 'Bulk delete encountered an issue.')
    }
  } catch (err) {
    console.error('[Bulk Delete Exception]', err)
    showToast('Failed to delete selected guests.')
  } finally {
    isBulkDeleting.value = false
    await loadGuests(false)
  }
}

onMounted(() => {
  loadGuests(true)
  pollInterval = setInterval(() => {
    loadGuests(false)
  }, 4000)
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
  height: 48px;
  padding: 0 24px;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.outlined-btn {
  background-color: transparent;
  color: #000000;
  border: 1px solid #000000;
}

.outlined-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  padding: 8px;
  transition: opacity 0.2s ease;
}

.header-logout-btn:hover {
  opacity: 0.6;
}

.brand-logo {
  height: 18px;
  width: auto;
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

.download-export-btn {
  height: 48px;
  padding: 0 20px;
  border: 1px solid #000000;
  background: transparent;
  color: #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.download-export-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.download-export-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.download-icon {
  flex-shrink: 0;
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

.filter-menu-item:hover {
  background: #f0f0f0;
}

.filter-menu-item.active {
  background: #000000;
  color: #ffffff;
}

.date-picker-btn {
  height: 48px;
  padding: 0 20px;
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
  gap: 10px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.date-picker-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.calendar-icon,
.chevron-icon {
  display: flex;
  align-items: center;
}

/* BULK ACTION TOOLBAR */
.bulk-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #000000;
  color: #ffffff;
  padding: 12px 20px;
  gap: 16px;
  box-sizing: border-box;
  width: 100%;
}

.bulk-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bulk-count-badge {
  background-color: #ffffff;
  color: #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  box-sizing: border-box;
}

.bulk-count-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.bulk-select-all-btn {
  background: transparent;
  border: none;
  color: #cccccc;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
}

.bulk-select-all-btn:hover {
  color: #ffffff;
}

.bulk-actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bulk-cancel-btn {
  background: transparent;
  border: 1px solid #666666;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.bulk-cancel-btn:hover {
  border-color: #ffffff;
}

.bulk-delete-btn {
  background-color: #d32f2f;
  border: none;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.03em;
  transition: background-color 0.15s ease;
}

.bulk-delete-btn:hover:not(:disabled) {
  background-color: #b71c1c;
}

.bulk-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* GUEST DATABASE TABLE */
.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: #f5f5f5;
}

.guest-table-wrapper {
  min-width: 1220px;
  width: 100%;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.table-header-row {
  background-color: #e3e3e3;
  border-bottom: 1px solid #dcdcdc;
  display: flex;
  align-items: center;
  height: 48px;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #000000;
  letter-spacing: 0.03em;
}

.table-body-row {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ebebeb;
  min-height: 56px;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  color: #000000;
  transition: background-color 0.15s ease;
}

.table-body-row:hover {
  background-color: #ededed;
}

.table-body-row.row-selected {
  background-color: #e4e4e4;
}

.table-state-row {
  padding: 36px;
  text-align: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #666666;
}

/* Column Dimensions & Styling (Prevents text/button overlapping) */
.col-select {
  width: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.header-checkbox-btn,
.row-checkbox {
  width: 20px;
  height: 20px;
  border: 1.5px solid #000000;
  background-color: transparent;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.header-checkbox-btn:hover,
.row-checkbox:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.header-checkbox-btn.checked,
.header-checkbox-btn.indeterminate,
.row-checkbox.checked {
  background-color: #000000;
  border-color: #000000;
}

.col-type {
  width: 90px;
  min-width: 90px;
  padding: 12px 14px;
  box-sizing: border-box;
  flex-shrink: 0;
  font-weight: 500;
  white-space: nowrap;
}

.col-name {
  flex: 1.2;
  min-width: 180px;
  padding: 12px 14px;
  box-sizing: border-box;
  font-weight: 500;
  overflow: hidden;
}

.guest-name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-access {
  width: 120px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 14px;
  box-sizing: border-box;
  flex-shrink: 0;
  font-weight: 400;
  white-space: nowrap;
}

.col-ticket {
  width: 120px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
  box-sizing: border-box;
  flex-shrink: 0;
  white-space: nowrap;
}

.ticket-days-group {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
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
  width: 220px;
  min-width: 220px;
  padding: 12px 14px;
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: hidden;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  line-height: 1.2;
  overflow: hidden;
}

.contact-phone {
  display: block;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-email {
  display: block;
  font-size: 11px;
  color: #666666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-time {
  width: 120px;
  min-width: 120px;
  padding: 12px 14px;
  box-sizing: border-box;
  flex-shrink: 0;
  white-space: nowrap;
}

.col-action {
  width: 290px;
  min-width: 290px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* Action Buttons */
.override-action-btn {
  height: 32px;
  padding: 0 14px;
  border: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  white-space: nowrap;
}

.view-pass-btn {
  background-color: transparent;
  border: 1px solid #000000;
  border-radius: 0;
  height: 32px;
  padding: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #000000;
  letter-spacing: 0.04em;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.view-pass-btn:hover:not(:disabled) {
  background-color: #000000;
  color: #ffffff;
}

.view-pass-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box-wrapper,
  .download-export-btn,
  .filter-by-btn,
  .date-picker-btn {
    width: 100%;
  }

  .bulk-action-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .bulk-actions-right {
    width: 100%;
    justify-content: flex-end;
  }
}

/* TOAST NOTIFICATION */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: #000000;
  color: #ffffff;
  padding: 12px 20px;
  border: 1px solid #333333;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  z-index: 10000;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
