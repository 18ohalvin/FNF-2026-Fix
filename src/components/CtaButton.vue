<template>
  <div class="cta-sticky-container">
    <button
      type="button"
      id="submit-cta-btn"
      class="cta-button"
      :class="{ 'is-active': active, 'is-loading': loading }"
      :disabled="!active || loading"
      @click="handleClick"
    >
      <span v-if="!loading" class="cta-text">{{ label }}</span>
      <span v-else class="cta-spinner" aria-label="Loading"></span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    default: 'NEXT'
  },
  active: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (props.active && !props.loading) {
    emit('click')
  }
}
</script>

<style scoped>
.cta-sticky-container {
  width: 100%;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background-color: var(--bg-primary);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  flex-shrink: 0;
}

.cta-button {
  width: 100%;
  height: 64px;
  border: none;
  outline: none;
  background-color: var(--btn-disabled-bg);
  color: var(--btn-disabled-text);
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: not-allowed;
  user-select: none;
}

.cta-button.is-active {
  background-color: var(--btn-active-bg);
  color: var(--btn-active-text);
  cursor: pointer;
}

.cta-text {
  display: inline-block;
  line-height: 1;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 700;
}

.cta-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
