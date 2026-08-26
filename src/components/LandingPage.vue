<template>
  <div class="landing-page-wrapper">
    <!-- Main Content Area -->
    <main class="landing-content">
      <!-- Static Event Banner Poster (Flex to fit screen) -->
      <div class="banner-container">
        <img
          src="../assets/event-banner.png"
          alt="Wet Market: Art Market A Creative's Pop-Up! April 24-26"
          class="event-banner-img"
        />
      </div>

      <!-- Sponsor Footer Row (Always fully visible above CTA) -->
      <div class="sponsor-footer-row">
        <span class="sponsor-label">THIS EVENT SUPPORTED BY:</span>
        <div class="sponsor-logo-wrapper">
          <img
            src="../assets/sponsor-jenius.png"
            alt="Jenius"
            class="sponsor-logo-img"
          />
        </div>
      </div>
    </main>

    <!-- Sticky Bottom CTA Button -->
    <CtaButton
      :active="true"
      label="GET YOUR ACCESS"
      @click="emit('start')"
    />
  </div>
</template>

<script setup>
import CtaButton from './CtaButton.vue'

const emit = defineEmits(['start'])
</script>

<style scoped>
.landing-page-wrapper {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #f2f2f2;
  overflow: hidden;
}

.landing-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
}

.banner-container {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  background-color: #e5e5e5;
  display: flex;
  overflow: hidden;
}

.event-banner-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: left center;
  user-select: none;
  -webkit-user-drag: none;
}

.sponsor-footer-row {
  width: 100%;
  height: 48px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  background-color: #f2f2f2;
  flex-shrink: 0;
}

.sponsor-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.sponsor-logo-wrapper {
  height: 28px;
  display: flex;
  align-items: center;
}

.sponsor-logo-img {
  height: 22px;
  width: auto;
  max-width: 105px;
  object-fit: contain;
  display: block;
}
</style>
