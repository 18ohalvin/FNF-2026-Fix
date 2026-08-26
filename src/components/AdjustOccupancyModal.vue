<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="adjust-backdrop" @click.self="handleClose">
        <div class="adjust-modal-card">
          <!-- Modal Header -->
          <div class="modal-card-header">
            <div class="header-left">
              <span class="header-title">ADJUST MAX CAPACITY</span>
              <span class="header-sub">Live Venue Occupancy Settings</span>
            </div>
            <button type="button" class="close-card-btn" aria-label="Close" @click="handleClose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-card-body">
            <!-- Current Live Context -->
            <div class="current-info-box">
              <div class="info-item">
                <span class="info-label">CURRENTLY INSIDE</span>
                <span class="info-val">{{ currentOccupancy }} GUESTS</span>
              </div>
              <div class="info-item">
                <span class="info-label">CURRENT CAPACITY</span>
                <span class="info-val">{{ currentCapacity }} GUESTS</span>
              </div>
            </div>

            <!-- Number Input Section -->
            <div class="input-section">
              <label class="field-label" for="capacity-input">
                NEW MAXIMUM CAPACITY (1 – 10,000)
              </label>
              
              <div class="stepper-wrapper">
                <button
                  type="button"
                  class="stepper-btn"
                  aria-label="Decrease by 10"
                  @click="adjustValue(-10)"
                >
                  -10
                </button>
                <button
                  type="button"
                  class="stepper-btn"
                  aria-label="Decrease by 1"
                  @click="adjustValue(-1)"
                >
                  -1
                </button>
                <input
                  id="capacity-input"
                  v-model.number="capacityValue"
                  type="number"
                  min="1"
                  max="10000"
                  class="capacity-number-input"
                  @keydown.enter="handleSave"
                />
                <button
                  type="button"
                  class="stepper-btn"
                  aria-label="Increase by 1"
                  @click="adjustValue(1)"
                >
                  +1
                </button>
                <button
                  type="button"
                  class="stepper-btn"
                  aria-label="Increase by 10"
                  @click="adjustValue(10)"
                >
                  +10
                </button>
              </div>
              <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
            </div>

            <!-- Quick Presets -->
            <div class="presets-section">
              <span class="preset-label">QUICK PRESETS:</span>
              <div class="preset-buttons">
                <button
                  v-for="preset in [50, 100, 200, 500, 1000, 2500, 5000, 10000]"
                  :key="preset"
                  type="button"
                  class="preset-chip"
                  :class="{ active: capacityValue === preset }"
                  @click="capacityValue = preset"
                >
                  {{ preset.toLocaleString() }}
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-card-footer">
            <button type="button" class="btn-cancel" @click="handleClose">
              Cancel
            </button>
            <button
              type="button"
              class="btn-save"
              :disabled="isSaving"
              @click="handleSave"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>SAVE CAPACITY</span>
            </button>
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
  currentOccupancy: { type: Number, default: 0 },
  currentCapacity: { type: Number, default: 100 }
})

const emit = defineEmits(['close', 'saved'])

const capacityValue = ref(100)
const isSaving = ref(false)
const errorMsg = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      capacityValue.value = props.currentCapacity || 100
      errorMsg.value = ''
      isSaving.value = false
    }
  }
)

const adjustValue = (delta) => {
  const cur = parseInt(capacityValue.value, 10) || 100
  const next = Math.max(1, Math.min(10000, cur + delta))
  capacityValue.value = next
}

const handleClose = () => {
  emit('close')
}

const handleSave = () => {
  const val = parseInt(capacityValue.value, 10)
  if (isNaN(val) || val < 1 || val > 10000) {
    errorMsg.value = 'Please enter a valid capacity between 1 and 10,000.'
    return
  }
  errorMsg.value = ''
  emit('saved', val)
}
</script>

<style scoped>
.adjust-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
}

.adjust-modal-card {
  background-color: #ffffff;
  border: 1px solid #000000;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
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
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #000000;
  text-transform: uppercase;
}

.header-sub {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #666666;
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

.modal-card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-info-box {
  display: flex;
  justify-content: space-between;
  background-color: #f2f2f2;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-val {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #000000;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #000000;
  text-transform: uppercase;
}

.stepper-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stepper-btn {
  height: 44px;
  padding: 0 10px;
  border: 1px solid #000000;
  background: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #000000;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.stepper-btn:hover {
  background: #f0f0f0;
}

.capacity-number-input {
  flex: 1;
  height: 44px;
  border: 1px solid #000000;
  padding: 0 12px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: #000000;
  outline: none;
  box-sizing: border-box;
}

.capacity-number-input:focus {
  border-width: 2px;
}

.error-msg {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  color: #d32f2f;
  margin: 0;
}

.presets-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #666666;
  text-transform: uppercase;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-chip {
  padding: 5px 10px;
  border: 1px solid #cccccc;
  background: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  border-color: #000000;
  background: #f5f5f5;
}

.preset-chip.active {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.modal-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #e5e5e5;
  background-color: #f9f9f9;
}

.btn-cancel {
  height: 36px;
  padding: 0 16px;
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

.btn-save {
  height: 36px;
  padding: 0 20px;
  border: 1px solid #000000;
  background: #000000;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-save:hover:not(:disabled) {
  background: #222222;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
