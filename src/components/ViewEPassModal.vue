<template>
  <Transition name="modal-fade">
    <div v-if="isOpen && guest" class="modal-backdrop" @click.self="handleClose">
      <div class="pass-modal-card" role="dialog" aria-modal="true">
        <!-- Modal Top Bar -->
        <div class="modal-top-bar">
          <div class="top-bar-title-group">
            <h2 class="top-bar-title">CUSTOMER E-PASS</h2>
            <span class="guest-role-pill" :class="{ 'vip-pill': isVip }">
              {{ isVip ? 'VIP PASS' : 'PUBLIC PASS' }}
            </span>
          </div>
          <button type="button" class="close-btn" @click="handleClose" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Scrollable E-Pass Canvas Preview Container -->
        <div class="pass-preview-scroll">
          <div class="digital-pass-card" :class="{ 'vip-theme': isVip }">
            <!-- 1. Header with Logo -->
            <div class="pass-header">
              <img
                src="../assets/logo-707.png"
                alt="707"
                class="pass-logo"
                :class="{ 'white-logo': isVip }"
              />
              <span class="pass-access-badge">YOUR ACCESS</span>
            </div>

            <!-- 2. Role Title -->
            <div class="pass-role-title">
              {{ isVip ? 'VIP GUEST' : 'PUBLIC GUEST' }}
            </div>

            <!-- 3. QR Code Box -->
            <div class="pass-qr-box">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="Pass QR Code" class="pass-qr-img" />
              <div v-else class="qr-loading">Generating QR...</div>
            </div>

            <!-- 4. Details Grid -->
            <div class="pass-grid">
              <div class="pass-grid-col">
                <span class="pass-label">GUEST NAME</span>
                <span class="pass-val">{{ formattedGuestName }}</span>
              </div>
              <div class="pass-grid-col">
                <span class="pass-label">VENUE</span>
                <span class="pass-val">PLAZA SENAYAN<br>4th FLOOR</span>
              </div>
            </div>

            <div class="pass-grid pass-grid-row2">
              <div class="pass-grid-col">
                <span class="pass-label">VALID FOR</span>
                <div class="pass-val">
                  <div v-for="(line, idx) in validForLines" :key="idx">
                    {{ line }}
                  </div>
                </div>
              </div>
              <div class="pass-grid-col">
                <span class="pass-label">ACCESS ID</span>
                <span class="pass-val">{{ computedAccessId }}</span>
              </div>
            </div>

            <!-- 5. Promotional Sponsor Banner with Clickable Link -->
            <div class="pass-banner-wrapper">
              <a
                href="https://www.jenius.com/greenclubpromo/details/penawaran-jenius-707-ff-sale"
                target="_blank"
                rel="noopener noreferrer"
                class="pass-banner-link"
              >
                <img
                  src="../assets/ad-banner.png"
                  alt="Nikmati promo spesial dari Jenius!"
                  class="pass-banner-img"
                />
              </a>
            </div>

            <!-- 6. Terms & Conditions -->
            <div class="pass-terms">
              <span class="terms-title">TERMS & CONDITIONS:</span>
              <p class="terms-item">1. Valid for one (1) person only — non-transferable.</p>
              <p class="terms-item">2. Present this ticket at the entrance for scanning.</p>
              <p class="terms-item">3. No re-entry once you have exited the venue.</p>
              <p class="terms-item">4. Management is not liable for loss of personal belongings.</p>
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
import logo707Black from '../assets/logo-707.png'
import adBannerImg from '../assets/ad-banner.png'

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

const isVip = computed(() => {
  const role = props.guest?.role || ''
  return role.toUpperCase().includes('VIP')
})

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

const validForLines = computed(() => {
  if (!props.guest) return ['VIP: DAY 1']
  const rawDates = props.guest.selected_dates || props.guest.selectedDates || []
  let arr = []
  if (Array.isArray(rawDates)) {
    arr = rawDates
  } else if (typeof rawDates === 'string') {
    try {
      arr = JSON.parse(rawDates)
    } catch (e) {
      arr = rawDates.split(',').map(s => s.trim())
    }
  }

  const normalized = arr.map(k => String(k).toLowerCase().trim())
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
    lines.push(isVip.value ? 'VIP: DAY 1' : 'PUBLIC: DAY 2')
  }

  return lines
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

// Generate & Download PDF on demand
const handleDownloadPdf = async () => {
  if (!props.guest || isDownloading.value) return
  isDownloading.value = true

  try {
    const accessId = computedAccessId.value
    const vip = isVip.value

    const scale = 3
    const width = 402
    const height = 860

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })

    // 1. Background
    ctx.fillStyle = vip ? '#000000' : '#f2f2f2'
    ctx.fillRect(0, 0, width, height)

    // 2. Logo
    const logoImg = await loadImage(logo707Black)
    if (vip) {
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
      ctx.drawImage(logoImg, 24, 15.5, 53, 17)
    }

    // 3. Title Row
    ctx.font = "300 18px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillStyle = vip ? '#ffffff' : '#000000'
    ctx.textAlign = 'left'
    ctx.fillText(vip ? 'VIP GUEST' : 'PUBLIC GUEST', 24, 76)

    ctx.font = "400 18px 'Helvetica Neue', Arial, sans-serif"
    ctx.textAlign = 'right'
    ctx.fillText('YOUR ACCESS', 378, 76)

    // 4. QR Code
    const qrBoxX = 24
    const qrBoxY = 108
    const qrBoxSize = 195
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

    ctx.strokeStyle = vip ? '#ffffff' : '#000000'
    ctx.lineWidth = 0.5
    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrRadius)
    ctx.stroke()

    const qrImg = await loadImage(qrDataUrl.value)
    ctx.drawImage(qrImg, qrBoxX + 13, qrBoxY + 13, 169, 169)

    // 5. Grid Details
    ctx.textAlign = 'left'
    ctx.fillStyle = vip ? '#ffffff' : '#000000'
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('GUEST NAME', 24, 344)
    ctx.fillText('VENUE', 216, 344)

    ctx.font = "500 16px 'Helvetica Neue', Arial, sans-serif"
    const nameParts = formattedGuestName.value.split(/\s+/).filter(Boolean)
    let line1 = formattedGuestName.value
    let line2 = ''
    if (nameParts.length === 2) {
      line1 = nameParts[0]
      line2 = nameParts[1]
    } else if (nameParts.length > 2) {
      line1 = nameParts.slice(0, nameParts.length - 1).join(' ')
      line2 = nameParts[nameParts.length - 1]
    }
    ctx.fillText(line1, 24, 368)
    if (line2) ctx.fillText(line2, 24, 390)

    ctx.fillText('PLAZA SENAYAN', 216, 368)
    ctx.fillText('4th FLOOR', 216, 390)

    // Row 2: VALID FOR & ACCESS ID
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

    // 6. Ad Banner
    const banner = await loadImage(adBannerImg)
    ctx.drawImage(banner, 24, 510, 354, 177)

    // 7. Terms
    ctx.font = "300 12px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('TERMS & CONDITIONS:', 24, 720)
    ctx.font = "300 11px 'Helvetica Neue', Arial, sans-serif"
    ctx.fillText('Valid for one (1) person only — non-transferable.', 24, 744)
    ctx.fillText('Present this ticket at the entrance for scanning.', 24, 764)
    ctx.fillText('No re-entry once you have exited the venue.', 24, 784)
    ctx.fillText('Management is not liable for loss of personal belongings.', 24, 804)

    // 8. Generate PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [width, height]
    })
    pdf.addImage(imgData, 'PNG', 0, 0, width, height, '', 'FAST')
    pdf.link(24, 510, 354, 177, { url: 'https://www.jenius.com/greenclubpromo/details/penawaran-jenius-707-ff-sale' })

    pdf.save(`FNF-2026-${vip ? 'VIP' : 'PUBLIC'}-PASS-${accessId}.pdf`)
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
}

.pass-modal-card {
  background-color: #ffffff;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  border-radius: 0;
  border: 1px solid #000000;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.modal-top-bar {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  color: #000000;
}

.guest-role-pill {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border: 1px solid #000000;
  background-color: #f2f2f2;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.guest-role-pill.vip-pill {
  background-color: #000000;
  color: #ffffff;
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
  background-color: #e0e0e0;
  display: flex;
  justify-content: center;
}

.digital-pass-card {
  width: 100%;
  max-width: 380px;
  background-color: #f2f2f2;
  color: #000000;
  padding: 20px;
  border: 1px solid #cccccc;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.digital-pass-card.vip-theme {
  background-color: #000000;
  color: #ffffff;
  border-color: #333333;
}

.pass-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pass-logo {
  height: 16px;
  width: auto;
  display: block;
}

.pass-logo.white-logo {
  filter: brightness(0) invert(1);
}

.pass-access-badge {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.pass-role-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.pass-qr-box {
  width: 170px;
  height: 170px;
  background-color: #f2f2f2;
  border-radius: 4px;
  margin: 0 auto 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.vip-theme .pass-qr-box {
  border-color: rgba(255, 255, 255, 0.3);
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

.pass-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.pass-grid-row2 {
  margin-bottom: 20px;
}

.pass-grid-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pass-label {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.05em;
  opacity: 0.75;
  text-transform: uppercase;
}

.pass-val {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-transform: uppercase;
}

.pass-banner-wrapper {
  margin: 0 0 20px 0;
  width: 100%;
}

.pass-banner-link {
  display: block;
  width: 100%;
}

.pass-banner-img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 2px;
}

.pass-terms {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vip-theme .pass-terms {
  border-top-color: rgba(255, 255, 255, 0.15);
}

.terms-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.terms-item {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  line-height: 14px;
  margin: 0;
  opacity: 0.8;
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
  border-radius: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 0;
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
