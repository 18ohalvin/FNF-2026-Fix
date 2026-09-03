<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card" role="dialog" aria-modal="true">
          <!-- Close Button (Top right subtle) -->
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

          <!-- Title (Figma 472:271 - 24px) -->
          <div class="title-container">
            <h1 class="modal-title">OCCUPANCY<br />ADJUSTMENT</h1>
          </div>

          <!-- Subtitle (Figma 472:274 - 16px light) -->
          <div class="subtitle-container">
            <p class="modal-subtitle">Slide the bar below to set venue occupancy limit.</p>
          </div>

          <!-- Capacity Info & Slider (Figma 472:289) -->
          <div class="capacity-info-container">
            <!-- Capacity Numbers Header (Figma 472:286) -->
            <div class="capacity-text-row">
              <div class="target-capacity-display">
                <input
                  v-model.number="capacityValue"
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  class="target-val-input"
                  @change="clampToStep"
                />
                <span class="max-total">/ 10000</span>
              </div>
              <div class="current-capacity-display">
                Current: {{ currentCapacity }}
              </div>
            </div>

            <!-- Custom Figma Style Slider with Multiples of 10 -->
            <div class="slider-control-group">
              <button
                type="button"
                class="step-btn"
                title="Decrease by 10"
                @click="adjustStep(-10)"
              >
                -10
              </button>
              <div class="slider-wrapper">
                <div
                  class="slider-track-active"
                  :style="{ width: `${sliderPercent}%` }"
                ></div>
                <div
                  class="slider-track-inactive"
                  :style="{ left: `${sliderPercent}%`, width: `${100 - sliderPercent}%` }"
                ></div>
                <input
                  v-model.number="capacityValue"
                  type="range"
                  min="10"
                  max="10000"
                  step="10"
                  class="figma-slider-input"
                  aria-label="Adjust Occupancy Limit"
                  @input="clampToStep"
                />
              </div>
              <button
                type="button"
                class="step-btn"
                title="Increase by 10"
                @click="adjustStep(10)"
              >
                +10
              </button>
            </div>
          </div>

          <!-- Error Alert if any -->
          <div v-if="errorMessage" class="error-msg-banner">
            {{ errorMessage }}
          </div>

          <!-- Save Button (Figma 472:277 - 48px) -->
          <div class="buttons-container">
            <button
              type="button"
              class="btn-save-confirm"
              :disabled="isSaving || capacityValue < 10 || capacityValue > 10000"
              @click="handleSave"
            >
              <span v-if="isSaving">Saving...</span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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

const sliderPercent = computed(() => {
  const val = Number(capacityValue.value) || 10
  return Math.max(0, Math.min(100, (val / 10000) * 100))
})

const clampToStep = () => {
  let num = parseInt(capacityValue.value, 10)
  if (isNaN(num)) num = 100
  num = Math.round(num / 10) * 10
  capacityValue.value = Math.max(10, Math.min(10000, num))
}

const adjustStep = (delta) => {
  let num = parseInt(capacityValue.value, 10)
  if (isNaN(num)) num = 100
  num = Math.round((num + delta) / 10) * 10
  capacityValue.value = Math.max(10, Math.min(10000, num))
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      const initial = Number(props.currentCapacity) || 100
      capacityValue.value = Math.round(initial / 10) * 10
      errorMessage.value = ''
    }
  }
)

const handleSave = async () => {
  clampToStep()
  const num = capacityValue.value

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
  font-size: 24px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.3px;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
}

.subtitle-container {
  width: 100%;
}

.modal-subtitle {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 1.35;
  color: #000000;
  margin: 0;
}

.capacity-info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.capacity-text-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.target-capacity-display {
  display: flex;
  align-items: baseline;
  color: #000000;
}

.target-val-input {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 1;
  color: #000000;
  width: 110px;
  border: none;
  border-bottom: 2px solid #000000;
  background: transparent;
  outline: none;
  padding: 0;
  margin-right: 4px;
  -moz-appearance: textfield;
}

.target-val-input::-webkit-outer-spin-button,
.target-val-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.max-total {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
}

.current-capacity-display {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
}

/* CUSTOM FIGMA SLIDER & STEP CONTROL GROUP */
.slider-control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.step-btn {
  height: 36px;
  min-width: 44px;
  padding: 0 8px;
  background: #f0f0f0;
  border: 1px solid #cccccc;
  border-radius: 4px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #000000;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.step-btn:hover {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.slider-wrapper {
  position: relative;
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
}

.slider-track-active {
  position: absolute;
  left: 0;
  height: 5px;
  background-color: #000000;
  pointer-events: none;
}

.slider-track-inactive {
  position: absolute;
  height: 1px;
  background-color: #000000;
  pointer-events: none;
}

.figma-slider-input {
  position: relative;
  width: 100%;
  height: 24px;
  background: transparent;
  outline: none;
  cursor: pointer;
  margin: 0;
  z-index: 2;
  -webkit-appearance: none;
}

.figma-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 5px;
  height: 21px;
  background-color: #000000;
  border-radius: 0;
  border: none;
  cursor: pointer;
}

.figma-slider-input::-moz-range-thumb {
  width: 5px;
  height: 21px;
  background-color: #000000;
  border-radius: 0;
  border: none;
  cursor: pointer;
}

.buttons-container {
  width: 100%;
}

.btn-save-confirm {
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

.btn-save-confirm:hover:not(:disabled) {
  background-color: #222222;
}

.btn-save-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg-banner {
  padding: 8px 12px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
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
