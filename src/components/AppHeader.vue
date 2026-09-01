<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 707 Logo clickable to return home -->
      <button
        type="button"
        class="logo-button"
        aria-label="707 Logo - Back to Home"
        @click="emit('home')"
      >
        <img src="../assets/logo-707.png" alt="707 Logo" class="brand-logo" />
      </button>

      <!-- Sponsor Logo (Jenius by SMBC Indonesia Presents) on Top Right -->
      <div class="sponsor-logo-container">
        <img
          src="../assets/logo-jenius-presents.png"
          alt="Jenius by SMBC Indonesia Presents"
          class="sponsor-logo"
          :class="{ 'invert-logo': !isLanding }"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  isLanding: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['home'])
</script>

<style scoped>
.app-header {
  width: 100%;
  height: 48px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
  flex-shrink: 0;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.logo-button {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.brand-logo {
  height: 17px;
  width: auto;
  object-fit: contain;
  display: block;
}

.sponsor-logo-container {
  display: inline-flex;
  align-items: center;
  user-select: none;
}

.sponsor-logo {
  height: 22px;
  width: auto;
  object-fit: contain;
  display: block;
}

.sponsor-logo.invert-logo {
  filter: invert(1);
}
</style>
