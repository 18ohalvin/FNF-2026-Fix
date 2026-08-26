<template>
  <div class="ticket-summary-wrapper">
    <!-- Main Scrollable Content -->
    <main class="ticket-content">
      <!-- Success Title -->
      <div class="success-title-box">
        <h1 class="success-line">SUCCESS.</h1>
        <h1 class="success-line">YOUR PASS HAS</h1>
        <h1 class="success-line">BEEN SENT.</h1>
      </div>

      <!-- Identity & Details Section -->
      <div class="identity-section">
        <!-- Row 1: Guest Name & Venue -->
        <div class="two-col-row">
          <div class="info-block">
            <span class="info-label">GUEST NAME</span>
            <span class="info-value guest-name">
              {{ formattedGuestName }}
            </span>
          </div>

          <div class="info-block">
            <span class="info-label">VENUE</span>
            <div class="info-value venue-value">
              <p class="venue-line">PLAZA SENAYAN</p>
              <p class="venue-line">
                <span>4</span><span class="superscript-th">th</span><span> FLOOR</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Row 2: Access ID & Guest Type -->
        <div class="two-col-row">
          <div class="info-block">
            <span class="info-label">ACCESS ID</span>
            <span class="info-value access-id-value">
              {{ computedAccessId }}
            </span>
          </div>

          <div class="info-block">
            <span class="info-label">GUEST TYPE</span>
            <span class="info-value">
              {{ guestTypeShort }}
            </span>
          </div>
        </div>

        <!-- Row 3: Email -->
        <div class="info-block email-block">
          <span class="info-label">EMAIL</span>
          <span class="info-value email-value">
            {{ userDetails.email || 'alvin@sosco.id' }}
          </span>
        </div>

        <!-- Row 4: Selected Access Dates -->
        <div class="access-dates-block">
          <span class="access-valid-label">ACCESS VALID FOR:</span>
          <div class="selected-dates-list">
            <div
              v-for="item in resolvedSelectedDates"
              :key="item.id"
              class="date-summary-card"
            >
              <span class="date-text">{{ item.date }}</span>
              <span class="day-text">{{ item.day }}</span>
            </div>
          </div>
        </div>

        <!-- Row 5: Notice Info with Contact Support Link -->
        <div class="ticket-notice-box">
          <div class="info-icon-holder">
            <img src="../assets/icon-info.svg" alt="Information" class="info-icon" />
          </div>
          <div class="notice-text-content">
            <p class="notice-heading">DIDN'T RECEIVE THE EMAIL?</p>
            <p class="notice-body">
              Check your spam folder or
              <a
                href="https://wa.me/6281707909707"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-support-link"
              >contact support</a>
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky Bottom CTA Button: DOWNLOAD QR CODE (Substitutes DONE button) -->
    <CtaButton
      :active="true"
      :loading="isDownloading"
      label="DOWNLOAD QR CODE"
      @click="handleDownloadQr"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import CtaButton from './CtaButton.vue'

const props = defineProps({
  userDetails: {
    type: Object,
    default: () => ({
      salutation: 'Mr.',
      firstName: 'ALVIN',
      lastName: 'DECOROUS',
      email: '18ohalvin@gmail.com',
      role: 'VIP GUEST'
    })
  },
  selectedDateIds: {
    type: Array,
    default: () => ['day-1', 'day-2']
  }
})

const emit = defineEmits(['home'])
const isDownloading = ref(false)

const allDateOptions = [
  { id: 'day-1', dayNum: 1, date: '2 September 2026', day: 'Day 1' },
  { id: 'day-2', dayNum: 2, date: '3 September 2026', day: 'Day 2' },
  { id: 'day-3', dayNum: 3, date: '4 September 2026', day: 'Day 3' },
  { id: 'day-4', dayNum: 4, date: '5 September 2026', day: 'Day 4' },
  { id: 'day-5', dayNum: 5, date: '6 September 2026', day: 'Day 5' }
]

// Resolve date objects from IDs
const resolvedSelectedDates = computed(() => {
  if (!props.selectedDateIds || props.selectedDateIds.length === 0) {
    return [allDateOptions[0]]
  }
  return allDateOptions.filter(d => props.selectedDateIds.includes(d.id))
})

// Guest Name: e.g. "Mr. ALVIN DECOROUS"
const formattedGuestName = computed(() => {
  let sal = (props.userDetails.salutation || 'Mr.').trim()
  if (!sal.endsWith('.')) sal = `${sal}.`
  const first = (props.userDetails.firstName || 'ALVIN').toUpperCase()
  const last = (props.userDetails.lastName || 'DECOROUS').toUpperCase()
  return `${sal} ${first} ${last}`.trim()
})

// Guest Type short: "VIP" if VIP GUEST, else "GUEST"
const guestTypeShort = computed(() => {
  const role = props.userDetails.role || 'VIP GUEST'
  return role.toUpperCase().includes('VIP') ? 'VIP' : 'GUEST'
})

// Access ID Format: 3-digit unique alphanumeric code (e.g. 707, K9X)
const computedAccessId = computed(() => {
  if (props.userDetails?.access_id) {
    return props.userDetails.access_id
  }
  return '707'
})

// Generate & Download high-resolution QR pass image
const handleDownloadQr = async () => {
  if (isDownloading.value) return
  isDownloading.value = true

  try {
    const accessId = computedAccessId.value
    // Generate QR Code data URL
    const qrDataUrl = await QRCode.toDataURL(accessId, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // Create offscreen canvas for a high-res event pass
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 880
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#f7f7f7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Pass Card Container
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.fillRect(40, 40, 560, 800)
    ctx.strokeRect(40, 40, 560, 800)

    // Header Title
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 36px Helvetica, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('707 EVENT PASS', 320, 110)

    // Subtitle
    ctx.font = '500 16px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#555555'
    ctx.fillText('PLAZA SENAYAN - 4TH FLOOR', 320, 145)

    // Divider Line
    ctx.strokeStyle = '#dddddd'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(80, 175)
    ctx.lineTo(560, 175)
    ctx.stroke()

    // Draw QR Code
    const qrImg = new Image()
    qrImg.src = qrDataUrl
    await new Promise((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 180, 200, 280, 280)
        resolve()
      }
    })

    // Access ID
    ctx.font = 'bold 22px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#000000'
    ctx.fillText(`ACCESS ID: ${accessId}`, 320, 520)

    // Guest Info Box
    ctx.fillStyle = '#f9f9f9'
    ctx.fillRect(80, 550, 480, 170)
    ctx.strokeStyle = '#eeeeee'
    ctx.strokeRect(80, 550, 480, 170)

    ctx.textAlign = 'left'
    ctx.font = '300 13px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#777777'
    ctx.fillText('GUEST NAME', 105, 580)
    ctx.fillText('GUEST TYPE', 360, 580)

    ctx.font = 'bold 16px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#000000'
    ctx.fillText(formattedGuestName.value, 105, 608)
    ctx.fillText(guestTypeShort.value, 360, 608)

    ctx.font = '300 13px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#777777'
    ctx.fillText('VALID FOR', 105, 650)

    ctx.font = '500 15px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#000000'
    const daysSummary = resolvedSelectedDates.value.map(d => d.day).join(', ')
    ctx.fillText(daysSummary, 105, 678)

    // Footer instructions
    ctx.textAlign = 'center'
    ctx.font = '12px Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#888888'
    ctx.fillText('Please show this QR pass at entrance scanner checkpoint', 320, 780)

    // Download trigger
    const downloadUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `707_Pass_${accessId}.png`
    link.href = downloadUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error generating QR pass download:', err)
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
.ticket-summary-wrapper {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f2f2f2;
}

.ticket-content {
  flex: 1;
  padding: 24px 24px 32px 24px;
  display: flex;
  flex-direction: column;
}

.success-title-box {
  margin-bottom: 34px;
}

.success-line {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 32px;
  color: #000000;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: -0.01em;
}

.identity-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.two-col-row {
  display: flex;
  gap: 32px;
  width: 100%;
}

.two-col-row > .info-block {
  flex: 1;
  min-width: 0;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #000000;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.info-value {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  line-height: 20px;
}

.guest-name {
  word-break: break-word;
}

.venue-value {
  display: flex;
  flex-direction: column;
}

.venue-line {
  margin: 0;
  line-height: 20px;
}

.superscript-th {
  font-size: 10.32px;
  vertical-align: super;
  line-height: 0;
  font-weight: 500;
}

.access-id-value {
  letter-spacing: 0.02em;
}

.email-block {
  width: 100%;
}

.email-value {
  text-transform: none; /* preserve lowercase email */
  word-break: break-all;
}

.access-dates-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.access-valid-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #000000;
  line-height: 16px;
  text-transform: uppercase;
}

.selected-dates-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-summary-card {
  width: 100%;
  height: 48px;
  background-color: #ededed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-sizing: border-box;
}

.date-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
}

.day-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
}

.ticket-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.info-icon-holder {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.notice-text-content {
  display: flex;
  flex-direction: column;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 20px;
  color: #000000;
}

.notice-heading {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #000000;
  line-height: 20px;
  text-transform: uppercase;
  margin: 0;
}

.notice-body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #000000;
  line-height: 20px;
  margin: 0;
}

.contact-support-link {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 500;
  color: #000000;
  text-decoration: underline;
  text-underline-position: from-font;
  cursor: pointer;
}
</style>
