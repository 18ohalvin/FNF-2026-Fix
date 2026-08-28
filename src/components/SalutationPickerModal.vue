<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        id="salutation-modal-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
      >
        <div
          class="modal-sheet"
          id="salutation-modal-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="select-title-heading"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :style="{ transform: translateY > 0 ? `translateY(${translateY}px)` : '' }"
        >
          <!-- Drag Handle for Mobile -->
          <div class="sheet-drag-handle-container" @click="handleClose">
            <div class="sheet-drag-handle"></div>
          </div>

          <!-- Content Section -->
          <div class="modal-body">
            <h2 id="select-title-heading" class="modal-title">SELECT TITLE</h2>

            <!-- Options List -->
            <div class="options-list">
              <button
                v-for="opt in options"
                :key="opt.value"
                type="button"
                class="option-card"
                :class="{ 'is-selected': selectedValue === opt.value }"
                @click="selectedValue = opt.value"
              >
                <span class="option-label">{{ opt.label }}</span>
                
                <!-- Right-aligned checkmark when selected -->
                <div v-if="selectedValue === opt.value" class="check-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.2929 5.29289C20.6834 5.68342 20.6834 6.31658 20.2929 6.70711L9.70711 17.2929C9.31658 17.6834 8.68342 17.6834 8.29289 17.2929L3.70711 12.7071C3.31658 12.3166 3.31658 11.6834 3.70711 11.2929C4.09763 10.9024 4.7308 10.9024 5.12132 11.2929L9 15.1716L18.8787 5.29289C19.2692 4.90237 19.9024 4.90237 20.2929 5.29289Z" fill="black"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Confirm Action Button -->
          <button
            type="button"
            id="salutation-confirm-btn"
            class="modal-action-button"
            @click="handleConfirm"
          >
            <span class="action-text">CONFIRM</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  selected: {
    type: String,
    default: 'MR'
  }
})

const emit = defineEmits(['close', 'select'])

const options = [
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Mrs.', label: 'Mrs.' }
]

const normalizeValue = (val) => {
  if (!val) return 'Mr.'
  const clean = val.trim().toLowerCase()
  if (clean.startsWith('mrs')) return 'Mrs.'
  if (clean.startsWith('ms')) return 'Ms.'
  if (clean.startsWith('mr')) return 'Mr.'
  return 'Mr.'
}

const selectedValue = ref(normalizeValue(props.selected))
const translateY = ref(0)
let startY = 0
let currentY = 0
let isDragging = false

watch(() => props.selected, (newVal) => {
  selectedValue.value = normalizeValue(newVal)
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedValue.value = normalizeValue(props.selected)
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    translateY.value = 0
  }
})

const handleClose = () => {
  translateY.value = 0
  emit('close')
}

const handleConfirm = () => {
  emit('select', selectedValue.value)
  handleClose()
}

// Touch swipe gesture handling
const onTouchStart = (e) => {
  startY = e.touches[0].clientY
  isDragging = true
}

const onTouchMove = (e) => {
  if (!isDragging) return
  currentY = e.touches[0].clientY
  const deltaY = currentY - startY
  if (deltaY > 0) {
    translateY.value = deltaY
  }
}

const onTouchEnd = () => {
  if (!isDragging) return
  isDragging = false
  if (translateY.value > 80) {
    handleClose()
  } else {
    translateY.value = 0
  }
}

const onKeyDown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 9999;
  padding: 0 0 max(16px, env(safe-area-inset-bottom, 16px)) 0;
  box-sizing: border-box;
}

.modal-sheet {
  width: 100%;
  max-width: var(--max-content-width, 440px);
  background-color: #f2f2f2;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.sheet-drag-handle-container {
  width: 100%;
  padding: 12px 0 6px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.sheet-drag-handle {
  width: 36px;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}

.modal-body {
  padding: 24px 24px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.4;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.option-card {
  width: 100%;
  height: 48px;
  background-color: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  user-select: none;
  text-align: left;
}

.option-card.is-selected {
  background-color: transparent;
  border: none;
}

.option-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
}

.option-card.is-selected .option-label {
  font-weight: 500;
}

.check-icon-wrapper {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-action-button {
  width: 100%;
  height: 64px;
  background-color: #000000;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  user-select: none;
}

.action-text {
  line-height: 1;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* Modal Transition */
.modal-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-leave-active {
  transition: opacity 0.25s ease-in;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-sheet {
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-leave-active .modal-sheet {
  transition: transform 0.25s ease-in;
}

.modal-fade-enter-from .modal-sheet,
.modal-fade-leave-to .modal-sheet {
  transform: translateY(100%);
}
</style>
