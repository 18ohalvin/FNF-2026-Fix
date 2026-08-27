<template>
  <div class="landing-page-wrapper">
    <!-- Main Content Area -->
    <main class="landing-content">
      <!-- Static Event Banner Poster (Fill Screen) -->
      <div class="banner-container">
        <img
          :src="bannerSource"
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
import { computed } from 'vue'
import CtaButton from './CtaButton.vue'
import publicBanner from '../assets/event-banner.png'
import vipBanner from '../assets/event-banner-vip.jpg'

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
  return isVip.value ? vipBanner : publicBanner
})
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
  overflow: hidden;
}

.event-banner-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center center;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
