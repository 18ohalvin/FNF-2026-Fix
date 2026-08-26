<template>
  <div class="landing-page-wrapper">
    <!-- Main Content Area -->
    <main class="landing-content">
      <!-- Static Event Banner Poster (Flex to fit screen) -->
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
}

.event-banner-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center top;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
