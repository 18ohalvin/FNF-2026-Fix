<template>
  <div class="scanner-page-container">
    <div class="scanner-frame">
      <!-- LEFT PANE: CAMERA & SCANNER VIEWFINDER -->
      <div class="left-pane">
        <!-- Mode Selector Tabs: CHECK IN vs CHECK OUT -->
        <div class="tabs-header">
          <button
            type="button"
            class="tab-button"
            :class="{ active: scanMode === 'check-in' }"
            @click="setScanMode('check-in')"
          >
            CHECK IN
          </button>
          <button
            type="button"
            class="tab-button"
            :class="{ active: scanMode === 'check-out' }"
            @click="setScanMode('check-out')"
          >
            CHECK OUT
          </button>
        </div>

        <!-- Camera Viewfinder Region -->
        <div class="viewfinder-wrapper">
          <div class="camera-viewport">
            <!-- HTML5 QR Code Camera Mounting Element -->
            <div id="html5-qr-code-reader" class="qr-reader-mount"></div>

            <!-- Custom Scanning Reticle Corner Overlay -->
            <div class="reticle-container">
              <div class="reticle-corner top-left"></div>
              <div class="reticle-corner top-right"></div>
              <div class="reticle-corner bottom-left"></div>
              <div class="reticle-corner bottom-right"></div>
            </div>

            <!-- Instant Scan Result Feedback Popover -->
            <Transition name="scan-pop">
              <div
                v-if="scanFeedback"
                class="scan-feedback-banner"
                :class="scanFeedback.status.toLowerCase()"
              >
                <div class="feedback-icon">
                  <svg v-if="scanFeedback.status === 'GRANTED'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div class="feedback-text">
                  <span class="feedback-title">{{ scanFeedback.title }}</span>
                  <span class="feedback-msg">{{ scanFeedback.message }}</span>
                </div>
              </div>
            </Transition>

            <!-- Camera Error / Insecure Context Helper Banner -->
            <div v-if="cameraErrorMessage && !isCameraOn" class="camera-error-overlay">
              <div class="error-dialog-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <p class="error-dialog-title">CAMERA OFFLINE</p>
                <p class="error-dialog-msg">{{ cameraErrorMessage }}</p>
                <div class="error-dialog-actions">
                  <button type="button" class="retry-cam-btn" @click="startCamera">
                    RETRY CAMERA
                  </button>
                </div>
              </div>
            </div>

            <!-- Camera Stream Controls -->
            <div class="camera-toolbar">
              <button
                type="button"
                class="tool-btn"
                title="Toggle Camera Stream"
                @click="toggleCameraActive"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>{{ isCameraOn ? 'Pause Camera' : 'Start Camera' }}</span>
              </button>
            </div>

            <!-- Figma Watermark Label -->
            <div class="watermark-label">
              707 SCANNER
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANE: CONTROL & LIVE OCCUPANCY PANEL -->
      <div class="right-pane">
        <div class="pane-content">
          <!-- Header Area with Search & Brand Logo -->
          <div class="search-container">
            <div class="brand-subcontainer">
              <button
                type="button"
                class="header-logout-btn"
                title="Log out"
                aria-label="Log out"
                @click="handleLogout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
              <img src="../assets/logo-707.png" alt="707 Logo" class="logo-707" />
            </div>

            <!-- Manual Ticket / Customer Name Input Box -->
            <div class="manual-input-box">
              <input
                v-model="manualTicketInput"
                type="text"
                class="ticket-input-field"
                placeholder="Enter Customer Name, Ticket ID, or Phone"
                @keyup.enter="handleManualSubmit"
              />
              <button
                type="button"
                class="search-submit-btn"
                aria-label="Search Customer Name or Ticket ID"
                :disabled="isProcessingScan"
                @click="handleManualSubmit"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Live Occupancy Section -->
          <div class="occupancy-section">
            <div class="occupancy-header">
              <span class="occupancy-title">LIVE OCCUPANCY</span>
              <span class="header-separator">|</span>
              <button
                type="button"
                class="day-selector-trigger"
                title="Change Active Event Day"
                @click="isCalendarOpen = true"
              >
                <span class="event-date-text">{{ eventDayText }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="day-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <!-- Big Occupancy Number Display (Figma 160px font spec) -->
            <div class="occupancy-counter-wrapper">
              <div class="counter-number">{{ currentOccupancy }}</div>
              <div class="counter-max">/ {{ maxCapacity }}</div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${occupancyPercent}%` }"
              ></div>
            </div>
          </div>

          <!-- Analytics Dashboard Button -->
          <button
            type="button"
            class="analytics-dashboard-btn"
            @click="emit('nav-analytics')"
          >
            <span>Analytics Dashboard</span>
            <div class="btn-arrow-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Security Scan Logs Modal -->
    <RecentScansModal
      :is-open="isModalOpen"
      :scans="recentScans"
      :current-occupancy="currentOccupancy"
      :checked-in-count="checkedInCount"
      :checked-out-count="checkedOutCount"
      @close="isModalOpen = false"
      @refresh="loadOccupancyData"
      @reset="handleResetOccupancy"
    />

    <!-- Figma Status Result Modal (Nodes 427:359, 447:347, 447:369, 447:386) -->
    <ScanResultModal
      :is-open="isResultModalOpen"
      :result="activeScanResult"
      @close="handleModalClose"
      @search="handleModalSearch"
      @adjust-occupancy="handleOpenAdjustOccupancy"
    />

    <!-- Adjust Occupancy Limit Modal -->
    <AdjustOccupancyModal
      :is-open="isAdjustOccupancyOpen"
      :current-capacity="maxCapacity"
      :current-occupancy="currentOccupancy"
      @close="isAdjustOccupancyOpen = false"
      @updated="handleCapacityUpdated"
    />

    <!-- Event Day Selector Calendar Modal (No "All Day" Option on Scanner) -->
    <CalendarModal
      :is-open="isCalendarOpen"
      :selected-date="eventDayText"
      :show-all-option="false"
      @close="isCalendarOpen = false"
      @select="handleDaySelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { apiProcessScan, apiFetchOccupancy, apiResetOccupancy } from '../api/client'
import RecentScansModal from './RecentScansModal.vue'
import ScanResultModal from './ScanResultModal.vue'
import AdjustOccupancyModal from './AdjustOccupancyModal.vue'
import CalendarModal from './CalendarModal.vue'

const emit = defineEmits(['nav-analytics', 'nav-database', 'logout'])

const handleLogout = () => {
  localStorage.removeItem('staff_auth')
  sessionStorage.removeItem('staff_auth')
  emit('logout')
}

// Scanner State
const scanMode = ref('check-in') // 'check-in' | 'check-out'
const isCameraOn = ref(false)
const isProcessingScan = ref(false)
const manualTicketInput = ref('')
const scanFeedback = ref(null)
const activeScanResult = ref(null)
const isResultModalOpen = ref(false)
const isAdjustOccupancyOpen = ref(false)
const isModalOpen = ref(false)
const isCalendarOpen = ref(false)

// Active Operating Event Day State
const activeDayId = ref('day-1')
const eventDayText = ref('DAY 1 - WEDNESDAY, 02 SEP 2026')

// Occupancy Data State
const currentOccupancy = ref(0)
const maxCapacity = ref(100)
const checkedInCount = ref(0)
const checkedOutCount = ref(0)
const recentScans = ref([])

// Camera State
let html5QrcodeScanner = null

const occupancyPercent = computed(() => {
  if (!maxCapacity.value) return 0
  return Math.min(100, Math.round((currentOccupancy.value / maxCapacity.value) * 100))
})

// Web Audio API Chime Synthesizer for instant audible scan feedback
const playAudioFeedback = (isSuccess) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (isSuccess) {
      // Pleasant high-pitched double chime
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1) // D6
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      // Low alert tone for warning/duplicate
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    }
  } catch (e) {
    console.warn('[Audio Chime] Audio Context unavailable:', e)
  }
}

const showFeedback = (status, title, message) => {
  scanFeedback.value = { status, title, message }
  playAudioFeedback(status === 'GRANTED')

  setTimeout(() => {
    scanFeedback.value = null
  }, 4000)
}

const setScanMode = (mode) => {
  scanMode.value = mode
}

const handleDaySelect = (title, dayObj) => {
  if (dayObj) {
    activeDayId.value = dayObj.id
    eventDayText.value = `${dayObj.badge} - ${dayObj.dateText.toUpperCase()}`
  } else {
    eventDayText.value = title
  }
  loadOccupancyData()
}

// Execute Ticket Scan Verification
const executeScan = async (code) => {
  if (!code || isProcessingScan.value) return
  isProcessingScan.value = true

  try {
    const dayNum = activeDayId.value ? String(activeDayId.value).replace(/\D/g, '') || '1' : '1'
    const formattedDay = `Day ${dayNum}`

    const res = await apiProcessScan({
      ticketCode: code,
      mode: scanMode.value,
      currentDay: formattedDay
    })

    isProcessingScan.value = false

    const isSuccess = res.success || res.status === 'GRANTED'
    playAudioFeedback(isSuccess)

    // Immediate local update of live occupancy
    if (res.liveOccupancy !== undefined) {
      currentOccupancy.value = res.liveOccupancy
    }

    // Open Figma Status Result Modal
    activeScanResult.value = {
      ...res,
      ticketCode: code,
      accessId: res.guest?.accessId || code,
      guestName: res.guest?.name,
      role: res.guest?.role || 'VIP GUEST'
    }
    isResultModalOpen.value = true

    // Also trigger feedback toast
    if (isSuccess) {
      const modeLabel = scanMode.value === 'check-out' ? 'CHECKED OUT' : (res.guest?.role || 'VIP GUEST')
      showFeedback('GRANTED', modeLabel, res.message || 'Access Granted')
    } else if (res.status === 'ALREADY_INSIDE') {
      showFeedback('ALREADY_INSIDE', 'ATTENTION: ALREADY INSIDE', res.message)
    } else if (res.status === 'NOT_CHECKED_IN') {
      showFeedback('NOT_CHECKED_IN', 'ATTENTION: NOT CHECKED IN', res.message)
    } else {
      showFeedback('INVALID', 'INVALID TICKET OR WRONG DAY', res.message || 'Access Denied')
    }

    // Refresh live occupancy stats from backend
    await loadOccupancyData()
  } catch (err) {
    isProcessingScan.value = false
    activeScanResult.value = {
      status: 'INVALID',
      message: 'Failed to process ticket code',
      ticketCode: code
    }
    isResultModalOpen.value = true
    showFeedback('INVALID', 'SCAN ERROR', 'Failed to process ticket code')
  }
}

const handleModalClose = () => {
  isResultModalOpen.value = false
}

const handleModalSearch = () => {
  isResultModalOpen.value = false
  const inputEl = document.querySelector('.ticket-input-field')
  if (inputEl) {
    inputEl.focus()
  }
}

const handleOpenAdjustOccupancy = () => {
  isResultModalOpen.value = false
  isAdjustOccupancyOpen.value = true
}

const handleCapacityUpdated = (newCap) => {
  if (newCap) maxCapacity.value = newCap
  loadOccupancyData()
}

const handleManualSubmit = () => {
  if (!manualTicketInput.value.trim()) return
  const code = manualTicketInput.value.trim()
  manualTicketInput.value = ''
  executeScan(code)
}

// Fetch Occupancy Stats
const loadOccupancyData = async () => {
  const data = await apiFetchOccupancy(activeDayId.value)
  if (data) {
    currentOccupancy.value = data.current ?? 0
    maxCapacity.value = data.capacity ?? 100
    checkedInCount.value = data.checkedInToday ?? 0
    checkedOutCount.value = data.checkedOutToday ?? 0
    if (data.recentScans) recentScans.value = data.recentScans
  }
}

const handleResetOccupancy = async () => {
  await apiResetOccupancy()
  await loadOccupancyData()
}

const cameraErrorMessage = ref('')
let pollInterval = null
let lastScannedCode = ''
let lastScannedTime = 0

// HTML5 Camera QR Code Scanner Lifecycle
const startCamera = async () => {
  cameraErrorMessage.value = ''
  try {
    if (html5QrcodeScanner) {
      await stopCamera()
    }

    // Check secure context requirement for web camera on non-localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!window.isSecureContext && !isLocal) {
      cameraErrorMessage.value = 'Camera requires HTTPS context on mobile devices. Please open via HTTPS tunnel or use manual search.'
      isCameraOn.value = false
      return
    }

    html5QrcodeScanner = new Html5Qrcode('html5-qr-code-reader', {
      verbose: false
    })

    let cameraConfig = { facingMode: 'environment' }
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length > 0) {
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment') || 
          d.label.toLowerCase().includes('rear')
        )
        cameraConfig = backCamera ? backCamera.id : devices[0].id
      }
    } catch (e) {
      // Continue with facingMode environment
    }

    await html5QrcodeScanner.start(
      cameraConfig,
      {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.max(160, Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.85))
          return { width: edge, height: edge }
        }
      },
      (decodedText) => {
        if (!decodedText || isResultModalOpen.value || isProcessingScan.value) return
        if (lastScannedCode === decodedText && Date.now() - lastScannedTime < 3000) {
          return
        }
        lastScannedCode = decodedText
        lastScannedTime = Date.now()
        executeScan(decodedText)
      },
      () => {
        // Quiet scan frame error
      }
    )
    isCameraOn.value = true
  } catch (err) {
    console.warn('[Camera Scanner] Camera initialization or permission note:', err)
    isCameraOn.value = false
    cameraErrorMessage.value = 'Camera access was blocked or is unavailable. Please grant camera permission or use manual ticket ID search.'
  }
}

const stopCamera = async () => {
  if (html5QrcodeScanner && isCameraOn.value) {
    try {
      await html5QrcodeScanner.stop()
      html5QrcodeScanner.clear()
    } catch (e) {
      console.warn('[Camera Scanner] Error stopping camera:', e)
    }
  }
  isCameraOn.value = false
}

const toggleCameraActive = async () => {
  if (isCameraOn.value) {
    await stopCamera()
  } else {
    await startCamera()
  }
}

// File Upload QR Code Image Scanner
const handleFileUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const scanner = html5QrcodeScanner || new Html5Qrcode('html5-qr-code-reader')
    const decodedText = await scanner.scanFile(file, true)
    if (decodedText) {
      executeScan(decodedText)
    }
  } catch (err) {
    console.error('File scan error:', err)
    showFeedback('INVALID', 'SCAN FAILED', 'Could not read QR code from image')
  } finally {
    event.target.value = ''
  }
}

onMounted(() => {
  loadOccupancyData()
  startCamera()
  // Auto-refresh occupancy data every 3 seconds for real-time dashboard sync
  pollInterval = setInterval(() => {
    loadOccupancyData()
  }, 3000)
})

onUnmounted(() => {
  stopCamera()
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.scanner-page-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  background-color: #f2f2f2;
  display: flex;
  justify-content: center;
  align-items: stretch;
  overflow: hidden;
  box-sizing: border-box;
  position: fixed;
  inset: 0;
}

.scanner-frame {
  width: 100%;
  height: 100%;
  max-height: 100dvh;
  display: flex;
  flex-direction: row;
  background-color: #f2f2f2;
  overflow: hidden;
}

/* LEFT PANE: CAMERA VIEWFINDER */
.left-pane {
  flex: 1.35;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.tabs-header {
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  display: flex;
  width: 100%;
  background-color: #f2f2f2;
  flex-shrink: 0;
  z-index: 10;
}

.tab-button {
  flex: 1;
  height: 100%;
  border: none;
  background-color: #f2f2f2;
  color: #000000;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tab-button.active {
  background-color: #0a0a0a;
  color: #ffffff;
}

.viewfinder-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.camera-viewport {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-reader-mount {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

/* Force HTML5 QrCode Video to fill 100% fullview camera portview */
:deep(#html5-qr-code-reader) {
  border: none !important;
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  inset: 0 !important;
  background: #000000 !important;
}

:deep(#html5-qr-code-reader video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  border: none !important;
}

:deep(#html5-qr-code-reader__scan_region) {
  width: 100% !important;
  height: 100% !important;
  min-height: 100% !important;
  background: transparent !important;
  border: none !important;
}

/* Hide shaded overlays, dashboard controls, or superfluous elements */
:deep(#qr-shaded-region),
:deep(#html5-qr-code-reader__scan_region svg),
:deep(#html5-qr-code-reader__dashboard),
:deep(#html5-qr-code-reader img) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  border: none !important;
}

:deep(#html5-qr-code-reader canvas) {
  position: absolute !important;
  top: -9999px !important;
  left: -9999px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Custom Reticle Box Framing Overlay */
.reticle-container {
  position: absolute;
  width: 220px;
  height: 220px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}

.reticle-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: #ffffff;
  border-style: solid;
}

.top-left {
  top: 0;
  left: 0;
  border-top-width: 2px;
  border-left-width: 2px;
  opacity: 0.8;
}

.top-right {
  top: 0;
  right: 0;
  border-top-width: 2px;
  border-right-width: 2px;
  opacity: 0.8;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-width: 2px;
  border-left-width: 2px;
  opacity: 0.8;
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-width: 2px;
  border-right-width: 2px;
  opacity: 0.8;
}

/* Instant Scan Result Feedback Banner */
.scan-feedback-banner {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 8px;
  color: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  max-width: 90%;
}

.scan-feedback-banner.granted {
  background-color: #0d6efd;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.scan-feedback-banner.already_inside,
.scan-feedback-banner.not_checked_in {
  background-color: #fd7e14;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.scan-feedback-banner.invalid {
  background-color: #dc3545;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.feedback-text {
  display: flex;
  flex-direction: column;
}

.feedback-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.feedback-msg {
  font-size: 13px;
  font-weight: 500;
}

/* Camera Controls Toolbar */
.camera-toolbar {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 10px;
}

.tool-btn {
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease;
  user-select: none;
}

.tool-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.demo-btn {
  background-color: #ffffff;
  color: #000000;
  font-weight: 700;
  border: none;
}

.demo-btn:hover {
  background-color: #e2e2e2;
}

.hidden-file-input {
  display: none;
}

/* Camera Error & HTTPS Helper Overlay */
.camera-error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.error-dialog-box {
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 320px;
  gap: 12px;
}

.error-dialog-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  margin: 0;
}

.error-dialog-msg {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 1.5;
  color: #cccccc;
  margin: 0;
}

.error-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
}

.retry-cam-btn {
  height: 38px;
  background: #ffffff;
  color: #000000;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 4px;
}

.retry-cam-btn:hover {
  background: #e0e0e0;
}

.upload-qr-label {
  height: 38px;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}

.upload-qr-label:hover {
  background: rgba(255, 255, 255, 0.25);
}

.watermark-label {
  position: absolute;
  bottom: 16px;
  left: 20px;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  user-select: none;
  z-index: 5;
}

/* RIGHT PANE: OCCUPANCY & CONTROL PANEL */
.right-pane {
  flex: 1;
  background-color: #f2f2f2;
  border-left: 1px solid #000000;
  display: flex;
  flex-direction: column;
  min-width: 320px;
}

.pane-content {
  padding: 0 24px 24px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  box-sizing: border-box;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.brand-subcontainer {
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
}

.header-logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  padding: 6px;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.header-logout-btn:hover {
  opacity: 1;
  color: #d32f2f;
  transform: translateX(-2px);
}

.logo-707 {
  height: 14px;
  width: 45px;
  object-fit: contain;
  display: block;
}

.manual-input-box {
  width: 100%;
  height: 60px;
  background: #ffffff;
  border: 0.871px solid #000000;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.ticket-input-field {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #000000;
  outline: none;
}

.ticket-input-field::placeholder {
  color: #555555;
}

.search-submit-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #000000;
}

.search-submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pane-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 16px 0;
}

.occupancy-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: auto 0;
}

.occupancy-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #000000;
  letter-spacing: 0.3px;
}

.header-separator {
  color: rgba(0, 0, 0, 0.3);
}

.event-date-text {
  font-weight: 500;
  font-size: 11px;
  color: #000000;
}

.day-selector-trigger {
  background: transparent;
  border: 1px solid transparent;
  padding: 2px 6px;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.day-selector-trigger:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.15);
}

.day-chevron {
  color: #000000;
  transition: transform 0.15s ease;
}

.day-selector-trigger:hover .day-chevron {
  transform: translateY(1px);
}

.occupancy-counter-wrapper {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.counter-number {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 130px;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -2px;
  color: #000000;
}

.counter-max {
  font-size: 36px;
  font-weight: 400;
  color: #000000;
}

.progress-track {
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #000000;
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.analytics-dashboard-btn {
  width: 100%;
  height: 60px;
  background: transparent;
  border: 1px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.analytics-dashboard-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-arrow-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* RESPONSIVE LAYOUT FOR SMALL MOBILE / TABLET SCREENS (FIT TO SCREEN, NO SCROLL) */
@media (max-width: 850px) {
  .scanner-page-container {
    height: 100vh;
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
  }

  .scanner-frame {
    flex-direction: column;
    height: 100%;
    max-height: 100dvh;
    overflow: hidden;
  }
  
  .left-pane {
    flex: 1;
    min-height: 0;
    width: 100%;
    height: auto;
    overflow: hidden;
  }

  .tabs-header {
    height: 44px;
    min-height: 44px;
  }

  .viewfinder-wrapper {
    flex: 1;
    min-height: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .camera-viewport {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .right-pane {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: auto;
    flex-shrink: 0;
    border-left: none;
    border-top: 1px solid #000000;
    overflow: hidden;
  }

  .pane-content {
    padding: 10px 16px;
    gap: 8px;
    height: auto;
  }

  .search-container {
    gap: 8px;
  }

  .brand-subcontainer {
    display: none; /* Hide top logo on compact mobile to maximize camera viewport */
  }

  .manual-input-box {
    height: 42px;
    padding: 0 12px;
  }

  .pane-divider {
    margin: 2px 0;
  }

  .occupancy-section {
    margin: 0;
    gap: 4px;
  }

  .occupancy-header {
    font-size: 10px;
  }

  .occupancy-counter-wrapper {
    gap: 8px;
  }

  .counter-number {
    font-size: clamp(32px, 6vh, 44px);
    line-height: 1;
  }

  .counter-max {
    font-size: 16px;
  }

  .progress-track {
    height: 3px;
  }

  .analytics-dashboard-btn {
    height: 42px;
    padding: 0 14px;
    font-size: 12px;
  }

  .btn-arrow-icon {
    width: 28px;
    height: 28px;
  }

  .camera-toolbar {
    bottom: 16px;
  }

  .tool-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
}

/* Transitions */
.scan-pop-enter-active,
.scan-pop-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.scan-pop-enter-from,
.scan-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -15px);
}
</style>
