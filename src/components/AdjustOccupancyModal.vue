<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <span class="header-title">ADJUST MAX CAPACITY</span>
              <span class="header-subtitle">Set maximum venue occupancy limit (1 – 10,000)</span>
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
            <!-- Current Status Box -->
            <div class="status-summary-box">
              <div class="status-metric">
                <span class="status-label">CURRENT LIVE COUNT</span>
                <span class="status-value">{{ currentOccupancy }}</span>
              </div>
              <div class="status-divider"></div>
              <div class="status-metric">
                <span class="status-label">NEW MAX CAPACITY</span>
                <span class="status-value highlight">{{ capacityValue }}</span>
              </div>
            </div>

            <!-- Number Input Row with +/- stepper -->
            <div class="input-control-group">
              <label class="control-label">MAX CAPACITY LIMIT</label>
              <div class="stepper-input-wrapper">
                <button
                  type="button"
                  class="step-btn"
                  :disabled="capacityValue <= 1"
                  @click="adjustValue(-10)"
                >
                  −10
                </button>
                <button
                  type="button"
                  class="step-btn step-single"
                  :disabled="capacityValue <= 1"
                  @click="adjustValue(-1)"
                >
                  −1
                </button>
                <input
                  v-model.number="capacityValue"
                  type="number"
                  min="1"
                  max="10000"
                  class="capacity-number-input"
                  @input="validateInput"
                />
                <button
                  type="button"
                  class="step-btn step-single"
                  :disabled="capacityValue >= 10000"
                  @click="adjustValue(1)"
                >
                  +1
                </button>
                <button
                  type="button"
                  class="step-btn"
                  :disabled="capacityValue >= 10000"
                  @click="adjustValue(10)"
                >
                  +10
                </button>
              </div>
            </div>

            <!-- Slider Control -->
            <div class="slider-control-group">
              <div class="slider-header">
                <span class="slider-min-label">1</span>
                <span class="slider-current-label">{{ capacityValue.toLocaleString() }} Guests</span>
                <span class="slider-max-label">10,000</span>
              </div>
              <input
                v-model.number="capacityValue"
                type="range"
                min="1"
                max="10000"
                step="1"
                class="capacity-slider"
              />
            </div>

            <!-- Quick Presets -->
            <div class="presets-group">
              <span class="presets-label">QUICK PRESETS</span>
              <div class="presets-buttons">
                <button
                  v-for="preset in presets"
                  :key="preset"
                  type="button"
                  class="preset-chip"
                  :class="{ active: capacityValue === preset }"
                  @click="capacityValue = preset"
                >
                  {{ preset >= 1000 ? `${preset / 1000}k` : preset }}
                </button>
              </div>
            </div>

            <!-- Warning if capacity is lower than current occupancy -->
            <div v-if="capacityValue < currentOccupancy" class="occupancy-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Capacity limit is lower than the {{ currentOccupancy }} guests currently inside. Venue will show 100%+ capacity.</span>
            </div>

            <!-- Error message if any -->
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

const presets = [50, 100, 250, 500, 1000, 2500, 5000, 10000]

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      capacityValue.value = props.currentCapacity || 100
      errorMessage.value = ''
    }
  }
)

const adjustValue = (delta) => {
  const next = Number(capacityValue.value) + delta
  capacityValue.value = Math.max(1, Math.min(10000, next))
}

const validateInput = () => {
  if (capacityValue.value === '' || capacityValue.value === null) return
  let num = parseInt(capacityValue.value, 10)
  if (isNaN(num)) num = 1
  if (num < 1) num = 1
  if (num > 10000) num = 10000
  capacityValue.value = num
}

const handleSave = async () => {
  validateInput()
  isSaving.value = true
  errorMessage.value = ''

  try {
    const res = await apiUpdateMaxCapacity(capacityValue.value)
    if (res && res.success) {
      emit('updated', res.capacity || capacityValue.value)
      emit('close')
    } else {
      errorMessage.value = res?.error || 'Failed to update capacity limit.'
    }
  } catch (err) {
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
  max-width: 440px;
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-summary-box {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #f2f2f2;
  border: 1px solid #e0e0e0;
  padding: 12px 16px;
}

.status-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.status-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #777777;
  text-transform: uppercase;
}

.status-value {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #000000;
}

.status-value.highlight {
  color: #000000;
}

.status-divider {
  width: 1px;
  height: 32px;
  background-color: #d0d0d0;
}

.input-control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #000000;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.stepper-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #000000;
  background: #ffffff;
  height: 44px;
}

.step-btn {
  height: 100%;
  padding: 0 12px;
  background: #f0f0f0;
  border: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.step-btn.step-single {
  padding: 0 10px;
  font-size: 14px;
  background: #e8e8e8;
}

.step-btn:hover:not(:disabled) {
  background: #000000;
  color: #ffffff;
}

.step-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.capacity-number-input {
  flex: 1;
  height: 100%;
  border: none;
  text-align: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  outline: none;
  -moz-appearance: textfield;
}

.capacity-number-input::-webkit-outer-spin-button,
.capacity-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.slider-control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  color: #666666;
}

.slider-current-label {
  font-weight: 700;
  font-size: 13px;
  color: #000000;
}

.capacity-slider {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  accent-color: #000000;
  -webkit-appearance: none;
}

.capacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #000000;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  cursor: pointer;
}

.presets-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.presets-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #777777;
  text-transform: uppercase;
}

.presets-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-chip {
  padding: 5px 10px;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: #f0f0f0;
  border-color: #000000;
}

.preset-chip.active {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.occupancy-warning {
  display: flex;
  align-items: flex-start;
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
