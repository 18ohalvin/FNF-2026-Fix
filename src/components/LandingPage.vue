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
          alt="The 707 Company"
          class="event-banner-media"
        />

        <!-- On Brand Logo (Top Left, 64px height, 24px global margin) -->
        <div class="brand-logo-container">
          <img
            src="../assets/logo-on-white.png"
            alt="On Logo"
            class="on-logo"
          />
        </div>

        <!-- Location Info Section (Figma 539:127) -->
        <div class="location-info-container">
          <div class="location-text-box">
            <p class="location-line">La Moda</p>
            <p class="location-line">Plaza Indonesia</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky Bottom CTA Button (Normal Case) -->
    <CtaButton
      :active="true"
      label="Get your access"
      :uppercase="false"
      @click="emit('start')"
    >
      <template #after>
        <!-- Running Text Bar (Figma 538:126) -->
        <div class="running-ticker-bar" aria-label="DREAM ON ticker">
          <div class="ticker-track">
            <div class="ticker-group">
              <span v-for="n in 8" :key="'g1-' + n" class="ticker-item">DREAM ON</span>
            </div>
            <div class="ticker-group" aria-hidden="true">
              <span v-for="n in 8" :key="'g2-' + n" class="ticker-item">DREAM ON</span>
            </div>
          </div>
        </div>
      </template>
    </CtaButton>
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

/* On Brand Logo Container */
.brand-logo-container {
  position: absolute;
  top: 24px;
  left: 16px;
  z-index: 5;
  pointer-events: none;
}

.on-logo {
  height: 64px;
  width: auto;
  display: block;
  object-fit: contain;
}

/* Location Info Container (Figma 539:127) */
.location-info-container {
  position: absolute;
  bottom: 72px;
  left: 0;
  right: 0;
  padding: 0 24px;
  z-index: 5;
  pointer-events: none;
  box-sizing: border-box;
}

.location-text-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.location-line {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: clamp(36px, 11vw, 52px);
  font-weight: 400;
  line-height: 1.08;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.01em;
  word-break: break-word;
}

/* Running Marquee Text Bar (Figma 538:126) */
.running-ticker-bar {
  background-color: #ffffff;
  width: 100%;
  overflow: hidden;
  padding: 6px 0;
  display: flex;
  align-items: center;
  user-select: none;
  box-sizing: border-box;
}

.ticker-track {
  display: flex;
  width: max-content;
  animation: tickerLoop 22s linear infinite;
  will-change: transform;
}

.ticker-group {
  display: flex;
  align-items: center;
  gap: 48px;
  padding-right: 48px;
  flex-shrink: 0;
}

.ticker-item {
  font-family: 'On Diatype Semi-Mono', 'SFMono-Regular', Consolas, Menlo, Monaco, monospace, 'Helvetica Neue', sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1.92px;
  color: #000000;
  white-space: nowrap;
  text-transform: uppercase;
}

@keyframes tickerLoop {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
