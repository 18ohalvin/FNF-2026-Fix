<template>
  <button
    type="button"
    class="date-option-item"
    :class="{ 'is-selected': isSelected, 'is-disabled': disabled }"
    :disabled="disabled"
    @click="!disabled && emit('toggle')"
  >
    <div class="date-left-group">
      <!-- Checkmark icon when selected -->
      <div v-if="isSelected" class="check-icon-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.2929 5.29289C20.6834 5.68342 20.6834 6.31658 20.2929 6.70711L9.70711 17.2929C9.31658 17.6834 8.68342 17.6834 8.29289 17.2929L3.70711 12.7071C3.31658 12.3166 3.31658 11.6834 3.70711 11.2929C4.09763 10.9024 4.7308 10.9024 5.12132 11.2929L9 15.1716L18.8787 5.29289C19.2692 4.90237 19.9024 4.90237 20.2929 5.29289Z" fill="black"/>
        </svg>
      </div>
      <span class="date-label">{{ date }}</span>
    </div>
    <div class="day-right-group">
      <span v-if="note" class="note-badge">{{ note }}</span>
      <span class="day-label">{{ day }}</span>
    </div>
  </button>
</template>

<script setup>
const props = defineProps({
  date: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['toggle'])
</script>

<style scoped>
.date-option-item {
  width: 100%;
  height: 48px;
  background-color: #ededed;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  user-select: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-align: left;
  transition: all 0.15s ease;
}

.date-option-item.is-selected {
  border: 1px solid #000000;
}

.date-option-item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background-color: #e5e5e5;
}

.date-left-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-right-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-badge {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #d8d8d8;
  padding: 2px 6px;
  border-radius: 2px;
}

.check-icon-wrapper {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.date-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
}

.day-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
}
</style>
