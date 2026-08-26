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
import { ref, computed } from 'vue'
import QRCode from 'qrcode'
import CtaButton from './CtaButton.vue'
import logo707Black from '../assets/logo-707.png'
import adBannerImg from '../assets/ad-banner.png'

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

// Generate & Download high-resolution E-Pass image matching Figma nodes 197:958 (VIP) and 473:505 (Public)
const handleDownloadQr = async () => {
  if (isDownloading.value) return
  isDownloading.value = true

  try {
    const isVip = (props.userDetails.role || '').toUpperCase().includes('VIP')
    const accessId = computedAccessId.value

    // High-resolution retina scale for ultra-crisp mobile viewing & printing
    const scale = 3
    const width = 402
    const height = 820

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    // Image loader helper
    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })

    // 1. Card Background Fill (Pure Black for VIP, Brutalist Light Grey #F2F2F2 for Public)
    ctx.fillStyle = isVip ? '#000000' : '#f2f2f2'
    ctx.fillRect(0, 0, width, height)

    // 2. Header: 707 Logo (Exactly 48px Header Height, 17px Logo Height matching AppHeader.vue)
    // Header Y: 0 to 48px, Logo vertically centered at Y = (48 - 17) / 2 = 15.5px, X: 24px, W: 53px, H: 17px
    const logoImg = await loadImage(logo707Black)
    if (isVip) {
      // Draw pure white 707 logo on dark background for VIP E-Pass
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = logoImg.width
      tempCanvas.height = logoImg.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.drawImage(logoImg, 0, 0)
      tempCtx.globalCompositeOperation = 'source-in'
      tempCtx.fillStyle = '#FFFFFF'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      ctx.drawImage(tempCanvas, 24, 15.5, 53, 17)
    } else {
      // Draw black 707 logo on light background for Public E-Pass
      ctx.drawImage(logoImg, 24, 15.5, 53, 17)
    }

    // 3. Title Row (Y: 76px)
    // Left Title: "VIP GUEST" or "PUBLIC GUEST"
    ctx.font = "300 18px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillStyle = isVip ? '#ffffff' : '#000000'
    ctx.textAlign = 'left'
    ctx.fillText(isVip ? 'VIP GUEST' : 'PUBLIC GUEST', 24, 76)

    // Right Title: "YOUR ACCESS"
    ctx.font = "400 18px 'Helvetica Neue', Arial, sans-serif"
    ctx.textAlign = 'right'
    ctx.fillText('YOUR ACCESS', 378, 76)

    // 4. QR Code Box (X: 24, Y: 96, Size: 195, Radius: 5)
    const qrBoxX = 24
    const qrBoxY = 96
    const qrBoxSize = 195
    const qrRadius = 5

    // Rounded rectangle helper
    const drawRoundRect = (c, x, y, w, h, r) => {
      c.beginPath()
      c.moveTo(x + r, y)
      c.arcTo(x + w, y, x + w, y + h, r)
      c.arcTo(x + w, y + h, x, y + h, r)
      c.arcTo(x, y + h, x, y, r)
      c.arcTo(x, y, x + w, y, r)
      c.closePath()
    }

    // Inner QR container background (#F2F2F2)
    ctx.fillStyle = '#f2f2f2'
    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius)
    ctx.fill()

    // QR Border (White for VIP, Black for Public)
    ctx.strokeStyle = isVip ? '#ffffff' : '#000000'
    ctx.lineWidth = 0.5
    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius)
    ctx.stroke()

    // Generate high-resolution QR code
    const qrDataUrl = await QRCode.toDataURL(accessId, {
      width: 600,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#f2f2f2'
      }
    })
    const qrImg = await loadImage(qrDataUrl)
    // Center QR code within box (13px inset)
    ctx.drawImage(qrImg, qrBoxX + 13, qrBoxY + 13, 169, 169)

    // 5. Identity & Summary Grid (Y: 316)
    ctx.textAlign = 'left'

    // Row 1: GUEST NAME (Col 1, X: 24) & VENUE (Col 2, X: 216)
    ctx.fillStyle = isVip ? '#ffffff' : '#000000'
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('GUEST NAME', 24, 316)
    ctx.fillText('VENUE', 216, 316)

    // Guest Name Splitting: Ensures 2-word names occupy Line 1 and Line 2 without blank space
    const sal = (props.userDetails.salutation || '').trim()
    const first = (props.userDetails.firstName || '').toUpperCase().trim()
    const last = (props.userDetails.lastName || '').toUpperCase().trim()

    let nameLine1 = ''
    let nameLine2 = ''

    if (sal && first && last) {
      const formattedSal = sal.endsWith('.') ? sal : sal + '.'
      nameLine1 = `${formattedSal} ${first}`
      nameLine2 = last
    } else if (first && last) {
      nameLine1 = first
      nameLine2 = last
    } else {
      const rawFull = formattedGuestName.value || 'GUEST'
      const parts = rawFull.split(/\s+/).filter(Boolean)
      if (parts.length === 2) {
        nameLine1 = parts[0]
        nameLine2 = parts[1]
      } else if (parts.length > 2) {
        nameLine1 = parts.slice(0, parts.length - 1).join(' ')
        nameLine2 = parts[parts.length - 1]
      } else {
        nameLine1 = parts[0] || 'GUEST'
        nameLine2 = ''
      }
    }

    ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText(nameLine1, 24, 338)
    if (nameLine2) {
      ctx.fillText(nameLine2, 24, 358)
    }

    ctx.fillText('PLAZA SENAYAN', 216, 338)
    ctx.fillText('4th FLOOR', 216, 358)

    // Row 2: VALID FOR (Col 1, X: 24) & ACCESS ID (Col 2, X: 216) (Y: 394)
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('VALID FOR', 24, 394)
    ctx.fillText('ACCESS ID', 216, 394)

    ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
    let validForStr = ''
    if (isVip) {
      validForStr = resolvedSelectedDates.value.map(d => d.day).join(', ') || 'Day 1'
    } else {
      if (resolvedSelectedDates.value.length >= 4) {
        validForStr = 'ALL DAY'
      } else {
        validForStr = resolvedSelectedDates.value.map(d => d.day).join(', ') || 'Day 2'
      }
    }
    ctx.fillText(validForStr, 24, 416)
    ctx.fillText(accessId, 216, 416)

    // 6. Ad Banner Image (Y: 448, X: 24, W: 354, H: 177)
    const banner = await loadImage(adBannerImg)
    ctx.drawImage(banner, 24, 448, 354, 177)

    // 7. Terms & Conditions (Y: 648, X: 24)
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('TERMS & CONDITIONS:', 24, 648)

    ctx.font = "300 11px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('Valid for one (1) person only — non-transferable.', 24, 670)
    ctx.fillText('Present this ticket at the entrance for scanning.', 24, 688)
    ctx.fillText('No re-entry once you have exited the venue.', 24, 706)
    ctx.fillText('Management is not liable for loss of personal belongings.', 24, 724)

    // 8. Trigger PNG File Download
    const downloadUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `FNF-2026-${isVip ? 'VIP' : 'PUBLIC'}-PASS-${accessId}.png`
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
