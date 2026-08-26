<template>
  <div class="landing-page-wrapper">
    <!-- Main Content Area -->
    <main class="landing-content">
      <!-- Static Event Banner Poster (Fit to screen without cropping) -->
      <div class="banner-container">
        <img
          src="../assets/event-banner.png"
          alt="The 707 Company - F+F Sale 2026 (2-6 September 2026)"
          class="event-banner-img"
        />
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
  background-color: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px 16px 12px 16px;
  box-sizing: border-box;
}

.event-banner-img {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: block;
  object-fit: contain;
  object-position: center center;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
