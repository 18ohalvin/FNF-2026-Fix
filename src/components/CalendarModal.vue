<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card" role="dialog" aria-modal="true">
          <!-- Subtle Top Right Close Button -->
          <button
            type="button"
            class="modal-close-icon"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Modal Title (Figma 472:296) -->
          <div class="title-container">
            <h1 class="modal-title">SELECT EVENT DATE</h1>
          </div>

          <!-- Date Selection List (Figma 472:297-358) -->
          <div class="date-options-list">
            <div
              v-for="eventDay in eventDays"
              :key="eventDay.id"
              class="date-option-row"
              :class="{ selected: selectedDayId === eventDay.id }"
              @click="handleDaySelect(eventDay)"
            >
              <div class="date-container-left">
                <div class="day-label-badge">
                  <span>{{ eventDay.badge }}</span>
                </div>
                <div class="day-date-text">
                  <span>{{ eventDay.dateText }}</span>
                </div>
              </div>

              <!-- Square Checkbox (Figma 472:316) -->
              <div
                class="checkbox-square"
                :class="{ checked: selectedDayId === eventDay.id }"
              >
                <svg
                  v-if="selectedDayId === eventDay.id"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <!-- Confirm Button (Figma 472:309-312) -->
          <div class="buttons-container">
            <button
              type="button"
              class="btn-confirm-date"
              @click="confirmSelection"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  selectedDate: { type: String, default: 'All Days' },
  showAllOption: { type: Boolean, default: true }
})

const emit = defineEmits(['close', 'select'])

const allDaysList = [
  { id: 'all', badge: 'ALL DAY', title: 'All Days', dateText: '02 – 06 September 2026', isoDate: '' },
  { id: 'day-1', badge: 'DAY 1', title: 'Day 1 - 02 September 2026', dateText: '02 September 2026', isoDate: '2026-09-02' },
  { id: 'day-2', badge: 'DAY 2', title: 'Day 2 - 03 September 2026', dateText: '03 September 2026', isoDate: '2026-09-03' },
  { id: 'day-3', badge: 'DAY 3', title: 'Day 3 - 04 September 2026', dateText: '04 September 2026', isoDate: '2026-09-04' },
  { id: 'day-4', badge: 'DAY 4', title: 'Day 4 - 05 September 2026', dateText: '05 September 2026', isoDate: '2026-09-05' },
  { id: 'day-5', badge: 'DAY 5', title: 'Day 5 - 06 September 2026', dateText: '06 September 2026', isoDate: '2026-09-06' }
]

const eventDays = computed(() => {
  return props.showAllOption ? allDaysList : allDaysList.filter(d => d.id !== 'all')
})

const selectedDayId = ref('all')

watch(() => props.isOpen, (open) => {
  if (open) {
    if (!props.selectedDate || props.selectedDate.toLowerCase().includes('all')) {
      selectedDayId.value = props.showAllOption ? 'all' : 'day-1'
    } else {
      const matched = eventDays.value.find(d => props.selectedDate && (props.selectedDate.includes(d.badge) || props.selectedDate.includes(d.isoDate) || props.selectedDate.includes(d.id)))
      selectedDayId.value = matched ? matched.id : (props.showAllOption ? 'all' : 'day-1')
    }
  }
})

const handleDaySelect = (dayObj) => {
  selectedDayId.value = dayObj.id
}

const confirmSelection = () => {
  const chosen = eventDays.value.find(d => d.id === selectedDayId.value) || eventDays.value[0]
  emit('select', chosen.title, chosen)
  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
  box-sizing: border-box;
}

.modal-card {
  background-color: #ffffff;
  border-radius: 0;
  width: 100%;
  max-width: 440px;
  padding: 48px 32px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: relative;
  box-sizing: border-box;
}

.modal-close-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.modal-close-icon:hover {
  opacity: 1;
}

.title-container {
  width: 100%;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.5px;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
}

.date-options-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.date-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  width: 100%;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s ease;
}

.date-option-row:hover {
  opacity: 0.8;
}

.date-container-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.day-label-badge {
  background-color: #000000;
  width: 112px;
  height: 28px;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

.day-label-badge span {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  line-height: 1;
}

.day-date-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  white-space: nowrap;
}

.checkbox-square {
  width: 28px;
  height: 28px;
  border: 1px solid #000000;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.checkbox-square.checked {
  background-color: #000000;
}

.buttons-container {
  width: 100%;
}

.btn-confirm-date {
  width: 100%;
  height: 48px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.btn-confirm-date:hover {
  background-color: #222222;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
