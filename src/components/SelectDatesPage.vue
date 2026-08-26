<template>
  <div class="select-dates-wrapper">
    <!-- Main Content -->
    <main class="select-dates-content">
      <!-- Title Row -->
      <div class="title-row">
        <h1 class="page-title">SELECT DATES</h1>
        <span class="user-role-badge">{{ userRole }}</span>
      </div>

      <!-- VIP Access Section -->
      <section class="dates-section">
        <div class="section-header">
          <h2 class="section-title">VIP ACCESS</h2>
          <p class="section-subtitle">Your exclusive early access days</p>
        </div>

        <div class="options-list">
          <DateOptionItem
            v-for="item in vipDates"
            :key="item.id"
            :date="item.date"
            :day="item.day"
            :is-selected="selectedDates.includes(item.id)"
            @toggle="toggleDate(item.id)"
          />
        </div>
      </section>

      <!-- Public Access Section -->
      <section class="dates-section public-section">
        <div class="section-header">
          <h2 class="section-title">PUBLIC ACCESS</h2>
        </div>

        <div class="options-list">
          <DateOptionItem
            v-for="item in publicDates"
            :key="item.id"
            :date="item.date"
            :day="item.day"
            :is-selected="selectedDates.includes(item.id)"
            @toggle="toggleDate(item.id)"
          />
        </div>
      </section>
    </main>

    <!-- Sticky Bottom CTA Button -->
    <CtaButton
      :active="selectedDates.length > 0"
      :loading="isSubmitting"
      label="NEXT"
      @click="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DateOptionItem from './DateOptionItem.vue'
import CtaButton from './CtaButton.vue'

const props = defineProps({
  userRole: {
    type: String,
    default: 'VIP GUEST'
  }
})

const emit = defineEmits(['submit'])

const vipDates = [
  { id: 'day-1', date: '2 September 2026', day: 'Day 1' },
  { id: 'day-2', date: '3 September 2026', day: 'Day 2' }
]

const publicDates = [
  { id: 'day-3', date: '4 September 2026', day: 'Day 3' },
  { id: 'day-4', date: '5 September 2026', day: 'Day 4' },
  { id: 'day-5', date: '6 September 2026', day: 'Day 5' }
]

// User can pick one to all days
const selectedDates = ref([])
const isSubmitting = ref(false)

const toggleDate = (id) => {
  const index = selectedDates.value.indexOf(id)
  if (index > -1) {
    selectedDates.value.splice(index, 1)
  } else {
    selectedDates.value.push(id)
  }
}

const handleSubmit = () => {
  if (selectedDates.value.length === 0 || isSubmitting.value) return

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
