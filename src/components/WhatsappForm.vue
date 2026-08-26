<template>
  <div class="whatsapp-form-wrapper" :class="{ 'is-focused': isInputFocused }">
    <div class="form-content">
      <!-- Title -->
      <label for="phone-input" class="form-title">
        Enter your WhatsApp Number
      </label>

      <!-- Input Group -->
      <div class="input-row">
        <!-- Country Code Selector (Opens Modal) -->
        <button
          type="button"
          id="country-code-display"
          class="country-code-box"
          aria-label="Select Country Code"
          @click="emit('open-country-modal')"
        >
          <span class="country-code-text">{{ countryCode }}</span>
          <span class="chevron-wrapper">
            <img src="../assets/icon-chevron.svg" alt="" class="chevron-icon" />
          </span>
        </button>

        <!-- Phone Number Input -->
        <div class="phone-input-container">
          <input
            id="phone-input"
            ref="phoneInputRef"
            type="tel"
            inputmode="numeric"
            autocomplete="tel-national"
            :value="formattedPhone"
            @focus="handleFocus"
            @blur="handleBlur"
            @input="handleInput"
            placeholder="123 4567 8910"
            class="phone-input"
            maxlength="16"
          />
        </div>
      </div>

      <!-- Data Concern / Info Section -->
      <div class="data-concern-row">
        <button
          type="button"
          id="why-we-need-this-btn"
          class="why-need-this-btn"
          @click="emit('open-why-modal')"
        >
          <span class="info-icon-wrapper">
            <img src="../assets/icon-info.svg" alt="Information" class="info-icon" />
          </span>
          <span class="why-text-wrapper">
            <span class="why-text">Why we need this</span>
            <span class="why-chevron-wrapper">
              <img src="../assets/icon-chevron.svg" alt="" class="why-chevron-icon" />
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  countryCode: {
    type: String,
    default: '+62'
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'open-why-modal', 'open-country-modal'])

const phoneInputRef = ref(null)
const isInputFocused = ref(false)

// Format raw numeric string into spaced groups (e.g. 812 3456 7890)
const formatPhoneNumber = (raw) => {
  let digits = (raw || '').replace(/\D/g, '')
  // Strip leading zero so phone number never starts with 0
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '')
  }
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  if (digits.length <= 11) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11, 15)}`
}

const formattedPhone = computed(() => {
  return formatPhoneNumber(props.modelValue)
})

const handleFocus = () => {
  isInputFocused.value = true
  setTimeout(() => {
    const el = phoneInputRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight
    // Only scroll if the phone input is actually cut off or hidden
    if (rect.bottom > viewportHeight - 20 || rect.top < 80) {
      if (el.scrollIntoViewIfNeeded) {
        el.scrollIntoViewIfNeeded(false)
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }
  }, 200)
}

const handleBlur = () => {
  isInputFocused.value = false
}

const handleInput = (e) => {
  const input = e.target.value
  let rawDigits = input.replace(/\D/g, '')
  // Automatically strip leading zero(s)
  if (rawDigits.startsWith('0')) {
    rawDigits = rawDigits.replace(/^0+/, '')
  }
  emit('update:modelValue', rawDigits)
}
</script>

<style scoped>
.whatsapp-form-wrapper {
  width: 100%;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
}

.form-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 300;
  color: #000000;
  line-height: normal;
  display: block;
  user-select: none;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.country-code-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #000000;
  outline: none;
  flex-shrink: 0;
  user-select: none;
  cursor: pointer;
}

.country-code-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 400;
  color: #000000;
  line-height: normal;
  letter-spacing: -0.02em;
}

.chevron-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transform: rotate(90deg); /* 90deg clockwise points right */
}

.chevron-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.phone-input-container {
  flex: 1;
  min-width: 0;
  display: flex;
}

.phone-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid #000000;
  outline: none;
  padding: 10px 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 400;
  color: #000000;
  line-height: normal;
  letter-spacing: -0.02em;
  border-radius: 0;
  -webkit-appearance: none;
}

.phone-input::placeholder {
  color: #a5a5a5;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 400;
  opacity: 1;
  letter-spacing: -0.02em;
}

.phone-input:focus {
  border-bottom-color: #000000;
}

.data-concern-row {
  display: flex;
  align-items: center;
}

.why-need-this-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  outline: none;
  user-select: none;
}

.info-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.info-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.why-text-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.why-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: normal;
}

.why-chevron-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transform: rotate(90deg); /* 90deg clockwise points right */
}

.why-chevron-icon {
  width: 16px;
  height: 16px;
  display: block;
}

@media (max-width: 360px) {
  .country-code-text,
  .phone-input,
  .phone-input::placeholder {
    font-size: 26px;
  }
}
</style>
