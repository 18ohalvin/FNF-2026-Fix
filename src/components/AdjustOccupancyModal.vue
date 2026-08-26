<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <span class="header-title">ADJUST MAX CAPACITY</span>
              <span class="header-subtitle">Set global venue occupancy limit (1 – 10,000)</span>
            </div>
            <button
              type="button"
              class="close-btn"
              aria-label="Close"
              @click="emit('close')"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Capacity Live Display Box -->
            <div class="capacity-display-box">
              <span class="display-label">NEW MAX CAPACITY</span>
              <div class="display-main-number">
                <span class="capacity-num">{{ capacityValue.toLocaleString() }}</span>
                <span class="capacity-unit">GUESTS</span>
              </div>
              <div class="current-occupancy-note">
                <span>Current Live Count: <strong>{{ currentOccupancy }}</strong> guests inside</span>
              </div>
            </div>

            <!-- Clean Continuous Slider Control (1 – 10,000) -->
            <div class="slider-container">
              <div class="slider-labels-row">
                <span class="slider-bound-label">1</span>
                <span class="slider-current-indicator">{{ capacityValue.toLocaleString() }}</span>
                <span class="slider-bound-label">10,000</span>
              </div>

              <input
                v-model.number="capacityValue"
                type="range"
                min="1"
                max="10000"
                step="1"
                class="capacity-range-slider"
                aria-label="Max Capacity Slider"
              />
            </div>

            <!-- Warning Alert if capacity is set lower than current occupants -->
            <div v-if="capacityValue < currentOccupancy" class="occupancy-warning-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Capacity limit is lower than current live guests ({{ currentOccupancy }}).</span>
            </div>

            <!-- Error banner -->
            <div v-if="errorMessage" class="error-banner">
              {{ errorMessage }}
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn-cancel"
              :disabled="isSaving"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-save"
              :disabled="isSaving || capacityValue < 1 || capacityValue > 10000"
              @click="handleSave"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save Capacity</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { apiUpdateMaxCapacity } from '../api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  currentCapacity: {
    type: Number,
    default: 100
  },
  currentOccupancy: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'updated'])

const capacityValue = ref(100)
const isSaving = ref(false)
const errorMessage = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      capacityValue.value = Number(props.currentCapacity) || 100
      errorMessage.value = ''
    }
  }
)

const handleSave = async () => {
  let num = parseInt(capacityValue.value, 10)
  if (isNaN(num)) num = 100
  num = Math.max(1, Math.min(10000, num))
  capacityValue.value = num

  isSaving.value = true
  errorMessage.value = ''

  try {
    const res = await apiUpdateMaxCapacity(num)
    if (res && res.success) {
      emit('updated', res.capacity || num)
      emit('close')
    } else {
      errorMessage.value = res?.error || 'Failed to update capacity limit.'
    }
  } catch (err) {
    console.error('[AdjustOccupancyModal Error]', err)
    errorMessage.value = err.message || 'Network error updating capacity limit.'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
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
  border: 1px solid #000000;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #e5e5e5;
  background-color: #f9f9f9;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #000000;
  text-transform: uppercase;
}

.header-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #666666;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  padding: 4px;
  transition: opacity 0.15s ease;
}

.close-btn:hover {
  opacity: 0.6;
}

.modal-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.capacity-display-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
  border: 1px solid #000000;
  padding: 20px 16px;
  gap: 4px;
}

.display-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: #666666;
  text-transform: uppercase;
}

.display-main-number {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.capacity-num {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #000000;
}

.capacity-unit {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: #666666;
}

.current-occupancy-note {
  margin-top: 6px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  color: #666666;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider-labels-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #000000;
}

.slider-bound-label {
  color: #888888;
  font-size: 12px;
}

.slider-current-indicator {
  font-size: 14px;
  font-weight: 700;
  color: #000000;
}

.capacity-range-slider {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  accent-color: #000000;
  -webkit-appearance: none;
}

.capacity-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: #000000;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.capacity-range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.capacity-range-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #000000;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  border-radius: 50%;
  cursor: pointer;
}

.occupancy-warning-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  color: #d48806;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 16px;
}

.error-banner {
  padding: 10px 12px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e5e5e5;
  background-color: #f9f9f9;
}

.btn-cancel {
  height: 38px;
  padding: 0 16px;
  border: 1px solid #cccccc;
  background: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-cancel:hover:not(:disabled) {
  background: #f0f0f0;
}

.btn-save {
  height: 38px;
  padding: 0 20px;
  border: 1px solid #000000;
  background: #000000;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-save:hover:not(:disabled) {
  background: #222222;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
