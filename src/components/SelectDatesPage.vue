<template>
  <div class="select-dates-wrapper">
    <!-- Main Content -->
    <main class="select-dates-content">
      <!-- Title Row (Figma Node 539:357) -->
      <div class="title-row">
        <h1 class="page-title-left">GUEST ACCESS</h1>
        <span class="page-title-right">SELECT ARRIVALS</span>
      </div>

      <!-- Date Sections Container (Figma Node 539:360 & 539:366) -->
      <div class="date-groups-container">
        <section
          v-for="group in dateGroups"
          :key="group.id"
          class="dates-section"
        >
          <!-- Section Header: Date + Subtitle -->
          <div class="section-header">
            <h2 class="section-date">{{ group.date }}</h2>
            <p class="section-subtitle">{{ group.subtitle }}</p>
          </div>

          <!-- Slots List -->
          <div class="options-list">
            <DateOptionItem
              v-for="slot in group.slots"
              :key="slot.id"
              :time="slot.time"
              :session="slot.session"
              :session-sub="slot.sessionSub"
              :is-selected="selectedDates.includes(slot.id)"
              :disabled="isItemDisabled(slot)"
              :is-full="isSlotFull(slot.id)"
              :is-passed="isPassedSlot(slot, group.dateIso)"
              :note="getItemNote(slot, group.dateIso)"
              @toggle="toggleSlot(slot.id, group.id)"
            />
          </div>
        </section>
      </div>

      <!-- Quota Notice / Warning Message -->
      <Transition name="fade">
        <div v-if="quotaWarning" class="quota-warning-banner">
          {{ quotaWarning }}
        </div>
      </Transition>
    </main>

    <!-- Sticky Bottom CTA Button -->
    <CtaButton
      :active="isCtaActive"
      :loading="isSubmitting"
      :label="alreadyBookedDates.length > 0 ? 'UPDATE TICKET ACCESS' : 'NEXT'"
      @click="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DateOptionItem from './DateOptionItem.vue'
import CtaButton from './CtaButton.vue'
import { EVENT_DATE_GROUPS, MAX_SLOT_CAPACITY } from '../utils/dateHelper'
import { apiGetSlotCapacities } from '../api/client'

const props = defineProps({
  userRole: {
    type: String,
    default: 'GUEST'
  },
  alreadyBookedDates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit'])

const dateGroups = EVENT_DATE_GROUPS

// User can pick up to 2 arrival slots per day (max 4 total)
const selectedDates = ref([])
const isSubmitting = ref(false)
const slotCapacities = ref({})
const quotaWarning = ref('')
let warningTimer = null

const showWarning = (msg) => {
  quotaWarning.value = msg
  if (warningTimer) clearTimeout(warningTimer)
  warningTimer = setTimeout(() => {
    quotaWarning.value = ''
  }, 3500)
}

// Function to check if a slot date has passed
const isPassedSlot = (slot, dateIso) => {
  if (!dateIso) return false
  const now = new Date()
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dateObj = new Date(dateIso)
  if (!isNaN(dateObj.getTime())) {
    const targetZero = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime()
    return targetZero < todayZero
  }
  return false
}

// Check if a slot has reached maximum capacity of 25
const isSlotFull = (slotId) => {
  if (props.alreadyBookedDates.includes(slotId)) return false
  const bookedCount = slotCapacities.value[slotId] || 0
  return bookedCount >= MAX_SLOT_CAPACITY
}

const getItemNote = (slot, dateIso) => {
  if (isPassedSlot(slot, dateIso)) return 'PASSED'
  if (isSlotFull(slot.id)) return 'FULL'
  return ''
}

const isItemDisabled = (slot) => {
  if (props.alreadyBookedDates.includes(slot.id)) return true
  if (isSlotFull(slot.id)) return true
  return false
}

const isCtaActive = computed(() => {
  if (selectedDates.value.length === 0) return false
  if (props.alreadyBookedDates.length > 0) {
    const bookedSet = new Set(props.alreadyBookedDates)
    return selectedDates.value.some(d => !bookedSet.has(d))
  }
  return true
})

onMounted(async () => {
  // 1. Fetch live slot capacities
  try {
    const capRes = await apiGetSlotCapacities()
    if (capRes && capRes.capacities) {
      slotCapacities.value = capRes.capacities
    }
  } catch (err) {
    console.warn('Failed to load slot capacities:', err)
  }

  // 2. Only pre-fill slots the guest already has booked (add-on flow) — never
  // silently auto-pick a default slot. The guest must explicitly tap one.
  const booked = Array.isArray(props.alreadyBookedDates) ? props.alreadyBookedDates : []
  selectedDates.value = [...booked]
})

const toggleSlot = (id, groupId) => {
  if (props.alreadyBookedDates.includes(id)) return
  if (isSlotFull(id)) {
    showWarning('This time slot is fully booked (capacity 25/25).')
    return
  }

  const index = selectedDates.value.indexOf(id)
  if (index > -1) {
    selectedDates.value.splice(index, 1)
    return
  }

  // Single-select: a guest picks exactly one arrival slot. Choosing a new
  // slot replaces any previously chosen (but not already-locked-in-booked)
  // slot instead of stacking on top of it.
  const bookedSet = new Set(props.alreadyBookedDates)
  selectedDates.value = selectedDates.value.filter(d => bookedSet.has(d))
  selectedDates.value.push(id)
}

const handleSubmit = () => {
  if (!isCtaActive.value || isSubmitting.value) return

  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    emit('submit', selectedDates.value)
  }, 600)
}
</script>

<style scoped>
.select-dates-wrapper {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f2f2f2;
}

.select-dates-content {
  flex: 1;
  padding: 24px 24px 32px 24px;
  display: flex;
  flex-direction: column;
}

/* Title Row (Figma Node 539:357) */
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 34px;
}

.page-title-left {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 300;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  line-height: 32px;
}

.page-title-right {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 400;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 32px;
  text-align: right;
}

.date-groups-container {
  display: flex;
  flex-direction: column;
  gap: 34px;
}

.dates-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-date {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 300;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  line-height: 24px;
}

.section-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #000000;
  margin: 0;
  line-height: 16px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Quota Warning Banner */
.quota-warning-banner {
  position: fixed;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #000000;
  color: #ffffff;
  padding: 12px 20px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  z-index: 9999;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
