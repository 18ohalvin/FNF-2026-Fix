<template>
  <div class="ticket-summary-wrapper">
    <!-- Main Scrollable Content -->
    <main class="ticket-content">
      <!-- Success Title (Figma Node 213:996) -->
      <div class="success-title-box">
        <p class="success-line">SUCCESS.</p>
        <p class="success-line">YOUR PASS HAS</p>
        <p class="success-line">BEEN SENT.</p>
      </div>

      <!-- Identity & Details Section (Figma Node 213:998) -->
      <div class="identity-section">
        <!-- Row 1: Guest Name & Venue -->
        <div class="two-col-row">
          <div class="info-block">
            <span class="info-label">GUEST NAME</span>
            <div class="info-value guest-name-value">
              <p v-for="(line, idx) in guestNameLines" :key="idx" class="guest-name-line">
                {{ line }}
              </p>
            </div>
          </div>

          <div class="info-block">
            <span class="info-label">VENUE</span>
            <div class="info-value venue-value">
              <p class="venue-line">LA MODA</p>
              <p class="venue-line">PLAZA INDONESIA</p>
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
            {{ displayedEmail }}
          </span>
        </div>

        <!-- Row 4: Selected Access Dates (Separated by Date - Figma 541:543) -->
        <div class="access-dates-block">
          <span class="access-valid-label">VALID FOR</span>
          <div class="date-groups-wrapper">
            <div
              v-for="group in dateGroups"
              :key="group.date"
              class="summary-date-group"
            >
              <h3 class="summary-date-title">{{ group.date }}</h3>
              <div class="summary-slots-list">
                <div
                  v-for="slot in group.slots"
                  :key="slot.id"
                  class="date-summary-card"
                >
                  <div class="date-summary-left">
                    <span class="slot-time-text">{{ slot.time }}</span>
                  </div>
                  <div class="date-summary-right">
                    <span class="slot-session-title">{{ slot.session || 'PLAYBACK' }}</span>
                    <span v-if="slot.sessionSub" class="slot-session-sub">{{ slot.sessionSub }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Sticky Bottom CTA Button: DOWNLOAD E-PASS (Direct PDF Download Action) -->
    <CtaButton
      :active="!isDownloading"
      :loading="isDownloading"
      :label="isDownloading ? 'GENERATING PDF...' : 'DOWNLOAD E-PASS'"
      @click="handleDownloadEPassPdf"
    />

    <!-- Update Guest Email Modal with Success State & Fail-Safe Checks -->
    <UpdateEmailModal
      :is-open="isUpdateEmailOpen"
      :phone="userDetails?.phone"
      :current-email="displayedEmail"
      @close="isUpdateEmailOpen = false"
      @updated="handleEmailUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import CtaButton from './CtaButton.vue'
import UpdateEmailModal from './UpdateEmailModal.vue'
import epassBgImg from '../assets/epass-bg.png'
import { LOGO_707_WHITE_BASE64, ON_LOGO_WHITE_BASE64, SPONSOR_PROMO_URL } from '../utils/clientAssets'
import { resolveArrivalSlots } from '../utils/dateHelper'

const props = defineProps({
  userDetails: {
    type: Object,
    default: () => ({
      salutation: 'Mr.',
      firstName: 'ALVIN',
      lastName: 'DECOROUS',
      email: 'alvin@sosco.id',
      phone: '081707909707',
      role: 'GUEST'
    })
  },
  selectedDates: {
    type: Array,
    default: () => []
  },
  selectedDateIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['back', 'home'])

const isDownloading = ref(false)
const hasDownloaded = ref(false)
const isUpdateEmailOpen = ref(false)
const overrideEmail = ref('')

const displayedEmail = computed(() => {
  return overrideEmail.value || props.userDetails?.email || 'alvin@sosco.id'
})

const handleEmailUpdated = (newEmail) => {
  overrideEmail.value = newEmail
}

// Resolve selected event date objects for display
const resolvedSelectedDates = computed(() => {
  const rawDates = (Array.isArray(props.selectedDates) && props.selectedDates.length > 0)
    ? props.selectedDates
    : (Array.isArray(props.selectedDateIds) && props.selectedDateIds.length > 0)
      ? props.selectedDateIds
      : (props.userDetails?.selectedDates || props.userDetails?.selected_dates || ['19sep-1030'])

  return resolveArrivalSlots(rawDates)
})

// Split guest name into lines (e.g. Line 1: "MR. ALVIN", Line 2: "DECOROUS")
const guestNameLines = computed(() => {
  const sal = (props.userDetails.salutation || '').trim()
  const first = (props.userDetails.firstName || props.userDetails.first_name || '').toUpperCase().trim()
  const last = (props.userDetails.lastName || props.userDetails.last_name || '').toUpperCase().trim()

  if (sal && first && last) {
    const formattedSal = sal.endsWith('.') ? sal : sal + '.'
    return [`${formattedSal} ${first}`, last]
  } else if (first && last) {
    return [first, last]
  } else if (first) {
    return [first]
  } else {
    const rawFull = formattedGuestName.value || 'GUEST'
    const parts = rawFull.split(/\s+/).filter(Boolean)
    if (parts.length === 2) {
      return [parts[0], parts[1]]
    } else if (parts.length > 2) {
      return [parts.slice(0, parts.length - 1).join(' '), parts[parts.length - 1]]
    }
    return [rawFull]
  }
})

// Guest Name Formatted (e.g. "MR. ALVIN DECOROUS")
const formattedGuestName = computed(() => {
  let sal = (props.userDetails.salutation || 'Mr.').toUpperCase()
  if (!sal.endsWith('.')) sal = `${sal}.`
  const first = (props.userDetails.firstName || props.userDetails.first_name || 'ALVIN').toUpperCase()
  const last = (props.userDetails.lastName || props.userDetails.last_name || 'DECOROUS').toUpperCase()
  return `${sal} ${first} ${last}`.trim()
})

// Guest Type short: Always "GUEST"
const guestTypeShort = computed(() => {
  return 'GUEST'
})

// Access ID Format: 3-digit unique alphanumeric code (e.g. 707, K9X)
const computedAccessId = computed(() => {
  if (props.userDetails?.access_id) {
    return props.userDetails.access_id
  }
  return '707'
})

const dateGroups = computed(() => {
  const slots = resolvedSelectedDates.value
  if (!slots || slots.length === 0) {
    return [
      {
        date: '19 SEPT 2026',
        slots: [{ id: 'default', time: '16:30 - 17:00', session: 'PLAYBACK', sessionSub: '' }]
      }
    ]
  }

  const groups = []
  const map = new Map()

  slots.forEach(slot => {
    let dStr = '19 SEPT 2026'
    if (slot.dateId === '20-sep' || slot.dateIso === '2026-09-20' || slot.id?.startsWith('20sep') || slot.date?.startsWith('20')) {
      dStr = '20 SEPT 2026'
    } else if (slot.dateId === '19-sep' || slot.dateIso === '2026-09-19' || slot.id?.startsWith('19sep') || slot.date?.startsWith('19')) {
      dStr = '19 SEPT 2026'
    } else if (slot.date) {
      dStr = slot.date.toUpperCase()
    }

    if (!map.has(dStr)) {
      const g = { date: dStr, slots: [] }
      map.set(dStr, g)
      groups.push(g)
    }
    map.get(dStr).slots.push(slot)
  })

  // Ensure chronological order: 19 SEPT then 20 SEPT
  groups.sort((a, b) => {
    if (a.date.includes('19') && b.date.includes('20')) return -1
    if (a.date.includes('20') && b.date.includes('19')) return 1
    return 0
  })

  return groups
})

// Generate & Download high-resolution E-Pass PDF matching Figma 540:419
const handleDownloadEPassPdf = async () => {
  if (isDownloading.value) return
  isDownloading.value = true

  try {
    const accessId = computedAccessId.value
    const groups = dateGroups.value

    // Calculate dynamic height based on slots count
    let totalSlots = 0
    groups.forEach(g => { totalSlots += g.slots.length })
    const baseHeight = 680 + (groups.length * 28) + (totalSlots * 56)
    const height = Math.max(760, baseHeight)
    const width = 402
    const scale = 3

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    // Image loader helper (supports Base64 data URLs with infallible fallback)
    const loadImage = (src) => new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        const retryImg = new Image()
        retryImg.onload = () => resolve(retryImg)
        retryImg.onerror = () => resolve(null)
        retryImg.src = src
      }
      img.src = src
    })

    // 1. Background Artwork (Figma 540:419)
    const bgImg = await loadImage(epassBgImg)
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, width, height)
    } else {
      ctx.fillStyle = '#4a251b'
      ctx.fillRect(0, 0, width, height)
    }

    // 2. Header: 707 White Logo on top right (w: 52, h: 16)
    const logo707 = await loadImage(LOGO_707_WHITE_BASE64)
    if (logo707) {
      ctx.drawImage(logo707, 326, 24, 52, 16)
    }

    // 3. On Brand White Logo on the left (w: 30, h: 61)
    const logoOn = await loadImage(ON_LOGO_WHITE_BASE64)
    if (logoOn) {
      ctx.drawImage(logoOn, 24, 56, 30, 61)
    }

    // 4. QR Code Box (X: 24, Y: 133, Size: 156, Radius: 5)
    const qrBoxX = 24
    const qrBoxY = 133
    const qrBoxSize = 156
    const qrRadius = 5

    const drawRoundRect = (c, x, y, w, h, r) => {
      c.beginPath()
      c.moveTo(x + r, y)
      c.arcTo(x + w, y, x + w, y + h, r)
      c.arcTo(x + w, y + h, x, y + h, r)
      c.arcTo(x, y + h, x, y, r)
      c.arcTo(x, y, x + w, y, r)
      c.closePath()
    }

    ctx.fillStyle = '#f2f2f2'
    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius)
    ctx.fill()

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 0.5
    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius)
    ctx.stroke()

    const qrDataUrl = await QRCode.toDataURL(accessId, {
      width: 600,
      margin: 0,
      color: { dark: '#000000', light: '#f2f2f2' }
    })
    const qrImg = await loadImage(qrDataUrl)
    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, 136, 136)
    }

    // 5. Identity Details in White (Side-by-side with QR)
    const infoX = 208
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    
    // GUEST NAME
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('GUEST NAME', infoX, 148)

    ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
    const nameLines = guestNameLines.value
    const name1 = nameLines[0] || formattedGuestName.value || 'GUEST'
    const name2 = nameLines[1] || ''
    ctx.fillText(name1, infoX, 172)
    if (name2) {
      ctx.fillText(name2, infoX, 192)
    }

    // VENUE
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('VENUE', infoX, 230)

    ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('LA MODA PLAZA', infoX, 254)
    ctx.fillText('INDONESIA', infoX, 274)

    // 6. VALID FOR Section
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('VALID FOR', 24, 320)

    let curY = 346
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]

      // Date Title
      ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
      ctx.textAlign = 'left'
      ctx.fillText(group.date, 24, curY)
      curY += 16

      // Slot Cards
      for (const slot of group.slots) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.strokeRect(24, curY, 354, 48)

        // Time on Left
        ctx.font = "400 14px 'Helvetica Neue', Arial, sans-serif"
        ctx.textAlign = 'left'
        ctx.fillText(slot.time, 48, curY + 29)

        // Session on Right
        ctx.textAlign = 'right'
        if (slot.sessionSub) {
          ctx.font = "400 14px 'Helvetica Neue', Arial, sans-serif"
          ctx.fillText(slot.session || 'LIVE GUIDED LED', 354, curY + 20)
          ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
          ctx.fillText(slot.sessionSub, 354, curY + 36)
        } else {
          ctx.font = "400 14px 'Helvetica Neue', Arial, sans-serif"
          ctx.fillText(slot.session || 'PLAYBACK', 354, curY + 29)
        }

        curY += 56
      }

      // Add spacious gap between date groups
      curY += (i < groups.length - 1) ? 28 : 16
    }

    // 7. Terms & Conditions
    curY += 16
    ctx.textAlign = 'left'
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('TERMS & CONDITIONS:', 24, curY)

    curY += 20
    ctx.font = "300 11px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('Valid for one (1) person only — non-transferable.', 24, curY)
    ctx.fillText('Present this ticket at the entrance for scanning.', 24, curY + 16)
    ctx.fillText('No re-entry once you have exited the venue.', 24, curY + 32)
    ctx.fillText('Management is not liable for loss of personal belongings.', 24, curY + 48)

    // 8. Output PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [width, height]
    })
    pdf.addImage(imgData, 'PNG', 0, 0, width, height, '', 'FAST')
    pdf.save(`707-EPASS-${accessId}.pdf`)
    hasDownloaded.value = true
  } catch (err) {
    console.error('Error generating PDF pass download:', err)
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

/* Success Title (Figma Node 213:996) */
.success-title-box {
  margin-bottom: 34px;
  display: flex;
  flex-direction: column;
}

.success-line {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 32px;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  margin: 0;
  display: block;
}

/* Identity & Details Section (Figma Node 213:998) */
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
  text-transform: uppercase;
}

.guest-name-value {
  display: flex;
  flex-direction: column;
}

.guest-name-line {
  margin: 0;
  line-height: 20px;
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
  line-height: 16px;
}

.email-block {
  width: 100%;
}

.email-value {
  text-transform: none; /* preserve lowercase email */
  word-break: break-all;
  line-height: 16px;
}

.access-dates-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.access-valid-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #000000;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.date-groups-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.summary-date-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-date-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  line-height: 20px;
  text-transform: uppercase;
  margin: 0;
}

.summary-slots-list {
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

.date-summary-left {
  display: flex;
  align-items: center;
}

.slot-time-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 14px;
  white-space: nowrap;
}

.date-summary-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.slot-session-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  line-height: 16px;
  text-transform: uppercase;
  text-align: right;
  white-space: nowrap;
}

.slot-session-sub {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #666666;
  line-height: 16px;
  text-align: right;
  white-space: nowrap;
}
</style>
