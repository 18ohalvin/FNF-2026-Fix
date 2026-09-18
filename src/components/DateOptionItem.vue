<template>
  <button
    type="button"
    class="date-option-item"
    :class="{ 'is-selected': isSelected, 'is-disabled': disabled || isFull, 'is-passed': isPassed, 'is-full': isFull }"
    :disabled="disabled || isPassed || isFull"
    @click="!(disabled || isPassed || isFull) && emit('toggle')"
  >
    <!-- Left Group: Time Label -->
    <div class="slot-left-group">
      <span class="time-label">{{ time || date }}</span>
    </div>

    <!-- Right Group: Note Badge (if any) + Session Detail -->
    <div class="slot-right-group">
      <span v-if="note" class="note-badge" :class="{ 'badge-full': isFull }">{{ note }}</span>
      <div v-if="session || sessionSub" class="session-block">
        <p v-if="session" class="session-main">{{ session }}</p>
        <p v-if="sessionSub" class="session-sub">{{ sessionSub }}</p>
      </div>
    </div>
  </button>
</template>

<script setup>
const props = defineProps({
  time: {
    type: String,
    default: ''
  },
  session: {
    type: String,
    default: ''
  },
  sessionSub: {
    type: String,
    default: ''
  },
  // Legacy prop fallbacks
  date: {
    type: String,
    default: ''
  },
  day: {
    type: String,
    default: ''
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  isFull: {
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
  min-height: 48px;
  background-color: #ededed;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  user-select: none;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-align: left;
  transition: all 0.15s ease;
}

.date-option-item.is-selected {
  border-color: #000000;
  background-color: #e2e2e2;
}

.date-option-item.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background-color: #e5e5e5;
}

.date-option-item.is-full {
  opacity: 0.35 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  background-color: #e4e4e4;
}

.date-option-item.is-passed {
  opacity: 0.2 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  background-color: #e0e0e0;
}

.slot-left-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.check-icon-wrapper {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #000000;
}

.time-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
  white-space: nowrap;
}

.slot-right-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  text-align: right;
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

.session-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.session-main {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 16px;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

.session-sub {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #000000;
  line-height: 16px;
  margin: 0;
  white-space: nowrap;
}
</style>
