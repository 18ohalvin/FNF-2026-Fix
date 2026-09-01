<template>
  <div class="landing-page-wrapper">
    <!-- Main Content Area -->
    <main class="landing-content">
      <!-- Event Banner Media (Video or Image Fill Screen) -->
      <div class="banner-container">
        <video
          v-if="isVideoBanner"
          :src="bannerSource"
          autoplay
          loop
          muted
          playsinline
          class="event-banner-media"
        ></video>
        <img
          v-else
          :src="bannerSource"
          alt="The 707 Company - F+F Sale 2026 (2-6 September 2026)"
          class="event-banner-media"
        />

        <!-- Sponsor Logo (Jenius by SMBC Indonesia Presents) Top Right Under Header -->
        <div class="sponsor-overlay-container">
          <img
            src="../assets/logo-jenius-presents.png"
            alt="Jenius by SMBC Indonesia Presents"
            class="sponsor-overlay-logo"
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
import { computed } from 'vue'
import CtaButton from './CtaButton.vue'
import publicBannerMedia from '../assets/event-banner.mp4'
import vipBannerMedia from '../assets/event-banner-vip.mp4'

const props = defineProps({
  registrationType: {
    type: String,
    default: 'vip'
  }
})

const emit = defineEmits(['start'])

const isVip = computed(() => {
  return props.registrationType !== 'public'
})

const bannerSource = computed(() => {
  return isVip.value ? vipBannerMedia : publicBannerMedia
})

const isVideoBanner = computed(() => {
  return typeof bannerSource.value === 'string' && (bannerSource.value.endsWith('.mp4') || bannerSource.value.endsWith('.webm') || bannerSource.value.includes('.mp4'))
})
</script>

<style scoped>
.landing-page-wrapper {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #f2f2f2;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: pan-x pinch-zoom;
}

.landing-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.banner-container {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #f2f2f2;
  overflow: hidden;
}

.event-banner-media {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center center;
  user-select: none;
  -webkit-user-drag: none;
}

.sponsor-overlay-container {
  position: absolute;
  top: 16px;
  right: 24px;
  z-index: 10;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.sponsor-overlay-logo {
  height: 24px;
  width: auto;
  object-fit: contain;
  display: block;
}
</style>
