<template>
  <Transition name="modal-fade">
    <div v-if="isOpen && result" class="modal-backdrop" @click.self="handleClose">
      <!-- 1. VALID TICKET - REGULAR GUEST (Figma Node 427:359) -->
      <div
        v-if="modalType === 'VALID_REGULAR'"
        class="result-modal valid-regular-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-green">VALID TICKET</h2>
        </div>

        <div class="guest-details-section">
          <p class="guest-name text-black">{{ formattedGuestName }}</p>
          <div class="badge-row border-black">
            <div class="badge-left bg-gray">
              <span class="badge-role text-black">PUBLIC</span>
            </div>
            <div class="badge-right bg-white">
              <span class="badge-code text-black">{{ displayAccessId }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-solid-black" @click="handleClose">
            Next Scan
          </button>
        </div>

        <p class="timer-text text-black">
          Auto close in {{ countdown }} seconds
        </p>
      </div>

      <!-- 2. VALID TICKET - VIP GUEST (Figma Node 447:347) -->
      <div
        v-else-if="modalType === 'VALID_VIP'"
        class="result-modal valid-vip-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-white">VALID TICKET</h2>
        </div>

        <div class="guest-details-section">
          <p class="guest-name text-white">{{ formattedGuestName }}</p>
          <div class="badge-row border-white">
            <div class="badge-left bg-gray">
              <span class="badge-role text-black">VIP GUEST</span>
            </div>
            <div class="badge-right bg-transparent">
              <span class="badge-code text-white">{{ displayAccessId }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-solid-white" @click="handleClose">
            Next Scan
          </button>
        </div>

        <p class="timer-text text-white">
          Auto close in {{ countdown }} seconds
        </p>
      </div>

      <!-- 3. ALREADY CHECKED IN (Figma Node 447:369) -->
      <div
        v-else-if="modalType === 'ALREADY_CHECKED_IN'"
        class="result-modal already-checked-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-stacked text-black">
            <span>ALREADY</span>
            <span>CHECKED-IN</span>
          </h2>
        </div>

        <div class="guest-details-section">
          <p class="guest-name text-black">{{ formattedGuestName }}</p>
          <div class="badge-row border-black">
            <div class="badge-left bg-gray">
              <span class="badge-role text-black">{{ isVip ? 'VIP GUEST' : 'PUBLIC' }}</span>
            </div>
            <div class="badge-right bg-tan">
              <span class="badge-code text-black">CHECKED IN at {{ checkInTimeText }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-solid-black" @click="handleClose">
            Dismiss
          </button>
        </div>
      </div>

      <!-- 4. CHECKED OUT SUCCESS (Exit Scan Mode) -->
      <div
        v-else-if="modalType === 'CHECKED_OUT'"
        class="result-modal valid-regular-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-green">CHECKED OUT</h2>
        </div>

        <div class="guest-details-section">
          <p class="guest-name text-black">{{ formattedGuestName }}</p>
          <div class="badge-row border-black">
            <div class="badge-left bg-gray">
              <span class="badge-role text-black">{{ isVip ? 'VIP GUEST' : 'PUBLIC' }}</span>
            </div>
            <div class="badge-right bg-white">
              <span class="badge-code text-black">EXIT at {{ checkInTimeText }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-solid-black" @click="handleClose">
            Next Scan
          </button>
        </div>

        <p class="timer-text text-black">
          Auto close in {{ countdown }} seconds
        </p>
      </div>

      <!-- 5. NOT CHECKED IN WARNING (Exit Scan Mode) -->
      <div
        v-else-if="modalType === 'NOT_CHECKED_IN'"
        class="result-modal not-checked-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-stacked text-black">
            <span>NOT</span>
            <span>CHECKED-IN</span>
          </h2>
        </div>

        <div class="guest-details-section">
          <p class="guest-name text-black">{{ formattedGuestName }}</p>
          <div class="badge-row border-black">
            <div class="badge-left bg-gray">
              <span class="badge-role text-black">{{ isVip ? 'VIP GUEST' : 'PUBLIC' }}</span>
            </div>
            <div class="badge-right bg-warning-yellow">
              <span class="badge-code text-black">NOT CHECKED IN</span>
            </div>
          </div>
        </div>

        <div class="not-checked-msg-section">
          <p class="not-checked-subtext">
            Cannot check out. Guest is not currently inside.
          </p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-solid-black" @click="handleClose">
            Dismiss
          </button>
        </div>
      </div>

      <!-- 6. VENUE CAPACITY FULL (Max Limit Reached) -->
      <div
        v-else-if="modalType === 'VENUE_FULL'"
        class="result-modal venue-full-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-stacked text-white">
            <span>VENUE CAPACITY</span>
            <span>FULL</span>
          </h2>
        </div>

        <div class="guest-details-section">
          <p class="guest-name text-white">{{ formattedGuestName }}</p>
          <div class="badge-row border-white">
            <div class="badge-left bg-gray">
              <span class="badge-role text-black">{{ isVip ? 'VIP GUEST' : 'PUBLIC' }}</span>
            </div>
            <div class="badge-right bg-danger-red">
              <span class="badge-code text-white">CAPACITY {{ currentOccText }}</span>
            </div>
          </div>
        </div>

        <div class="invalid-msg-section">
          <p class="invalid-subtext">
            {{ result?.message || "Venue capacity limit reached. Access is paused until capacity is adjusted or guests check out." }}
          </p>
        </div>

        <div class="modal-actions-stacked">
          <button type="button" class="btn-solid-white" @click="handleAdjustOccupancy">
            CHANGE OCCUPANCY
          </button>
          <button type="button" class="btn-outline-white" @click="handleClose">
            DISMISS
          </button>
        </div>
      </div>

      <!-- 7. INVALID TICKET OR WRONG DAY (Figma Node 447:386) -->
      <div
        v-else
        class="result-modal invalid-ticket-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-header">
          <h2 class="title-stacked text-white">
            <span>INVALID TICKET</span>
            <span>OR WRONG DAY</span>
          </h2>
        </div>

        <div class="invalid-msg-section">
          <p class="invalid-subtext">
            {{ result?.message || "Ticket not recognized for today's event." }}
          </p>
        </div>

        <div class="modal-actions-stacked">
          <button type="button" class="btn-solid-white" @click="handleClose">
            Dismiss
          </button>
          <button type="button" class="btn-outline-white" @click="handleSearch">
            Search Ticket ID
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  result: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'search', 'adjust-occupancy'])

const countdown = ref(5)
let timer = null

const isVip = computed(() => {
  const role = (props.result?.guest?.role || props.result?.role || '').toUpperCase()
  return role.includes('VIP')
})

const modalType = computed(() => {
  if (!props.result) return 'INVALID'

  const status = props.result.status
  if (status === 'VENUE_FULL' || status === 'CAPACITY_REACHED') {
    return 'VENUE_FULL'
  }

  if (status === 'NOT_CHECKED_IN') {
    return 'NOT_CHECKED_IN'
  }

  if (props.result.mode === 'check-out' && (status === 'GRANTED' || props.result.success)) {
    return 'CHECKED_OUT'
  }

  if (status === 'ALREADY_INSIDE' || status === 'ALREADY_CHECKED_IN') {
    return 'ALREADY_CHECKED_IN'
  }

  if (status === 'GRANTED' || props.result.success) {
    return isVip.value ? 'VALID_VIP' : 'VALID_REGULAR'
  }

  return 'INVALID'
})

const formattedGuestName = computed(() => {
  if (props.result?.guest?.name) return props.result.guest.name
  if (props.result?.guestName) return props.result.guestName
  const g = props.result?.guest
  if (g) {
    return `${g.salutation || ''} ${g.first_name || g.firstName || ''} ${g.last_name || g.lastName || ''}`.trim()
  }
  return 'Mrs. Dewi Lestari'
})

const displayAccessId = computed(() => {
  return props.result?.guest?.accessId || props.result?.accessId || props.result?.ticketCode || '020305-1008-1245'
})

const checkInTimeText = computed(() => {
  if (props.result?.checkedInTime) return props.result.checkedInTime
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const mins = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${mins}`
})

const currentOccText = computed(() => {
  const occ = props.result?.currentOccupancy ?? props.result?.liveOccupancy ?? 100
  const max = props.result?.maxCapacity ?? 100
  return `${occ}/${max}`
})

const startTimer = () => {
  clearTimer()
  countdown.value = 5
  if (modalType.value === 'VALID_REGULAR' || modalType.value === 'VALID_VIP' || modalType.value === 'CHECKED_OUT') {
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        handleClose()
      }
    }, 1000)
  }
}

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const handleClose = () => {
  clearTimer()
  emit('close')
}

const handleSearch = () => {
  clearTimer()
  emit('search')
}

const handleAdjustOccupancy = () => {
  clearTimer()
  emit('adjust-occupancy')
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      startTimer()
    } else {
      clearTimer()
    }
  }
)

onUnmounted(() => {
  clearTimer()
})
</script>

<style scoped>
/* Modal Backdrop Overlay */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

/* Base Modal Container */
.result-modal {
  width: 100%;
  max-width: 480px;
  border-radius: 8px;
  padding: 48px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Theme 1: Valid Regular Guest (Figma 427:359) */
.valid-regular-modal {
  background-color: #ffffff;
}

/* Theme 2: Valid VIP Guest (Figma 447:347) */
.valid-vip-modal {
  background-color: #000000;
}

/* Theme 3: Already Checked In (Figma 447:369) */
.already-checked-modal {
  background-color: #e0bda3;
}

/* Theme 4: Not Checked In Warning (Yellow/Grey theme) */
.not-checked-modal {
  background-color: #f7e8aa;
}

/* Theme 5: Invalid Ticket / Wrong Day (Figma 447:386) */
.invalid-ticket-modal {
  background-color: #4a2626;
}

/* Theme 6: Venue Capacity Full */
.venue-full-modal {
  background-color: #7a1515;
}

/* Typography & Titles */
.modal-header {
  width: 100%;
}

.title-green {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  color: #004b00;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.title-white {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  color: #ffffff;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.title-stacked {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.1;
  display: flex;
  flex-direction: column;
  letter-spacing: -0.5px;
}

.title-stacked.text-black {
  color: #000000;
}

.title-stacked.text-white {
  color: #ffffff;
}

/* Guest Details Area */
.guest-details-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.guest-name {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  margin: 0;
  line-height: 1.15;
  letter-spacing: -0.5px;
  word-break: break-word;
}

.text-black {
  color: #111111;
}

.text-white {
  color: #ffffff;
}

/* Split Badge Row */
.badge-row {
  display: flex;
  width: 100%;
  border-style: solid;
  border-width: 1px;
  box-sizing: border-box;
}

.border-black {
  border-color: #000000;
}

.border-white {
  border-color: #ffffff;
}

.badge-left {
  flex: 1;
  min-width: 0;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.bg-gray {
  background-color: #f2f2f2;
}

.badge-role {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.badge-right {
  flex: 1;
  min-width: 0;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.bg-white {
  background-color: #ffffff;
}

.bg-transparent {
  background-color: transparent;
}

.bg-tan {
  background-color: #e0bda3;
}

.bg-warning-yellow {
  background-color: #e6cb67;
}

.bg-danger-red {
  background-color: #d32f2f;
}

.badge-code {
  font-family: 'Assistant', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

/* Not Checked In Message */
.not-checked-msg-section {
  width: 100%;
}

.not-checked-subtext {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin: 0;
  line-height: 1.4;
}

/* Invalid Subtitle Message */
.invalid-msg-section {
  width: 100%;
}

.invalid-subtext {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  line-height: 1.4;
}

/* Buttons */
.modal-actions {
  display: flex;
  width: 100%;
  height: 48px;
}

.modal-actions-stacked {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.btn-solid-black {
  width: 100%;
  height: 48px;
  background-color: #000000;
  color: #f0f6fc;
  border: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.btn-solid-black:hover {
  background-color: #222222;
}

.btn-solid-white {
  width: 100%;
  height: 48px;
  background-color: #ffffff;
  color: #000000;
  border: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.btn-solid-white:hover {
  background-color: #e0e0e0;
}

.btn-outline-white {
  width: 100%;
  height: 48px;
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.btn-outline-white:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Auto-close Timer Subtext */
.timer-text {
  font-family: 'Assistant', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  font-weight: 400;
  text-align: center;
  margin: 0;
  line-height: 16px;
  width: 100%;
}

/* Fade Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Responsive adjustment for small screens */
@media (max-width: 480px) {
  .result-modal {
    padding: 36px 24px;
    gap: 24px;
  }

  .title-green,
  .title-white,
  .title-stacked,
  .guest-name {
    font-size: 26px;
  }

  .badge-role,
  .badge-code {
    font-size: 14px;
  }
}
</style>
