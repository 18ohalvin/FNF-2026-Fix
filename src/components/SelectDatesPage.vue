<template>
  <div class="select-dates-wrapper">
    <!-- Main Content -->
    <main class="select-dates-content">
      <!-- Title Row -->
      <div class="title-row">
        <h1 class="page-title">SELECT DATES</h1>
        <span class="user-role-badge">{{ userRole }}</span>
      </div>

      <!-- VIP Access Section (Day 1) -->
      <section class="dates-section">
        <div class="section-header">
          <h2 class="section-title">VIP ACCESS</h2>
          <p class="section-subtitle">Exclusive VIP access day</p>
        </div>

        <div class="options-list">
          <DateOptionItem
            v-for="item in vipDates"
            :key="item.id"
            :date="item.date"
            :day="item.day"
            :is-selected="selectedDates.includes(item.id)"
            :disabled="isItemDisabled(item)"
            :is-passed="isPassedDate(item.date)"
            :note="getItemNote(item)"
            @toggle="toggleDate(item.id)"
          />
        </div>
      </section>

      <!-- Public Access Section (Day 2 - 5) -->
      <section class="dates-section public-section">
        <div class="section-header">
          <h2 class="section-title">PUBLIC ACCESS</h2>
          <p class="section-subtitle">Day 2 to Day 5 access</p>
        </div>

        <div class="options-list">
          <DateOptionItem
            v-for="item in publicDates"
            :key="item.id"
            :date="item.date"
            :day="item.day"
            :is-selected="selectedDates.includes(item.id)"
            :disabled="isItemDisabled(item)"
            :is-passed="isPassedDate(item.date)"
            :note="getItemNote(item)"
            @toggle="toggleDate(item.id)"
          />
        </div>
      </section>
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

const props = defineProps({
  userRole: {
    type: String,
    default: 'VIP GUEST'
  },
  alreadyBookedDates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit'])

const isVipGuest = computed(() => {
  return (props.userRole || '').toUpperCase().includes('VIP')
})

// Day 1 for VIP
const vipDates = [
  { id: 'day-1', date: '2 September 2026', day: 'Day 1' }
]

// Day 2-5 for Public Guest
const publicDates = [
  { id: 'day-2', date: '3 September 2026', day: 'Day 2' },
  { id: 'day-3', date: '4 September 2026', day: 'Day 3' },
  { id: 'day-4', date: '5 September 2026', day: 'Day 4' },
  { id: 'day-5', date: '6 September 2026', day: 'Day 5' }
]

// User can pick one to all allowed days
const selectedDates = ref([])
const isSubmitting = ref(false)

// Function to check if an event date has passed relative to current date
const isPassedDate = (dateStr) => {
  const now = new Date()
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dateObj = new Date(dateStr)
  if (!isNaN(dateObj.getTime())) {
    const targetZero = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime()
    return targetZero < todayZero
  }
  return false
}

const getItemNote = (item) => {
  if (item.id === 'day-1' && !isVipGuest.value) return 'VIP Only'
  if (isPassedDate(item.date)) return 'PASSED'
  if (props.alreadyBookedDates.includes(item.id)) return 'BOOKED'
  return ''
}

const isItemDisabled = (item) => {
  if (item.id === 'day-1' && !isVipGuest.value) return true
  if (props.alreadyBookedDates.includes(item.id)) return true
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

onMounted(() => {
  const booked = Array.isArray(props.alreadyBookedDates) ? props.alreadyBookedDates : []
  const initial = new Set(booked)

  if (!isVipGuest.value) {
    initial.delete('day-1')
  }

  // If new registration with no bookings yet, select first available non-passed day
  if (initial.size === 0) {
    if (isVipGuest.value && !isPassedDate(vipDates[0].date)) {
      initial.add('day-1')
    } else {
      const avail = publicDates.find(d => !isPassedDate(d.date))
      if (avail) initial.add(avail.id)
    }
  }

  selectedDates.value = Array.from(initial)
})

const toggleDate = (id) => {
  // Disallow public guests picking day-1 or changing already booked dates
  if (id === 'day-1' && !isVipGuest.value) return
  if (props.alreadyBookedDates.includes(id)) return

  const index = selectedDates.value.indexOf(id)
  if (index > -1) {
    selectedDates.value.splice(index, 1)
  } else {
    selectedDates.value.push(id)
  }
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

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  line-height: 32px;
}

.user-role-badge {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 300;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 32px;
}

.dates-section {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
}

.public-section {
  margin-bottom: 24px;
}

.section-header {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  line-height: normal;
}

.section-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: #000000;
  margin: 0;
  line-height: 20px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
