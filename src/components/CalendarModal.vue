<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="calendar-backdrop" @click.self="emit('close')">
        <div class="calendar-modal-card">
          <!-- Modal Header -->
          <div class="calendar-card-header">
            <span class="header-title">SELECT EVENT DAY</span>
            <button type="button" class="close-card-btn" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Clean Single-Line 5-Day Options -->
          <div class="event-days-list">
            <button
              v-for="eventDay in eventDays"
              :key="eventDay.id"
              type="button"
              class="event-day-item"
              :class="{ selected: selectedDayId === eventDay.id }"
              @click="handleDaySelect(eventDay)"
            >
              <div class="day-left-content">
                <span class="day-badge">{{ eventDay.badge }}</span>
                <span class="day-date-text">{{ eventDay.dateText }}</span>
              </div>
              <div class="radio-indicator" :class="{ active: selectedDayId === eventDay.id }">
                <div v-if="selectedDayId === eventDay.id" class="radio-dot"></div>
              </div>
            </button>
          </div>

          <!-- Modal Footer Actions -->
          <div class="calendar-card-footer">
            <button type="button" class="btn-cancel" @click="emit('close')">Cancel</button>
            <button type="button" class="btn-confirm" @click="confirmSelection">Confirm</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  selectedDate: { type: String, default: 'Day 1 - 02 September 2026' }
})

const emit = defineEmits(['close', 'select'])

const eventDays = [
  { id: 'day-1', badge: 'DAY 1', title: 'Day 1 - 02 September 2026', dateText: 'Wednesday, 02 Sep 2026', isoDate: '2026-09-02' },
  { id: 'day-2', badge: 'DAY 2', title: 'Day 2 - 03 September 2026', dateText: 'Thursday, 03 Sep 2026', isoDate: '2026-09-03' },
  { id: 'day-3', badge: 'DAY 3', title: 'Day 3 - 04 September 2026', dateText: 'Friday, 04 Sep 2026', isoDate: '2026-09-04' },
  { id: 'day-4', badge: 'DAY 4', title: 'Day 4 - 05 September 2026', dateText: 'Saturday, 05 Sep 2026', isoDate: '2026-09-05' },
  { id: 'day-5', badge: 'DAY 5', title: 'Day 5 - 06 September 2026', dateText: 'Sunday, 06 Sep 2026', isoDate: '2026-09-06' }
]

const selectedDayId = ref('day-1')

watch(() => props.isOpen, (open) => {
  if (open) {
    const matched = eventDays.find(d => props.selectedDate && (props.selectedDate.includes(d.badge) || props.selectedDate.includes(d.isoDate)))
    selectedDayId.value = matched ? matched.id : 'day-1'
  }
})

const handleDaySelect = (dayObj) => {
  selectedDayId.value = dayObj.id
}

const confirmSelection = () => {
  const chosen = eventDays.find(d => d.id === selectedDayId.value) || eventDays[0]
  emit('select', chosen.title, chosen)
  emit('close')
}
</script>

<style scoped>
.calendar-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.calendar-modal-card {
  background-color: #ffffff;
  border: 1px solid #000000;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.calendar-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e5e5;
  background-color: #f9f9f9;
}

.header-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #000000;
  text-transform: uppercase;
}

.close-card-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  padding: 4px;
  transition: opacity 0.2s ease;
}

.close-card-btn:hover {
  opacity: 0.6;
}

.event-days-list {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  gap: 6px;
}

.event-day-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.event-day-item:hover {
  background: #f7f7f7;
  border-color: #000000;
}

.event-day-item.selected {
  background: #f2f2f2;
  border-color: #000000;
}

.day-left-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.day-badge {
  display: inline-block;
  background: #000000;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 7px;
}

.day-date-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  white-space: nowrap;
}

.radio-indicator {
  width: 16px;
  height: 16px;
  border: 1.5px solid #999999;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
  flex-shrink: 0;
}

.radio-indicator.active {
  border-color: #000000;
}

.radio-dot {
  width: 8px;
  height: 8px;
  background: #000000;
  border-radius: 50%;
}

.calendar-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #e5e5e5;
  background-color: #f9f9f9;
}

.btn-cancel {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #cccccc;
  background: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f0f0f0;
}

.btn-confirm {
  height: 34px;
  padding: 0 18px;
  border: 1px solid #000000;
  background: #000000;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-confirm:hover {
  background: #222222;
}

/* Modal Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
