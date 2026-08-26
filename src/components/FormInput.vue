<template>
  <div class="form-input-container">
    <div
      class="form-input-wrapper"
      :class="{
        'is-focused': isFocused,
        'is-filled': Boolean(modelValue) && !isFocused,
        'is-variant-5': isVariant5,
        'is-variant-4': isVariant4,
        'is-variant-1': isVariant1,
        'is-variant-2': isVariant2,
        'is-variant-3': isVariant3,
        'is-disabled': disabled
      }"
    >
      <!-- Floating Label on top border (Shown in Variant 2 and Variant 5 when focused) -->
      <div v-if="isFocused" class="floating-label">
        <span class="floating-label-text">{{ label }}</span>
      </div>

      <!-- Variant 4 Display: When left empty and unfocused -->
      <div v-if="isVariant4" class="variant-4-display">
        <span class="error-text">{{ errorMessage }}</span>
      </div>

      <!-- Input Field -->
      <input
        ref="inputRef"
        :id="id"
        :name="name"
        :type="type"
        :value="modelValue"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="computedPlaceholder"
        :disabled="disabled"
        :readonly="readonly"
        class="custom-input"
        :class="{
          'hide-text': isVariant4,
          'variant-5-placeholder': isVariant5
        }"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
      />
    </div>

    <!-- Helper Text below input field box (appears only when tapped/focused) -->
    <div v-if="helperText && isFocused" class="helper-text-container">
      <p class="helper-text">{{ helperText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  name: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: ''
  },
  autocomplete: {
    type: String,
    default: ''
  },
  inputmode: {
    type: String,
    default: ''
  },
  hasError: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: 'This information is required*'
  },
  helperText: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const inputRef = ref(null)
const isFocused = ref(false)
const wasTouched = ref(false)

// State Calculations:
// Variant 1: Default unfocused, untouched, empty
const isVariant1 = computed(() => {
  return !isFocused.value && !props.modelValue && !wasTouched.value && !props.hasError
})

// Variant 2: Focused with value
const isVariant2 = computed(() => {
  return isFocused.value && Boolean(props.modelValue)
})

// Variant 3: Unfocused with value
const isVariant3 = computed(() => {
  return !isFocused.value && Boolean(props.modelValue)
})

// Variant 4: Left empty and unfocused (touched or error)
const isVariant4 = computed(() => {
  return !isFocused.value && !props.modelValue && (wasTouched.value || props.hasError)
})

// Variant 5: Clicked / focused on the box but not filled yet
const isVariant5 = computed(() => {
  return isFocused.value && !props.modelValue
})

const computedPlaceholder = computed(() => {
  if (isVariant5.value) {
    return props.errorMessage // "This information is required*" in #7b2323
  }
  if (isVariant1.value) {
    return props.placeholder || props.label // "FIRST NAME*" in #a5a5a5
  }
  return ''
})

const handleFocus = (e) => {
  if (props.disabled || props.readonly) return
  isFocused.value = true
  wasTouched.value = true
  emit('focus', e)

  setTimeout(() => {
    const el = inputRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight
    // Only scroll if the input field is actually hidden or cut off by the keyboard or viewport edge
    if (rect.bottom > viewportHeight - 20 || rect.top < 80) {
      if (el.scrollIntoViewIfNeeded) {
        el.scrollIntoViewIfNeeded(false)
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }
  }, 200)
}

const handleBlur = (e) => {
  isFocused.value = false
  emit('blur', e)
}

const handleInput = (e) => {
  emit('update:modelValue', e.target.value)
}
</script>

<style scoped>
.form-input-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.form-input-wrapper {
  width: 100%;
  height: 48px;
  background-color: #ededed;
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

/* Focused State (Variant 2 & Variant 5): border 0.5px solid black, background #f2f2f2 */
.form-input-wrapper.is-focused {
  background-color: #f2f2f2;
  border: 0.5px solid #000000;
}

/* Floating Label on top border */
.floating-label {
  position: absolute;
  top: -7.5px;
  left: 16.5px;
  background-color: #f2f2f2;
  padding: 0 4px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.floating-label-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 8px;
  font-weight: 400;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 14px;
  white-space: nowrap;
}

/* Custom Input Field */
.custom-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 24px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  letter-spacing: normal;
  border-radius: 0;
  -webkit-appearance: none;
}

/* Variant 1 Default placeholder in #A5A5A5 */
.custom-input::placeholder {
  color: #a5a5a5;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  text-transform: uppercase;
  opacity: 1;
}

/* Variant 5 placeholder when clicked but not filled yet: "This information is required*" in #7b2323 */
.custom-input.variant-5-placeholder::placeholder {
  color: #7b2323;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  text-transform: none;
  opacity: 1;
}

.custom-input.hide-text {
  opacity: 0;
}

/* Variant 4 Display: When left empty and unfocused */
.variant-4-display {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 24px;
  pointer-events: none;
}

.error-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #7b2323;
  line-height: 14px;
}

.helper-text-container {
  padding: 8px 24px 0 24px;
}

.helper-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: #000000;
  line-height: 20px;
  margin: 0;
}

.form-input-wrapper.is-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-input-wrapper.is-disabled .custom-input {
  cursor: not-allowed;
}
</style>
