<template>
  <Transition name="modal-fade">
    <div v-if="isOpen && guest" class="modal-backdrop" @click.self="handleClose">
      <div class="pass-modal-card" role="dialog" aria-modal="true">
        <!-- Modal Top Bar -->
        <div class="modal-top-bar">
          <div class="top-bar-title-group">
            <h2 class="top-bar-title">CUSTOMER E-PASS</h2>
            <span class="guest-role-pill">GUEST PASS</span>
          </div>
          <button type="button" class="close-btn" @click="handleClose" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Scrollable E-Pass Canvas Preview Container (Figma 540:419) -->
        <div class="pass-preview-scroll">
          <div class="digital-pass-card">
            <!-- 1. Header with 707 White Logo on the Right -->
            <div class="pass-header">
              <img
                src="../assets/logo-707-white.png"
                alt="707"
                class="pass-logo-707"
              />
            </div>

            <!-- 2. On Brand White Logo on the Left -->
            <div class="pass-brand-icon-box">
              <img
                src="../assets/logo-on-white.png"
                alt="On Logo"
                class="pass-brand-icon"
              />
            </div>

            <!-- 3. Identity & QR Row (QR on left, Guest Name & Venue on right) -->
            <div class="pass-identity-row">
              <div class="pass-qr-box">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="Pass QR Code" class="pass-qr-img" />
                <div v-else class="qr-loading">...</div>
              </div>

              <div class="pass-info-container">
                <!-- Guest Name -->
                <div class="pass-info-block">
                  <span class="pass-label">GUEST NAME</span>
                  <div class="pass-val">
                    <p v-for="(line, idx) in guestNameLines" :key="idx" class="pass-val-line">
                      {{ line }}
                    </p>
                  </div>
                </div>

                <!-- Venue -->
                <div class="pass-info-block">
                  <span class="pass-label">VENUE</span>
                  <div class="pass-val">
                    <p class="pass-val-line">LA MODA PLAZA</p>
                    <p class="pass-val-line">INDONESIA</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Valid Access Dates (Separated by Date - Figma 540:419) -->
            <div class="pass-validity-section">
              <span class="pass-label">VALID FOR</span>
              
              <div class="pass-date-groups-wrapper">
                <div v-for="group in dateGroups" :key="group.date" class="pass-date-group">
                  <h3 class="pass-date-title">{{ group.date }}</h3>
                  <div class="pass-slots-list">
                    <div v-for="slot in group.slots" :key="slot.id" class="pass-slot-card">
                      <span class="slot-time">{{ slot.time }}</span>
                      <div v-if="slot.session || slot.sessionSub" class="slot-session-box">
                        <span v-if="slot.session" class="slot-session-name">{{ slot.session }}</span>
                        <span v-if="slot.sessionSub" class="slot-session-sub">{{ slot.sessionSub }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Terms & Conditions (White Typography) -->
            <div class="pass-terms">
              <span class="terms-title">TERMS & CONDITIONS:</span>
              <p class="terms-item">Valid for one (1) person only — non-transferable.</p>
              <p class="terms-item">Present this ticket at the entrance for scanning.</p>
              <p class="terms-item">No re-entry once you have exited the venue.</p>
              <p class="terms-item">Management is not liable for loss of personal belongings.</p>
            </div>
          </div>
        </div>

        <!-- Modal Bottom Actions -->
        <div class="modal-bottom-actions">
          <button
            type="button"
            class="btn-download-pdf"
            :disabled="isDownloading"
            @click="handleDownloadPdf"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span v-if="isDownloading">GENERATING PDF...</span>
            <span v-else>DOWNLOAD E-PASS (PDF)</span>
          </button>
          <button
            type="button"
            class="btn-close-modal"
            @click="handleClose"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import epassBgImg from '../assets/epass-bg.png'
import { LOGO_707_WHITE_BASE64, ON_LOGO_WHITE_BASE64 } from '../utils/clientAssets'
import { resolveArrivalSlots } from '../utils/dateHelper'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  guest: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const qrDataUrl = ref('')
const isDownloading = ref(false)

const computedAccessId = computed(() => {
  return props.guest?.access_id || '707'
})

const formattedGuestName = computed(() => {
  if (!props.guest) return 'GUEST'
  const sal = (props.guest.salutation || '').trim()
  const first = (props.guest.first_name || props.guest.firstName || '').toUpperCase().trim()
  const last = (props.guest.last_name || props.guest.lastName || '').toUpperCase().trim()
  const formattedSal = sal ? (sal.endsWith('.') ? sal : sal + '.') : ''
  return `${formattedSal} ${first} ${last}`.trim() || 'GUEST'
})

const guestNameLines = computed(() => {
  const sal = (props.guest?.salutation || '').trim()
  const first = (props.guest?.first_name || props.guest?.firstName || '').toUpperCase().trim()
  const last = (props.guest?.last_name || props.guest?.lastName || '').toUpperCase().trim()

  if (sal && first && last) {
    const formattedSal = sal.endsWith('.') ? sal : sal + '.'
    return [`${formattedSal} ${first}`, last]
  } else if (sal && first) {
    const formattedSal = sal.endsWith('.') ? sal : sal + '.'
    return [`${formattedSal} ${first}`]
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

const dateGroups = computed(() => {
  if (!props.guest) return []
  const rawDates = props.guest.selected_dates || props.guest.selectedDates || []
  const slots = resolveArrivalSlots(rawDates)
  
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

// Generate QR Code when guest changes or modal opens
watch([() => props.isOpen, () => props.guest], async ([open, guest]) => {
  if (open && guest) {
    try {
      const code = guest.access_id || '707'
      qrDataUrl.value = await QRCode.toDataURL(code, {
        width: 400,
        margin: 0,
        color: { dark: '#000000', light: '#f2f2f2' }
      })
    } catch (err) {
      console.error('Failed to generate QR in modal:', err)
    }
  }
}, { immediate: true })

const handleClose = () => {
  emit('close')
}

// Generate & Download PDF matching Figma 540:419
const handleDownloadPdf = async () => {
  if (!props.guest || isDownloading.value) return
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

    const qrImg = await loadImage(qrDataUrl.value)
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
        } else if (slot.session) {
          ctx.font = "400 14px 'Helvetica Neue', Arial, sans-serif"
          ctx.fillText(slot.session, 354, curY + 29)
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
  } catch (err) {
    console.error('Error generating PDF pass in modal:', err)
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.pass-modal-card {
  background-color: #ffffff;
  border-radius: 4px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-top-bar {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e5e5;
  background-color: #ffffff;
}

.top-bar-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-bar-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 0;
  color: #000000;
}

.guest-role-pill {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  background-color: #000000;
  color: #ffffff;
  letter-spacing: 0.05em;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  transition: color 0.15s ease;
}

.close-btn:hover {
  color: #000000;
}

.pass-preview-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #1a1a1a;
  display: flex;
  justify-content: center;
}

/* Digital Pass Card matching Figma 540:419 */
.digital-pass-card {
  width: 100%;
  max-width: 402px;
  background-image: url('../assets/epass-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #ffffff;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  position: relative;
}

.pass-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.pass-logo-707 {
  height: 16px;
  width: auto;
  display: block;
}

.pass-brand-icon-box {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.pass-brand-icon {
  height: 61px;
  width: 30px;
  display: block;
  object-fit: contain;
}

/* Identity & QR Row (QR on left, Guest & Venue on right) */
.pass-identity-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
  width: 100%;
}

.pass-qr-box {
  width: 156px;
  height: 156px;
  min-width: 156px;
  background-color: #f2f2f2;
  border-radius: 5px;
  border: 0.5px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
}

.pass-qr-img {
  width: 100%;
  height: 100%;
  display: block;
}

.qr-loading {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  color: #666666;
}

.pass-info-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  min-width: 0;
}

.pass-info-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pass-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: #ffffff;
  text-transform: uppercase;
  line-height: 16px;
}

.pass-val {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #ffffff;
  text-transform: uppercase;
  word-break: break-word;
}

.pass-val-line {
  margin: 0;
  line-height: 20px;
}

/* VALID FOR / Date Options */
.pass-validity-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
}

.pass-date-groups-wrapper {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
}

.pass-date-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pass-date-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  margin: 0;
  color: #ffffff;
  text-transform: uppercase;
}

.pass-slots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pass-slot-card {
  height: 48px;
  border: 1px solid #ffffff;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: transparent;
  color: #ffffff;
}

.slot-time {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  white-space: nowrap;
}

.slot-session-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.slot-session-name {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  text-transform: uppercase;
  text-align: right;
  white-space: nowrap;
}

.slot-session-sub {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  line-height: 16px;
  color: #ffffff;
  text-align: right;
  white-space: nowrap;
}

/* Terms & Conditions */
.pass-terms {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #ffffff;
  padding-top: 16px;
}

.terms-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin-bottom: 4px;
  line-height: 16px;
}

.terms-item {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 300;
  line-height: 15.125px;
  margin: 0;
  color: #ffffff;
  opacity: 0.95;
}

.modal-bottom-actions {
  padding: 16px 20px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #e5e5e5;
  background-color: #ffffff;
}

.btn-download-pdf {
  flex: 2;
  height: 44px;
  background-color: #000000;
  border: 1px solid #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 600;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.btn-download-pdf:hover:not(:disabled) {
  background-color: #222222;
}

.btn-download-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-close-modal {
  flex: 1;
  height: 44px;
  background-color: transparent;
  border: 1px solid #cccccc;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #666666;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background-color: #f5f5f5;
  color: #000000;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
