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
            {{ displayedEmail }}
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

        <!-- Row 5: Notice Info -->
        <div class="ticket-notice-box">
          <div class="info-icon-holder">
            <img src="../assets/icon-info.svg" alt="Information" class="info-icon" />
          </div>
          <div class="notice-text-content">
            <p class="notice-heading">DIDN'T RECEIVE THE EMAIL?</p>
            <p class="notice-body">
              Check your spam folder or <button type="button" id="open-update-email-btn" class="update-email-link" @click="isUpdateEmailOpen = true">click here</button> to update your email address.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky Bottom CTA Button: DONE -->
    <CtaButton
      :active="true"
      label="DONE"
      @click="emit('home')"
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
import logo707Black from '../assets/logo-707.png'
import adBannerImg from '../assets/ad-banner.png'
import { LOGO_707_BASE64, LOGO_707_WHITE_BASE64, AD_BANNER_BASE64, SPONSOR_PROMO_URL } from '../utils/clientAssets'

const props = defineProps({
  userDetails: {
    type: Object,
    default: () => ({
      salutation: 'Mr.',
      firstName: 'ALVIN',
      lastName: 'DECOROUS',
      email: 'alvin@sosco.id',
      phone: '081707909707',
      role: 'VIP GUEST'
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
  const datesMap = {
    'day-1': { id: 'day-1', date: '2 September 2026', day: 'Day 1 (VIP)' },
    'day-2': { id: 'day-2', date: '3 September 2026', day: 'Day 2' },
    'day-3': { id: 'day-3', date: '4 September 2026', day: 'Day 3' },
    'day-4': { id: 'day-4', date: '5 September 2026', day: 'Day 4' },
    'day-5': { id: 'day-5', date: '6 September 2026', day: 'Day 5' }
  }

  const rawDates = (Array.isArray(props.selectedDates) && props.selectedDates.length > 0)
    ? props.selectedDates
    : (Array.isArray(props.selectedDateIds) && props.selectedDateIds.length > 0)
      ? props.selectedDateIds
      : (props.userDetails?.selectedDates || props.userDetails?.selected_dates || ['day-1'])

  let arr = Array.isArray(rawDates) ? rawDates : []
  if (typeof rawDates === 'string') {
    try {
      arr = JSON.parse(rawDates)
    } catch (e) {
      arr = rawDates.split(',').map(s => s.trim())
    }
  }

  return arr.map(key => {
    if (typeof key === 'object' && key.day) {
      return key
    }
    return datesMap[key] || { id: key, date: 'Event Date', day: key.toUpperCase() }
  })
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

// Guest Type short: "VIP" if VIP GUEST, else "PUBLIC"
const guestTypeShort = computed(() => {
  const role = props.userDetails.role || 'VIP GUEST'
  return role.toUpperCase().includes('VIP') ? 'VIP' : 'PUBLIC'
})

// Access ID Format: 3-digit unique alphanumeric code (e.g. 707, K9X)
const computedAccessId = computed(() => {
  if (props.userDetails?.access_id) {
    return props.userDetails.access_id
  }
  return '707'
})

// Computed multi-tier VALID FOR lines (e.g. "VIP: DAY 1", "PUBLIC: ALL DAY" or "PUBLIC: DAY 2, 4")
const validForLines = computed(() => {
  const isVip = (props.userDetails.role || '').toUpperCase().includes('VIP')
  const rawDates = (Array.isArray(props.selectedDates) && props.selectedDates.length > 0)
    ? props.selectedDates
    : (Array.isArray(props.selectedDateIds) && props.selectedDateIds.length > 0)
      ? props.selectedDateIds
      : (props.userDetails?.selectedDates || props.userDetails?.selected_dates || ['day-1'])

  let arr = Array.isArray(rawDates) ? rawDates : []
  if (typeof rawDates === 'string') {
    try {
      arr = JSON.parse(rawDates)
    } catch (e) {
      arr = rawDates.split(',').map(s => s.trim())
    }
  }

  const normalized = arr.map(k => {
    if (typeof k === 'object' && k.id) return String(k.id).toLowerCase().trim()
    return String(k).toLowerCase().trim()
  })

  const hasDay1 = normalized.some(k => k === 'day-1' || k === '1' || k.includes('day 1'))
  const publicDays = ['day-2', 'day-3', 'day-4', 'day-5'].filter(d => 
    normalized.some(k => k === d || k === d.replace('day-', '') || k === d.replace('-', ' '))
  )

  const lines = []
  if (hasDay1) {
    lines.push('VIP: DAY 1')
  }
  if (publicDays.length === 4) {
    lines.push('PUBLIC: ALL DAY')
  } else if (publicDays.length > 0) {
    const nums = publicDays.map(d => d.replace('day-', '')).join(', ')
    lines.push(`PUBLIC: DAY ${nums}`)
  }

  if (lines.length === 0) {
    lines.push(isVip ? 'VIP: DAY 1' : 'PUBLIC: DAY 2')
  }

  return lines
})

// Generate & Download high-resolution E-Pass PDF with Clickable Sponsor Promo Link
const handleDownloadEPassPdf = async () => {
  if (isDownloading.value) return
  isDownloading.value = true

  try {
    const isVip = (props.userDetails.role || '').toUpperCase().includes('VIP')
    const accessId = computedAccessId.value

    // High-resolution retina scale for ultra-crisp mobile viewing & printing
    const scale = 3
    const width = 402
    const height = 860

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
        // Fallback retry
        const retryImg = new Image()
        retryImg.onload = () => resolve(retryImg)
        retryImg.onerror = () => resolve(null)
        retryImg.src = src
      }
      img.src = src
    })

    // 1. Card Background Fill (Pure Black for VIP, Brutalist Light Grey #F2F2F2 for Public)
    ctx.fillStyle = isVip ? '#000000' : '#f2f2f2'
    ctx.fillRect(0, 0, width, height)

    // 2. Header: 707 Logo (Infallible embedded Base64)
    const logoSrc = isVip ? LOGO_707_WHITE_BASE64 : LOGO_707_BASE64
    const logoImg = await loadImage(logoSrc)
    if (logoImg) {
      ctx.drawImage(logoImg, 24, 15.5, 53, 17)
    }

    // 3. Title Row (Y: 76px)
    ctx.font = "300 18px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillStyle = isVip ? '#ffffff' : '#000000'
    ctx.textAlign = 'left'
    ctx.fillText(isVip ? 'VIP GUEST' : 'PUBLIC GUEST', 24, 76)

    // Right Title: "YOUR ACCESS"
    ctx.font = "400 18px 'Helvetica Neue', Arial, sans-serif"
    ctx.textAlign = 'right'
    ctx.fillText('YOUR ACCESS', 378, 76)

    // 4. QR Code Box (X: 24, Y: 108, Size: 195, Radius: 5)
    const qrBoxX = 24
    const qrBoxY = 108
    const qrBoxSize = 195
    const qrRadius = 5

    const drawRoundRect = (c, x, y, w, h, r) => {
      if (typeof c.roundRect === 'function') {
        c.beginPath()
        c.roundRect(x, y, w, h, r)
        c.closePath()
        return
      }
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

    ctx.strokeStyle = isVip ? '#ffffff' : '#000000'
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
      ctx.drawImage(qrImg, qrBoxX + 13, qrBoxY + 13, 169, 169)
    }

    // 5. Identity & Summary Grid (Y: 344)
    ctx.textAlign = 'left'
    ctx.fillStyle = isVip ? '#ffffff' : '#000000'
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('GUEST NAME', 24, 344)
    ctx.fillText('VENUE', 216, 344)

    // Guest Name Splitting: Ensures 2-word names occupy Line 1 and Line 2 without blank space
    const nameLines = guestNameLines.value
    const nameLine1 = nameLines[0] || formattedGuestName.value || 'GUEST'
    const nameLine2 = nameLines[1] || ''

    ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText(nameLine1, 24, 368)
    if (nameLine2) {
      ctx.fillText(nameLine2, 24, 390)
    }

    ctx.fillText('PLAZA SENAYAN', 216, 368)
    ctx.fillText('4th FLOOR', 216, 390)

    // Row 2: VALID FOR (Col 1, X: 24) & ACCESS ID (Col 2, X: 216) (Y: 438)
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('VALID FOR', 24, 438)
    ctx.fillText('ACCESS ID', 216, 438)

    ctx.font = "500 14px 'Helvetica Neue', Arial, sans-serif"
    const lines = validForLines.value
    if (lines.length === 1) {
      ctx.fillText(lines[0], 24, 462)
    } else {
      ctx.fillText(lines[0], 24, 458)
      ctx.fillText(lines[1], 24, 478)
    }
    ctx.fillText(accessId, 216, 462)

    // 6. Ad Banner Image (Infallible embedded Base64, Y: 510, X: 24, W: 354, H: 177)
    const banner = await loadImage(AD_BANNER_BASE64)
    if (banner) {
      ctx.drawImage(banner, 24, 510, 354, 177)
    }

    // 7. Terms & Conditions (Y: 720, X: 24)
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('TERMS & CONDITIONS:', 24, 720)
    ctx.font = "300 11px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('Valid for one (1) person only — non-transferable.', 24, 744)
    ctx.fillText('Present this ticket at the entrance for scanning.', 24, 764)
    ctx.fillText('No re-entry once you have exited the venue.', 24, 784)
    ctx.fillText('Management is not liable for loss of personal belongings.', 24, 804)

    // 8. Generate PDF with Clickable Link
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [width, height]
    })
    pdf.addImage(imgData, 'PNG', 0, 0, width, height, '', 'FAST')

    // Clickable Hyperlink Annotation over Sponsor Promo Banner
    pdf.link(24, 510, 354, 177, { url: SPONSOR_PROMO_URL })
    
    // Save as PDF file
    pdf.save(`FNF-2026-${isVip ? 'VIP' : 'PUBLIC'}-PASS-${accessId}.pdf`)
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

.update-email-link {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  font-weight: 700;
  color: #000000;
  text-decoration: underline;
  cursor: pointer;
  display: inline;
  -webkit-tap-highlight-color: transparent;
}

.update-email-link:hover {
  opacity: 0.75;
}
</style>
