<template>
  <div class="analytics-page-container">
    <div class="analytics-frame">
      <!-- HEADER CONTAINER -->
      <div class="header-container">
        <div class="header-subcontainer">
          <div class="header-title-group">
            <h1 class="page-title">CUSTOMER ANALYTICS DASHBOARD</h1>
            <div class="header-action-buttons">
              <!-- Customer Database Button -->
              <button
                type="button"
                class="header-btn outlined-btn"
                @click="emit('nav-database')"
              >
                <span>CUSTOMER DATABASE</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <!-- Scanner App Button -->
              <button
                type="button"
                class="header-btn solid-btn"
                @click="emit('nav-scanner')"
              >
                <span>SCANNER APP</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <div class="logo-wrapper">
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
            <img src="../assets/logo-707.png" alt="707 Logo" class="brand-logo" />
          </div>
        </div>
      </div>

      <!-- LIVE OCCUPANCY CONTAINER (Matching Figma 447:615) -->
      <div class="occupancy-section">
        <div class="occupancy-header">
          <span class="occupancy-title">LIVE OCCUPANCY</span>
          <span class="header-separator">|</span>
          <span class="event-date-text">{{ occupancyData.eventDayText || 'DAY 1 - MONDAY, 02 SEPTEMBER 2026' }}</span>
        </div>

        <div class="occupancy-data-container">
          <div class="occupancy-counter-wrapper">
            <div class="counter-number">{{ occupancyData.current }}</div>
            <div class="counter-max">/ {{ occupancyData.capacity }}</div>
          </div>

          <!-- Adjust Occupancy Action Button (Figma 470:63) -->
          <button
            type="button"
            class="adjust-occupancy-btn"
            @click="isAdjustModalOpen = true"
          >
            <span>ADJUST OCCUPANCY</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tune-icon">
              <line x1="21" y1="4" x2="14" y2="4"></line>
              <line x1="10" y1="4" x2="3" y2="4"></line>
              <line x1="21" y1="12" x2="12" y2="12"></line>
              <line x1="8" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="20" x2="16" y2="20"></line>
              <line x1="12" y1="20" x2="3" y2="20"></line>
              <line x1="14" y1="1" x2="14" y2="7"></line>
              <line x1="8" y1="9" x2="8" y2="15"></line>
              <line x1="16" y1="17" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :class="{ 'warning-gradient': occupancyPercent >= 90 }"
            :style="{ width: `${Math.min(100, occupancyPercent)}%` }"
          ></div>
        </div>
      </div>

      <!-- HOURLY ARRIVALS SUMMARY CHART CARD -->
      <div class="summary-chart-card">
        <!-- Card Top Bar: Title & Calendar Date Picker Trigger -->
        <div class="card-header">
          <h2 class="card-title">HOURLY ARRIVALS</h2>

          <!-- Date Picker Button Trigger -->
          <button
            type="button"
            class="date-picker-btn"
            @click="isCalendarOpen = true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="calendar-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="date-text">{{ displayDateText }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <!-- 4 Summary KPI Metric Cards Grid (Fully Interactive Tabs) -->
        <div class="summary-cards-grid">
          <!-- Card 1: TOTAL CHECKED IN -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'totalCheckedIn' }"
            @click="activeTab = 'totalCheckedIn'"
          >
            <div class="kpi-label">
              <span>TOTAL</span>
              <span>CHECKED IN</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.totalCheckedIn }}</div>
          </button>

          <!-- Card 2: TOTAL UPCOMING ARRIVALS -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'upcomingArrivals' }"
            @click="activeTab = 'upcomingArrivals'"
          >
            <div class="kpi-label">
              <span>TOTAL</span>
              <span>UPCOMING ARRIVALS</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.upcomingArrivals }}</div>
          </button>

          <!-- Card 3: VIPs CHECKED-IN -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'vipsCheckedIn' }"
            @click="activeTab = 'vipsCheckedIn'"
          >
            <div class="kpi-label">
              <span>VIPs</span>
              <span>CHECKED-IN</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.vipsCheckedIn }}</div>
          </button>

          <!-- Card 4: FAILED SCANS / OVERRIDES -->
          <button
            type="button"
            class="kpi-card"
            :class="{ active: activeTab === 'failedScans' }"
            @click="activeTab = 'failedScans'"
          >
            <div class="kpi-label">
              <span>FAILED SCANS</span>
              <span>/ OVERRIDES</span>
            </div>
            <div class="kpi-number">{{ summaryMetrics.failedScans }}</div>
          </button>
        </div>

        <!-- Ultra-Minimalist Smoothed Area Chart (Hourly Arrivals) -->
        <div class="chart-wrapper">
          <div class="chart-body">
            <svg
              class="chart-svg"
              viewBox="0 0 1000 230"
              preserveAspectRatio="none"
              @mousemove="handleChartMouseMove"
              @mouseleave="handleChartMouseLeave"
              @touchmove.passive="handleChartTouchMove"
              @touchend="handleChartMouseLeave"
            >
              <!-- Gradient Definition for Smoothed Area Fill -->
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#000000" stop-opacity="0.22" />
                  <stop offset="60%" stop-color="#000000" stop-opacity="0.06" />
                  <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Smoothed Gradient Area Under Curve -->
              <path :d="chartAreaPath" fill="url(#chartAreaGradient)" />

              <!-- Smoothed Spline Curve Line -->
              <path
                :d="chartLinePath"
                fill="none"
                stroke="#000000"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- X-Axis Baseline & Small Vertical Tick Marks -->
              <line x1="0" y1="216" x2="1000" y2="216" stroke="#000000" stroke-width="1" />
              <line
                v-for="(pt, idx) in chartPoints"
                :key="'tick-' + idx"
                :x1="pt.x"
                y1="216"
                :x2="pt.x"
                y2="222"
                stroke="#000000"
                stroke-width="1"
              />

              <!-- Active Hover / Touch Tracking Group -->
              <g v-if="activeHoverPoint" class="hover-overlay-group">
                <!-- Thin Dashed Vertical Line Dropping to X-Axis -->
                <line
                  :x1="activeHoverPoint.x"
                  :y1="activeHoverPoint.y"
                  :x2="activeHoverPoint.x"
                  y2="216"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-dasharray="3 3"
                  class="hover-dashed-line"
                />

                <!-- Prominent Solid Dot on the Line -->
                <circle
                  :cx="activeHoverPoint.x"
                  :cy="activeHoverPoint.y"
                  r="6"
                  fill="#000000"
                  stroke="#ffffff"
                  stroke-width="3"
                  class="hover-active-dot"
                />

                <!-- Minimal Pill-Shaped Tooltip Directly Above the Dot -->
                <g
                  :transform="`translate(${Math.max(40, Math.min(960, activeHoverPoint.x))}, ${Math.max(28, activeHoverPoint.y - 12)})`"
                  class="hover-pill-tooltip"
                >
                  <rect
                    x="-32"
                    y="-24"
                    width="64"
                    height="24"
                    rx="12"
                    ry="12"
                    fill="#000000"
                  />
                  <text
                    x="0"
                    y="-8"
                    text-anchor="middle"
                    fill="#ffffff"
                    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
                    font-size="11"
                    font-weight="700"
                    letter-spacing="0.4"
                  >
                    {{ activeHoverPoint.val }}
                  </text>
                </g>
              </g>
            </svg>

            <!-- X-Axis Labels (00:00 to 22:00) with dynamic active highlight -->
            <div class="chart-x-axis">
              <span
                v-for="(item, idx) in activeHourlyData"
                :key="item.slot"
                class="x-slot-label"
                :class="{ active: hoveredPointIndex === idx }"
              >
                {{ item.slot }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Date Picker Modal -->
    <CalendarModal
      :is-open="isCalendarOpen"
      :selected-date="selectedIsoDate"
      @close="isCalendarOpen = false"
      @select="handleDateSelect"
    />

    <!-- Adjust Max Capacity Modal -->
    <AdjustOccupancyModal
      :is-open="isAdjustModalOpen"
      :current-capacity="occupancyData.capacity"
      :current-occupancy="occupancyData.current"
      @close="isAdjustModalOpen = false"
      @updated="handleCapacityUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CalendarModal from './CalendarModal.vue'
import AdjustOccupancyModal from './AdjustOccupancyModal.vue'
import { apiFetchAnalytics } from '../api/client'
import { getCurrentEventDayGMT7 } from '../utils/dateHelper'

const emit = defineEmits(['nav-database', 'nav-scanner', 'logout'])

const handleLogout = () => {
  localStorage.removeItem('staff_auth')
  sessionStorage.removeItem('staff_auth')
  emit('logout')
}

const initialDayInfo = getCurrentEventDayGMT7()
const isCalendarOpen = ref(false)
const isAdjustModalOpen = ref(false)
const selectedIsoDate = ref(initialDayInfo.isoDate)
const displayDateText = ref(initialDayInfo.shortText)
const activeTab = ref('totalCheckedIn') // 'totalCheckedIn' | 'upcomingArrivals' | 'vipsCheckedIn' | 'failedScans'

const occupancyData = ref({ current: 0, capacity: 100, eventDayText: initialDayInfo.dateText })

const handleCapacityUpdated = (newCapacity) => {
  occupancyData.value.capacity = newCapacity
  loadAnalytics()
}
const summaryMetrics = ref({ totalCheckedIn: 0, upcomingArrivals: 0, vipsCheckedIn: 0, failedScans: 0 })
const seriesData = ref({
  totalCheckedIn: [],
  upcomingArrivals: [],
  vipsCheckedIn: [],
  failedScans: []
})

const defaultHourlyData = [
  { slot: '00:00', count: 0 },
  { slot: '02:00', count: 0 },
  { slot: '04:00', count: 0 },
  { slot: '06:00', count: 0 },
  { slot: '08:00', count: 0 },
  { slot: '10:00', count: 0 },
  { slot: '12:00', count: 0 },
  { slot: '14:00', count: 0 },
  { slot: '16:00', count: 0 },
  { slot: '18:00', count: 0 },
  { slot: '20:00', count: 0 },
  { slot: '22:00', count: 0 }
]

const activeHourlyData = computed(() => {
  if (seriesData.value && seriesData.value[activeTab.value] && seriesData.value[activeTab.value].length > 0) {
    return seriesData.value[activeTab.value]
  }
  return defaultHourlyData
})

const occupancyPercent = computed(() => {
  if (!occupancyData.value.capacity) return 0
  return Math.min(100, Math.round((occupancyData.value.current / occupancyData.value.capacity) * 100))
})

const hoveredPointIndex = ref(null)

const activeHoverPoint = computed(() => {
  if (hoveredPointIndex.value !== null && chartPoints.value[hoveredPointIndex.value]) {
    return chartPoints.value[hoveredPointIndex.value]
  }
  return null
})

const handleChartMouseMove = (event) => {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  if (rect.width === 0) return
  const mouseX = event.clientX - rect.left
  const percentX = mouseX / rect.width
  const svgX = percentX * 1000

  const points = chartPoints.value
  if (points.length === 0) return

  let closestIdx = 0
  let minDist = Infinity
  points.forEach((pt, idx) => {
    const dist = Math.abs(pt.x - svgX)
    if (dist < minDist) {
      minDist = dist
      closestIdx = idx
    }
  })

  hoveredPointIndex.value = closestIdx
}

const handleChartTouchMove = (event) => {
  if (!event.touches || event.touches.length === 0) return
  const touch = event.touches[0]
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  if (rect.width === 0) return
  const touchX = touch.clientX - rect.left
  const percentX = touchX / rect.width
  const svgX = percentX * 1000

  const points = chartPoints.value
  if (points.length === 0) return

  let closestIdx = 0
  let minDist = Infinity
  points.forEach((pt, idx) => {
    const dist = Math.abs(pt.x - svgX)
    if (dist < minDist) {
      minDist = dist
      closestIdx = idx
    }
  })

  hoveredPointIndex.value = closestIdx
}

const handleChartMouseLeave = () => {
  hoveredPointIndex.value = null
}

const maxChartVal = computed(() => {
  const maxInSeries = Math.max(...activeHourlyData.value.map(d => d.count), 0)
  return Math.max(20, Math.ceil(maxInSeries / 5) * 5)
})

const getYPos = (val) => {
  const max = maxChartVal.value
  if (max === 0) return 210
  // Val 0 sits at y=210, max sits at y=25
  const availableH = 185
  return 210 - (val / max) * availableH
}

const chartPoints = computed(() => {
  const data = activeHourlyData.value
  const total = data.length
  if (total === 0) return []

  const stepX = 1000 / (total - 1 || 1)
  return data.map((d, i) => ({
    x: i * stepX,
    y: getYPos(d.count),
    val: d.count,
    slot: d.slot
  }))
})

// Catmull-Rom to Cubic Bezier smooth spline interpolation
const chartLinePath = computed(() => {
  const points = chartPoints.value
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`
  if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`

  let d = `M ${points[0].x},${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }

  return d
})

const chartAreaPath = computed(() => {
  const line = chartLinePath.value
  const points = chartPoints.value
  if (!line || points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  const bottomY = 216
  return `${line} L ${last.x},${bottomY} L ${first.x},${bottomY} Z`
})

const loadAnalytics = async () => {
  const res = await apiFetchAnalytics(selectedIsoDate.value)
  if (res) {
    if (res.occupancy) occupancyData.value = res.occupancy
    if (res.summary) summaryMetrics.value = res.summary
    if (res.series) {
      seriesData.value = res.series
    } else if (res.hourlyArrivals && res.hourlyArrivals.length > 0) {
      seriesData.value = {
        totalCheckedIn: res.hourlyArrivals,
        upcomingArrivals: res.hourlyArrivals.map(d => ({ ...d, count: Math.max(0, d.count - 1) })),
        vipsCheckedIn: res.hourlyArrivals,
        failedScans: res.hourlyArrivals.map(d => ({ ...d, count: 0 }))
      }
    }
  }
}

const handleDateSelect = (title, dayObj) => {
  displayDateText.value = title
  if (dayObj) {
    selectedIsoDate.value = dayObj.isoDate
    occupancyData.value.eventDayText = `${dayObj.badge} - ${dayObj.dateText.toUpperCase()}`
  }
  loadAnalytics()
}

let pollInterval = null

onMounted(() => {
  loadAnalytics()
  pollInterval = setInterval(() => {
    loadAnalytics()
  }, 4000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.analytics-page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f2f2f2;
  padding: 0 24px 24px 24px;
  box-sizing: border-box;
}

.analytics-frame {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* HEADER */
.header-container {
  width: 100%;
}

.header-subcontainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  height: 60px;
  min-height: 60px;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.page-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.32px;
  color: #000000;
  margin: 0;
  white-space: nowrap;
}

.header-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  height: 40px;
  padding: 0 16px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.outlined-btn {
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
}

.outlined-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.solid-btn {
  background: #000000;
  border: 1px solid #000000;
  color: #ffffff;
}

.solid-btn:hover {
  background: #222222;
}

.logo-wrapper {
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

.brand-logo {
  height: 14px;
  width: 45px;
  object-fit: contain;
  display: block;
}

.divider-line {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

/* LIVE OCCUPANCY */
.occupancy-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.occupancy-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #000000;
}

.header-separator {
  color: rgba(0, 0, 0, 0.3);
}

.event-date-text {
  font-weight: 500;
  color: #000000;
}

.occupancy-data-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
  flex-wrap: wrap;
}

.occupancy-counter-wrapper {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.adjust-occupancy-btn {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #000000;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.32px;
  color: #000000;
  text-transform: uppercase;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
}

.adjust-occupancy-btn:hover {
  background: #000000;
  color: #ffffff;
}

.adjust-occupancy-btn:hover .tune-icon {
  stroke: #ffffff;
}

.tune-icon {
  stroke: #000000;
  transition: stroke 0.2s ease;
}

.counter-number {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 96px;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -2.27px;
  color: #000000;
}

.counter-max {
  font-size: 24px;
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
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease;
}

.progress-fill.warning-gradient {
  background: linear-gradient(90deg, #ff7a00 0%, #d32f2f 65%, #8b0000 100%);
}

/* SUMMARY CHART CARD */
.summary-chart-card {
  background: #f2f2f2;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #111827;
  margin: 0;
}

.date-picker-btn {
  background: transparent;
  border: 1px solid #000000;
  height: 36px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  transition: background-color 0.2s ease;
}

.date-picker-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 80px;
  box-sizing: border-box;
  background-color: #f2f2f2;
  border: 1px solid #000000;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #000000;
  text-align: left;
}

.kpi-card:hover:not(.active) {
  background-color: #e0e0e0;
}

.kpi-card.active {
  background-color: #000000;
  color: #ffffff;
  border-color: #000000;
}

.kpi-label {
  display: flex;
  flex-direction: column;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  line-height: 1.2;
}

.kpi-number {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

/* ULTRA-MINIMALIST SMOOTHED AREA CHART */
.chart-wrapper {
  width: 100%;
  padding: 12px 0 0 0;
  box-sizing: border-box;
}

.chart-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: crosshair;
}

.chart-svg {
  width: 100%;
  height: 230px;
  overflow: visible;
  display: block;
}

.hover-overlay-group {
  pointer-events: none;
}

.hover-dashed-line {
  opacity: 0.7;
}

.hover-active-dot {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.hover-pill-tooltip rect {
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 11px;
  color: #666666;
  font-weight: 500;
  padding-top: 6px;
  user-select: none;
}

.x-slot-label {
  width: 36px;
  text-align: center;
  transition: all 0.15s ease;
}

.x-slot-label.active {
  color: #000000;
  font-weight: 700;
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .analytics-page-container {
    padding: 0 16px 24px 16px;
  }

  .header-subcontainer {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-title-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-action-buttons {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .header-btn {
    width: 100%;
    justify-content: space-between;
  }

  .occupancy-data-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .adjust-occupancy-btn {
    width: 100%;
    justify-content: center;
  }

  .counter-number {
    font-size: clamp(48px, 8vw, 72px);
  }

  .counter-max {
    font-size: 20px;
  }

  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .chart-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .chart-body {
    min-width: 540px;
  }
}

@media (max-width: 600px) {
  .header-action-buttons {
    grid-template-columns: 1fr;
  }

  .summary-cards-grid {
    grid-template-columns: 1fr;
  }

  .counter-number {
    font-size: 52px;
  }

  .kpi-card {
    height: 72px;
    padding: 12px 18px;
  }

  .kpi-number {
    font-size: 36px;
  }
}
</style>
